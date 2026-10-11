import { useEffect, useMemo, useState, type ReactNode } from "react";
import * as Switch from "@radix-ui/react-switch";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  Check,
  ExternalLink,
  Leaf,
  QrCode,
  Salad,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { z } from "zod";
import { FoodSearch } from "@/components/food-search";
import { PrivacyContent } from "@/components/privacy-content";
import { QRShare } from "@/components/qr-share";
import { matchLivePrices, STORES } from "@/lib/catalog";
import { getMarketLive, type MarketLive } from "@/lib/market.functions";
import {
  minimumBudget,
  planMenu,
  type BudgetMode,
  type DrinkChoice,
  type PlanInput,
  type PlanResult,
} from "@/lib/planner";
import { previewPathPrefix } from "@/lib/preview-path-prefix";

type Tab = "plan" | "menu" | "lista" | "qr" | "privacidad" | "mas";

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

const PrefsSchema = z.object({
  budget: z
    .string()
    .max(12)
    .regex(/^\d*(?:\.\d{0,2})?$/),
  budgetMode: z.enum(["dia", "total"]),
  days: z.number().int().min(1).max(14),
  people: z.number().int().min(1).max(8),
  desayuno: z.boolean(),
  comida: z.boolean(),
  cena: z.boolean(),
  drink: z.enum(["agua", "refresco"]),
  storeId: z.string().refine((id) => STORES.some((store) => store.id === id)),
});
const GroupSchema = z.enum(["proteina", "verdura", "cereal", "fruta"]);
const SlotSchema = z.enum(["desayuno", "comida", "cena", "postre", "bebida"]);
const MealSchema = z.object({
  slot: SlotSchema,
  slotLabel: z.string().max(24),
  recipeId: z.string().max(80),
  name: z.string().max(120),
  minutes: z.number().int().min(0).max(600),
  steps: z.array(z.string().max(260)).max(20),
  portions: z.array(z.string().max(120)).max(30),
  groups: z.array(GroupSchema).max(4),
});
const PlanSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.number().int().min(1).max(14),
        meals: z.array(MealSchema).max(5),
        balanced: z.boolean(),
        missing: z.array(z.string().max(32)).max(4),
      }),
    )
    .max(14),
  lines: z
    .array(
      z.object({
        id: z.string().max(80),
        name: z.string().max(120),
        aisle: z.string().max(60),
        buy: z.string().max(100),
        use: z.string().max(120),
        extra: z.string().max(120).nullable(),
        cost: z.number().finite().min(0).max(1_000_000),
        live: z.boolean(),
        liveNote: z.string().max(160).nullable(),
      }),
    )
    .max(100),
  total: z.number().finite().min(0).max(1_000_000),
  budget: z.number().finite().min(0).max(1_000_000),
  perDay: z.number().finite().min(0).max(1_000_000),
  shortfall: z.number().finite().min(0).max(1_000_000),
  balancedDays: z.number().int().min(0).max(14),
  storeName: z.string().max(60),
  people: z.number().int().min(1).max(8),
  dayCount: z.number().int().min(1).max(14),
  sameEveryDay: z.boolean(),
});
const ChecksSchema = z.array(z.string().max(80)).max(100);

function money(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: value < 20 ? 2 : 0,
  }).format(value);
}

function fromStorage<T>(raw: string | null, schema: z.ZodType<T>): T | null {
  if (!raw) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw) as unknown);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function getAppUrl(): string {
  if (typeof window === "undefined") return "";
  const prefix = previewPathPrefix(window.location.hostname, window.location.pathname) ?? "";
  return new URL(`${prefix}/`, window.location.origin).toString();
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

function cleanBudgetInput(value: string): string {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  return rest.length ? `${whole}.${rest.join("").slice(0, 2)}`.slice(0, 12) : whole.slice(0, 12);
}

export function MenuApp() {
  const [tab, setTab] = useState<Tab>("plan");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [ready, setReady] = useState(false);
  const [hasUserData, setHasUserData] = useState(false);
  const [live, setLive] = useState<MarketLive | null>(null);
  const [appUrl, setAppUrl] = useState("");
  const [day, setDay] = useState(1);
  const [checks, setChecks] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedPrefs = localStorage.getItem(PREFS_KEY);
      const storedPlan = localStorage.getItem(PLAN_KEY);
      const storedChecks = localStorage.getItem(CHECK_KEY);
      const savedPrefs = fromStorage(storedPrefs, PrefsSchema);
      const savedPlan = fromStorage(storedPlan, PlanSchema);
      const savedChecks = fromStorage(storedChecks, ChecksSchema);
      if (savedPrefs) setPrefs(savedPrefs);
      if (savedPlan) setPlan(savedPlan as PlanResult);
      if (savedChecks) setChecks(savedChecks);
      if (storedPrefs && !savedPrefs) localStorage.removeItem(PREFS_KEY);
      if (storedPlan && !savedPlan) localStorage.removeItem(PLAN_KEY);
      if (storedChecks && !savedChecks) localStorage.removeItem(CHECK_KEY);
      setHasUserData(Boolean(savedPrefs || savedPlan || savedChecks));
    } catch {
      /* Si el navegador bloquea el almacenamiento, el plan sigue funcionando en memoria. */
    }
    setReady(true);
    setAppUrl(getAppUrl());
    void getMarketLive()
      .then(setLive)
      .catch(() => setLive(null));
  }, []);

  useEffect(() => {
    if (!ready || !hasUserData) return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      if (plan) localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
      else localStorage.removeItem(PLAN_KEY);
      localStorage.setItem(CHECK_KEY, JSON.stringify(checks));
    } catch {
      setNotice(
        "El navegador no pudo guardar los cambios; puedes seguir usando el plan mientras esta pestaña esté abierta.",
      );
    }
  }, [prefs, plan, checks, ready, hasUserData]);

  const matched = useMemo(() => matchLivePrices(live?.shelf ?? []), [live]);
  const draft = useMemo(() => toInput(prefs, matched), [prefs, matched]);
  const floor = useMemo(() => (draft ? minimumBudget(draft) : null), [draft]);
  const activeDay = plan?.days.find((item) => item.day === day) ?? plan?.days[0];
  const checkedCount = plan?.lines.filter((line) => checks.includes(line.id)).length ?? 0;

  function update(partial: Partial<Prefs>) {
    setHasUserData(true);
    setPrefs((current) => ({ ...current, ...partial }));
  }

  function build() {
    if (!draft) {
      setNotice("Escribe un presupuesto válido y elige al menos una comida.");
      return;
    }
    const next = planMenu(draft);
    setHasUserData(true);
    setPlan(next);
    setDay(1);
    setChecks([]);
    setNotice(null);
    setTab("menu");
  }

  function clearAll() {
    if (
      !window.confirm(
        "¿Borramos las preferencias, el menú y la lista guardados en este dispositivo?",
      )
    )
      return;
    try {
      localStorage.removeItem(PREFS_KEY);
      localStorage.removeItem(PLAN_KEY);
      localStorage.removeItem(CHECK_KEY);
    } catch {
      /* La limpieza en memoria también se aplica si el navegador bloquea el almacenamiento. */
    }
    setPrefs(DEFAULT_PREFS);
    setPlan(null);
    setChecks([]);
    setDay(1);
    setHasUserData(false);
    setNotice("Listo: se borraron los datos guardados en este dispositivo.");
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
      setNotice("No se pudo copiar la lista en este navegador.");
    }
  }

  function markChecked(id: string) {
    setHasUserData(true);
    setChecks((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function install() {
    const ios =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const target = new URL(appUrl || getAppUrl());
    target.searchParams.set("install", "1");
    target.searchParams.set("platform", ios ? "ios" : "android");
    window.location.assign(target.toString());
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <a href={appUrl || "/"} className="brand-lockup" aria-label="Menú Diario, inicio">
            <span className="brand-mark" aria-hidden="true">
              <Leaf size={21} strokeWidth={2.6} />
            </span>
            <span>
              <span className="brand-name">Menú Diario</span>
              <span className="brand-tagline">Tu cocina, con más color</span>
            </span>
          </a>
          <div className="header-badge">
            <span className="status-dot" /> Sin cuenta, sin complicaciones
          </div>
        </div>
      </header>

      <main className="app-main">
        {tab === "plan" ? (
          <section className="page-content plan-page">
            <PlannerHero />
            <div className="planning-grid">
              <div className="planner-form">
                <section className="surface-card budget-card">
                  <div className="section-heading-row">
                    <span className="step-number">01</span>
                    <div>
                      <p className="eyebrow">El punto de partida</p>
                      <h2 className="font-display text-2xl text-fg">¿Cuánto quieres gastar?</h2>
                    </div>
                    <span className="section-doodle" aria-hidden="true">
                      💸
                    </span>
                  </div>
                  <div className="budget-mode" role="group" aria-label="Periodo del presupuesto">
                    {(
                      [
                        ["dia", "Cada día"],
                        ["total", "Todo el plan"],
                      ] as const
                    ).map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        aria-pressed={prefs.budgetMode === mode}
                        className={`mode-option ${prefs.budgetMode === mode ? "is-active" : ""}`}
                        onClick={() => update({ budgetMode: mode })}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="budget-input-wrap" htmlFor="budget-input">
                    <span className="currency-mark">$</span>
                    <input
                      id="budget-input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      maxLength={12}
                      aria-label="Presupuesto en pesos mexicanos"
                      value={prefs.budget}
                      onChange={(event) => update({ budget: cleanBudgetInput(event.target.value) })}
                    />
                    <span className="currency-caption">MXN</span>
                  </label>
                </section>

                <div className="stepper-grid">
                  <Stepper
                    label="Días"
                    value={prefs.days}
                    min={1}
                    max={14}
                    onChange={(days) => update({ days })}
                    accent="mango"
                  />
                  <Stepper
                    label="Personas"
                    value={prefs.people}
                    min={1}
                    max={8}
                    onChange={(people) => update({ people })}
                    accent="pink"
                  />
                </div>

                <section className="surface-card meals-card">
                  <div className="section-heading-row compact-heading">
                    <span className="step-number step-green">02</span>
                    <div>
                      <p className="eyebrow">Elige tus tiempos</p>
                      <h2 className="font-display text-2xl text-fg">¿Qué vamos a preparar?</h2>
                    </div>
                  </div>
                  <div className="meal-toggle-list">
                    <Toggle
                      icon="🌞"
                      title="Desayuno"
                      detail="Algo rico para arrancar"
                      checked={prefs.desayuno}
                      onChange={(desayuno) => update({ desayuno })}
                    />
                    <Toggle
                      icon="🍲"
                      title="Comida"
                      detail="Incluye postre y bebida"
                      checked={prefs.comida}
                      onChange={(comida) => update({ comida })}
                    />
                    <Toggle
                      icon="🌙"
                      title="Cena"
                      detail="Cierra el día sin complicarte"
                      checked={prefs.cena}
                      onChange={(cena) => update({ cena })}
                    />
                  </div>
                </section>

                {prefs.comida ? (
                  <section className="surface-card drink-card">
                    <div className="section-heading-row compact-heading">
                      <span className="step-number step-coral">03</span>
                      <div>
                        <p className="eyebrow">Un toque fresco</p>
                        <h2 className="font-display text-xl text-fg">¿Qué se sirve?</h2>
                      </div>
                    </div>
                    <div className="choice-grid">
                      {(
                        [
                          ["agua", "🍋", "Agua de sabor"],
                          ["refresco", "🥤", "Refresco"],
                        ] as const
                      ).map(([kind, icon, label]) => (
                        <button
                          key={kind}
                          type="button"
                          aria-pressed={prefs.drink === kind}
                          className={`choice-tile ${prefs.drink === kind ? "is-selected" : ""}`}
                          onClick={() => update({ drink: kind })}
                        >
                          <span className="choice-emoji" aria-hidden="true">
                            {icon}
                          </span>
                          <span>{label}</span>
                          {prefs.drink === kind ? <Check size={15} aria-hidden="true" /> : null}
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}

                <section className="surface-card store-card">
                  <div className="section-heading-row compact-heading">
                    <span className="step-number step-blue">04</span>
                    <div>
                      <p className="eyebrow">La ruta de compra</p>
                      <h2 className="font-display text-2xl text-fg">Elige supermercado</h2>
                    </div>
                  </div>
                  <div className="store-picker">
                    {STORES.map((store) => (
                      <button
                        key={store.id}
                        type="button"
                        aria-pressed={prefs.storeId === store.id}
                        className={`store-chip ${prefs.storeId === store.id ? "is-selected" : ""}`}
                        onClick={() => update({ storeId: store.id })}
                      >
                        {store.name}
                        {prefs.storeId === store.id ? <Check size={14} aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                </section>

                <button
                  type="button"
                  className="button-primary build-button"
                  onClick={build}
                  disabled={!draft}
                >
                  <Sparkles size={19} aria-hidden="true" /> Armar mi menú rico{" "}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>

              <aside className="planner-aside">
                <div className="estimate-card">
                  <span className="estimate-icon" aria-hidden="true">
                    🧺
                  </span>
                  <p className="eyebrow">Compra estimada mínima</p>
                  {floor != null ? (
                    <>
                      <p className="estimate-price">{money(floor)}</p>
                      <p className="estimate-copy">
                        Paquetes completos para {prefs.people}{" "}
                        {prefs.people === 1 ? "persona" : "personas"}.
                      </p>
                      {draft?.budgetMode === "dia" ? (
                        <div className="estimate-footnote">
                          {prefs.days} días de menú · hasta{" "}
                          {money(Number(prefs.budget) * prefs.days)} de presupuesto
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="estimate-copy">
                      Escribe un presupuesto y activa al menos un tiempo de comida.
                    </p>
                  )}
                  {notice ? (
                    <p className="notice-message" role="status">
                      {notice}
                    </p>
                  ) : null}
                </div>

                <div className="aside-tip">
                  <span className="tip-illustration" aria-hidden="true">
                    🌶️
                  </span>
                  <p className="eyebrow">Dato de cocina</p>
                  <p className="font-display text-xl text-fg">Una sola lista, menos vueltas.</p>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Juntamos ingredientes repetidos y redondeamos a paquetes reales para que sepas
                    qué comprar.
                  </p>
                </div>
                <ShelfNote live={live} matches={Object.keys(matched).length} />
                <div className="source-stamp">
                  <ShieldCheck size={15} /> Tus preferencias no salen de este dispositivo
                </div>
              </aside>
            </div>
          </section>
        ) : null}

        {tab === "menu" && plan && activeDay ? (
          <section className="page-content menu-page">
            <BudgetHero plan={plan} />
            <div className="day-heading-row">
              <div>
                <p className="eyebrow">Tu menú está servido</p>
                <h1 className="font-display text-4xl text-fg">El sabor de la semana</h1>
              </div>
              <span className="day-count-badge">
                <CalendarDays size={16} /> {plan.dayCount} días
              </span>
            </div>
            {plan.days.length > 1 ? (
              <div className="day-picker" aria-label="Elige un día">
                {plan.days.map((item) => (
                  <button
                    key={item.day}
                    type="button"
                    aria-pressed={item.day === activeDay.day}
                    className={`day-chip ${item.day === activeDay.day ? "is-active" : ""}`}
                    onClick={() => setDay(item.day)}
                  >
                    <span>Día</span>
                    <strong>{item.day}</strong>
                  </button>
                ))}
              </div>
            ) : null}
            <div className={`balance-banner ${activeDay.balanced ? "is-balanced" : "is-pending"}`}>
              <span aria-hidden="true">{activeDay.balanced ? "🥗" : "🧩"}</span>
              <p>
                {activeDay.balanced
                  ? "Este día suma proteína, cereal y verdura o fruta. ¡Buen provecho!"
                  : `A este día le falta ${activeDay.missing.join(", ")}.`}
                {plan.sameEveryDay
                  ? " Repetimos algunos platillos para aprovechar mejor los paquetes."
                  : ""}
              </p>
            </div>
            <div className="meal-card-grid">
              {activeDay.meals.map((meal, index) => (
                <MealCard key={`${meal.slot}-${meal.recipeId}`} meal={meal} index={index} />
              ))}
            </div>
            <MealIdeas live={live} />
          </section>
        ) : null}

        {tab === "menu" && !plan ? (
          <Empty onPlan={() => setTab("plan")} icon={<ChefHat size={30} />} />
        ) : null}

        {tab === "lista" && plan ? (
          <section className="page-content list-page">
            <div className="list-hero">
              <div className="list-hero-top">
                <span className="eyebrow-pill">
                  <ShoppingBasket size={15} /> Lista inteligente
                </span>
                <span className="cart-doodle" aria-hidden="true">
                  🛍️
                </span>
              </div>
              <div className="list-summary-row">
                <div>
                  <p className="list-store-name">{plan.storeName}</p>
                  <h1 className="font-display text-5xl text-fg">{money(plan.total)}</h1>
                  <p className="text-sm text-muted">
                    estimado para {plan.dayCount} días · {plan.people}{" "}
                    {plan.people === 1 ? "persona" : "personas"}
                  </p>
                </div>
                <button type="button" className="button-light" onClick={() => void copyList()}>
                  {copied ? <Check size={16} /> : <ExternalLink size={16} />}
                  {copied ? "Copiada" : "Copiar lista"}
                </button>
              </div>
              <div
                className="shopping-progress"
                aria-label={`${checkedCount} de ${plan.lines.length} productos marcados`}
              >
                <span
                  style={{
                    width: `${plan.lines.length ? (checkedCount / plan.lines.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="progress-caption">
                {checkedCount} de {plan.lines.length} productos en la canasta
              </p>
            </div>

            <div className="list-subheader">
              <div>
                <p className="eyebrow">Pasillo por pasillo</p>
                <h2 className="font-display text-3xl text-fg">A comprar se ha dicho</h2>
              </div>
              <button type="button" className="mini-action" onClick={() => setTab("qr")}>
                Comparte la app <QrCode size={16} />
              </button>
            </div>
            <p className="shopping-note">
              Las cantidades cubren el menú; compras el paquete completo y lo que sobra se queda en
              casa.
            </p>

            {groupLines(plan).map(([aisle, lines]) => (
              <section key={aisle} className="aisle-section">
                <h3 className="aisle-heading">
                  <span className="aisle-dot" />
                  {aisle}
                  <span>{lines.length}</span>
                </h3>
                <ul className="shopping-list">
                  {lines.map((line) => {
                    const on = checks.includes(line.id);
                    return (
                      <li key={line.id}>
                        <button
                          type="button"
                          className={`shopping-item ${on ? "is-checked" : ""}`}
                          aria-pressed={on}
                          onClick={() => markChecked(line.id)}
                        >
                          <span className="shopping-check" aria-hidden="true">
                            {on ? <Check size={15} /> : null}
                          </span>
                          <span className="shopping-item-copy">
                            <span className="shopping-name">{line.name}</span>
                            <span className="shopping-detail">
                              Llevas {line.buy}. {line.use}.{line.extra ? ` ${line.extra}.` : ""}
                              {line.live ? " Precio visto en anaquel." : ""}
                            </span>
                          </span>
                          <span className="shopping-cost">{money(line.cost)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </section>
        ) : null}

        {tab === "lista" && !plan ? (
          <Empty onPlan={() => setTab("plan")} icon={<ShoppingBasket size={30} />} />
        ) : null}
        {tab === "qr" ? (
          <div className="page-content">
            <QRShare url={appUrl} />
          </div>
        ) : null}
        {tab === "privacidad" ? (
          <div className="page-content">
            <PrivacyContent />
          </div>
        ) : null}

        {tab === "mas" ? (
          <section className="page-content more-page">
            <div className="more-hero">
              <span className="more-hero-emoji" aria-hidden="true">
                ✨
              </span>
              <p className="eyebrow">Todo lo extra, en un mismo lugar</p>
              <h1 className="font-display text-4xl text-fg">Más sabor. Más ideas.</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                Explora ingredientes, instala la app y comparte tu cocina. No necesitas cuenta ni
                configurar claves privadas.
              </p>
            </div>

            <div className="more-action-grid">
              <button type="button" className="more-action-card install-card" onClick={install}>
                <span className="more-action-emoji" aria-hidden="true">
                  📲
                </span>
                <span>
                  <strong>Instálala en tu pantalla</strong>
                  <small>Abre Menú Diario como una app en tu dispositivo.</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="more-action-card qr-shortcut"
                onClick={() => setTab("qr")}
              >
                <span className="more-action-emoji" aria-hidden="true">
                  🔗
                </span>
                <span>
                  <strong>Comparte con un QR</strong>
                  <small>Descarga la imagen o el vector para imprimir.</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="more-action-card privacy-shortcut"
                onClick={() => setTab("privacidad")}
              >
                <span className="more-action-emoji" aria-hidden="true">
                  🔒
                </span>
                <span>
                  <strong>Tu privacidad importa</strong>
                  <small>Lee qué se guarda y qué se consulta.</small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>

            <FoodSearch />

            <section className="sources-panel">
              <div className="section-heading-row compact-heading">
                <span className="step-number step-green">
                  <Leaf size={16} />
                </span>
                <div>
                  <p className="eyebrow">Datos abiertos y útiles</p>
                  <h2 className="font-display text-2xl text-fg">APIs públicas, sin registro.</h2>
                </div>
              </div>
              <div className="source-list">
                <SourceItem
                  name="Open Prices"
                  detail="Precios reales compartidos por personas que compran."
                  href="https://prices.openfoodfacts.org/"
                  icon="🏷️"
                />
                <SourceItem
                  name="TheMealDB"
                  detail="Ideas de recetas mexicanas con fotos y enlace a su fuente."
                  href="https://www.themealdb.com/"
                  icon="🍽️"
                />
                <SourceItem
                  name="Open Food Facts"
                  detail="Productos y datos de etiqueta consultados cuando buscas."
                  href="https://world.openfoodfacts.org/"
                  icon="🥫"
                />
              </div>
              <p className="api-footnote">
                No se configuran claves privadas; TheMealDB usa su identificador público de prueba
                1. Los precios varían por tienda y fecha.
              </p>
            </section>

            <section className="open-source-note">
              <div className="open-source-mark" aria-hidden="true">
                <QrCode size={19} />
              </div>
              <p>
                El QR se genera localmente con{" "}
                <a href="https://github.com/zpao/qrcode.react" target="_blank" rel="noreferrer">
                  qrcode.react
                </a>
                , proyecto abierto de GitHub. El enlace no pasa por un generador externo.
              </p>
            </section>

            <section className="data-controls">
              <div className="data-controls-copy">
                <ShieldCheck size={20} aria-hidden="true" />
                <div>
                  <h2>Controla tus datos</h2>
                  <p>
                    Elimina preferencias, menú y marcas de compra guardadas en este dispositivo.
                  </p>
                </div>
              </div>
              <button type="button" className="button-danger" onClick={clearAll}>
                Borrar mis datos
              </button>
            </section>
            {notice ? (
              <p className="notice-message" role="status">
                {notice}
              </p>
            ) : null}
          </section>
        ) : null}
      </main>

      <nav className="dock" aria-label="Navegación principal">
        <div className="dock-inner">
          <DockButton
            label="Plan"
            active={tab === "plan"}
            onClick={() => setTab("plan")}
            icon={<CalendarDays size={19} />}
          />
          <DockButton
            label="Menú"
            active={tab === "menu"}
            onClick={() => setTab("menu")}
            icon={<ChefHat size={19} />}
          />
          <DockButton
            label="Lista"
            active={tab === "lista"}
            onClick={() => setTab("lista")}
            icon={<ShoppingBasket size={19} />}
          />
          <DockButton
            label="QR"
            active={tab === "qr"}
            onClick={() => setTab("qr")}
            icon={<QrCode size={19} />}
          />
          <DockButton
            label="Privacidad"
            active={tab === "privacidad"}
            onClick={() => setTab("privacidad")}
            icon={<ShieldCheck size={19} />}
          />
          <DockButton
            label="Más"
            active={tab === "mas"}
            onClick={() => setTab("mas")}
            icon={<SlidersHorizontal size={19} />}
          />
        </div>
      </nav>
    </div>
  );
}

function PlannerHero() {
  return (
    <div className="planner-hero rise">
      <div className="planner-hero-copy">
        <span className="hero-eyebrow">
          <Sparkles size={14} /> Una semana rica empieza aquí
        </span>
        <h1 className="font-display">
          Menos vueltas.
          <br />
          <em>Más sabor.</em>
        </h1>
        <p>Planea rico, aprovecha lo que compras y cuida el presupuesto familiar.</p>
        <div className="hero-note">
          <span className="hero-note-dot" /> Hecho para comer mejor, sin complicarse
        </div>
      </div>
      <div className="hero-plate" aria-hidden="true">
        <span className="hero-sunburst" />
        <span className="hero-food hero-avocado">🥑</span>
        <span className="hero-food hero-tomato">🍅</span>
        <span className="hero-food hero-lemon">🍋</span>
        <span className="hero-food hero-herb">🌿</span>
        <span className="hero-plate-tag">
          ¡rico
          <br />y listo!
        </span>
      </div>
      <span className="hero-sparkle sparkle-one" aria-hidden="true">
        ✦
      </span>
      <span className="hero-sparkle sparkle-two" aria-hidden="true">
        ✳
      </span>
    </div>
  );
}

function BudgetHero({ plan }: { plan: PlanResult }) {
  const ratio = plan.budget > 0 ? Math.min(plan.total / plan.budget, 1) : 1;
  return (
    <div className="budget-hero">
      <div className="budget-hero-text">
        <span className="eyebrow-pill">
          <Salad size={15} /> Tu semana, bien servida
        </span>
        <p className="budget-hero-store">
          {plan.storeName} <span>·</span> {plan.balancedDays} de {plan.dayCount} días balanceados
        </p>
        <p className="budget-hero-total">{money(plan.total)}</p>
        <p className="budget-hero-caption">en caja, de {money(plan.budget)} de presupuesto</p>
        <div className="budget-progress">
          <span style={{ width: `${ratio * 100}%` }} />
        </div>
        {plan.shortfall > 0 ? (
          <p className="budget-message warning">
            Te faltan {money(plan.shortfall)}. Este es el plan más austero; sube un poco el
            presupuesto para variar.
          </p>
        ) : (
          <p className="budget-message">
            Te alcanza. Quedan {money(plan.budget - plan.total)} para un antojito.
          </p>
        )}
      </div>
      <div className="budget-hero-art" aria-hidden="true">
        <span>🍊</span>
        <span>🥬</span>
        <span>🍅</span>
        <i>¡a comer!</i>
      </div>
    </div>
  );
}

function MealCard({
  meal,
  index,
}: {
  meal: PlanResult["days"][number]["meals"][number];
  index: number;
}) {
  const emoji: Record<string, string> = {
    desayuno: "🌞",
    comida: "🍲",
    cena: "🌙",
    postre: "🍓",
    bebida: "🍋",
  };
  return (
    <article className={`meal-card meal-${meal.slot} rise delay-${Math.min(index, 3)}`}>
      <div className="meal-card-top">
        <span className="meal-slot-icon" aria-hidden="true">
          {emoji[meal.slot] ?? "🍴"}
        </span>
        <span className="meal-slot-label">{meal.slotLabel}</span>
        <span className="meal-time">{meal.minutes > 0 ? `${meal.minutes} min` : "Listo"}</span>
      </div>
      <h2 className="font-display text-3xl leading-tight text-fg">{meal.name}</h2>
      <ol className="meal-steps">
        {meal.steps.map((step, stepIndex) => (
          <li key={`${meal.recipeId}-${stepIndex}`}>
            <span>{stepIndex + 1}</span>
            <p>{step}</p>
          </li>
        ))}
      </ol>
      <div className="portion-list">
        <p className="eyebrow">Porciones para la mesa</p>
        <ul>
          {meal.portions.map((portion) => (
            <li key={portion}>{portion}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function MealIdeas({ live }: { live: MarketLive | null }) {
  const ideas = live?.mealIdeas ?? [];
  if (!ideas.length) return null;
  return (
    <section className="ideas-section">
      <div className="ideas-heading">
        <div>
          <p className="eyebrow">Inspiración de la comunidad</p>
          <h2 className="font-display text-3xl text-fg">¿Algo más para cocinar?</h2>
        </div>
        <span className="ideas-source">TheMealDB · abierto</span>
      </div>
      <div className="ideas-grid">
        {ideas.slice(0, 4).map((idea) => (
          <a
            key={idea.id}
            className="idea-card"
            href={idea.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            <img
              src={idea.imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <span className="idea-card-copy">
              <strong>{idea.name}</strong>
              <small>
                Ver receta <ExternalLink size={12} />
              </small>
            </span>
          </a>
        ))}
      </div>
      <p className="ideas-footnote">Ideas aparte del presupuesto y la lista calculados arriba.</p>
    </section>
  );
}

function ShelfNote({ live, matches }: { live: MarketLive | null; matches: number }) {
  if (!live) return <p className="shelf-note">Buscando precios y recetas de fuentes públicas…</p>;
  if (!live.ok) {
    return (
      <p className="shelf-note">
        Hoy usamos precios de referencia: las fuentes públicas no respondieron.
      </p>
    );
  }
  const bits = [
    live.sources.openPrices ? "Open Prices" : null,
    live.sources.mealDb ? "TheMealDB" : null,
  ].filter(Boolean);
  return (
    <p className="shelf-note">
      Fuentes: {bits.join(" · ")}
      {live.fromCache
        ? live.stale
          ? " · copia de respaldo"
          : " · guardadas unas horas"
        : " · actualizado ahora"}
      .{matches > 0 ? ` ${matches} precios coinciden con la despensa.` : ""}
    </p>
  );
}

function Empty({ onPlan, icon }: { onPlan: () => void; icon: ReactNode }) {
  return (
    <section className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">
        {icon}
      </span>
      <p className="eyebrow">La mesa está lista</p>
      <h2 className="font-display text-4xl text-fg">Todavía no hay menú</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Arma un plan con tu presupuesto, los días y las personas que comen contigo.
      </p>
      <button type="button" className="button-primary mt-6" onClick={onPlan}>
        Ir a planear <ArrowRight size={17} />
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
  accent,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accent: "mango" | "pink";
}) {
  return (
    <div className={`stepper-card stepper-${accent}`}>
      <div className="stepper-heading">
        <span>{label}</span>
        <span className="stepper-accent" aria-hidden="true">
          {label === "Días" ? "📅" : "👨‍👩‍👧"}
        </span>
      </div>
      <div className="stepper-controls">
        <button
          type="button"
          className="stepper-button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Menos ${label}`}
          disabled={value <= min}
        >
          −
        </button>
        <span className="stepper-value" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          className="stepper-button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Más ${label}`}
          disabled={value >= max}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  title,
  detail,
  checked,
  onChange,
}: {
  icon: string;
  title: string;
  detail: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className={`meal-toggle-row ${checked ? "is-on" : ""}`}>
      <span className="meal-toggle-emoji" aria-hidden="true">
        {icon}
      </span>
      <span className="meal-toggle-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <Switch.Root
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
        className="toggle-switch"
      >
        <Switch.Thumb className="toggle-thumb" />
      </Switch.Root>
    </div>
  );
}

function SourceItem({
  name,
  detail,
  href,
  icon,
}: {
  name: string;
  detail: string;
  href: string;
  icon: string;
}) {
  return (
    <a className="source-item" href={href} target="_blank" rel="noreferrer">
      <span className="source-emoji" aria-hidden="true">
        {icon}
      </span>
      <span className="source-copy">
        <strong>{name}</strong>
        <small>{detail}</small>
      </span>
      <ExternalLink size={16} aria-hidden="true" />
    </a>
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
    <button
      type="button"
      className={`dock-button ${active ? "is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <span className="dock-icon">{icon}</span>
      <span className="dock-label">{label}</span>
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
