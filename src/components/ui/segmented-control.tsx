import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { nextIndex, type Orientation } from "@/lib/keyboard";
import { scrollBehavior } from "@/lib/use-media";

type Option<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };
type Edges = { start: boolean; end: boolean };

type SegmentedProps<T extends string> = {
  /** Nombre accesible del grupo (p. ej. "Presupuesto"). */
  label: string;
  /** "tabs": pestañas con aria-controls; "radio": selección única tipo radiogroup. */
  mode: "tabs" | "radio";
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Prefijo para ids estables de cada opción. */
  id: string;
  controlsFor?: (value: T) => string;
  className?: string;
  itemClassName?: string;
  selectedClassName?: string;
  idleClassName?: string;
  indicatorClassName?: string;
  /** Convierte el grupo en un carril nativo y centra la selección cuando cambia. */
  scrollable?: boolean;
  orientation?: Orientation;
};

/**
 * Control segmentado con indicador que se desliza hacia la opción activa.
 * Teclado: flechas según orientación, Inicio y Fin.
 * Roving tabindex: solo la opción activa entra en el orden de tabulación.
 * La variante desplazable conserva el scroll nativo y centra la opción seleccionada.
 */
export function SegmentedControl<T extends string>({
  label,
  mode,
  options,
  value,
  onChange,
  id,
  controlsFor,
  className = "",
  itemClassName = "gap-2 px-3 py-2 text-sm",
  selectedClassName = "text-fg",
  idleClassName = "text-muted",
  indicatorClassName = "bg-clay",
  scrollable = false,
  orientation = "horizontal",
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [edges, setEdges] = useState<Edges>({ start: false, end: false });
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const measure = useCallback(() => {
    const el = refs.current[selectedIndex];
    if (!el) return;
    setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [selectedIndex]);

  const updateEdges = useCallback(() => {
    const el = containerRef.current;
    if (!el || !scrollable) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: el.scrollLeft > 4, end: max - el.scrollLeft > 4 };
    setEdges((previous) =>
      previous.start === next.start && previous.end === next.end ? previous : next,
    );
  }, [scrollable]);

  const centerSelected = useCallback(() => {
    if (!scrollable) return;
    const container = containerRef.current;
    const selected = refs.current[selectedIndex];
    if (!container || !selected) return;
    const max = Math.max(0, container.scrollWidth - container.clientWidth);
    const target = Math.max(
      0,
      Math.min(max, selected.offsetLeft - (container.clientWidth - selected.offsetWidth) / 2),
    );
    if (Math.abs(container.scrollLeft - target) > 1) {
      container.scrollTo({ left: target, behavior: scrollBehavior() });
    }
  }, [scrollable, selectedIndex]);

  useLayoutEffect(() => {
    measure();
    centerSelected();
  }, [measure, centerSelected, options.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !scrollable) return;
    updateEdges();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      measure();
      centerSelected();
      updateEdges();
    });
    observer.observe(container);
    refs.current.forEach((button) => {
      if (button) observer.observe(button);
    });
    return () => observer.disconnect();
  }, [scrollable, options.length, measure, centerSelected, updateEdges]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, from: number) {
    const next = nextIndex(from, event.key, options.length, orientation);
    if (next === null) return;
    event.preventDefault();
    const option = options[next];
    if (!option) return;
    refs.current[next]?.focus();
    onChange(option.value);
  }

  const role = mode === "tabs" ? "tab" : "radio";

  return (
    <div className={scrollable ? "relative min-w-0" : undefined}>
      <div
        ref={containerRef}
        role={mode === "tabs" ? "tablist" : "radiogroup"}
        aria-label={label}
        aria-orientation={orientation === "vertical" ? "vertical" : "horizontal"}
        data-fade-start={scrollable ? edges.start : undefined}
        data-fade-end={scrollable ? edges.end : undefined}
        onScroll={scrollable ? updateEdges : undefined}
        className={`${scrollable ? "segmented-scroll relative flex w-full snap-x snap-proximity justify-around" : "relative grid"} ${className}`}
        style={
          scrollable
            ? undefined
            : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }
        }
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 rounded-full transition-[transform,width,height] duration-200 ease-out motion-reduce:transition-none ${indicatorClassName}`}
          style={
            box
              ? { width: box.w, height: box.h, transform: `translate3d(${box.x}px, ${box.y}px, 0)` }
              : { opacity: 0 }
          }
        />
        {options.map((option, index) => {
          const selected = index === selectedIndex;
          return (
            <button
              key={option.value}
              ref={(element) => {
                refs.current[index] = element;
              }}
              type="button"
              role={role}
              id={`${id}-${option.value}`}
              aria-selected={mode === "tabs" ? selected : undefined}
              aria-checked={mode === "radio" ? selected : undefined}
              aria-controls={mode === "tabs" ? controlsFor?.(option.value) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`press relative z-10 flex min-h-11 items-center justify-center rounded-full transition-colors duration-200 ${
                scrollable ? "shrink-0 snap-center" : ""
              } ${selected ? selectedClassName : idleClassName} ${itemClassName}`}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
