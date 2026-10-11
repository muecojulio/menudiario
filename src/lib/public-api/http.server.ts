/**
 * Lectura HTTP saliente, solo servidor. Tiempo límite, tamaño máximo de respuesta
 * y verificación del host final (por si una redirección intenta salir de la lista).
 */

const AGENT = "Menudiario/1.1 (https://github.com/muecojulio/menudiario)";
const MAX_BYTES = 1_000_000;

export async function fetchJson(
  url: string,
  options: { timeoutMs?: number; allowedHosts: readonly string[] },
): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": AGENT },
      signal: AbortSignal.timeout(options.timeoutMs ?? 8000),
    });
    if (!response.ok) return null;
    const host = new URL(response.url || url).hostname.toLowerCase();
    const allowed = options.allowedHosts.some((item) => host === item || host.endsWith(`.${item}`));
    if (!allowed) return null;
    const declared = Number(response.headers.get("content-length") ?? 0);
    if (declared > MAX_BYTES) return null;
    const text = await response.text();
    if (text.length > MAX_BYTES) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
