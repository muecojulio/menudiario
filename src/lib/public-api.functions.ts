/**
 * Server functions que consultan APIs públicas sin clave. Cada entrada se valida con zod,
 * las URLs salen de una lista fija (nunca de texto libre) y todo pasa por la caché del servidor.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ingredientById, ingredientExists, ingredientWikiTitle } from "./catalog.ts";
import { cachedLoad } from "./public-api/cache.server.ts";
import { CITY_IDS, cityOrDefault, findCity } from "./public-api/cities.ts";
import { fetchJson } from "./public-api/http.server.ts";
import {
  type DayForecast,
  type Holiday,
  type MealDetail,
  parseForecast,
  parseHolidays,
  parseMealDetail,
  parseOpenFoodFactsCount,
  parseWikiSummary,
  type WikiSummary,
} from "./public-api/parsers.ts";
import { PUBLIC_SOURCES } from "./public-api/sources.ts";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// ---------- Pronóstico (Open-Meteo) ----------

export type WeatherResult = {
  ok: boolean;
  cityId: string;
  days: DayForecast[];
  fetchedAt: string | null;
  fromCache: boolean;
};

function asForecast(raw: unknown): DayForecast[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const valid = raw.every(
    (item) => isRecordLike(item) && typeof item.date === "string" && typeof item.tmax === "number",
  );
  return valid ? (raw as DayForecast[]) : null;
}

export const getWeather = createServerFn({ method: "GET" })
  .inputValidator(z.object({ cityId: z.enum(CITY_IDS) }))
  .handler(async ({ data }): Promise<WeatherResult> => {
    const city = findCity(data.cityId) ?? cityOrDefault(undefined);
    const cached = await cachedLoad(
      `mx-weather:${city.id}`,
      HOUR / 2,
      async () => {
        const days = parseForecast(
          await fetchJson(PUBLIC_SOURCES.weather(city, 14), {
            allowedHosts: ["api.open-meteo.com"],
          }),
        );
        return days.length ? days : null;
      },
      asForecast,
    );
    return {
      ok: Boolean(cached),
      cityId: city.id,
      days: cached?.data ?? [],
      fetchedAt: cached?.fetchedAt ?? null,
      fromCache: cached?.fromCache ?? false,
    };
  });

// ---------- Festivos (Nager.Date) ----------

export const getHolidays = createServerFn({ method: "GET" })
  .inputValidator(z.object({ years: z.array(z.number().int().min(2024).max(2100)).min(1).max(3) }))
  .handler(async ({ data }): Promise<{ holidays: Holiday[] }> => {
    const years = [...new Set(data.years)];
    const results = await Promise.all(
      years.map((year) =>
        cachedLoad(
          `mx-holidays:${year}`,
          7 * DAY,
          async () => {
            const list = parseHolidays(
              await fetchJson(PUBLIC_SOURCES.holidays(year), { allowedHosts: ["date.nager.at"] }),
            );
            return list.length ? list : null;
          },
          (raw) => (Array.isArray(raw) ? (raw as Holiday[]) : null),
        ),
      ),
    );
    return { holidays: results.flatMap((result) => result?.data ?? []) };
  });

// ---------- Ficha de ingrediente (Wikipedia + Open Food Facts) ----------

export type IngredientInfo = {
  ingredientId: string;
  wiki: WikiSummary | null;
  offCount: number | null;
};

export const getIngredientInfo = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      ingredientId: z
        .string()
        .max(40)
        .refine((id) => ingredientExists(id), "Ingrediente desconocido"),
    }),
  )
  .handler(async ({ data }): Promise<IngredientInfo> => {
    const id = data.ingredientId;
    const title = ingredientWikiTitle(id);
    const ingredient = ingredientById(id);

    const [wiki, off] = await Promise.all([
      title
        ? cachedLoad(
            `mx-wiki:${id}`,
            7 * DAY,
            async () =>
              parseWikiSummary(
                await fetchJson(PUBLIC_SOURCES.wikiSummary(title), {
                  allowedHosts: ["es.wikipedia.org"],
                }),
              ),
            (raw) =>
              isRecordLike(raw) && typeof raw.title === "string" ? (raw as WikiSummary) : null,
          )
        : Promise.resolve(null),
      cachedLoad(
        `mx-off:${id}`,
        7 * DAY,
        async () => {
          const count = parseOpenFoodFactsCount(
            await fetchJson(PUBLIC_SOURCES.openFoodFactsCount(ingredient.name), {
              allowedHosts: ["world.openfoodfacts.org"],
            }),
          );
          return count > 0 ? { count } : null;
        },
        (raw) => (isRecordLike(raw) && typeof raw.count === "number" ? { count: raw.count } : null),
      ),
    ]);

    return {
      ingredientId: id,
      wiki: wiki?.data ?? null,
      offCount: off?.data.count ?? null,
    };
  });

// ---------- Receta abierta (TheMealDB) ----------

export const getMealDetail = createServerFn({ method: "GET" })
  .inputValidator(z.object({ id: z.string().regex(/^\d{1,8}$/) }))
  .handler(async ({ data }): Promise<MealDetail | null> => {
    const cached = await cachedLoad(
      `mx-meal:${data.id}`,
      7 * DAY,
      async () =>
        parseMealDetail(
          await fetchJson(PUBLIC_SOURCES.mealDbLookup(data.id), {
            allowedHosts: ["www.themealdb.com"],
          }),
        ),
      (raw) => (isRecordLike(raw) && typeof raw.id === "string" ? (raw as MealDetail) : null),
    );
    return cached?.data ?? null;
  });
