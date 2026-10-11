/**
 * Texto para búsquedas y para datos que llegan de fuera.
 *
 * `normalizeText` ignora mayúsculas y diacríticos ("Año" ≈ "ano", "Jitomate" ≈ "jítomate").
 * `cleanText` quita caracteres de control, colapsa espacios y acota la longitud,
 * para que nada raro de una API externa llegue a la interfaz sin filtrar.
 */

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function matchesQuery(haystack: string, query: string): boolean {
  const needle = normalizeText(query);
  if (!needle) return true;
  return normalizeText(haystack).includes(needle);
}

export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = Array.from(value, (char) => {
    const code = char.codePointAt(0) ?? 0;
    return code < 0x20 || (code >= 0x7f && code <= 0x9f) ? " " : char;
  })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned.length > max ? `${cleaned.slice(0, Math.max(0, max - 1)).trimEnd()}…` : cleaned;
}
