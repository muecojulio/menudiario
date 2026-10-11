/**
 * Fechas del plan. Todo en fechas ISO (YYYY-MM-DD) para no depender de la zona del navegador:
 * el "hoy" se calcula en la zona horaria de la ciudad elegida.
 */

export function todayIn(timeZone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(iso: string, days: number): string {
  const [year = 1970, month = 1, day = 1] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function planDates(startIso: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(startIso, index));
}

export function yearsCovered(dates: string[]): number[] {
  const years = new Set(dates.map((date) => Number(date.slice(0, 4))));
  return [...years].filter((year) => Number.isInteger(year)).sort((a, b) => a - b);
}

export function dayChip(iso: string): { weekday: string; day: string; long: string } {
  const date = new Date(`${iso}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" }).format(date),
    day: String(date.getUTCDate()),
    long: new Intl.DateTimeFormat("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(date),
  };
}
