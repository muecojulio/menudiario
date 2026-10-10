import { createServerFn } from "@tanstack/react-start";

export type ShelfItem = {
  name: string;
  price: number;
  store: string;
  date: string;
};

export type MarketLive = {
  ok: boolean;
  fetchedAt: string | null;
  fromCache: boolean;
  shelf: ShelfItem[];
  mexicanMeals: string[];
  sources: {
    openPrices: boolean;
    mealDb: boolean;
    openFoodFacts: boolean;
  };
};

const CACHE_KEY = "mx-shelf-v1";
const SIX_HOURS = 6 * 60 * 60 * 1000;
const AGENT = "Menudiario/1.0 (https://github.com/muecojulio/menudiario)";

async function readJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function asShelf(payload: unknown): ShelfItem[] {
  if (!payload || typeof payload !== "object") return [];
  const items = (payload as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const shelf: ShelfItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const row = item as {
      price?: unknown;
      date?: unknown;
      product?: { product_name?: unknown };
      location?: { osm_brand?: unknown; osm_name?: unknown };
    };
    const name = typeof row.product?.product_name === "string" ? row.product.product_name.trim() : "";
    const price = typeof row.price === "number" ? row.price : Number(row.price);
    if (!name || !Number.isFinite(price) || price <= 0 || price > 400) continue;
    const storeRaw = row.location?.osm_brand || row.location?.osm_name;
    const store = typeof storeRaw === "string" && storeRaw.trim() ? storeRaw.trim() : "Tienda";
    const date = typeof row.date === "string" ? row.date : "";
    shelf.push({ name, price, store, date });
  }
  return shelf;
}

function mealNames(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const meals = (payload as { meals?: unknown }).meals;
  if (!Array.isArray(meals)) return [];
  return meals
    .map((meal) => (meal && typeof meal === "object" ? (meal as { strMeal?: unknown }).strMeal : null))
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}

async function loadFresh(): Promise<MarketLive> {
  const [prices, page2, meals, foods] = await Promise.all([
    readJson("https://prices.openfoodfacts.org/api/v1/prices?currency=MXN&page=1"),
    readJson("https://prices.openfoodfacts.org/api/v1/prices?currency=MXN&page=2"),
    readJson("https://www.themealdb.com/api/json/v1/1/filter.php?a=Mexican"),
    readJson(
      "https://world.openfoodfacts.org/cgi/search.pl?search_terms=leche&search_simple=1&action=process&json=1&page_size=1&cc=mx",
    ),
  ]);
  const shelf = [...asShelf(prices), ...asShelf(page2)].slice(0, 40);
  const mexicanMeals = mealNames(meals);
  const openFoodFacts = Boolean(
    foods && typeof foods === "object" && Number((foods as { count?: unknown }).count) > 0,
  );
  return {
    ok: shelf.length > 0 || mexicanMeals.length > 0 || openFoodFacts,
    fetchedAt: new Date().toISOString(),
    fromCache: false,
    shelf,
    mexicanMeals,
    sources: {
      openPrices: shelf.length > 0,
      mealDb: mexicanMeals.length > 0,
      openFoodFacts,
    },
  };
}

export const getMarketLive = createServerFn({ method: "GET" }).handler(async (): Promise<MarketLive> => {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const cached = await sql<{ payload: string; fetched_at: string | Date }>`
      select payload, fetched_at from price_cache where cache_key = ${CACHE_KEY}
    `;
    const row = cached[0];
    if (row) {
      const fetchedAt = new Date(row.fetched_at).toISOString();
      const fresh = Date.now() - new Date(fetchedAt).getTime() < SIX_HOURS;
      if (fresh) {
        const parsed = JSON.parse(row.payload) as MarketLive;
        return { ...parsed, fromCache: true, fetchedAt };
      }
    }
    const live = await loadFresh();
    if (live.ok) {
      await sql`
        insert into price_cache (cache_key, payload, fetched_at)
        values (${CACHE_KEY}, ${JSON.stringify(live)}, now())
        on conflict (cache_key) do update
          set payload = excluded.payload, fetched_at = now()
      `;
    }
    return live;
  } catch {
    try {
      return await loadFresh();
    } catch {
      return {
        ok: false,
        fetchedAt: null,
        fromCache: false,
        shelf: [],
        mexicanMeals: [],
        sources: { openPrices: false, mealDb: false, openFoodFacts: false },
      };
    }
  }
});
