import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseForecast,
  parseHolidays,
  parseMealDetail,
  parseMealList,
  parseShelf,
  parseWikiSummary,
  safeImageUrl,
  safePageUrl,
} from "./parsers.ts";

test("parseShelf descarta precios absurdos y limpia nombres", () => {
  const shelf = parseShelf({
    items: [
      {
        price: 24.5,
        date: "2026-09-01T10:00:00Z",
        product: { product_name: "  Leche\u0000 Entera " },
        location: { osm_brand: "Walmart" },
      },
      { price: 0, product: { product_name: "Gratis" } },
      { price: 9999, product: { product_name: "Caro" } },
      { price: 12, product: {} },
      { price: "18.9", product: { product_name: "Huevo" }, location: { osm_name: "Tienda local" } },
    ],
  });
  assert.deepEqual(
    shelf.map((item) => item.name),
    ["Leche Entera", "Huevo"],
  );
  assert.equal(shelf[1]?.store, "Tienda local");
  assert.equal(shelf[0]?.date, "2026-09-01");
});

test("parseShelf tolera respuestas con forma inesperada", () => {
  assert.deepEqual(parseShelf(null), []);
  assert.deepEqual(parseShelf({ items: "no es lista" }), []);
});

test("parseMealList exige id numérico y conserva solo miniaturas https de hosts conocidos", () => {
  const meals = parseMealList({
    meals: [
      {
        idMeal: "52771",
        strMeal: "Chicken Enchilada",
        strMealThumb: "https://www.themealdb.com/images/media/meals/a.jpg",
      },
      { idMeal: "../../x", strMeal: "Malo" },
      { idMeal: "52772", strMeal: "Tacos", strMealThumb: "javascript:alert(1)" },
      { idMeal: "52773", strMeal: "Otro", strMealThumb: "https://evil.example.com/x.jpg" },
    ],
  });
  assert.equal(meals.length, 3);
  assert.equal(meals[0]?.thumb, "https://www.themealdb.com/images/media/meals/a.jpg");
  assert.equal(meals[1]?.thumb, null);
  assert.equal(meals[2]?.thumb, null);
});

test("parseMealDetail separa pasos e ingredientes y ignora enlaces no permitidos", () => {
  const detail = parseMealDetail({
    meals: [
      {
        idMeal: "52772",
        strMeal: "Teriyaki Chicken Casserole",
        strCategory: "Chicken",
        strArea: "Japanese",
        strInstructions: "Preheat oven.\r\nCombine soy sauce.\r\n\r\nEnjoy!",
        strIngredient1: "soy sauce",
        strMeasure1: "3/4 cup",
        strIngredient2: "",
        strYoutube: "https://evil.example.com/watch",
        strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx.jpg",
      },
    ],
  });
  assert.ok(detail);
  assert.deepEqual(detail.steps, ["Preheat oven.", "Combine soy sauce.", "Enjoy!"]);
  assert.deepEqual(detail.ingredients, [{ name: "soy sauce", measure: "3/4 cup" }]);
  assert.equal(detail.youtube, null);
  assert.equal(parseMealDetail({ meals: null }), null);
});

test("parseWikiSummary toma título, extracto, imagen y página de es.wikipedia", () => {
  const summary = parseWikiSummary({
    title: "Tomate",
    extract: "El tomate o jitomate es el fruto de la planta Solanum lycopersicum.",
    description: "fruto, usado como vegetal",
    thumbnail: { source: "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/88/tomato.jpg" },
    content_urls: { desktop: { page: "https://es.wikipedia.org/wiki/Tomate" } },
  });
  assert.equal(summary?.title, "Tomate");
  assert.equal(summary?.pageUrl, "https://es.wikipedia.org/wiki/Tomate");
  assert.match(summary?.thumb ?? "", /wikimedia/);
  assert.equal(parseWikiSummary({ title: "Sin extracto" }), null);
});

test("las URLs se validan: solo https y solo hosts permitidos", () => {
  assert.equal(safeImageUrl("http://upload.wikimedia.org/a.jpg"), null, "sin https");
  assert.equal(
    safeImageUrl("https://user:pass@upload.wikimedia.org/a.jpg"),
    null,
    "sin credenciales",
  );
  assert.equal(safeImageUrl("https://upload.wikimedia.org.evil.com/a.jpg"), null, "host falso");
  assert.equal(
    safePageUrl("https://es.wikipedia.org/wiki/Tomate"),
    "https://es.wikipedia.org/wiki/Tomate",
  );
  assert.equal(safePageUrl("not a url"), null);
});

test("parseHolidays acepta fechas ISO y nombres locales", () => {
  const holidays = parseHolidays([
    { date: "2026-09-16", localName: "Día de la Independencia", name: "Independence Day" },
    { date: "16/09/2026", localName: "Mal formato" },
    { date: "2026-11-16", name: "Revolution Day" },
  ]);
  assert.deepEqual(holidays, [
    { date: "2026-09-16", name: "Día de la Independencia" },
    { date: "2026-11-16", name: "Revolution Day" },
  ]);
  assert.deepEqual(parseHolidays({ error: true }), []);
});

test("parseForecast alinea los arreglos diarios y descarta días incompletos", () => {
  const days = parseForecast({
    daily: {
      time: ["2026-10-11", "2026-10-12", "2026-10-13"],
      temperature_2m_max: [31.2, null, 22.8],
      temperature_2m_min: [14, 13, 12.5],
      precipitation_probability_max: [10, 40, 88],
      weather_code: [1, 3, 61],
    },
  });
  assert.equal(days.length, 2);
  assert.deepEqual(days[0], { date: "2026-10-11", tmax: 31.2, tmin: 14, precip: 10, code: 1 });
  assert.equal(days[1]?.code, 61);
});
