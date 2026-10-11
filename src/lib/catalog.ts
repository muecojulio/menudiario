import type { ShelfItem } from "./public-api/parsers.ts";

type Store = {
  id: string;
  name: string;
  factor: number;
};

export type Ingredient = {
  id: string;
  name: string;
  aisle: string;
  packSize: number;
  unit: string;
  packLabel: string;
  price: number;
  liveKeys: string[];
  band: [number, number];
};

export type RecipeLine = { ingredientId: string; amount: number };

export type RecipeGroup = "proteina" | "verdura" | "cereal" | "fruta";

export type RecipeSlot = "desayuno" | "comida" | "cena" | "postre" | "bebida";

export type Recipe = {
  id: string;
  slot: RecipeSlot;
  name: string;
  minutes: number;
  steps: string[];
  lines: RecipeLine[];
  groups: RecipeGroup[];
  drinkKind?: "agua" | "refresco";
};

export const STORES: Store[] = [
  { id: "aurrera", name: "Bodega Aurrerá", factor: 0.9 },
  { id: "walmart", name: "Walmart", factor: 1 },
  { id: "soriana", name: "Soriana", factor: 1.03 },
  { id: "chedraui", name: "Chedraui", factor: 1.05 },
  { id: "heb", name: "HEB", factor: 1.08 },
  { id: "lacomer", name: "La Comer", factor: 1.14 },
];

export const AISLE_ORDER = [
  "Frutas y verduras",
  "Huevos y lácteos",
  "Pollo",
  "Abarrotes",
  "Pan y tortillas",
  "Bebidas",
];

const INGREDIENTS: Ingredient[] = [
  { id: "huevo", name: "Huevo blanco", aisle: "Huevos y lácteos", packSize: 12, unit: "pza", packLabel: "caja de 12", price: 54, liveKeys: ["huevo"], band: [40, 85] },
  { id: "leche", name: "Leche entera", aisle: "Huevos y lácteos", packSize: 1000, unit: "ml", packLabel: "1 L", price: 29, liveKeys: ["leche"], band: [20, 42] },
  { id: "yogurt", name: "Yogurt natural", aisle: "Huevos y lácteos", packSize: 1000, unit: "g", packLabel: "1 kg", price: 46, liveKeys: ["yogurt natural", "yoghurt natural"], band: [36, 68] },
  { id: "queso", name: "Queso panela", aisle: "Huevos y lácteos", packSize: 400, unit: "g", packLabel: "400 g", price: 62, liveKeys: ["panela"], band: [45, 90] },
  { id: "oaxaca", name: "Queso Oaxaca", aisle: "Huevos y lácteos", packSize: 400, unit: "g", packLabel: "400 g", price: 79, liveKeys: ["oaxaca"], band: [55, 120] },
  { id: "jamon", name: "Jamón de pavo", aisle: "Huevos y lácteos", packSize: 250, unit: "g", packLabel: "250 g", price: 46, liveKeys: ["jamon", "jamón"], band: [32, 70] },
  { id: "crema", name: "Crema", aisle: "Huevos y lácteos", packSize: 200, unit: "ml", packLabel: "200 ml", price: 24, liveKeys: ["crema lala", "crema alpura"], band: [16, 38] },
  { id: "pechuga", name: "Pechuga de pollo", aisle: "Pollo", packSize: 1000, unit: "g", packLabel: "1 kg", price: 139, liveKeys: ["pechuga"], band: [95, 190] },
  { id: "pierna", name: "Pierna y muslo", aisle: "Pollo", packSize: 1000, unit: "g", packLabel: "1 kg", price: 86, liveKeys: ["pierna", "muslo"], band: [60, 130] },
  { id: "jitomate", name: "Jitomate", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 3.4, liveKeys: ["jitomate", "tomate saladet"], band: [2.2, 6] },
  { id: "cebolla", name: "Cebolla blanca", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 2.8, liveKeys: ["cebolla"], band: [1.6, 5] },
  { id: "chile", name: "Chile serrano", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g", price: 7.2, liveKeys: ["serrano"], band: [4, 14] },
  { id: "cilantro", name: "Cilantro", aisle: "Frutas y verduras", packSize: 1, unit: "manojo", packLabel: "1 manojo", price: 12, liveKeys: ["cilantro"], band: [6, 20] },
  { id: "limon", name: "Limón", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 3.6, liveKeys: ["limón", "limon"], band: [2, 7] },
  { id: "platano", name: "Plátano", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 2.9, liveKeys: ["plátano", "platano"], band: [1.8, 5.5] },
  { id: "manzana", name: "Manzana", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 5.2, liveKeys: ["manzana"], band: [3, 9] },
  { id: "nopal", name: "Nopal", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 3, liveKeys: ["nopal"], band: [1.5, 6] },
  { id: "papa", name: "Papa", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 2.9, liveKeys: ["papa blanca"], band: [1.5, 5.5] },
  { id: "zanahoria", name: "Zanahoria", aisle: "Frutas y verduras", packSize: 100, unit: "g", packLabel: "100 g sueltos", price: 2.2, liveKeys: ["zanahoria"], band: [1.2, 4.5] },
  { id: "lechuga", name: "Lechuga", aisle: "Frutas y verduras", packSize: 1, unit: "pza", packLabel: "1 pieza", price: 24, liveKeys: ["lechuga"], band: [14, 40] },
  { id: "pepino", name: "Pepino", aisle: "Frutas y verduras", packSize: 1, unit: "pza", packLabel: "1 pieza", price: 16, liveKeys: ["pepino"], band: [8, 28] },
  { id: "frijol", name: "Frijol negro", aisle: "Abarrotes", packSize: 1000, unit: "g", packLabel: "1 kg", price: 46, liveKeys: ["frijol"], band: [32, 70] },
  { id: "arroz", name: "Arroz", aisle: "Abarrotes", packSize: 1000, unit: "g", packLabel: "1 kg", price: 34, liveKeys: ["arroz"], band: [22, 52] },
  { id: "avena", name: "Avena", aisle: "Abarrotes", packSize: 400, unit: "g", packLabel: "400 g", price: 34, liveKeys: ["avena"], band: [22, 52] },
  { id: "aceite", name: "Aceite vegetal", aisle: "Abarrotes", packSize: 500, unit: "ml", packLabel: "500 ml", price: 38, liveKeys: ["aceite"], band: [26, 62] },
  { id: "jamaica", name: "Flor de jamaica", aisle: "Abarrotes", packSize: 100, unit: "g", packLabel: "100 g", price: 24, liveKeys: ["jamaica"], band: [14, 40] },
  { id: "azucar", name: "Azúcar", aisle: "Abarrotes", packSize: 1000, unit: "g", packLabel: "1 kg", price: 33, liveKeys: ["azúcar", "azucar"], band: [24, 48] },
  { id: "atun", name: "Atún en agua", aisle: "Abarrotes", packSize: 1, unit: "lata", packLabel: "1 lata", price: 24, liveKeys: ["atún", "atun"], band: [16, 38] },
  { id: "pasta", name: "Pasta", aisle: "Abarrotes", packSize: 200, unit: "g", packLabel: "200 g", price: 18, liveKeys: ["spaghetti", "pasta"], band: [12, 32] },
  { id: "lenteja", name: "Lenteja", aisle: "Abarrotes", packSize: 500, unit: "g", packLabel: "500 g", price: 32, liveKeys: ["lenteja"], band: [22, 48] },
  { id: "gelatina", name: "Gelatina de agua", aisle: "Abarrotes", packSize: 1, unit: "sobre", packLabel: "1 sobre", price: 14, liveKeys: ["gelatina"], band: [8, 24] },
  { id: "caldo", name: "Consomé de pollo", aisle: "Abarrotes", packSize: 8, unit: "cubo", packLabel: "caja 8 cubos", price: 22, liveKeys: ["consomé", "consome", "caldo de pollo"], band: [14, 36] },
  { id: "sal", name: "Sal", aisle: "Abarrotes", packSize: 1000, unit: "g", packLabel: "1 kg", price: 16, liveKeys: ["sal"], band: [10, 28] },
  { id: "salsa", name: "Salsa picante", aisle: "Abarrotes", packSize: 150, unit: "ml", packLabel: "150 ml", price: 18, liveKeys: ["valentina", "salsa picante"], band: [12, 32] },
  { id: "tortilla", name: "Tortilla de maíz", aisle: "Pan y tortillas", packSize: 1000, unit: "g", packLabel: "1 kg", price: 26, liveKeys: ["tortilla"], band: [18, 40] },
  { id: "pan", name: "Pan de caja integral", aisle: "Pan y tortillas", packSize: 680, unit: "g", packLabel: "680 g", price: 52, liveKeys: ["pan integral", "pan de caja"], band: [38, 78] },
  { id: "bolillo", name: "Bolillo", aisle: "Pan y tortillas", packSize: 1, unit: "pza", packLabel: "1 pieza", price: 6, liveKeys: ["bolillo"], band: [3, 12] },
  { id: "tostada", name: "Tostadas", aisle: "Pan y tortillas", packSize: 10, unit: "pza", packLabel: "bolsa 10 pzas", price: 22, liveKeys: ["tostada"], band: [14, 36] },
  { id: "refresco", name: "Refresco de cola", aisle: "Bebidas", packSize: 600, unit: "ml", packLabel: "600 ml", price: 22, liveKeys: ["coca", "cola"], band: [14, 32] },
];

/**
 * Título del artículo de Wikipedia en español para la ficha de cada ingrediente.
 * Si Wikipedia no tiene el título exacto, la ficha dice que no hay información.
 */
const WIKI_TITLES: Record<string, string> = {
  huevo: "Huevo",
  leche: "Leche",
  yogurt: "Yogur",
  queso: "Queso",
  oaxaca: "Queso Oaxaca",
  jamon: "Jamón",
  crema: "Crema",
  pechuga: "Pollo",
  pierna: "Muslo",
  jitomate: "Tomate",
  cebolla: "Cebolla",
  chile: "Chile",
  cilantro: "Coriandrum sativum",
  limon: "Limón",
  platano: "Plátano",
  manzana: "Manzana",
  nopal: "Nopal",
  papa: "Solanum tuberosum",
  zanahoria: "Zanahoria",
  lechuga: "Lechuga",
  pepino: "Pepino",
  frijol: "Frijol",
  arroz: "Arroz",
  avena: "Avena",
  aceite: "Aceite vegetal",
  jamaica: "Hibiscus sabdariffa",
  azucar: "Azúcar",
  atun: "Atún",
  pasta: "Pasta",
  lenteja: "Lenteja",
  gelatina: "Gelatina",
  caldo: "Consomé",
  sal: "Sal de mesa",
  salsa: "Salsa picante",
  tortilla: "Tortilla de maíz",
  pan: "Pan de molde",
  bolillo: "Bolillo",
  tostada: "Tostada",
  refresco: "Refresco",
};

export function ingredientWikiTitle(id: string): string | null {
  return WIKI_TITLES[id] ?? null;
}

export function ingredientExists(id: string): boolean {
  return byId.has(id);
}

const byId = new Map(INGREDIENTS.map((item) => [item.id, item]));

export function ingredientById(id: string): Ingredient {
  const found = byId.get(id);
  if (!found) throw new Error(`Ingrediente desconocido: ${id}`);
  return found;
}

export function storeById(id: string): Store {
  return STORES.find((store) => store.id === id) ?? STORES[1]!;
}

export const RECIPES: Recipe[] = [
  {
    id: "huevos-mexicana",
    slot: "desayuno",
    name: "Huevos a la mexicana",
    minutes: 15,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Pica jitomate, cebolla y un poco de chile.",
      "Sofríe en poco aceite, agrega el huevo y revuelve.",
      "Sirve con tortillas calientes y cilantro.",
    ],
    lines: [
      { ingredientId: "huevo", amount: 2 },
      { ingredientId: "tortilla", amount: 60 },
      { ingredientId: "jitomate", amount: 80 },
      { ingredientId: "cebolla", amount: 30 },
      { ingredientId: "chile", amount: 15 },
      { ingredientId: "aceite", amount: 8 },
      { ingredientId: "cilantro", amount: 0.15 },
    ],
  },
  {
    id: "avena-platano",
    slot: "desayuno",
    name: "Avena con plátano",
    minutes: 10,
    groups: ["proteina", "fruta", "cereal"],
    steps: [
      "Calienta la leche y la avena 5 minutos, moviendo.",
      "Reposa un minuto para que espese.",
      "Corta el plátano encima y sirve.",
    ],
    lines: [
      { ingredientId: "avena", amount: 40 },
      { ingredientId: "leche", amount: 250 },
      { ingredientId: "platano", amount: 120 },
    ],
  },
  {
    id: "molletes",
    slot: "desayuno",
    name: "Molletes de frijol",
    minutes: 12,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Parte el bolillo y tuéstalo.",
      "Unta frijoles y queso.",
      "Gratina y termina con jitomate y cebolla picados.",
    ],
    lines: [
      { ingredientId: "bolillo", amount: 1 },
      { ingredientId: "frijol", amount: 80 },
      { ingredientId: "queso", amount: 30 },
      { ingredientId: "jitomate", amount: 40 },
      { ingredientId: "cebolla", amount: 20 },
    ],
  },
  {
    id: "yogurt-avena",
    slot: "desayuno",
    name: "Yogurt, avena y manzana",
    minutes: 5,
    groups: ["proteina", "fruta", "cereal"],
    steps: [
      "Pon el yogurt en un tazón.",
      "Agrega avena y manzana en cubos.",
      "Mezcla y come al momento.",
    ],
    lines: [
      { ingredientId: "yogurt", amount: 200 },
      { ingredientId: "avena", amount: 20 },
      { ingredientId: "manzana", amount: 100 },
    ],
  },
  {
    id: "pollo-plancha",
    slot: "comida",
    name: "Pollo a la plancha, arroz y ensalada",
    minutes: 25,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Sazona la pechuga y cuécela en plancha con poco aceite.",
      "Hierve el arroz en agua con una pizca de sal.",
      "Mezcla lechuga, jitomate, pepino y unas gotas de limón.",
    ],
    lines: [
      { ingredientId: "pechuga", amount: 150 },
      { ingredientId: "arroz", amount: 60 },
      { ingredientId: "aceite", amount: 8 },
      { ingredientId: "lechuga", amount: 0.25 },
      { ingredientId: "jitomate", amount: 50 },
      { ingredientId: "pepino", amount: 0.25 },
      { ingredientId: "limon", amount: 20 },
    ],
  },
  {
    id: "lentejas",
    slot: "comida",
    name: "Lentejas con verdura y arroz",
    minutes: 35,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Sofríe cebolla y jitomate.",
      "Agrega lentejas, papa, zanahoria, consomé y agua. Cuece 25 minutos.",
      "Sirve con un poco de arroz.",
    ],
    lines: [
      { ingredientId: "lenteja", amount: 80 },
      { ingredientId: "zanahoria", amount: 40 },
      { ingredientId: "papa", amount: 80 },
      { ingredientId: "jitomate", amount: 50 },
      { ingredientId: "cebolla", amount: 30 },
      { ingredientId: "arroz", amount: 40 },
      { ingredientId: "caldo", amount: 0.5 },
    ],
  },
  {
    id: "tinga",
    slot: "comida",
    name: "Tinga de pollo",
    minutes: 30,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Cuece la pierna y deshébrala.",
      "Sofríe jitomate, cebolla y chile. Mezcla el pollo.",
      "Sirve en tortilla con una cucharada de crema.",
    ],
    lines: [
      { ingredientId: "pierna", amount: 150 },
      { ingredientId: "jitomate", amount: 80 },
      { ingredientId: "cebolla", amount: 40 },
      { ingredientId: "chile", amount: 10 },
      { ingredientId: "tortilla", amount: 80 },
      { ingredientId: "crema", amount: 15 },
    ],
  },
  {
    id: "pasta-atun",
    slot: "comida",
    name: "Pasta con atún y ensalada",
    minutes: 20,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Cuece la pasta y escúrrela.",
      "Mezcla con atún, un chorrito de aceite y jitomate.",
      "Acompaña con lechuga.",
    ],
    lines: [
      { ingredientId: "pasta", amount: 80 },
      { ingredientId: "atun", amount: 0.5 },
      { ingredientId: "aceite", amount: 5 },
      { ingredientId: "jitomate", amount: 40 },
      { ingredientId: "lechuga", amount: 0.2 },
    ],
  },
  {
    id: "nopales-huevo",
    slot: "comida",
    name: "Nopales, frijoles y huevo",
    minutes: 25,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Asa o hierve los nopales y saltéalos con cebolla y chile.",
      "Calienta los frijoles y fríe el huevo.",
      "Sirve todo junto con tortillas.",
    ],
    lines: [
      { ingredientId: "frijol", amount: 80 },
      { ingredientId: "huevo", amount: 1 },
      { ingredientId: "nopal", amount: 80 },
      { ingredientId: "cebolla", amount: 20 },
      { ingredientId: "tortilla", amount: 50 },
      { ingredientId: "chile", amount: 10 },
      { ingredientId: "aceite", amount: 8 },
    ],
  },
  {
    id: "quesadillas",
    slot: "cena",
    name: "Quesadillas con pico de gallo",
    minutes: 12,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Rellena las tortillas con queso Oaxaca y caliéntalas.",
      "Pica jitomate, cebolla y cilantro.",
      "Sirve las quesadillas con el pico y unas gotas de salsa.",
    ],
    lines: [
      { ingredientId: "tortilla", amount: 80 },
      { ingredientId: "oaxaca", amount: 40 },
      { ingredientId: "jitomate", amount: 40 },
      { ingredientId: "cebolla", amount: 15 },
      { ingredientId: "cilantro", amount: 0.1 },
      { ingredientId: "salsa", amount: 8 },
    ],
  },
  {
    id: "sandwich",
    slot: "cena",
    name: "Sándwich de pavo",
    minutes: 8,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Tuesta dos rebanadas de pan.",
      "Arma con jamón, queso, lechuga y jitomate.",
      "Cierra y parte a la mitad.",
    ],
    lines: [
      { ingredientId: "pan", amount: 60 },
      { ingredientId: "jamon", amount: 40 },
      { ingredientId: "queso", amount: 20 },
      { ingredientId: "lechuga", amount: 0.2 },
      { ingredientId: "jitomate", amount: 30 },
    ],
  },
  {
    id: "caldo",
    slot: "cena",
    name: "Caldo de pollo y verdura",
    minutes: 30,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Pon agua, pierna, papa, zanahoria, cebolla y consomé.",
      "Cuece a fuego bajo 25 minutos.",
      "Agrega un poco de arroz los últimos 12 minutos.",
    ],
    lines: [
      { ingredientId: "pierna", amount: 80 },
      { ingredientId: "papa", amount: 70 },
      { ingredientId: "zanahoria", amount: 40 },
      { ingredientId: "cebolla", amount: 20 },
      { ingredientId: "caldo", amount: 0.5 },
      { ingredientId: "arroz", amount: 20 },
    ],
  },
  {
    id: "tostadas",
    slot: "cena",
    name: "Tostadas de frijol",
    minutes: 10,
    groups: ["proteina", "verdura", "cereal"],
    steps: [
      "Calienta los frijoles y aplástalos.",
      "Unta dos tostadas, agrega queso, lechuga y jitomate.",
      "Termina con salsa si quieres.",
    ],
    lines: [
      { ingredientId: "tostada", amount: 2 },
      { ingredientId: "frijol", amount: 60 },
      { ingredientId: "queso", amount: 25 },
      { ingredientId: "lechuga", amount: 0.15 },
      { ingredientId: "jitomate", amount: 30 },
      { ingredientId: "salsa", amount: 5 },
    ],
  },
  {
    id: "gelatina",
    slot: "postre",
    name: "Gelatina",
    minutes: 8,
    groups: [],
    steps: [
      "Disuelve el sobre como dice el empaque.",
      "Reparte en vasos.",
      "Mete al refrigerador. Prepárala el día anterior si puedes.",
    ],
    lines: [{ ingredientId: "gelatina", amount: 0.5 }],
  },
  {
    id: "platano-postre",
    slot: "postre",
    name: "Plátano",
    minutes: 1,
    groups: ["fruta"],
    steps: ["Lava o pela un plátano y sírvelo al terminar la comida."],
    lines: [{ ingredientId: "platano", amount: 120 }],
  },
  {
    id: "manzana-postre",
    slot: "postre",
    name: "Manzana",
    minutes: 2,
    groups: ["fruta"],
    steps: ["Lava la manzana y pártela en gajos."],
    lines: [{ ingredientId: "manzana", amount: 150 }],
  },
  {
    id: "yogurt-postre",
    slot: "postre",
    name: "Yogurt natural",
    minutes: 1,
    groups: ["proteina"],
    steps: ["Sirve yogurt natural frío en un vaso."],
    lines: [{ ingredientId: "yogurt", amount: 150 }],
  },
  {
    id: "jamaica",
    slot: "bebida",
    name: "Agua de jamaica",
    minutes: 15,
    drinkKind: "agua",
    groups: [],
    steps: [
      "Hierve la jamaica 5 minutos y cuela.",
      "Endulza al gusto y deja enfriar.",
      "Rinde una jarra. Guárdala en el refri.",
    ],
    lines: [
      { ingredientId: "jamaica", amount: 8 },
      { ingredientId: "azucar", amount: 15 },
    ],
  },
  {
    id: "agua-limon",
    slot: "bebida",
    name: "Agua de limón",
    minutes: 8,
    drinkKind: "agua",
    groups: ["fruta"],
    steps: [
      "Exprime los limones.",
      "Mezcla con agua fría y azúcar.",
      "Sirve con hielo si tienes.",
    ],
    lines: [
      { ingredientId: "limon", amount: 40 },
      { ingredientId: "azucar", amount: 12 },
    ],
  },
  {
    id: "refresco-cola",
    slot: "bebida",
    name: "Refresco",
    minutes: 0,
    drinkKind: "refresco",
    groups: [],
    steps: ["Una botella de 600 ml por persona, con la comida."],
    lines: [{ ingredientId: "refresco", amount: 600 }],
  },
];

export const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]));

export type LivePrice = {
  price: number;
  name: string;
  store: string;
  date: string;
};

export function matchLivePrices(items: ShelfItem[]): Record<string, LivePrice> {
  const found: Record<string, LivePrice> = {};
  for (const ingredient of INGREDIENTS) {
    const hits = items.filter((item) => {
      const name = item.name.toLowerCase();
      const priced = item.price >= ingredient.band[0] && item.price <= ingredient.band[1];
      return priced && ingredient.liveKeys.some((key) => name.includes(key));
    });
    if (!hits.length) continue;
    hits.sort((a, b) => a.price - b.price);
    const best = hits[0]!;
    found[ingredient.id] = {
      price: best.price,
      name: best.name,
      store: best.store,
      date: best.date,
    };
  }
  return found;
}

export function humanQty(amount: number, unit: string): string {
  const trim = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  };
  if (unit === "g" && amount >= 1000) return `${trim(amount / 1000)} kg`;
  if (unit === "ml" && amount >= 1000) return `${trim(amount / 1000)} L`;
  return `${trim(amount)} ${unit}`;
}
