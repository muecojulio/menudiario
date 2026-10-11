import { useEffect, useRef, type RefObject } from "react";
import { horizontalSwipe, lockAxis } from "@/lib/gesture";
import { isNoSwipeTarget } from "@/lib/dom-gesture";

type Handlers = { onLeft?: () => void; onRight?: () => void };

/**
 * Detecta swipes horizontales sobre un contenedor (pasivo: nunca bloquea el scroll vertical).
 * Ignora gestos que empiezan en controles o en carriles con `data-no-swipe`.
 */
export function useHorizontalSwipe<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handlers: Handlers,
) {
  const latest = useRef(handlers);
  latest.current = handlers;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let start: { x: number; y: number; t: number; axis: "x" | "y" | null } | null = null;

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1 || isNoSwipeTarget(event.target)) {
        start = null;
        return;
      }
      const touch = event.touches[0]!;
      start = { x: touch.clientX, y: touch.clientY, t: performance.now(), axis: null };
    };
    const onMove = (event: TouchEvent) => {
      if (!start || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      if (start.axis === null)
        start.axis = lockAxis(touch.clientX - start.x, touch.clientY - start.y);
      if (start.axis === "y") start = null;
    };
    const onEnd = (event: TouchEvent) => {
      const current = start;
      start = null;
      if (!current || current.axis !== "x") return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const direction = horizontalSwipe(
        touch.clientX - current.x,
        touch.clientY - current.y,
        performance.now() - current.t,
      );
      if (direction === "left") latest.current.onLeft?.();
      else if (direction === "right") latest.current.onRight?.();
    };
    const onCancel = () => {
      start = null;
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, [ref]);
}
