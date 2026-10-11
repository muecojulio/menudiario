export function money(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: value < 20 ? 2 : 0,
  }).format(value);
}
