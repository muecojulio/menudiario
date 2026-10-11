import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { nextIndex } from "@/lib/keyboard";
import { scrollBehavior } from "@/lib/use-media";

type Edges = { start: boolean; end: boolean; overflow: boolean };

/**
 * Carril horizontal de chips o tarjetas con desplazamiento nativo (momentum y arrastre del navegador).
 * - Bordes difuminados y pista "Desliza" solo cuando hay contenido fuera de vista.
 * - Centra la opción activa (`data-active="true"`) cuando cambia `activeKey`.
 * - La barra se oculta visualmente, pero el carril sigue siendo desplazable.
 */
export function ChipRail({
  label,
  role = "group",
  activeKey,
  children,
  className = "",
}: {
  label: string;
  role?: "group" | "tablist" | "radiogroup";
  activeKey?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false, overflow: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next: Edges = {
      start: el.scrollLeft > 4,
      end: max - el.scrollLeft > 4,
      overflow: max > 4,
    };
    setEdges((prev) =>
      prev.start === next.start && prev.end === next.end && prev.overflow === next.overflow
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || activeKey === undefined) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const target = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: Math.max(0, Math.min(target, max)), behavior: scrollBehavior() });
  }, [activeKey]);

  /** Flechas, Inicio y Fin mueven y seleccionan una opción (radio o tab) dentro del carril. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (role === "group") return;
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[role="radio"],[role="tab"]'));
    const current = items.indexOf(document.activeElement as HTMLElement);
    if (current < 0) return;
    const next = nextIndex(current, event.key, items.length, "both");
    if (next === null) return;
    event.preventDefault();
    items[next]?.focus();
    items[next]?.click();
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        role={role}
        onKeyDown={onKeyDown}
        aria-label={label}
        data-no-swipe=""
        onScroll={update}
        data-fade-start={edges.start}
        data-fade-end={edges.end}
        className={`rail relative flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain scroll-px-5 pb-1 ${className}`}
      >
        {children}
      </div>
      {edges.overflow && edges.end ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 rounded-full border border-line bg-raise/95 px-2.5 py-1 text-[11px] text-muted shadow-lg"
        >
          Desliza →
        </span>
      ) : null}
    </div>
  );
}
