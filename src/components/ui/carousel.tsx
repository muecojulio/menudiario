import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { nextIndex } from "@/lib/keyboard";
import { scrollBehavior } from "@/lib/use-media";

/**
 * Carrusel de tarjetas: en móvil desliza con scroll-snap dentro de su propio carril
 * (sin desbordar la página); en escritorio se convierte en rejilla vía `gridClassName`.
 * Indicadores: puntos si hay pocas tarjetas, o anterior/siguiente con contador si hay muchas.
 */
export function Carousel({
  label,
  slides,
  slideLabel,
  slideClassName = "w-[82%] sm:w-[60%]",
  gridClassName = "md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:mx-0 lg:grid-cols-3",
}: {
  label: string;
  slides: ReactNode[];
  slideLabel: (index: number, total: number) => string;
  slideClassName?: string;
  gridClassName?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const total = slides.length;
  const [active, setActive] = useState(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function measure() {
    const el = trackRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const second = el.children[1] as HTMLElement | undefined;
    const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
      setActive(total - 1);
      return;
    }
    setActive(Math.max(0, Math.min(total - 1, Math.round(el.scrollLeft / Math.max(step, 1)))));
  }

  function goTo(index: number) {
    const el = trackRef.current;
    const child = el?.children[index] as HTMLElement | undefined;
    if (!el || !child) return;
    const padding = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    el.scrollTo({ left: Math.max(0, child.offsetLeft - padding), behavior: scrollBehavior() });
    setActive(index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const next = nextIndex(active, event.key, total, "horizontal");
    if (next === null) return;
    event.preventDefault();
    goTo(next);
  }

  const slideText = (index: number) => slideLabel(index, total);

  return (
    <section role="region" aria-roledescription="carrusel" aria-label={label} className="space-y-3">
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        tabIndex={0}
        data-no-swipe=""
        onScroll={() => {
          cancelAnimationFrame(frame.current);
          frame.current = requestAnimationFrame(measure);
        }}
        onKeyDown={onKeyDown}
        className={`carousel-track flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-2 ${gridClassName}`}
      >
        {slides.map((node, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={slideText(index)}
            data-active={index === active}
            className={`carousel-slide shrink-0 snap-start ${slideClassName} md:w-auto`}
          >
            {node}
          </div>
        ))}
      </div>
      {total > 1 && total <= 6 ? (
        <div
          role="group"
          aria-label="Elegir tarjeta"
          className="flex justify-center gap-0.5 md:hidden"
        >
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ir a ${slideText(index)}`}
              aria-current={index === active ? "true" : undefined}
              onClick={() => goTo(index)}
              className="press grid h-11 w-11 place-items-center"
            >
              <span
                aria-hidden
                className={`block h-1.5 rounded-full transition-all duration-200 ${index === active ? "w-5 bg-clay" : "w-1.5 bg-muted/60"}`}
              />
            </button>
          ))}
        </div>
      ) : null}
      {total > 6 ? (
        <div
          className="flex items-center justify-center gap-2 md:hidden"
          role="group"
          aria-label="Navegación del carrusel"
        >
          <button
            type="button"
            aria-label="Tarjeta anterior"
            disabled={active === 0}
            onClick={() => goTo(Math.max(0, active - 1))}
            className="press grid h-11 w-11 place-items-center rounded-full border border-line text-fg disabled:opacity-40"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <span aria-live="polite" className="min-w-16 text-center text-sm tabular-nums text-muted">
            {active + 1} / {total}
          </span>
          <button
            type="button"
            aria-label="Tarjeta siguiente"
            disabled={active >= total - 1}
            onClick={() => goTo(Math.min(total - 1, active + 1))}
            className="press grid h-11 w-11 place-items-center rounded-full border border-line text-fg disabled:opacity-40"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      ) : null}
    </section>
  );
}
