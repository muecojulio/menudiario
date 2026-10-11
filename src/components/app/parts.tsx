import type { ReactNode } from "react";
import * as Switch from "@radix-ui/react-switch";
import { ExternalLink as ExternalLinkIcon, Minus, Plus } from "lucide-react";
import { money } from "@/lib/format";
import type { PlanResult } from "@/lib/planner";
import type { MarketLive } from "@/lib/market.functions";

export const CARD = "rounded-2xl bg-surface p-4";

export function Stepper({
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
    <div className={CARD}>
      <p id={`stepper-${label}`} className="text-sm text-muted">
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          className="press grid h-11 w-11 place-items-center rounded-full bg-raise text-fg disabled:opacity-40"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Menos ${label.toLowerCase()}`}
        >
          <Minus size={18} aria-hidden />
        </button>
        <span
          aria-labelledby={`stepper-${label}`}
          aria-live="polite"
          className="font-display text-3xl text-fg tabular-nums"
        >
          {value}
        </span>
        <button
          type="button"
          className="press grid h-11 w-11 place-items-center rounded-full bg-raise text-fg disabled:opacity-40"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Más ${label.toLowerCase()}`}
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>
    </div>
  );
}

export function Toggle({
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
    <div className="flex min-h-11 items-center justify-between gap-3">
      <label htmlFor={`switch-${title}`} className="min-w-0 flex-1">
        <span className="block text-fg">{title}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </label>
      <Switch.Root
        id={`switch-${title}`}
        checked={checked}
        onCheckedChange={onChange}
        className="press relative flex h-11 w-14 shrink-0 items-center rounded-full bg-raise transition-colors duration-200 data-[state=checked]:bg-clay"
      >
        <Switch.Thumb className="block h-6 w-6 translate-x-1 rounded-full bg-fg shadow transition-transform duration-200 data-[state=checked]:translate-x-7" />
      </Switch.Root>
    </div>
  );
}

export function BudgetHero({ plan }: { plan: PlanResult }) {
  const ratio = plan.budget > 0 ? Math.min(plan.total / plan.budget, 1) : 1;
  return (
    <div className={`${CARD} relative overflow-hidden`}>
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-clay/10 blur-2xl"
      />
      <p className="relative text-sm text-muted">
        {plan.storeName} · {plan.balancedDays} de {plan.dayCount} días balanceados
      </p>
      <p className="relative mt-1 font-display text-4xl text-fg tabular-nums">
        {money(plan.total)}
      </p>
      <p className="relative text-sm text-muted">en caja, de {money(plan.budget)} de presupuesto</p>
      <div
        className="relative mt-3 h-2 overflow-hidden rounded-full bg-raise"
        role="meter"
        aria-label="Gasto frente al presupuesto"
        aria-valuemin={0}
        aria-valuemax={Math.round(plan.budget)}
        aria-valuenow={Math.round(Math.min(plan.total, plan.budget))}
        aria-valuetext={`${money(plan.total)} de ${money(plan.budget)}`}
      >
        <div
          className="h-full rounded-full bg-clay transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {plan.shortfall > 0 ? (
        <p className="relative mt-3 text-sm text-clay">
          Te faltan {money(plan.shortfall)}. Este es el plan más austero; sube el presupuesto para
          variar platillos.
        </p>
      ) : (
        <p className="relative mt-3 text-sm text-muted">
          Te alcanza. El sobrante queda en {money(plan.budget - plan.total)}.
        </p>
      )}
    </div>
  );
}

export function ShelfNote({ live, matches }: { live: MarketLive | null; matches: number }) {
  if (!live) return <p className="text-sm text-muted">Buscando precios públicos…</p>;
  if (!live.ok) {
    return (
      <p className="text-sm text-muted">
        Hoy uso precios de referencia. Las listas públicas no respondieron.
      </p>
    );
  }
  const bits = [
    live.sources.openPrices ? "Open Prices" : null,
    live.sources.openFoodFacts ? "Open Food Facts" : null,
    live.sources.mealDb ? "TheMealDB" : null,
  ].filter(Boolean);
  return (
    <p className="text-sm text-muted">
      Fuentes vivas: {bits.join(", ")}
      {live.stale ? " (respaldo de hasta 7 días)" : live.fromCache ? " (caché reciente)" : ""}.
      {matches > 0 ? ` ${matches} precios coinciden con la despensa.` : ""}
    </p>
  );
}

export function Empty({ onPlan }: { onPlan: () => void }) {
  return (
    <section className="px-5 py-16 text-center">
      <h2 className="font-display text-4xl text-fg">Todavía no hay menú</h2>
      <p className="mt-2 text-sm text-muted">
        Arma uno con tu presupuesto y los días que vas a cubrir.
      </p>
      <button
        type="button"
        className="press mt-6 min-h-11 rounded-full bg-clay px-5 py-3 text-bg"
        onClick={onPlan}
      >
        Ir al plan
      </button>
    </section>
  );
}

/** Enlace externo: se abre en otra pestaña sin pasar la referencia de la app. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="press inline-flex min-h-11 items-center gap-1.5 text-clay underline-offset-4 hover:underline"
    >
      {children}
      <ExternalLinkIcon size={14} aria-hidden />
      <span className="sr-only">(se abre en otra pestaña)</span>
    </a>
  );
}
