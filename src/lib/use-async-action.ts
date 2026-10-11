import { useCallback, useEffect, useRef, useState } from "react";

export type ActionStatus = "idle" | "loading" | "success" | "error";

/**
 * Estado de una acción asíncrona: bloquea envíos duplicados mientras corre,
 * y vuelve a "idle" después de mostrar el resultado unos segundos.
 */
export function useAsyncAction(resetMs = 2200) {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const busy = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const run = useCallback(
    async (task: () => unknown): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      window.clearTimeout(timer.current);
      setStatus("loading");
      let ok = true;
      try {
        await task();
      } catch {
        ok = false;
      }
      busy.current = false;
      setStatus(ok ? "success" : "error");
      timer.current = window.setTimeout(() => setStatus("idle"), ok ? resetMs : resetMs + 1200);
      return ok;
    },
    [resetMs],
  );

  return { status, run };
}
