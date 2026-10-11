import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchJson } from "./public-api/http.server.ts";
import { PUBLIC_SOURCES } from "./public-api/sources.ts";

export type FoodProduct = {
  name: string;
  brand: string;
  quantity: string;
  nutriScore: string | null;
  kcal: number | null;
  protein: number | null;
  sugars: number | null;
  sourceUrl: string;
};

export type FoodSearchResult = {
  ok: boolean;
  query: string;
  products: FoodProduct[];
  cached: boolean;
  issue: "no-results" | "unavailable" | "rate-limited" | null;
};

const CACHE_TIME = 30 * 60 * 1000;
const CACHE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;
const RATE_LIMIT = 24;
const MAX_CONCURRENT_SEARCHES = 6;
const querySchema = z.object({
  query: z
    .string()
    .trim()
    .min(2, "Escribe al menos dos letras.")
    .max(60, "La búsqueda debe tener 60 caracteres o menos.")
    .regex(
      /^[\p{L}\p{M}\p{N}\s'’.-]+$/u,
      "Usa solo letras, números, espacios, apóstrofes o guiones.",
    ),
});

const responseCache = new Map<string, { expiresAt: number; result: FoodSearchResult }>();
const inFlight = new Map<string, Promise<FoodSearchResult>>();
let rateWindowStart = 0;
let searchesInWindow = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, limit: number): string {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}

function numberOrNull(value: unknown): number | null {
  const number =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 && number <= 100_000
    ? Math.round(number * 10) / 10
    : null;
}

function parseProducts(payload: unknown): FoodProduct[] {
  if (!isRecord(payload) || !Array.isArray(payload.products)) return [];
  const products: FoodProduct[] = [];
  for (const item of payload.products) {
    if (!isRecord(item)) continue;
    const name = text(item.product_name, 100);
    if (!name) continue;
    const nutriments = isRecord(item.nutriments) ? item.nutriments : {};
    const code = text(item.code, 14);
    const sourceUrl = /^\d{8,14}$/.test(code)
      ? `https://world.openfoodfacts.org/product/${code}`
      : "https://world.openfoodfacts.org";
    const grade = text(item.nutriscore_grade ?? item.nutrition_grade_fr, 1).toLowerCase();
    products.push({
      name,
      brand: text(item.brands, 72),
      quantity: text(item.quantity, 36),
      nutriScore: /^[a-e]$/.test(grade) ? grade : null,
      kcal: numberOrNull(nutriments["energy-kcal_100g"]),
      protein: numberOrNull(nutriments.proteins_100g),
      sugars: numberOrNull(nutriments.sugars_100g),
      sourceUrl,
    });
    if (products.length === 6) break;
  }
  return products;
}

function trimCache(now: number): void {
  for (const [key, entry] of responseCache) {
    if (entry.expiresAt <= now) responseCache.delete(key);
  }
  while (responseCache.size >= CACHE_LIMIT) {
    const oldest = responseCache.keys().next().value;
    if (oldest === undefined) break;
    responseCache.delete(oldest);
  }
}

async function fetchProducts(query: string): Promise<FoodSearchResult> {
  try {
    const payload = await fetchJson(PUBLIC_SOURCES.openFoodFactsSearch(query), {
      allowedHosts: ["world.openfoodfacts.org"],
      timeoutMs: 8000,
    });
    if (payload === null) {
      return { ok: false, query, products: [], cached: false, issue: "unavailable" };
    }
    const products = parseProducts(payload);
    return {
      ok: products.length > 0,
      query,
      products,
      cached: false,
      issue: products.length > 0 ? null : "no-results",
    };
  } catch {
    return { ok: false, query, products: [], cached: false, issue: "unavailable" };
  }
}

export const searchOpenFoods = createServerFn({ method: "GET" })
  .validator((input: unknown) => querySchema.parse(input))
  .handler(async ({ data }): Promise<FoodSearchResult> => {
    const query = data.query.trim().replace(/\s+/g, " ");
    const key = query.toLocaleLowerCase("es-MX");
    const now = Date.now();
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > now) {
      return { ...cached.result, cached: true };
    }

    const pending = inFlight.get(key);
    if (pending) return { ...(await pending), cached: true };

    if (now - rateWindowStart >= RATE_WINDOW) {
      rateWindowStart = now;
      searchesInWindow = 0;
    }
    if (searchesInWindow >= RATE_LIMIT || inFlight.size >= MAX_CONCURRENT_SEARCHES) {
      return {
        ok: false,
        query,
        products: [],
        cached: false,
        issue: "rate-limited",
      };
    }
    searchesInWindow += 1;

    const request = fetchProducts(query);
    inFlight.set(key, request);
    try {
      const result = await request;
      if (result.ok) {
        trimCache(now);
        responseCache.set(key, { expiresAt: now + CACHE_TIME, result });
      }
      return result;
    } finally {
      if (inFlight.get(key) === request) inFlight.delete(key);
    }
  });
