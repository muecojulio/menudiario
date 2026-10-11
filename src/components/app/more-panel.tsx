import { Trash2 } from "lucide-react";
import type { MarketLive } from "@/lib/market.functions";
import { ActionButton } from "@/components/ui/action-button";
import { useAsyncAction } from "@/lib/use-async-action";
import { Disclosure } from "@/components/ui/disclosure";
import { FoodSearch } from "@/components/food-search";
import { CARD, ShelfNote } from "./parts";

export function MorePanel({
  live,
  onClear,
}: {
  live: MarketLive | null;
  onClear: () => void;
}) {
  const clear = useAsyncAction();

  return (
    <section className="space-y-5 px-5 py-5 text-sm leading-6 text-muted">
      <h2 className="font-display text-4xl text-fg">Más</h2>

      <FoodSearch />

      <Disclosure
        id="fuentes"
        title="Fuentes y licencias"
        summary="Datos públicos, sin clave ni registro"
      >
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Open-Meteo: pronóstico del clima (uso no comercial, CC BY 4.0).</li>
          <li>Nager.Date: días festivos de México (MIT).</li>
          <li>Open Prices y Open Food Facts: precios y productos (ODbL).</li>
          <li>TheMealDB: recetas mexicanas.</li>
          <li>Wikipedia en español: descripciones de ingredientes (CC BY-SA 4.0).</li>
        </ul>
        <div className="mt-3">
          <ShelfNote live={live} matches={0} />
        </div>
      </Disclosure>

      <div className={`${CARD} space-y-3`}>
        <ActionButton
          variant="danger"
          status={clear.status}
          onAction={() => void clear.run(onClear)}
          icon={<Trash2 size={16} aria-hidden />}
          loadingText="Borrando…"
          successText="Plan borrado"
          errorText="No se pudo borrar"
          fullWidth
        >
          Borrar el plan de este teléfono
        </ActionButton>
      </div>
    </section>
  );
}
