/**
 * Estado que se guarda en este teléfono (localStorage). Como cualquier dato que vuelve
 * del almacenamiento, se valida antes de usarse: un valor viejo o alterado cae al
 * valor por defecto en vez de romper la pantalla.
 */

import { z } from "zod";
import { STORES } from "./catalog.ts";
import type { PlanResult } from "./planner.ts";
import { CITY_IDS, DEFAULT_CITY_ID } from "./public-api/cities.ts";

export const PREFS_KEY = "menudiario-prefs";
export const PLAN_KEY = "menudiario-plan";
export const CHECK_KEY = "menudiario-checks";

export type BudgetMode = "dia" | "total";
export type DrinkChoice = "agua" | "refresco";

export type Prefs = {
  budget: string;
  budgetMode: BudgetMode;
  days: number;
  people: number;
  desayuno: boolean;
  comida: boolean;
  cena: boolean;
  drink: DrinkChoice;
  storeId: string;
  cityId: string;
};

export const DEFAULT_PREFS: Prefs = {
  budget: "250",
  budgetMode: "dia",
  days: 3,
  people: 2,
  desayuno: true,
  comida: true,
  cena: true,
  drink: "agua",
  storeId: "walmart",
  cityId: DEFAULT_CITY_ID,
};

const STORE_IDS = STORES.map((store) => store.id) as [string, ...string[]];

const PrefsSchema = z.object({
  budget: z
    .string()
    .max(12)
    .regex(/^\d{0,9}(\.\d{0,2})?$/)
    .catch(DEFAULT_PREFS.budget),
  budgetMode: z.enum(["dia", "total"]).catch(DEFAULT_PREFS.budgetMode),
  days: z.number().int().min(1).max(14).catch(DEFAULT_PREFS.days),
  people: z.number().int().min(1).max(8).catch(DEFAULT_PREFS.people),
  desayuno: z.boolean().catch(DEFAULT_PREFS.desayuno),
  comida: z.boolean().catch(DEFAULT_PREFS.comida),
  cena: z.boolean().catch(DEFAULT_PREFS.cena),
  drink: z.enum(["agua", "refresco"]).catch(DEFAULT_PREFS.drink),
  storeId: z.enum(STORE_IDS).catch(DEFAULT_PREFS.storeId),
  cityId: z.enum(CITY_IDS).catch(DEFAULT_PREFS.cityId),
});

const MealSchema = z.object({
  slot: z.enum(["desayuno", "comida", "cena", "postre", "bebida"]),
  slotLabel: z.string().max(20),
  recipeId: z.string().max(60),
  name: z.string().max(120),
  minutes: z.number().int().min(0).max(600),
  steps: z.array(z.string().max(300)).max(10),
  portions: z.array(z.string().max(120)).max(20),
  groups: z.array(z.enum(["proteina", "verdura", "cereal", "fruta"])).max(4),
});

const DaySchema = z.object({
  day: z.number().int().min(1).max(14),
  meals: z.array(MealSchema).max(6),
  balanced: z.boolean(),
  missing: z.array(z.string().max(40)).max(4),
});

const LineSchema = z.object({
  id: z.string().max(60),
  name: z.string().max(80),
  aisle: z.string().max(40),
  buy: z.string().max(80),
  use: z.string().max(80),
  extra: z.string().max(80).nullable(),
  cost: z.number().finite().min(0),
  live: z.boolean(),
  liveNote: z.string().max(200).nullable(),
});

export const PlanSchema = z.object({
  days: z.array(DaySchema).min(1).max(14),
  lines: z.array(LineSchema).max(80),
  total: z.number().finite().min(0),
  budget: z.number().finite().min(0),
  perDay: z.number().finite().min(0),
  shortfall: z.number().finite().min(0),
  balancedDays: z.number().int().min(0),
  storeName: z.string().max(40),
  people: z.number().int().min(1).max(8),
  dayCount: z.number().int().min(1).max(14),
  sameEveryDay: z.boolean(),
});

const ChecksSchema = z.array(z.string().max(80)).max(300);

export function readPrefs(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = PrefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function readPlan(raw: string | null): PlanResult | null {
  if (!raw) return null;
  try {
    const parsed = PlanSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as PlanResult) : null;
  } catch {
    return null;
  }
}

export function readChecks(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = ChecksSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
