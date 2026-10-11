/**
 * Navegación por teclado para grupos de opciones (pestañas, segmentos, chips).
 * Función pura: devuelve el índice destino o null si la tecla no navega.
 */

export type Orientation = "horizontal" | "vertical" | "both";

export function nextIndex(
  current: number,
  key: string,
  count: number,
  orientation: Orientation = "horizontal",
): number | null {
  if (count <= 0) return null;
  const forward =
    (orientation !== "vertical" && key === "ArrowRight") ||
    (orientation !== "horizontal" && key === "ArrowDown");
  const backward =
    (orientation !== "vertical" && key === "ArrowLeft") ||
    (orientation !== "horizontal" && key === "ArrowUp");
  if (forward) return (current + 1 + count) % count;
  if (backward) return (current - 1 + count) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
