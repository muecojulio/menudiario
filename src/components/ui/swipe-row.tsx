import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { MoreHorizontal } from "lucide-react";
import { settleRow, lockAxis } from "@/lib/gesture";
import { isNoSwipeTarget } from "@/lib/dom-gesture";
import { useCoarsePointer } from "@/lib/use-media";

/** Ancho de las acciones reveladas (2 × 96 px). Debe coincidir con `.swipe-actions` en styles.css. */
const REVEAL = 192;

type RowProps = {
  id: string;
  /** Nombre accesible del grupo de acciones. */
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Contenido principal: toque/clic lo activa (p. ej. marcar como comprado). */
  children: ReactNode;
  /** Acciones (botones). Siempre disponibles por el botón "⋯" como alternativa explícita. */
  actions: ReactNode;
  /** Elementos fijos a la derecha que no se desplazan (p. ej. un contador). */
  trailing?: ReactNode;
};

/**
 * Fila con acciones reveladas por deslizamiento hacia la izquierda en táctil.
 * Alternativas: el botón "⋯" abre/cierra las acciones en táctil; en escritorio están visibles.
 * El deslizamiento no empieza en el botón "⋯" ni en las acciones.
 */
export function SwipeRow({ id, label, open, onOpenChange, children, actions, trailing }: RowProps) {
  const coarse = useCoarsePointer();
  const rootRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    start: number;
    t: number;
    axis: "x" | "y" | null;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);
  const latest = useRef({ open, onOpenChange, coarse });
  latest.current = { open, onOpenChange, coarse };

  // Los listeners nativos permiten cancelar el scroll solo cuando el gesto ya es horizontal.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onStart = (event: globalThis.TouchEvent) => {
      if (
        !latest.current.coarse ||
        event.touches.length !== 1 ||
        isNoSwipeTarget(event.target, el)
      ) {
        gesture.current = null;
        return;
      }
      const touch = event.touches[0]!;
      gesture.current = {
        x: touch.clientX,
        y: touch.clientY,
        start: latest.current.open ? -REVEAL : 0,
        t: performance.now(),
        axis: null,
        moved: false,
      };
    };
    const onMove = (event: globalThis.TouchEvent) => {
      const g = gesture.current;
      if (!g || event.touches.length !== 1) return;
      const touch = event.touches[0]!;
      const dx = touch.clientX - g.x;
      const dy = touch.clientY - g.y;
      if (g.axis === null) g.axis = lockAxis(dx, dy);
      if (g.axis === "y") {
        gesture.current = null;
        setDrag(null);
        return;
      }
      if (g.axis === "x") {
        if (event.cancelable) event.preventDefault();
        g.moved = true;
        setDrag(Math.max(-REVEAL, Math.min(0, g.start + dx)));
      }
    };
    const onEnd = (event: globalThis.TouchEvent) => {
      const g = gesture.current;
      gesture.current = null;
      if (!g || !g.moved) {
        setDrag(null);
        return;
      }
      const touch = event.changedTouches[0];
      const offset = Math.max(-REVEAL, Math.min(0, g.start + ((touch?.clientX ?? g.x) - g.x)));
      const velocity = (offset - g.start) / Math.max(performance.now() - g.t, 1);
      const nextOpen = settleRow({ offset, velocity, width: REVEAL });
      suppressClick.current = true;
      window.setTimeout(() => (suppressClick.current = false), 350);
      setDrag(null);
      if (nextOpen !== latest.current.open) latest.current.onOpenChange(nextOpen);
    };
    const onCancel = () => {
      gesture.current = null;
      setDrag(null);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
    };
  }, []);

  const offset = drag ?? (coarse && open ? -REVEAL : 0);
  const dragging = drag !== null;

  function onClickCapture(event: ReactMouseEvent) {
    if (suppressClick.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    // Con las acciones abiertas en táctil, el primer toque solo cierra la fila.
    if (coarse && open && !isNoSwipeTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      onOpenChange(false);
    }
  }

  return (
    <div
      ref={rootRef}
      data-no-swipe=""
      data-open={open || undefined}
      className="swipe-row relative rounded-2xl"
    >
      <div
        className="swipe-surface relative z-10 flex items-stretch gap-2 rounded-2xl bg-surface"
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: dragging ? "none" : "transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        onClickCapture={onClickCapture}
      >
        <div className="flex min-w-0 flex-1 items-stretch gap-2">{children}</div>
        <button
          type="button"
          className="swipe-toggle press grid min-h-11 w-11 shrink-0 place-items-center self-center rounded-full text-muted hover:text-fg"
          aria-label={open ? `Ocultar acciones de ${label}` : `Mostrar acciones de ${label}`}
          aria-expanded={open}
          aria-controls={`${id}-actions`}
          onClick={(event) => {
            event.stopPropagation();
            onOpenChange(!open);
          }}
        >
          <MoreHorizontal size={20} aria-hidden />
        </button>
        {trailing}
      </div>
      <div
        id={`${id}-actions`}
        role="group"
        aria-label={`Acciones de ${label}`}
        aria-hidden={coarse && !open}
        inert={coarse && !open}
        className="swipe-actions flex items-stretch"
      >
        {actions}
      </div>
    </div>
  );
}
