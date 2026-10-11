/**
 * Caché de datos públicos en dos niveles, solo servidor:
 *
 *  1. Memoria del proceso (respuesta inmediata en instancias calientes).
 *  2. Tabla `price_cache` (Postgres/Neon en producción, PGLite en preview), para que
 *     varias instancias compartan lo ya consultado. Su índice por `fetched_at` sirve
 *     para purgar filas vencidas sin recorrer toda la tabla.
 *
 * Las peticiones simultáneas a la misma clave comparten una sola consulta externa.
 * Si la fuente no responde, se devuelve la última copia guardada (aunque esté vencida).
 * Nada de lo que se guarda aquí pertenece a una persona.
 */

const MAX_MEMORY_ENTRIES = 300;
const PURGE_EVERY_MS = 60 * 60 * 1000;
const PURGE_OLDER_THAN_DAYS = 7;

type MemoryEntry = { value: unknown; fetchedAt: string; expires: number };

const memory = new Map<string, MemoryEntry>();
const inflight = new Map<string, Promise<unknown>>();
let lastPurge = 0;

export type Cached<T> = { data: T; fetchedAt: string; fromCache: boolean };

function canUseDatabase(): boolean {
  const hasDatabase = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
  return hasDatabase || process.env.NODE_ENV !== "production";
}

function remember(key: string, value: unknown, ttlMs: number, fetchedAt: string): void {
  if (memory.size >= MAX_MEMORY_ENTRIES && !memory.has(key)) {
    const oldest = memory.keys().next().value;
    if (oldest !== undefined) memory.delete(oldest);
  }
  memory.set(key, { value, fetchedAt, expires: Date.now() + ttlMs });
}

async function readRow(key: string): Promise<{ payload: string; fetchedAt: string } | null> {
  if (!canUseDatabase()) return null;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ payload: string; fetched_at: string | Date }>`
      select payload, fetched_at from price_cache where cache_key = ${key}
    `;
    const row = rows[0];
    if (!row) return null;
    return { payload: row.payload, fetchedAt: new Date(row.fetched_at).toISOString() };
  } catch {
    return null;
  }
}

async function writeRow(key: string, value: unknown): Promise<void> {
  if (!canUseDatabase()) return;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into price_cache (cache_key, payload, fetched_at)
      values (${key}, ${JSON.stringify(value)}, now())
      on conflict (cache_key) do update
        set payload = excluded.payload, fetched_at = now()
    `;
    if (Date.now() - lastPurge > PURGE_EVERY_MS) {
      lastPurge = Date.now();
      await sql`delete from price_cache where fetched_at < now() - make_interval(days => ${PURGE_OLDER_THAN_DAYS})`;
    }
  } catch {
    /* la respuesta en vivo sigue aunque la caché falle */
  }
}

/**
 * @param key      clave estable (incluye solo identificadores validados)
 * @param ttlMs    vigencia antes de volver a consultar la fuente
 * @param load     consulta externa; devuelve null si falla
 * @param parse    valida lo que sale de la caché antes de usarlo
 */
export async function cachedLoad<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T | null>,
  parse: (raw: unknown) => T | null = (raw) => raw as T,
): Promise<Cached<T> | null> {
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) {
    return { data: hit.value as T, fetchedAt: hit.fetchedAt, fromCache: true };
  }

  const row = await readRow(key);
  if (row && Date.now() - Date.parse(row.fetchedAt) < ttlMs) {
    const parsed = parse(JSON.parse(row.payload));
    if (parsed !== null) {
      remember(key, parsed, ttlMs, row.fetchedAt);
      return { data: parsed, fetchedAt: row.fetchedAt, fromCache: true };
    }
  }

  let pending = inflight.get(key) as Promise<T | null> | undefined;
  if (!pending) {
    pending = load()
      .catch(() => null)
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  const fresh = await pending;
  if (fresh !== null) {
    const fetchedAt = new Date().toISOString();
    remember(key, fresh, ttlMs, fetchedAt);
    await writeRow(key, fresh);
    return { data: fresh, fetchedAt, fromCache: false };
  }

  if (row) {
    try {
      const stale = parse(JSON.parse(row.payload));
      if (stale !== null) return { data: stale, fetchedAt: row.fetchedAt, fromCache: true };
    } catch {
      /* fila corrupta: se ignora */
    }
  }
  return null;
}
