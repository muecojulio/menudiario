import { createServerFn } from "@tanstack/react-start";
import { cachedLoad } from "./public-api/cache.server.ts";
import { fetchJson } from "./public-api/http.server.ts";
import {
  type MealCard,
  parseMealList,
  parseOpenFoodFactsCount,
  parseShelf,
  type ShelfItem,
} from "./public-api/parsers.ts";
import { PUBLIC_SOURCES } from "./public-api/sources.ts";

export type { ShelfItem } from "./public-api/parsers.ts";

export type MarketLive = {
  ok: boolean;
  fetchedAt: string | null;
  fromCache: boolean;
  shelf: ShelfItem[];
  meals: MealCard[];
  sources: {
    openPrices: boolean;
    mealDb: boolean;
    openFoodFacts: boolean;
  };
};

const CACHE_KEY = "mx-market-v2";
const SIX_HOURS = 6 * 60 * 60 * 1000;

const EMPTY: MarketLive = {
  ok: false,
  fetchedAt: null,
  fromCache: false,
  shelf: [],
  meals: [],
  sources: { openPrices: false, mealDb: false, openFoodFacts: false },
};

async function loadFresh(): Promise<MarketLive | null> {
  const [prices, page2, meals, foods] = await Promise.all([
    fetchJson(PUBLIC_SOURCES.shelfPrices(1), { allowedHosts: ["prices.openfoodfacts.org"] }),
    fetchJson(PUBLIC_SOURCES.shelfPrices(2), { allowedHosts: ["prices.openfoodfacts.org"] }),
    fetchJson(PUBLIC_SOURCES.mealDbMexican, { allowedHosts: ["www.themealdb.com"] }),
    fetchJson(PUBLIC_SOURCES.openFoodFactsCount("leche"), {
      allowedHosts: ["world.openfoodfacts.org"],
    }),
  ]);
  const shelf = [...parseShelf(prices), ...parseShelf(page2)].slice(0, 40);
  const mealCards = parseMealList(meals);
  const openFoodFacts = parseOpenFoodFactsCount(foods) > 0;
  const live: MarketLive = {
    ok: shelf.length > 0 || mealCards.length > 0 || openFoodFacts,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    shelf,
    meals: mealCards,
    sources: {
      openPrices: shelf.length > 0,
      mealDb: mealCards.length > 0,
      openFoodFacts,
    },
  };
  return live.ok ? live : null;
}

function asMarket(raw: unknown): MarketLive | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Partial<MarketLive>;
  if (!Array.isArray(row.shelf) || !Array.isArray(row.meals)) return null;
  return row as MarketLive;
}

export const getMarketLive = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketLive> => {
    const cached = await cachedLoad(CACHE_KEY, SIX_HOURS, loadFresh, asMarket);
    if (!cached) return EMPTY;
    return { ...cached.data, ok: true, fetchedAt: cached.fetchedAt, fromCache: cached.fromCache };
  },
);
