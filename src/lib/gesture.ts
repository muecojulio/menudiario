/**
 * Clasificación de gestos táctiles, sin DOM, para poder probarla.
 *
 * - Eje: un gesto es horizontal cuando el desplazamiento lateral supera al vertical
 *   por `axisRatio` (≈1,2). En cualquier otro caso manda el scroll vertical.
 * - Un swipe horizontal necesita distancia suficiente, o una distancia mínima con
 *   velocidad suficiente (gesto rápido).
 */

const SWIPE = {
  lockDistance: 10,
  axisRatio: 1.2,
  minDistance: 56,
  minFlingDistance: 24,
  flingVelocity: 0.45,
  rowOpenRatio: 0.4,
  rowFlingVelocity: 0.5,
} as const;

export type Axis = "x" | "y" | null;

export function lockAxis(dx: number, dy: number): Axis {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax + ay < SWIPE.lockDistance) return null;
  return ax >= ay * SWIPE.axisRatio ? "x" : "y";
}

export function horizontalSwipe(
  dx: number,
  dy: number,
  elapsedMs: number,
): "left" | "right" | null {
  if (lockAxis(dx, dy) !== "x") return null;
  const distance = Math.abs(dx);
  const velocity = distance / Math.max(elapsedMs, 1);
  const enough =
    distance >= SWIPE.minDistance ||
    (distance >= SWIPE.minFlingDistance && velocity >= SWIPE.flingVelocity);
  if (!enough) return null;
  return dx < 0 ? "left" : "right";
}

/**
 * Decide si una fila con acciones queda abierta al soltar.
 * `offset` va de -width (abierta) a 0 (cerrada); `velocity` en px/ms (negativa = abriendo).
 */
export function settleRow(input: { offset: number; velocity: number; width: number }): boolean {
  if (input.width <= 0) return false;
  if (Math.abs(input.velocity) >= SWIPE.rowFlingVelocity) return input.velocity < 0;
  return -input.offset >= input.width * SWIPE.rowOpenRatio;
}
