import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  QrCode,
  Refrigerator,
  ShieldCheck,
  ShoppingBasket,
  SlidersHorizontal,
} from "lucide-react";
import { matchLivePrices } from "@/lib/catalog";
import { getMarketLive, type MarketLive } from "@/lib/market.functions";
import { getHolidays, getWeather, type WeatherResult } from "@/lib/public-api.functions";
import type { Holiday } from "@/lib/public-api/parsers";
import { CITIES } from "@/lib/public-api/cities";
import { planDates, todayIn, yearsCovered } from "@/lib/calendar";
import { minimumBudget, planMenu, type PlanInput, type PlanResult } from "@/lib/planner";
import {
  DEFAULT_PREFS,
  CHECK_KEY,
  PLAN_KEY,
  PREFS_KEY,
  readChecks,
  readPlan,
  readPrefs,
  type Prefs,
} from "@/lib/storage";
import { prefersReducedMotion, scrollBehavior } from "@/lib/use-media";
import { useHorizontalSwipe } from "@/lib/use-swipe";
import { useAsyncAction } from "@/lib/use-async-action";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { IngredientSheet } from "./app/detail-sheets";
import { MenuPanel } from "./app/menu-panel";
import { MorePanel } from "./app/more-panel";
import { PlanPanel } from "./app/plan-panel";
import { QrPanel } from "./app/qr-panel";
import { ShopPanel } from "./app/shop-panel";
import { PrivacyContent } from "./app/privacy-content";
import { Empty } from "./app/parts";

type Tab = "plan" | "menu" | "lista" | "qr" | "privacidad" | "mas";

const TABS: Array<{ value: Tab; label: string; icon: ReactNode }> = [
  { value: "plan", label: "Plan", icon: <CalendarRange size={18} aria-hidden /> },
  { value: "menu", label: "Menú", icon: <Refrigerator size={18} aria-hidden /> },
  { value: "lista", label: "Lista", icon: <ShoppingBasket size={18} aria-hidden /> },
  { value: "qr", label: "QR", icon: <QrCode size={18} aria-hidden /> },
  { value: "privacidad", label: "Privacidad", icon: <ShieldCheck size={18} aria-hidden /> },
  { value: "mas", label: "Más", icon: <SlidersHorizontal size={18} aria-hidden /> },
];

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* almacenamiento lleno o bloqueado: la sesión sigue funcionando */
  }
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
  const tabRef = useRef<Tab>("plan");
  const [panelDirection, setPanelDirection] = useState<"forward" | "back">("forward");
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<MarketLive | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [day, setDay] = useState(1);
  const [checks, setChecks] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [ingredient, setIngredient] = useState<{ id: string; name: string } | null>(null);
  const build = useAsyncAction(1400);
  const mainRef = useRef<HTMLDivElement>(null);
  const firstTab = useRef(true);

  // Carga inicial: lo guardado se valida antes de usarse (una versión vieja cae al valor por defecto).
  useEffect(() => {
    setPrefs(readPrefs(readStorage(PREFS_KEY)));
    setPlan(readPlan(readStorage(PLAN_KEY)));
    setChecks(readChecks(readStorage(CHECK_KEY)));
    setReady(true);
    getMarketLive()
      .then(setLive)
      .catch(() => setLive(null));
    getHolidays({ data: { years: yearsCovered(planDates(todayIn("America/Mexico_City"), 16)) } })
      .then((result) => setHolidays(result.holidays))
      .catch(() => setHolidays([]));
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStorage(PREFS_KEY, JSON.stringify(prefs));
    writeStorage(PLAN_KEY, plan ? JSON.stringify(plan) : null);
    writeStorage(CHECK_KEY, JSON.stringify(checks));
  }, [prefs, plan, checks, ready]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    getWeather({ data: { cityId: prefs.cityId } })
      .then((result) => !cancelled && setWeather(result))
      .catch(
        () =>
          !cancelled &&
          setWeather({
            ok: false,
            cityId: prefs.cityId,
            days: [],
            fetchedAt: null,
            fromCache: false,
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [ready, prefs.cityId]);

  // Al cambiar de pestaña se vuelve arriba (sin animación si el usuario pide movimiento reducido).
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
  }, [tab]);

  const cityTz = CITIES.find((city) => city.id === prefs.cityId)?.tz ?? "America/Mexico_City";
  const startIso = useMemo(() => todayIn(cityTz), [cityTz]);
  const matched = useMemo(() => matchLivePrices(live?.shelf ?? []), [live]);
  const draft = useMemo(() => toInput(prefs, matched), [prefs, matched]);
  const floor = useMemo(() => (draft ? minimumBudget(draft) : null), [draft]);
  const tabIndex = TABS.findIndex((item) => item.value === tab);

  function selectTab(next: Tab) {
    const previousIndex = TABS.findIndex((item) => item.value === tabRef.current);
    const nextIndex = TABS.findIndex((item) => item.value === next);
    if (previousIndex === nextIndex) return;
    setPanelDirection(nextIndex > previousIndex ? "forward" : "back");
    tabRef.current = next;
    setTab(next);
  }

  useHorizontalSwipe(mainRef, {
    onLeft: () => selectTab(TABS[Math.min(TABS.length - 1, tabIndex + 1)]!.value),
    onRight: () => selectTab(TABS[Math.max(0, tabIndex - 1)]!.value),
  });

  function update(partial: Partial<Prefs>) {
    setPrefs((current) => ({ ...current, ...partial }));
  }

  function buildMenu() {
    if (!draft) {
      setNotice("Escribe un presupuesto y elige al menos una comida.");
      throw new Error("sin datos");
    }
    setPlan(planMenu(draft));
    setDay(1);
    setChecks([]);
    setNotice(null);
    selectTab("menu");
  }

  function clearAll() {
    setPlan(null);
    setChecks([]);
    writeStorage(PLAN_KEY, null);
    writeStorage(CHECK_KEY, null);
    selectTab("plan");
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg pb-32">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-5 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="relative h-9 w-9 shrink-0" aria-hidden>
            <span className="absolute bottom-2 left-0 right-0 h-px bg-clay" />
            <span className="absolute bottom-3 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-clay" />
          </span>
          <div>
            <p className="font-display text-2xl leading-none text-fg">Menú Diario</p>
            <p className="mt-1 text-sm text-muted">Hecho para tu mesa y tu bolsillo.</p>
          </div>
        </div>
      </header>

      <div ref={mainRef} className="relative">
        <PanelFrame value="plan" active={tab === "plan"} motionDirection={panelDirection}>
          <PlanPanel
            prefs={prefs}
            update={update}
            draft={draft !== null}
            floor={floor}
            notice={notice}
            live={live}
            matches={Object.keys(matched).length}
            status={build.status}
            onBuild={() => void build.run(buildMenu)}
          />
        </PanelFrame>

        <PanelFrame value="menu" active={tab === "menu"} motionDirection={panelDirection}>
          {plan ? (
            <MenuPanel
              plan={plan}
              day={day}
              onDay={setDay}
              startIso={startIso}
              forecast={weather}
              holidays={holidays}
              meals={live?.meals ?? []}
            />
          ) : (
            <Empty onPlan={() => selectTab("plan")} />
          )}
        </PanelFrame>

        <PanelFrame value="lista" active={tab === "lista"} motionDirection={panelDirection}>
          <ShopPanel
            plan={plan}
            checks={checks}
            onChecks={setChecks}
            onInfo={setIngredient}
            onEmptyAction={() => selectTab("plan")}
          />
        </PanelFrame>

        <PanelFrame value="qr" active={tab === "qr"} motionDirection={panelDirection}>
          <QrPanel />
        </PanelFrame>

        <PanelFrame
          value="privacidad"
          active={tab === "privacidad"}
          motionDirection={panelDirection}
        >
          <section className="px-5 py-5">
            <h2 className="font-display text-4xl text-fg">Privacidad</h2>
            <p className="mt-2 text-sm text-muted">
              Qué guarda la app, qué consulta y qué no hace.
            </p>
            <div className="mt-6">
              <PrivacyContent compact />
            </div>
            <Link
              to="/privacidad"
              className="mt-6 inline-flex min-h-11 items-center text-sm text-clay"
            >
              Abrir esta política en su propia página
            </Link>
          </section>
        </PanelFrame>

        <PanelFrame value="mas" active={tab === "mas"} motionDirection={panelDirection}>
          <MorePanel live={live} onClear={clearAll} />
        </PanelFrame>
      </div>

      <nav
        aria-label="Secciones"
        className="dock fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 backdrop-blur"
      >
        <div className="mx-auto max-w-lg px-2 pt-1">
          <SegmentedControl<Tab>
            id="app-tab"
            mode="tabs"
            label="Secciones de la app"
            options={TABS}
            value={tab}
            onChange={selectTab}
            controlsFor={(value) => `panel-${value}`}
            scrollable
            className="min-w-0 gap-0"
            itemClassName="w-16 flex-none flex-col gap-0.5 px-0 py-1.5 text-[11px] leading-tight"
            selectedClassName="text-clay"
            idleClassName="text-muted"
            indicatorClassName="bg-clay-soft"
          />
        </div>
      </nav>

      <IngredientSheet
        ingredient={ingredient}
        onOpenChange={(open) => !open && setIngredient(null)}
      />
    </div>
  );
}

const PANEL_TRANSITION_MS = 220;

/** Mantiene los paneles montados y animables, pero inertes desde que dejan de estar activos. */
function PanelFrame({
  value,
  active,
  motionDirection,
  children,
}: {
  value: Tab;
  active: boolean;
  motionDirection: "forward" | "back";
  children: ReactNode;
}) {
  const firstEffect = useRef(true);
  const visibleRef = useRef(active);
  const [visible, setVisible] = useState(active);
  const [phase, setPhase] = useState<"active" | "inactive" | "enter" | "exit">(
    active ? "active" : "inactive",
  );

  useLayoutEffect(() => {
    if (firstEffect.current) {
      firstEffect.current = false;
      return;
    }

    let frame: number | undefined;
    let timer: number | undefined;
    if (active) {
      visibleRef.current = true;
      setVisible(true);
      if (prefersReducedMotion()) {
        setPhase("active");
      } else {
        setPhase("enter");
        frame = requestAnimationFrame(() => setPhase("active"));
      }
    } else if (visibleRef.current) {
      if (prefersReducedMotion()) {
        visibleRef.current = false;
        setVisible(false);
        setPhase("inactive");
      } else {
        setPhase("exit");
        timer = window.setTimeout(() => {
          visibleRef.current = false;
          setVisible(false);
          setPhase("inactive");
        }, PANEL_TRANSITION_MS);
      }
    }

    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [active]);

  return (
    <div
      id={`panel-${value}`}
      role="tabpanel"
      aria-labelledby={`app-tab-${value}`}
      aria-hidden={!active}
      inert={!active}
      hidden={!visible}
      data-phase={phase}
      data-direction={motionDirection}
      className="tab-panel"
      tabIndex={0}
    >
      {children}
    </div>
  );
}
