/**
 * Parsers defensivos de las respuestas públicas. Nunca confían en la forma del JSON:
 * ignoran lo que no reconocen, acotan longitudes y solo aceptan URLs HTTPS de hosts conocidos.
 */

import { cleanText } from "../text.ts";
import { IMAGE_HOSTS, PAGE_HOSTS } from "./sources.ts";

export type Json = unknown;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const NUMERIC_ID = /^\d{1,8}$/;

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Acepta solo https con un host de la lista (o subdominios de esa lista). */
export function safeUrl(value: unknown, hosts: readonly string[]): string | null {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const allowed = hosts.some((item) => host === item || host.endsWith(`.${item}`));
    return allowed ? url.toString() : null;
  } catch {
    return null;
  }
}

export function safeImageUrl(value: unknown): string | null {
  return safeUrl(value, IMAGE_HOSTS);
}

export function safePageUrl(value: unknown): string | null {
  return safeUrl(value, PAGE_HOSTS);
}

// ---------- Precios de anaquel (Open Prices) ----------

export type ShelfItem = { name: string; price: number; store: string; date: string };

export function parseShelf(payload: Json): ShelfItem[] {
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  const shelf: ShelfItem[] = [];
  for (const raw of items) {
    if (!isRecord(raw)) continue;
    const product = isRecord(raw.product) ? raw.product : {};
    const location = isRecord(raw.location) ? raw.location : {};
    const name = cleanText(product.product_name, 120);
    const price = typeof raw.price === "number" ? raw.price : Number(raw.price);
    if (!name || !Number.isFinite(price) || price <= 0 || price > 400) continue;
    const store = cleanText(location.osm_brand, 60) ?? cleanText(location.osm_name, 60) ?? "Tienda";
    const date =
      typeof raw.date === "string" && ISO_DATE.test(raw.date.slice(0, 10))
        ? raw.date.slice(0, 10)
        : "";
    shelf.push({ name, price, store, date });
    if (shelf.length >= 100) break;
  }
  return shelf;
}

export function parseOpenFoodFactsCount(payload: Json): number {
  if (!isRecord(payload)) return 0;
  const count = finiteNumber(payload.count);
  return count && count > 0 ? Math.floor(count) : 0;
}

// ---------- Recetas (TheMealDB) ----------

export type MealCard = { id: string; name: string; thumb: string | null };

export function parseMealList(payload: Json): MealCard[] {
  const meals = isRecord(payload) && Array.isArray(payload.meals) ? payload.meals : [];
  const out: MealCard[] = [];
  for (const raw of meals) {
    if (!isRecord(raw)) continue;
    const id = String(raw.idMeal ?? "");
    const name = cleanText(raw.strMeal, 80);
    if (!NUMERIC_ID.test(id) || !name) continue;
    out.push({ id, name, thumb: safeImageUrl(raw.strMealThumb) });
    if (out.length >= 24) break;
  }
  return out;
}

export type MealDetail = {
  id: string;
  name: string;
  area: string | null;
  category: string | null;
  thumb: string | null;
  steps: string[];
  ingredients: { name: string; measure: string }[];
  youtube: string | null;
};

export function parseMealDetail(payload: Json): MealDetail | null {
  const list = isRecord(payload) && Array.isArray(payload.meals) ? payload.meals : [];
  const raw = list.find(isRecord);
  if (!raw) return null;
  const id = String(raw.idMeal ?? "");
  const name = cleanText(raw.strMeal, 80);
  if (!NUMERIC_ID.test(id) || !name) return null;

  const steps = String(raw.strInstructions ?? "")
    .split(/\r?\n/)
    .map((line) => cleanText(line, 400))
    .filter((line): line is string => Boolean(line))
    .slice(0, 30);

  const ingredients: { name: string; measure: string }[] = [];
  for (let index = 1; index <= 20; index += 1) {
    const ingredient = cleanText(raw[`strIngredient${index}`], 60);
    if (!ingredient) continue;
    ingredients.push({ name: ingredient, measure: cleanText(raw[`strMeasure${index}`], 40) ?? "" });
  }

  return {
    id,
    name,
    area: cleanText(raw.strArea, 40),
    category: cleanText(raw.strCategory, 40),
    thumb: safeImageUrl(raw.strMealThumb),
    steps,
    ingredients,
    youtube: safePageUrl(raw.strYoutube),
  };
}

// ---------- Ficha de ingrediente (Wikipedia en español) ----------

export type WikiSummary = {
  title: string;
  extract: string;
  description: string | null;
  thumb: string | null;
  pageUrl: string | null;
};

export function parseWikiSummary(payload: Json): WikiSummary | null {
  if (!isRecord(payload)) return null;
  const title = cleanText(payload.title, 120);
  const extract = cleanText(payload.extract, 700);
  if (!title || !extract) return null;
  const thumbnail = isRecord(payload.thumbnail) ? payload.thumbnail.source : undefined;
  const urls = isRecord(payload.content_urls) ? payload.content_urls : {};
  const desktop = isRecord(urls.desktop) ? urls.desktop : {};
  return {
    title,
    extract,
    description: cleanText(payload.description, 120),
    thumb: safeImageUrl(thumbnail),
    pageUrl: safePageUrl(desktop.page),
  };
}

// ---------- Festivos (Nager.Date) ----------

export type Holiday = { date: string; name: string };

export function parseHolidays(payload: Json): Holiday[] {
  if (!Array.isArray(payload)) return [];
  const out: Holiday[] = [];
  for (const raw of payload) {
    if (!isRecord(raw)) continue;
    const date = typeof raw.date === "string" && ISO_DATE.test(raw.date) ? raw.date : null;
    const name = cleanText(raw.localName, 100) ?? cleanText(raw.name, 100);
    if (!date || !name) continue;
    out.push({ date, name });
  }
  return out;
}

// ---------- Pronóstico (Open-Meteo) ----------

export type DayForecast = {
  date: string;
  tmax: number;
  tmin: number;
  precip: number | null;
  code: number | null;
};

export function parseForecast(payload: Json): DayForecast[] {
  if (!isRecord(payload) || !isRecord(payload.daily)) return [];
  const daily = payload.daily;
  const times = Array.isArray(daily.time) ? daily.time : [];
  const maxes = Array.isArray(daily.temperature_2m_max) ? daily.temperature_2m_max : [];
  const mins = Array.isArray(daily.temperature_2m_min) ? daily.temperature_2m_min : [];
  const rain = Array.isArray(daily.precipitation_probability_max)
    ? daily.precipitation_probability_max
    : [];
  const codes = Array.isArray(daily.weather_code) ? daily.weather_code : [];
  const out: DayForecast[] = [];
  for (let index = 0; index < times.length && out.length < 16; index += 1) {
    const date = times[index];
    const tmax = finiteNumber(maxes[index]);
    const tmin = finiteNumber(mins[index]);
    if (typeof date !== "string" || !ISO_DATE.test(date) || tmax === null || tmin === null)
      continue;
    out.push({
      date,
      tmax,
      tmin,
      precip: finiteNumber(rain[index]),
      code: finiteNumber(codes[index]),
    });
  }
  return out;
}
