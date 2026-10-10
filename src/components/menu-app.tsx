import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import * as Switch from "@radix-ui/react-switch";
import { CalendarRange, Refrigerator, ShoppingBasket, SlidersHorizontal } from "lucide-react";
import { matchLivePrices, STORES, type ShelfItem } from "@/lib/catalog";
import { getMarketLive, type MarketLive } from "@/lib/market.functions";
import { minimumBudget, planMenu, type BudgetMode, type DrinkChoice, type PlanInput, type PlanResult } from "@/lib/planner";

type Tab = "plan" | "menu" | "lista" | "mas";

type Prefs = {
  budget: string;
  budgetMode: BudgetMode;
  days: number;
  people: number;
  desayuno: boolean;
  comida: boolean;
  cena: boolean;
  drink: DrinkChoice;
  storeId: string;
};

const PREFS_KEY = "menudiario-prefs";
const PLAN_KEY = "menudiario-plan";
const CHECK_KEY = "menudiario-checks";

const DEFAULT_PREFS: Prefs = {
  budget: "250",
  budgetMode: "dia",
  days: 3,
  people: 2,
  desayuno: true,
  comida: true,
  cena: true,
  drink: "agua",
  storeId: "walmart",
};

function money(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: value < 20 ? 2 : 0,
  }).format(value);
}

function toInput(prefs: Prefs, live: PlanInput["live"]): PlanInput | null {
  const budget = Number(prefs.budget);
  if (!Number.isFinite(budget) || budget <= 0) return null;
  if (!prefs.desayuno && !prefs.comida && !prefs.cena) return null;
  return {
    budget,
    budgetMode: prefs.budgetMode,
    days: prefs.days,
    people: prefs.people,
    desayuno: prefs.desayuno,
    comida: prefs.comida,
    cena: prefs.cena,
    drink: prefs.drink,
    storeId: prefs.storeId,
    live,
  };
}

export function MenuApp() {
  const [tab, setTab] = useState<Tab>("plan");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<MarketLive | null>(null);
  const [day, setDay] = useState(1);
  const [checks, setChecks] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(PREFS_KEY);
      const storedPlan = localStorage.getItem(PLAN_KEY);
      const storedChecks = localStorage.getItem(CHECK_KEY);
      if (storedPrefs) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(storedPrefs) });
      if (storedPlan) setPlan(JSON.parse(storedPlan) as PlanResult);
      if (storedChecks) setChecks(JSON.parse(storedChecks) as string[]);
    } catch {
      /* preferencias viejas se ignoran */
    }
    setReady(true);
    void getMarketLive()
      .then(setLive)
      .catch(() => setLive(null));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    if (plan) localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
  }, [prefs, plan, checks, ready]);

  const matched = useMemo(() => matchLivePrices(live?.shelf ?? []), [live]);
  const draft = useMemo(() => toInput(prefs, matched), [prefs, matched]);
  const floor = useMemo(() => (draft ? minimumBudget(draft) : null), [draft]);

  function update(partial: Partial<Prefs>) {
    setPrefs((current) => ({ ...current, ...partial }));
  }

  function build() {
    if (!draft) {
      setNotice("Escribe un presupuesto y elige al menos una comida.");
      return;
    }
    const next = planMenu(draft);
    setPlan(next);
    setDay(1);
    setChecks([]);
    setNotice(null);
    setTab("menu");
  }

  function clearAll() {
    setPlan(null);
    setChecks([]);
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(CHECK_KEY);
    setTab("plan");
  }

  async function copyList() {
    if (!plan) return;
    const text = [
      `Menú Diario · ${plan.storeName}`,
      `${plan.dayCount} días · ${plan.people} ${plan.people === 1 ? "persona" : "personas"}`,
      "",
      ...plan.lines.map((line) => `${line.name} — ${line.buy} — ${money(line.cost)}`),
      "",
      `Total ${money(plan.total)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice("No se pudo copiar la lista.");
    }
  }

  function install() {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    window.location.assign(`/?install=1&platform=${ios ? "ios" : "android"}`);
  }

  const activeDay = plan?.days.find((item) => item.day === day) ?? plan?.days[0];

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-28">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="relative h-9 w-9 shrink-0" aria-hidden>
            <span className="absolute bottom-2 left-0 right-0 h-px bg-clay" />
            <span className="absolute bottom-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-clay" />
          </span>
          <div>
            <p className="font-display text-2xl leading-none text-fg">Menú Diario</p>
            <p className="mt-1 text-sm text-muted">Come simple. Compra lo justo.</p>
          </div>
        </div>
      </header>

      {tab === "plan" ? (
        <section className="space-y-5 px-5 py-5">
          <div className="rise">
            <p className="text-sm text-muted">Presupuesto de toda la casa</p>
            <div className="mt-2 grid grid-cols-2 rounded-full bg-surface p-1">
              {(
                [
                  ["dia", "Por día"],
                  ["total", "Total"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  className={`press rounded-full px-3 py-3 text-sm ${prefs.budgetMode === mode ? "bg-clay text-bg" : "text-muted"}`}
                  onClick={() => update({ budgetMode: mode })}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-sm text-muted">Pesos mexicanos</span>
              <input
                inputMode="decimal"
                className="mt-2 w-full rounded-2xl border border-line bg-surface px-4 py-4 font-display text-4xl text-fg"
                value={prefs.budget}
                onChange={(event) => update({ budget: event.target.value.replace(/[^\d.]/g, "") })}
              />
            </label>
          </div>

          <div className="rise delay-1 grid grid-cols-2 gap-3">
            <Stepper label="Días" value={prefs.days} min={1} max={14} onChange={(days) => update({ days })} />
            <Stepper
              label="Personas"
              value={prefs.people}
              min={1}
              max={8}
              onChange={(people) => update({ people })}
            />
          </div>

          <div className="rise delay-2 space-y-3 rounded-2xl bg-surface p-4">
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
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["agua", "Agua de sabor"],
                  ["refresco", "Refresco"],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  className={`press rounded-2xl border px-3 py-4 text-sm ${prefs.drink === kind ? "border-clay bg-clay-soft text-fg" : "border-line bg-surface text-muted"}`}
                  onClick={() => update({ drink: kind })}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <p className="mb-2 text-sm text-muted">Supermercado</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STORES.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  className={`press shrink-0 rounded-full border px-4 py-3 text-sm ${prefs.storeId === store.id ? "border-clay bg-clay text-bg" : "border-line bg-surface text-fg"}`}
                  onClick={() => update({ storeId: store.id })}
                >
                  {store.name}
                </button>
              ))}
            </div>
          </div>

          {floor != null ? (
            <p className="text-sm text-muted">
              Lo más austero, comprando paquetes de una vez, sale en {money(floor)}.
              {draft && draft.budgetMode === "dia"
                ? ` Tu total para ${prefs.days} días es ${money(Number(prefs.budget) * prefs.days)}.`
                : ""}
            </p>
          ) : (
            <p className="text-sm text-clay">Escribe un presupuesto y deja al menos una comida activa.</p>
          )}

          {notice ? <p className="text-sm text-clay">{notice}</p> : null}

          <button
            type="button"
            className="press w-full rounded-full bg-clay px-4 py-4 text-base text-bg disabled:opacity-40"
            onClick={build}
            disabled={!draft}
          >
            Armar mi menú
          </button>
          <ShelfNote live={live} matches={Object.keys(matched).length} />
        </section>
      ) : null}

      {tab === "menu" && plan && activeDay ? (
        <section className="space-y-4 px-5 py-5">
          <BudgetHero plan={plan} />
          {plan.days.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {plan.days.map((item) => (
                <button
                  key={item.day}
                  type="button"
                  className={`press shrink-0 rounded-full px-4 py-3 text-sm ${item.day === activeDay.day ? "bg-clay text-bg" : "bg-surface text-muted"}`}
                  onClick={() => setDay(item.day)}
                >
                  Día {item.day}
                </button>
              ))}
            </div>
          ) : null}
          <p className="text-sm text-muted">
            {activeDay.balanced
              ? "Día balanceado: proteína, cereal y verdura o fruta."
              : `Este día se queda corto en ${activeDay.missing.join(", ")}.`}
            {plan.sameEveryDay ? " Se repite el menú para aprovechar los paquetes." : ""}
          </p>
          {activeDay.meals.map((meal, index) => (
            <article key={meal.slot} className={`rise rounded-2xl bg-surface p-4 ${index ? `delay-${Math.min(index, 3)}` : ""}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-clay">{meal.slotLabel}</p>
                <p className="text-sm text-muted">{meal.minutes > 0 ? `${meal.minutes} min` : "Listo"}</p>
              </div>
              <h2 className="mt-1 font-display text-3xl leading-tight text-fg">{meal.name}</h2>
              <ol className="mt-3 space-y-2 text-sm text-fg">
                {meal.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <ul className="mt-3 space-y-1 text-sm text-muted">
                {meal.portions.map((portion) => (
                  <li key={portion}>{portion}</li>
                ))}
              </ul>
            </article>
          ))}
          {live && live.mexicanMeals.length > 0 ? (
            <p className="text-sm text-muted">
              Recetas abiertas de TheMealDB, aparte de este plan: {live.mexicanMeals.slice(0, 3).join(", ")}.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "menu" && !plan ? <Empty onPlan={() => setTab("plan")} /> : null}

      {tab === "lista" && plan ? (
        <section className="space-y-4 px-5 py-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">{plan.storeName}</p>
              <h2 className="font-display text-4xl text-fg">{money(plan.total)}</h2>
            </div>
            <button type="button" className="press rounded-full bg-raise px-4 py-3 text-sm text-fg" onClick={() => void copyList()}>
              {copied ? "Lista copiada" : "Copiar"}
            </button>
          </div>
          <p className="text-sm text-muted">
            Cantidades para {plan.dayCount} días y {plan.people} {plan.people === 1 ? "persona" : "personas"}.
            Compras el paquete completo; lo que sobra queda en casa.
          </p>
          {groupLines(plan).map(([aisle, lines]) => (
            <div key={aisle}>
              <h3 className="mb-2 text-sm text-clay">{aisle}</h3>
              <ul className="space-y-2">
                {lines.map((line) => {
                  const on = checks.includes(line.id);
                  return (
                    <li key={line.id}>
                      <button
                        type="button"
                        className={`press flex w-full items-start gap-3 rounded-2xl bg-surface p-4 text-left ${on ? "opacity-50" : ""}`}
                        onClick={() =>
                          setChecks((current) =>
                            current.includes(line.id) ? current.filter((id) => id !== line.id) : [...current, line.id],
                          )
                        }
                      >
                        <span className={`mt-1 h-4 w-4 shrink-0 rounded-full border ${on ? "border-clay bg-clay" : "border-muted"}`} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="text-fg">{line.name}</span>
                            <span className="text-sm text-fg">{money(line.cost)}</span>
                          </span>
                          <span className="mt-1 block text-sm text-muted">
                            Llevas {line.buy}. {line.use}.
                            {line.extra ? ` ${line.extra}.` : ""}
                            {line.live ? " Precio visto en anaquel." : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "lista" && !plan ? <Empty onPlan={() => setTab("plan")} /> : null}

      {tab === "mas" ? (
        <section className="space-y-4 px-5 py-5 text-sm leading-6 text-muted">
          <h2 className="font-display text-4xl text-fg">Más</h2>
          <p className="text-fg">
            Instálala en la pantalla de inicio. Se abre como app, sin la barra del navegador.
          </p>
          <button type="button" className="press w-full rounded-full bg-clay px-4 py-4 text-base text-bg" onClick={install}>
            Instalar en el teléfono
          </button>
          <ShelfNote live={live} matches={Object.keys(matched).length} />
          <p>
            Las cadenas no publican una lista oficial gratuita. El ajuste por tienda es una referencia, y
            Open Prices cubre los productos que alguien fotografió en anaquel.
          </p>
          <Link to="/privacidad" className="block text-clay">
            Política de privacidad
          </Link>
          <button type="button" className="press text-fg" onClick={clearAll}>
            Borrar el plan de este teléfono
          </button>
        </section>
      ) : null}

      <nav className="dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg">
        <div className="mx-auto grid max-w-lg grid-cols-4">
          <DockButton label="Plan" active={tab === "plan"} onClick={() => setTab("plan")} icon={<CalendarRange size={18} />} />
          <DockButton label="Menú" active={tab === "menu"} onClick={() => setTab("menu")} icon={<Refrigerator size={18} />} />
          <DockButton label="Lista" active={tab === "lista"} onClick={() => setTab("lista")} icon={<ShoppingBasket size={18} />} />
          <DockButton label="Más" active={tab === "mas"} onClick={() => setTab("mas")} icon={<SlidersHorizontal size={18} />} />
        </div>
      </nav>
    </div>
  );
}

function BudgetHero({ plan }: { plan: PlanResult }) {
  const ratio = plan.budget > 0 ? Math.min(plan.total / plan.budget, 1) : 1;
  return (
    <div className="rise rounded-2xl bg-surface p-4">
      <p className="text-sm text-muted">
        {plan.storeName} · {plan.balancedDays} de {plan.dayCount} días balanceados
      </p>
      <p className="mt-1 font-display text-4xl text-fg">{money(plan.total)}</p>
      <p className="text-sm text-muted">en caja, de {money(plan.budget)} de presupuesto</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-raise">
        <div className="h-full rounded-full bg-clay transition-[width] duration-200" style={{ width: `${ratio * 100}%` }} />
      </div>
      {plan.shortfall > 0 ? (
        <p className="mt-3 text-sm text-clay">
          Te faltan {money(plan.shortfall)}. Este es el plan más austero; sube el presupuesto para variar platillos.
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">Te alcanza. El sobrante queda en {money(plan.budget - plan.total)}.</p>
      )}
    </div>
  );
}

function ShelfNote({ live, matches }: { live: MarketLive | null; matches: number }) {
  if (!live) return <p className="text-sm text-muted">Buscando precios públicos…</p>;
  if (!live.ok) {
    return <p className="text-sm text-muted">Hoy uso precios de referencia. Las listas públicas no respondieron.</p>;
  }
  const bits = [
    live.sources.openPrices ? "Open Prices" : null,
    live.sources.openFoodFacts ? "Open Food Facts" : null,
    live.sources.mealDb ? "TheMealDB" : null,
  ].filter(Boolean);
  return (
    <p className="text-sm text-muted">
      Fuentes vivas: {bits.join(", ")}
      {live.fromCache ? " (caché reciente)" : ""}.{matches > 0 ? ` ${matches} precios coinciden con la despensa.` : ""}
    </p>
  );
}

function Empty({ onPlan }: { onPlan: () => void }) {
  return (
    <section className="px-5 py-16 text-center">
      <h2 className="font-display text-4xl text-fg">Todavía no hay menú</h2>
      <p className="mt-2 text-sm text-muted">Arma uno con tu presupuesto y los días que vas a cubrir.</p>
      <button type="button" className="press mt-6 rounded-full bg-clay px-5 py-4 text-bg" onClick={onPlan}>
        Ir al plan
      </button>
    </section>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className="press h-11 w-11 rounded-full bg-raise text-fg"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Menos ${label}`}
        >
          –
        </button>
        <span className="font-display text-3xl text-fg">{value}</span>
        <button
          type="button"
          className="press h-11 w-11 rounded-full bg-raise text-fg"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Más ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  title,
  detail,
  checked,
  onChange,
}: {
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>
        <span className="block text-fg">{title}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        className="press relative h-7 w-12 shrink-0 rounded-full bg-raise transition-colors data-[state=checked]:bg-clay"
      >
        <Switch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-fg transition-transform duration-200 data-[state=checked]:translate-x-6" />
      </Switch.Root>
    </label>
  );
}

function DockButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button type="button" className={`press flex flex-col items-center gap-1 py-3 text-xs ${active ? "text-clay" : "text-muted"}`} onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function groupLines(plan: PlanResult): Array<[string, PlanResult["lines"]]> {
  const groups = new Map<string, PlanResult["lines"]>();
  for (const line of plan.lines) {
    const list = groups.get(line.aisle) ?? [];
    list.push(line);
    groups.set(line.aisle, list);
  }
  return [...groups.entries()];
}
