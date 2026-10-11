import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getIngredientInfo, getMealDetail, type IngredientInfo } from "@/lib/public-api.functions";
import type { MealDetail } from "@/lib/public-api/parsers";
import { Sheet } from "@/components/ui/sheet";
import { ExternalLink } from "./parts";

type Load<T> = { key: string; data: T | null; failed: boolean };

/** Carga de datos al abrir una hoja: ignora respuestas viejas si el usuario cambia de elemento. */
function useOpenLoad<T>(key: string | null, load: (key: string) => Promise<T>): Load<T> | null {
  const [state, setState] = useState<Load<T> | null>(null);
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    load(key)
      .then((data) => !cancelled && setState({ key, data, failed: false }))
      .catch(() => !cancelled && setState({ key, data: null, failed: true }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return state && key && state.key === key ? state : null;
}

function Loading({ text }: { text: string }) {
  return (
    <p className="flex items-center gap-2 py-6 text-sm text-muted" aria-busy="true" role="status">
      <Loader2 size={16} className="animate-spin" aria-hidden />
      {text}
    </p>
  );
}

export function IngredientSheet({
  ingredient,
  onOpenChange,
}: {
  ingredient: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const loaded = useOpenLoad<IngredientInfo>(ingredient?.id ?? null, (id) =>
    getIngredientInfo({ data: { ingredientId: id } }),
  );
  const current = loaded && ingredient && loaded.key === ingredient.id ? loaded : null;
  const info = current?.data;

  return (
    <Sheet
      open={ingredient !== null}
      onOpenChange={onOpenChange}
      title={ingredient?.name ?? "Ingrediente"}
      description="Ficha con datos públicos de Wikipedia y Open Food Facts."
    >
      {!current ? <Loading text="Buscando información pública…" /> : null}
      {current?.failed ? (
        <p role="alert" className="py-4 text-sm text-clay">
          No pudimos consultar la ficha ahora. Intenta más tarde.
        </p>
      ) : null}
      {info ? (
        <div className="space-y-4 text-sm leading-6 text-muted">
          {info.wiki?.thumb ? (
            <img
              src={info.wiki.thumb}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-40 w-full rounded-2xl object-cover"
            />
          ) : null}
          {info.wiki ? (
            <>
              {info.wiki.description ? (
                <p className="text-xs uppercase tracking-wide text-clay">{info.wiki.description}</p>
              ) : null}
              <p className="text-fg">
                {info.wiki.extract || "Wikipedia no tiene resumen para este término."}
              </p>
              {info.wiki.pageUrl ? (
                <ExternalLink href={info.wiki.pageUrl}>Leer en Wikipedia</ExternalLink>
              ) : null}
            </>
          ) : (
            <p>Wikipedia no tiene una ficha para este ingrediente.</p>
          )}
          <div className="rounded-2xl bg-raise p-4">
            <p className="text-fg">
              {info.offCount !== null
                ? `${info.offCount.toLocaleString("es-MX")} productos registrados en México`
                : "Sin conteo público por ahora"}
            </p>
            <p className="mt-1 text-xs">
              Open Food Facts (ODbL). Es un conteo de referencia, no un precio.
            </p>
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}

export function MealDetailSheet({
  id,
  onOpenChange,
}: {
  id: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const loaded = useOpenLoad<MealDetail | null>(id, (mealId) =>
    getMealDetail({ data: { id: mealId } }),
  );
  const current = loaded && id && loaded.key === id ? loaded : null;
  const meal = current?.data ?? null;

  return (
    <Sheet
      open={id !== null}
      onOpenChange={onOpenChange}
      title={meal?.name ?? "Receta"}
      description="Receta abierta de TheMealDB."
    >
      {!current ? <Loading text="Cargando receta…" /> : null}
      {current?.failed || (current && !meal) ? (
        <p role="alert" className="py-4 text-sm text-clay">
          No encontramos esta receta ahora.
        </p>
      ) : null}
      {meal ? (
        <div className="space-y-5 text-sm leading-6">
          {meal.thumb ? (
            <img
              src={meal.thumb}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          ) : null}
          <p className="text-muted">
            {[meal.category, meal.area].filter(Boolean).join(" · ") || "Receta"}
          </p>
          <section aria-labelledby="meal-ingredients">
            <h3 id="meal-ingredients" className="font-display text-xl text-fg">
              Ingredientes
            </h3>
            <ul className="mt-2 grid gap-1.5">
              {meal.ingredients.map((item) => (
                <li
                  key={`${item.name}-${item.measure}`}
                  className="flex justify-between gap-3 border-b border-line py-1.5"
                >
                  <span className="text-fg">{item.name}</span>
                  <span className="text-right text-muted">{item.measure}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="meal-steps">
            <h3 id="meal-steps" className="font-display text-xl text-fg">
              Pasos
            </h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-fg marker:text-clay">
              {meal.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          {meal.youtube ? <ExternalLink href={meal.youtube}>Ver video</ExternalLink> : null}
        </div>
      ) : null}
    </Sheet>
  );
}
