import { STORES } from "@/lib/catalog";
import { CITIES } from "@/lib/public-api/cities";
import type { Prefs } from "@/lib/storage";
import { money } from "@/lib/format";
import type { MarketLive } from "@/lib/market.functions";
import { ActionButton, type ActionStatus } from "@/components/ui/action-button";
import { FoodSearch } from "@/components/food-search";
import { Combobox } from "@/components/ui/combobox";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CARD, ShelfNote, Stepper, Toggle } from "./parts";

const STORE_OPTIONS = STORES.map((store) => ({ value: store.id, label: store.name }));
const CITY_OPTIONS = CITIES.map((city) => ({ value: city.id, label: city.name, hint: city.state }));

export function PlanPanel({
  prefs,
  update,
  draft,
  floor,
  notice,
  live,
  matches,
  status,
  onBuild,
}: {
  prefs: Prefs;
  update: (partial: Partial<Prefs>) => void;
  draft: boolean;
  floor: number | null;
  notice: string | null;
  live: MarketLive | null;
  matches: number;
  status: ActionStatus;
  onBuild: () => void;
}) {
  return (
    <section className="space-y-6 px-5 py-5">
      <header className="plan-hero rise">
        <p className="plan-hero-kicker">Menú de temporada · a tu medida</p>
        <h1>Más sabor. Menos vueltas.</h1>
        <p className="plan-hero-copy">
          Comidas ricas, presupuesto claro y una lista lista para llevar.
        </p>
      </header>

      <div className="rise delay-1">
        <SegmentedControl
          id="budget-mode"
          mode="radio"
          label="Modo de presupuesto"
          value={prefs.budgetMode}
          onChange={(budgetMode) => update({ budgetMode })}
          options={[
            { value: "dia", label: "Por día" },
            { value: "total", label: "Total" },
          ]}
          className="rounded-full bg-surface p-1"
          selectedClassName="text-bg"
          idleClassName="text-muted"
        />
        <label htmlFor="budget-input" className="mt-4 block text-sm text-muted">
          Pesos mexicanos
        </label>
        <input
          id="budget-input"
          inputMode="decimal"
          autoComplete="off"
          className="field mt-2 w-full rounded-2xl border border-line bg-surface px-4 py-4 font-display text-4xl text-fg tabular-nums"
          value={prefs.budget}
          onChange={(event) => update({ budget: event.target.value.replace(/[^\d.]/g, "") })}
        />
      </div>

      <div className="rise delay-2 grid grid-cols-2 gap-3">
        <Stepper
          label="Días"
          value={prefs.days}
          min={1}
          max={14}
          onChange={(days) => update({ days })}
        />
        <Stepper
          label="Personas"
          value={prefs.people}
          min={1}
          max={8}
          onChange={(people) => update({ people })}
        />
      </div>

      <div className={`rise delay-3 space-y-3 ${CARD}`}>
        <Toggle
          title="Desayuno"
          detail="Algo rápido de armar"
          checked={prefs.desayuno}
          onChange={(desayuno) => update({ desayuno })}
        />
        <Toggle
          title="Comida"
          detail="Incluye postre y bebida"
          checked={prefs.comida}
          onChange={(comida) => update({ comida })}
        />
        <Toggle
          title="Cena"
          detail="Ligera y sencilla"
          checked={prefs.cena}
          onChange={(cena) => update({ cena })}
        />
      </div>

      {prefs.comida ? (
        <div className="space-y-2">
          <p id="drink-label" className="text-sm text-muted">
            Bebida de la comida
          </p>
          <SegmentedControl
            id="drink"
            mode="radio"
            label="Bebida de la comida"
            value={prefs.drink}
            onChange={(drink) => update({ drink })}
            options={[
              { value: "agua", label: "Agua de sabor" },
              { value: "refresco", label: "Refresco" },
            ]}
            className="rounded-2xl border border-line bg-surface p-1"
            itemClassName="gap-2 px-3 py-3 text-sm"
            selectedClassName="text-fg"
            indicatorClassName="bg-clay-soft ring-1 ring-clay/60"
          />
        </div>
      ) : null}

      <Combobox
        id="store"
        label="Supermercado"
        options={STORE_OPTIONS}
        value={prefs.storeId}
        onChange={(storeId) => update({ storeId })}
        helper="Escribe para buscar. Las flechas mueven la lista y Enter elige."
      />

      <Combobox
        id="city"
        label="Ciudad para el clima"
        options={CITY_OPTIONS}
        value={prefs.cityId}
        onChange={(cityId) => update({ cityId })}
        helper="Solo cambia el pronóstico y las sugerencias del día. Tu ubicación no se usa."
      />

      <p className="text-sm text-muted" aria-live="polite">
        {floor != null ? (
          <>
            Lo más austero, comprando paquetes de una vez, sale en {money(floor)}.
            {draft && prefs.budgetMode === "dia"
              ? ` Tu total para ${prefs.days} días es ${money(Number(prefs.budget) * prefs.days)}.`
              : ""}
          </>
        ) : (
          <span className="text-clay">
            Escribe un presupuesto y deja al menos una comida activa.
          </span>
        )}
      </p>

      {notice ? (
        <p role="alert" className="text-sm text-clay">
          {notice}
        </p>
      ) : null}

      <ActionButton
        status={status}
        onAction={onBuild}
        fullWidth
        disabled={!draft}
        loadingText="Armando…"
        successText="Menú listo"
        errorText="No se pudo armar"
        className="text-base disabled:opacity-40"
      >
        Armar mi menú
      </ActionButton>

      <ShelfNote live={live} matches={matches} />
      <FoodSearch />
    </section>
  );
}
