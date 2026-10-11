import { createServerFn } from "@tanstack/react-start";

export type ShelfItem = {
  name: string;
  price: number;
  store: string;
  date: string;
};

export type MealIdea = {
  id: string;
  name: string;
  imageUrl: string;
  sourceUrl: string;
};

export type MarketLive = {
  ok: boolean;
  fetchedAt: string | null;
  fromCache: boolean;
  stale: boolean;
  shelf: ShelfItem[];
  mealIdeas: MealIdea[];
  sources: {
    openPrices: boolean;
    mealDb: boolean;
  };
};

type CachedMarket = {
  live: MarketLive;
  fetchedAt: string;
  ageMs: number;
};

const CACHE_KEY = "mx-shelf-v1";
const SIX_HOURS = 6 * 60 * 60 * 1000;
const MAX_STALE_AGE = 7 * 24 * 60 * 60 * 1000;
const AGENT = "Menudiario/1.0 (https://github.com/muecojulio/menudiario)";

const shared = globalThis as typeof globalThis & {
  __menudiarioMarketCache__?: CachedMarket;
  __menudiarioMarketRefresh__?: Promise<MarketLive>;
};

async function readJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shortText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function asShelf(payload: unknown): ShelfItem[] {
  if (!isRecord(payload) || !Array.isArray(payload.items)) return [];
  const shelf: ShelfItem[] = [];
  for (const item of payload.items) {
    if (!isRecord(item)) continue;
    const product = isRecord(item.product) ? item.product : {};
    const location = isRecord(item.location) ? item.location : {};
    const name = shortText(product.product_name, 100);
    const price = typeof item.price === "number" ? item.price : Number(item.price);
    if (!name || !Number.isFinite(price) || price <= 0 || price > 400) continue;
    const store = shortText(location.osm_brand || location.osm_name, 80) || "Tienda";
    const date = shortText(item.date, 40);
    shelf.push({ name, price, store, date });
  }
  return shelf;
}

function asMealIdeas(payload: unknown): MealIdea[] {
  if (!isRecord(payload) || !Array.isArray(payload.meals)) return [];
  const ideas: MealIdea[] = [];
  for (const meal of payload.meals) {
    if (!isRecord(meal)) continue;
    const id = shortText(meal.idMeal, 16);
    const name = shortText(meal.strMeal, 90);
    const imageUrl = shortText(meal.strMealThumb, 300);
    if (!/^\d{4,12}$/.test(id) || !name) continue;
    try {
      const image = new URL(imageUrl);
      if (image.protocol !== "https:" || image.hostname !== "www.themealdb.com") continue;
    } catch {
      continue;
    }
    ideas.push({
      id,
      name,
      imageUrl,
      sourceUrl: `https://www.themealdb.com/meal/${id}`,
    });
    if (ideas.length === 8) break;
  }
  return ideas;
}

function isShelfItem(value: unknown): value is ShelfItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    value.name.length > 0 &&
    value.name.length <= 100 &&
    typeof value.price === "number" &&
    Number.isFinite(value.price) &&
    value.price > 0 &&
    value.price <= 400 &&
    typeof value.store === "string" &&
    value.store.length <= 80 &&
    typeof value.date === "string" &&
    value.date.length <= 40
  );
}

function isMealIdea(value: unknown): value is MealIdea {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    !/^\d{4,12}$/.test(value.id) ||
    typeof value.name !== "string" ||
    value.name.length === 0 ||
    value.name.length > 90 ||
    typeof value.imageUrl !== "string" ||
    typeof value.sourceUrl !== "string"
  ) {
    return false;
  }
  try {
    return (
      new URL(value.imageUrl).origin === "https://www.themealdb.com" &&
      value.sourceUrl === `https://www.themealdb.com/meal/${value.id}`
    );
  } catch {
    return false;
  }
}

function cachedPayload(payload: unknown, fetchedAtValue: unknown): CachedMarket | null {
  const fetchedAt = new Date(fetchedAtValue as string | number | Date);
  if (!Number.isFinite(fetchedAt.getTime())) return null;
  const ageMs = Date.now() - fetchedAt.getTime();
  if (ageMs < 0 || ageMs > MAX_STALE_AGE || !isRecord(payload)) return null;
  if (!Array.isArray(payload.shelf) || !Array.isArray(payload.mealIdeas)) return null;
  const shelf = payload.shelf.filter(isShelfItem).slice(0, 40);
  const mealIdeas = payload.mealIdeas.filter(isMealIdea).slice(0, 8);
  const sources = isRecord(payload.sources) ? payload.sources : {};
  const live: MarketLive = {
    ok: shelf.length > 0 || mealIdeas.length > 0,
    fetchedAt: fetchedAt.toISOString(),
    fromCache: true,
    stale: ageMs >= SIX_HOURS,
    shelf,
    mealIdeas,
    sources: {
      openPrices: sources.openPrices === true && shelf.length > 0,
      mealDb: sources.mealDb === true && mealIdeas.length > 0,
    },
  };
  return live.ok ? { live, fetchedAt: fetchedAt.toISOString(), ageMs } : null;
}

function canUseDatabase(): boolean {
  const hasDatabase = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
  return hasDatabase || process.env.NODE_ENV !== "production";
}

async function readCache(): Promise<CachedMarket | null> {
  if (canUseDatabase()) {
    try {
      const { getSql } = await import("@/lib/db");
      const sql = await getSql();
      const rows = await sql<{ payload: string; fetched_at: string | Date }>`
        select payload, fetched_at from price_cache where cache_key = ${CACHE_KEY}
      `;
      const row = rows[0];
      if (row) {
        const parsed = cachedPayload(JSON.parse(row.payload) as unknown, row.fetched_at);
        if (parsed) {
          shared.__menudiarioMarketCache__ = parsed;
          return parsed;
        }
      }
    } catch {
      // The in-process cache is still useful if Neon/PGLite is not reachable.
    }
  }
  const memory = shared.__menudiarioMarketCache__;
  if (!memory) return null;
  const ageMs = Date.now() - Date.parse(memory.fetchedAt);
  if (ageMs < 0 || ageMs > MAX_STALE_AGE) return null;
  return {
    ...memory,
    ageMs,
    live: { ...memory.live, fromCache: true, stale: ageMs >= SIX_HOURS },
  };
}

async function writeCache(live: MarketLive): Promise<void> {
  const fetchedAt = live.fetchedAt ?? new Date().toISOString();
  const entry: CachedMarket = { live, fetchedAt, ageMs: 0 };
  shared.__menudiarioMarketCache__ = entry;
  if (!canUseDatabase()) return;
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    await sql`
      insert into price_cache (cache_key, payload, fetched_at)
      values (${CACHE_KEY}, ${JSON.stringify(live)}, now())
      on conflict (cache_key) do update
        set payload = excluded.payload, fetched_at = now()
    `;
  } catch {
    /* El menú sigue disponible aunque no se pueda escribir la caché persistente. */
  }
}

async function loadFresh(): Promise<MarketLive> {
  const [prices, page2, meals] = await Promise.all([
    readJson("https://prices.openfoodfacts.org/api/v1/prices?currency=MXN&page=1"),
    readJson("https://prices.openfoodfacts.org/api/v1/prices?currency=MXN&page=2"),
    readJson("https://www.themealdb.com/api/json/v1/1/filter.php?a=Mexican"),
  ]);
  const shelf = [...asShelf(prices), ...asShelf(page2)].slice(0, 40);
  const mealIdeas = asMealIdeas(meals);
  return {
    ok: shelf.length > 0 || mealIdeas.length > 0,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    stale: false,
    shelf,
    mealIdeas,
    sources: {
      openPrices: shelf.length > 0,
      mealDb: mealIdeas.length > 0,
    },
  };
}

function emptyMarket(): MarketLive {
  return {
    ok: false,
    fetchedAt: null,
    fromCache: false,
    stale: false,
    shelf: [],
    mealIdeas: [],
    sources: { openPrices: false, mealDb: false },
  };
}

async function refreshMarket(stale: CachedMarket | null): Promise<MarketLive> {
  if (shared.__menudiarioMarketRefresh__) return shared.__menudiarioMarketRefresh__;
  const refresh = (async () => {
    try {
      const fresh = await loadFresh();
      if (fresh.ok) {
        await writeCache(fresh);
        return fresh;
      }
    } catch {
      // Use the last public snapshot, if one exists, rather than blanking the UI.
    }
    return stale ? { ...stale.live, fromCache: true, stale: true } : emptyMarket();
  })();
  shared.__menudiarioMarketRefresh__ = refresh;
  try {
    return await refresh;
  } finally {
    if (shared.__menudiarioMarketRefresh__ === refresh) {
      shared.__menudiarioMarketRefresh__ = undefined;
    }
  }
}

export const getMarketLive = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketLive> => {
    const cached = await readCache();
    if (cached && cached.ageMs < SIX_HOURS) {
      return { ...cached.live, fromCache: true, stale: false };
    }
    return refreshMarket(cached);
  },
);
