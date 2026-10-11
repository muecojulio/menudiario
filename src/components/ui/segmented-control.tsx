import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { nextIndex } from "@/lib/keyboard";

type Option<T extends string> = { value: T; label: ReactNode; icon?: ReactNode };

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
};

/**
 * Control segmentado con indicador que se desliza hacia la opción activa.
 * Teclado: flechas para moverse y seleccionar, Inicio/Fin para los extremos.
 * Roving tabindex: solo la opción activa entra en el orden de tabulación.
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
}: SegmentedProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  const measure = useCallback(() => {
    const el = refs.current[selectedIndex];
    if (!el) return;
    setBox({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
  }, [selectedIndex]);

  useLayoutEffect(() => {
    measure();
  }, [measure, options.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    return () => observer.disconnect();
  }, [measure]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, from: number) {
    const next = nextIndex(from, event.key, options.length, "both");
    if (next === null) return;
    event.preventDefault();
    const option = options[next];
    if (!option) return;
    refs.current[next]?.focus();
    onChange(option.value);
  }

  const role = mode === "tabs" ? "tab" : "radio";

  return (
    <div
      ref={containerRef}
      role={mode === "tabs" ? "tablist" : "radiogroup"}
      aria-label={label}
      className={`relative grid ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
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
              selected ? selectedClassName : idleClassName
            } ${itemClassName}`}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
