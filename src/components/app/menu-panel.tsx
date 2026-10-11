import { useState } from "react";
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Check,
  Flame,
  Leaf,
  Snowflake,
  Sun,
  Thermometer,
  type LucideIcon,
} from "lucide-react";
import { dayChip } from "@/lib/calendar";
import { describeWeather, menuTip, type WeatherKind } from "@/lib/public-api/advice";
import type { Holiday, DayForecast, MealCard } from "@/lib/public-api/parsers";
import type { PlanResult, MealView } from "@/lib/planner";
import type { WeatherResult } from "@/lib/public-api.functions";
import { Carousel } from "@/components/ui/carousel";
import { ChipRail } from "@/components/ui/chip-rail";
import { BudgetHero, CARD } from "./parts";
import { MealDetailSheet } from "./detail-sheets";

const WEATHER_ICON: Record<WeatherKind, LucideIcon> = {
  clear: Sun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  snow: Snowflake,
  storm: CloudLightning,
};

const TIP_ICON = { hot: Flame, rain: CloudSun, cold: Thermometer, mild: Leaf } as const;
const TIP_TONE = {
  hot: "text-clay",
  rain: "text-[#8fb8d8]",
  cold: "text-[#9cc9c0]",
  mild: "text-muted",
} as const;

export function MenuPanel({
  plan,
  day,
  onDay,
  startIso,
  forecast,
  holidays,
  meals,
}: {
  plan: PlanResult;
  day: number;
  onDay: (day: number) => void;
  startIso: string;
  forecast: WeatherResult | null;
  holidays: Holiday[];
  meals: MealCard[];
}) {
  const activeDay = plan.days.find((item) => item.day === day) ?? plan.days[0]!;
  const dateFor = (dayNumber: number) => addOffset(startIso, dayNumber - 1);
  const forecastFor = (dayNumber: number) =>
    forecast?.days.find((item) => item.date === dateFor(dayNumber)) ?? null;
  const holidayFor = (dayNumber: number) =>
    holidays.find((item) => item.date === dateFor(dayNumber)) ?? null;
  const [openMeal, setOpenMeal] = useState<string | null>(null);

  const today = forecastFor(activeDay.day);
  const holiday = holidayFor(activeDay.day);

  return (
    <section className="space-y-5 px-5 py-5">
      <BudgetHero plan={plan} />

      {plan.days.length > 1 ? (
        <ChipRail
          role="radiogroup"
          label="Días del menú"
          activeKey={String(activeDay.day)}
          className="-mx-5 px-5 py-1"
        >
          {plan.days.map((item) => {
            const selected = item.day === activeDay.day;
            const chip = dayChip(dateFor(item.day));
            const weather = forecastFor(item.day);
            const Icon = weather ? WEATHER_ICON[describeWeather(weather.code).kind] : null;
            const isHoliday = holidayFor(item.day);
            return (
              <button
                key={item.day}
                type="button"
                role="radio"
                aria-checked={selected}
                data-active={selected}
                tabIndex={selected ? 0 : -1}
                title={isHoliday ? `${chip.long} · ${isHoliday.name}` : chip.long}
                onClick={() => onDay(item.day)}
                className={`press flex min-h-14 shrink-0 snap-start flex-col items-start justify-center gap-0.5 rounded-2xl border px-4 py-2 text-left text-sm ${
                  selected ? "border-clay bg-clay text-bg" : "border-line bg-surface text-fg"
                }`}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  Día {item.day}
                  {selected ? <Check size={13} strokeWidth={3} aria-hidden /> : null}
                  {isHoliday ? (
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-clay" />
                  ) : null}
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs ${selected ? "text-bg/80" : "text-muted"}`}
                >
                  {Icon ? <Icon size={13} aria-hidden /> : null}
                  {weather ? `${Math.round(weather.tmax)}°` : `${chip.weekday} ${chip.day}`}
                  <span className="sr-only">{chip.long}</span>
                </span>
              </button>
            );
          })}
        </ChipRail>
      ) : null}

      <div className={`${CARD} space-y-3`} aria-live="polite">
        <p className="text-sm text-muted">
          {activeDay.balanced
            ? "Día balanceado: proteína, cereal y verdura o fruta."
            : `Este día se queda corto en ${activeDay.missing.join(", ")}.`}
          {plan.sameEveryDay ? " Se repite el menú para aprovechar los paquetes." : ""}
        </p>
        {holiday ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-clay-soft px-3 py-1 text-xs text-fg">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-clay" />
            Festivo: {holiday.name}
          </p>
        ) : null}
        {today ? <WeatherLine day={today} /> : <WeatherFallback forecast={forecast} />}
      </div>

      <Carousel
        key={activeDay.day}
        label={`Comidas del día ${activeDay.day}`}
        slides={activeDay.meals.map((meal) => (
          <MealCardView key={meal.slot} meal={meal} />
        ))}
        slideLabel={(index, total) =>
          `${activeDay.meals[index]?.slotLabel ?? "Comida"}, ${index + 1} de ${total}`
        }
      />

      <PlanTips forecast={today} />

      {meals.length > 0 ? (
        <section aria-labelledby="ideas-title" className="space-y-3 pt-2">
          <div>
            <h2 id="ideas-title" className="font-display text-2xl text-fg">
              Ideas mexicanas
            </h2>
            <p className="text-xs text-muted">
              Recetas abiertas de TheMealDB. Son ideas, no parte del presupuesto.
            </p>
          </div>
          <Carousel
            label="Ideas mexicanas de TheMealDB"
            slides={meals.slice(0, 12).map((meal) => (
              <article key={meal.id} className={`${CARD} flex h-full flex-col gap-3 p-3`}>
                {meal.thumb ? (
                  <img
                    src={meal.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full rounded-xl object-cover"
                  />
                ) : (
                  <div aria-hidden className="aspect-[4/3] w-full rounded-xl bg-raise" />
                )}
                <h3 className="font-display text-xl leading-tight text-fg">{meal.name}</h3>
                <button
                  type="button"
                  onClick={() => setOpenMeal(meal.id)}
                  className="press mt-auto inline-flex min-h-11 items-center justify-center rounded-full border border-line px-4 text-sm text-fg"
                  aria-haspopup="dialog"
                >
                  Ver receta
                  <span className="sr-only"> de {meal.name}</span>
                </button>
              </article>
            ))}
            slideLabel={(index, total) => `Receta ${index + 1} de ${total}`}
            slideClassName="w-[78%] sm:w-[52%]"
            gridClassName="md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:mx-0 lg:grid-cols-3"
          />
        </section>
      ) : null}

      <MealDetailSheet id={openMeal} onOpenChange={(open) => !open && setOpenMeal(null)} />
    </section>
  );
}

function addOffset(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function WeatherLine({ day }: { day: DayForecast }) {
  const weather = describeWeather(day.code);
  const Icon = WEATHER_ICON[weather.kind];
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg">
      <span className="inline-flex items-center gap-2">
        <Icon size={18} aria-hidden className="text-clay" />
        {weather.label}
      </span>
      <span className="tabular-nums text-muted">
        {Math.round(day.tmin)}° / {Math.round(day.tmax)}°
      </span>
      {day.precip !== null ? (
        <span className="tabular-nums text-muted">Lluvia {Math.round(day.precip)}%</span>
      ) : null}
    </div>
  );
}

function WeatherFallback({ forecast }: { forecast: WeatherResult | null }) {
  if (forecast === null) return <p className="text-xs text-muted">Cargando clima…</p>;
  if (!forecast.ok) return <p className="text-xs text-muted">Clima no disponible por ahora.</p>;
  return <p className="text-xs text-muted">Sin pronóstico para esta fecha todavía.</p>;
}

function PlanTips({ forecast }: { forecast: DayForecast | null }) {
  if (!forecast) return null;
  const tip = menuTip(forecast);
  const Icon = TIP_ICON[tip.tone];
  return (
    <aside className={`${CARD} flex gap-3`} aria-label="Sugerencia según el clima">
      <Icon size={20} aria-hidden className={`mt-0.5 shrink-0 ${TIP_TONE[tip.tone]}`} />
      <div>
        <p className="text-fg">{tip.title}</p>
        <p className="text-sm text-muted">{tip.body}</p>
      </div>
    </aside>
  );
}

function MealCardView({ meal }: { meal: MealView }) {
  return (
    <article className={`${CARD} flex h-full flex-col`}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-clay">{meal.slotLabel}</p>
        <p className="text-sm text-muted">{meal.minutes > 0 ? `${meal.minutes} min` : "Listo"}</p>
      </div>
      <h2 className="mt-1 font-display text-3xl leading-tight text-fg">{meal.name}</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fg marker:text-clay">
        {meal.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <ul className="mt-auto space-y-1 pt-3 text-sm text-muted">
        {meal.portions.map((portion) => (
          <li key={portion}>{portion}</li>
        ))}
      </ul>
    </article>
  );
}
