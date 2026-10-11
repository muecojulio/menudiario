/**
 * Un gesto que empieza sobre estos elementos nunca cambia de sección ni revela acciones:
 * son controles que deben recibir su propio toque, scroll o arrastre.
 */
const NO_SWIPE_SELECTOR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='slider']",
  "[role='textbox']",
  "[role='combobox']",
  "[role='listbox']",
  "[role='option']",
  "[role='tab']",
  "[role='radio']",
  "[role='menuitem']",
  "[data-no-swipe]",
].join(",");

/**
 * `boundary` es el contenedor que marca a sí mismo `data-no-swipe` (p. ej. una fila con acciones):
 * el gesto puede empezar dentro de él, pero no sobre sus controles.
 */
export function isNoSwipeTarget(target: EventTarget | null, boundary?: Element | null): boolean {
  if (!(target instanceof Element)) return false;
  const control = target.closest(NO_SWIPE_SELECTOR);
  return control !== null && control !== boundary;
}
