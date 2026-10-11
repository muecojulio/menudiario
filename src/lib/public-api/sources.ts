/**
 * Endpoints públicos que usa la app. Todos son HTTPS, no piden clave ni registro,
 * y solo se llaman desde el servidor (la URL nunca se construye con datos del usuario,
 * salvo identificadores ya validados con zod).
 */

import type { City } from "./cities.ts";

export const WEATHER_DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
].join(",");

export const PUBLIC_SOURCES = {
  shelfPrices: (page: number) =>
    `https://prices.openfoodfacts.org/api/v1/prices?currency=MXN&page=${page}`,
  openFoodFactsCount: (term: string) =>
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=1&cc=mx`,
  openFoodFactsSearch: (term: string) => {
    const params = new URLSearchParams({
      search_terms: term,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "6",
      lc: "es",
      cc: "mx",
      fields: "product_name,brands,quantity,nutriscore_grade,nutrition_grade_fr,nutriments,code",
    });
    return `https://world.openfoodfacts.org/cgi/search.pl?${params}`;
  },
  mealDbMexican: "https://www.themealdb.com/api/json/v1/1/filter.php?a=Mexican",
  mealDbLookup: (id: string) => `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`,
  weather: (city: City, days: number) =>
    `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=${WEATHER_DAILY_FIELDS}&timezone=${encodeURIComponent(city.tz)}&forecast_days=${days}`,
  holidays: (year: number) => `https://date.nager.at/api/v3/PublicHolidays/${year}/MX`,
  wikiSummary: (title: string) =>
    `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`,
} as const;

/** Hosts a los que puede apuntar una imagen o un enlace que mostramos. */
export const IMAGE_HOSTS = [
  "upload.wikimedia.org",
  "thumb.wikimedia.org",
  "www.themealdb.com",
] as const;
export const PAGE_HOSTS = [
  "es.wikipedia.org",
  "www.youtube.com",
  "youtube.com",
  "world.openfoodfacts.org",
] as const;
