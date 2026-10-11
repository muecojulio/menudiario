import { useSyncExternalStore } from "react";

/** Suscripción a una media query (SSR: devuelve false). */
function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window === "undefined") return () => {};
      const media = window.matchMedia(query);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
    () => false,
  );
}

/** Dispositivo táctil sin mouse: ahí se revelan acciones con deslizamiento. */
export function useCoarsePointer(): boolean {
  return useMediaQuery("(hover: none), (pointer: coarse)");
}

/** Lectura puntual (fuera de render) para decidir el tipo de desplazamiento. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
