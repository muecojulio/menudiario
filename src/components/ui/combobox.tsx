import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronDown, Check } from "lucide-react";
import { matchesQuery } from "@/lib/text";

export type ComboOption = { value: string; label: string; hint?: string };

/**
 * Selector con búsqueda (patrón combobox WAI-ARIA):
 * - Filtra mientras se escribe, sin distinguir mayúsculas ni acentos ("merida" encuentra "Mérida").
 * - Flechas para moverse, Inicio/Fin para los extremos, Enter confirma, Escape cierra.
 * - Estado expandido, opción activa (aria-activedescendant) y seleccionada (aria-selected).
 * - Anuncia el número de resultados o que no hay coincidencias.
 * - Cierra al tocar fuera o al salir del control; el botón lateral es el alternativo táctil.
 */
export function Combobox({
  id,
  label,
  options,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  const selected = options.find((option) => option.value === value);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = `${id}-list`;

  const filtered = useMemo(
    () =>
      options.filter((option) => matchesQuery(`${option.label} ${option.hint ?? ""}`, query ?? "")),
    [options, query],
  );

  const inputValue = query ?? selected?.label ?? "";
  const statusText = !open
    ? ""
    : filtered.length === 0
      ? "Sin coincidencias. Prueba con otro nombre."
      : `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`;
  const activeOption = open && active >= 0 ? filtered[active] : undefined;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[active] as HTMLElement | undefined;
    if (!list || !item || !open) return;
    if (item.offsetTop < list.scrollTop) list.scrollTop = item.offsetTop;
    else if (item.offsetTop + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = item.offsetTop + item.offsetHeight - list.clientHeight;
    }
  }, [active, open]);

  function close() {
    setOpen(false);
    setQuery(null);
    setActive(-1);
  }

  function choose(index: number) {
    const option = filtered[index];
    if (!option) return;
    onChange(option.value);
    close();
  }

  function openList() {
    setQuery("");
    setOpen(true);
    const index = options.findIndex((option) => option.value === value);
    setActive(index >= 0 ? index : -1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const startsSearch =
      !open &&
      query === null &&
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;
    if (startsSearch) {
      // Al teclear desde el valor seleccionado, reemplaza el texto, no lo concatena.
      event.currentTarget.select();
      setOpen(true);
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const count = filtered.length;
      if (!count) return;
      setActive((current) =>
        event.key === "ArrowDown" ? (current + 1) % count : current <= 0 ? count - 1 : current - 1,
      );
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!open || !filtered.length) return;
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : filtered.length - 1);
      return;
    }
    if (event.key === "Enter") {
      if (open && active >= 0) {
        event.preventDefault();
        choose(active);
      }
      return;
    }
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        close();
      }
      return;
    }
    if (event.key === "Tab") close();
  }

  return (
    <div
      ref={wrapRef}
      className="relative"
      onBlur={(event) => {
        if (!wrapRef.current?.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <label htmlFor={`${id}-input`} className="block text-sm text-muted">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-expanded={open}
          aria-controls={listId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${id}-opt-${activeOption.value}` : undefined}
          aria-describedby={[`${id}-status`, helper ? `${id}-help` : null]
            .filter(Boolean)
            .join(" ")}
          value={inputValue}
          onChange={(event) => {
            const text = event.target.value;
            setQuery(text);
            setOpen(true);
            const firstMatch = options.findIndex((option) =>
              matchesQuery(`${option.label} ${option.hint ?? ""}`, text),
            );
            setActive(text ? firstMatch : -1);
          }}
          onClick={() => {
            if (!open) openList();
          }}
          onKeyDown={onKeyDown}
          className="field h-14 w-full rounded-2xl border border-line bg-surface pl-4 pr-14 text-base text-fg"
        />
        <button
          type="button"
          aria-label={open ? "Ocultar opciones" : "Mostrar opciones"}
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => {
            if (open) {
              close();
            } else {
              openList();
              inputRef.current?.focus();
            }
          }}
          className="press absolute inset-y-1 right-1 grid w-12 place-items-center rounded-xl text-muted hover:text-fg"
        >
          <ChevronDown
            size={20}
            aria-hidden
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>
      {helper ? (
        <p id={`${id}-help`} className="mt-2 text-xs text-muted">
          {helper}
        </p>
      ) : null}
      <span id={`${id}-status`} role="status" className="sr-only">
        {statusText}
      </span>
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-raise p-1.5 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.7)]"
      >
        {filtered.map((option, index) => {
          const isSelected = option.value === value;
          const isActive = index === active;
          return (
            <li
              key={option.value}
              id={`${id}-opt-${option.value}`}
              role="option"
              aria-selected={isSelected}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => choose(index)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm ${
                isActive ? "bg-clay-soft text-fg ring-1 ring-clay/60" : "text-fg hover:bg-surface"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{option.label}</span>
                {option.hint ? (
                  <span className="block truncate text-xs text-muted">{option.hint}</span>
                ) : null}
              </span>
              {isSelected ? <Check size={16} aria-hidden className="shrink-0 text-clay" /> : null}
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li role="presentation" className="px-3 py-3 text-sm text-muted">
            Sin coincidencias
          </li>
        ) : null}
      </ul>
    </div>
  );
}
