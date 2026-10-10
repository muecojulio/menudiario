import {
  AISLE_ORDER,
  type Ingredient,
  ingredientById,
  type LivePrice,
  RECIPES,
  type Recipe,
  type RecipeGroup,
  type RecipeSlot,
  recipeById,
  storeById,
  humanQty,
} from "./catalog.ts";

export type BudgetMode = "dia" | "total";
export type DrinkChoice = "agua" | "refresco";

export type PlanInput = {
  budget: number;
  budgetMode: BudgetMode;
  days: number;
  people: number;
  desayuno: boolean;
  comida: boolean;
  cena: boolean;
  drink: DrinkChoice;
  storeId: string;
  live: Record<string, LivePrice>;
};

export type MealView = {
  slot: RecipeSlot;
  slotLabel: string;
  recipeId: string;
  name: string;
  minutes: number;
  steps: string[];
  portions: string[];
  groups: RecipeGroup[];
};

export type DayView = {
  day: number;
  meals: MealView[];
  balanced: boolean;
  missing: string[];
};

export type ShopLine = {
  id: string;
  name: string;
  aisle: string;
  buy: string;
  use: string;
  extra: string | null;
  cost: number;
  live: boolean;
  liveNote: string | null;
};

export type PlanResult = {
  days: DayView[];
  lines: ShopLine[];
  total: number;
  budget: number;
  perDay: number;
  shortfall: number;
  balancedDays: number;
  storeName: string;
  people: number;
  dayCount: number;
  sameEveryDay: boolean;
};

const SLOT_LABEL: Record<RecipeSlot, string> = {
  desayuno: "Desayuno",
  comida: "Comida",
  cena: "Cena",
  postre: "Postre",
  bebida: "Bebida",
};

const GROUP_LABEL: Record<RecipeGroup, string> = {
  proteina: "Proteína",
  verdura: "Verdura",
  cereal: "Cereal",
  fruta: "Fruta",
};

type DayChoice = Partial<Record<RecipeSlot, string>>;

function money2(value: number): number {
  return Math.round(value * 100) / 100;
}

function buyLabel(packs: number, ingredient: Ingredient): string {
  if ((ingredient.unit === "g" || ingredient.unit === "ml") && ingredient.packSize <= 100) {
    return humanQty(packs * ingredient.packSize, ingredient.unit);
  }
  if (ingredient.unit === "pza" && ingredient.packSize === 1) {
    return packs === 1 ? "1 pieza" : `${packs} piezas`;
  }
  if (ingredient.unit === "manojo" && ingredient.packSize === 1) {
    return packs === 1 ? "1 manojo" : `${packs} manojos`;
  }
  return packs === 1 ? ingredient.packLabel : `${packs} × ${ingredient.packLabel}`;
}

function packPrice(ingredient: Ingredient, factor: number, live: Record<string, LivePrice>): number {
  const seen = live[ingredient.id];
  if (seen) return seen.price;
  return money2(ingredient.price * factor);
}

function proportional(recipe: Recipe, people: number, factor: number, live: Record<string, LivePrice>): number {
  let cost = 0;
  for (const line of recipe.lines) {
    const ingredient = ingredientById(line.ingredientId);
    cost += packPrice(ingredient, factor, live) * ((line.amount * people) / ingredient.packSize);
  }
  return cost;
}

function optionsFor(slot: RecipeSlot, drink: DrinkChoice): Recipe[] {
  return RECIPES.filter((recipe) => {
    if (recipe.slot !== slot) return false;
    if (recipe.slot === "bebida" && recipe.drinkKind !== drink) return false;
    return true;
  });
}

function activeSlots(input: PlanInput): RecipeSlot[] {
  const slots: RecipeSlot[] = [];
  if (input.desayuno) slots.push("desayuno");
  if (input.comida) slots.push("comida", "postre", "bebida");
  if (input.cena) slots.push("cena");
  return slots;
}

function cheapestChoice(input: PlanInput, slots: RecipeSlot[]): DayChoice {
  const choice: DayChoice = {};
  for (const slot of slots) {
    const options = optionsFor(slot, input.drink);
    let best = options[0]!;
    let bestCost = Infinity;
    for (const recipe of options) {
      const cost = proportional(recipe, input.people, storeById(input.storeId).factor, input.live);
      if (cost < bestCost) {
        best = recipe;
        bestCost = cost;
      }
    }
    choice[slot] = best.id;
  }
  return choice;
}

function cloneChoices(choices: DayChoice[]): DayChoice[] {
  return choices.map((day) => ({ ...day }));
}

function collect(choices: DayChoice[], people: number): Map<string, number> {
  const totals = new Map<string, number>();
  for (const day of choices) {
    for (const recipeId of Object.values(day)) {
      if (!recipeId) continue;
      const recipe = recipeById.get(recipeId);
      if (!recipe) continue;
      for (const line of recipe.lines) {
        totals.set(line.ingredientId, (totals.get(line.ingredientId) ?? 0) + line.amount * people);
      }
    }
  }
  return totals;
}

function totalCost(choices: DayChoice[], input: PlanInput): number {
  const factor = storeById(input.storeId).factor;
  let total = 0;
  for (const [id, amount] of collect(choices, input.people)) {
    const ingredient = ingredientById(id);
    const packs = Math.ceil(amount / ingredient.packSize - 1e-9);
    total += packs * packPrice(ingredient, factor, input.live);
  }
  return money2(total);
}

function balanceScore(choices: DayChoice[]): number {
  let score = 0;
  for (const day of choices) {
    const groups = new Set<RecipeGroup>();
    const ids = new Set<string>();
    for (const recipeId of Object.values(day)) {
      if (!recipeId) continue;
      ids.add(recipeId);
      const recipe = recipeById.get(recipeId);
      recipe?.groups.forEach((group) => groups.add(group));
    }
    const ok = groups.has("proteina") && groups.has("cereal") && (groups.has("verdura") || groups.has("fruta"));
    if (ok) score += 50;
    score += groups.size * 4;
    score += ids.size;
  }
  return score;
}

function diversify(choices: DayChoice[], input: PlanInput, slots: RecipeSlot[], budget: number): DayChoice[] {
  let current = cloneChoices(choices);
  const factor = storeById(input.storeId).factor;
  const seen = new Set<string>([JSON.stringify(current)]);

  for (let round = 0; round < 30; round += 1) {
    const before = balanceScore(current);
    let best: { day: number; slot: RecipeSlot; recipeId: string; score: number } | null = null;

    for (let day = 0; day < current.length; day += 1) {
      for (const slot of slots) {
        const currentId = current[day]?.[slot];
        const currentRecipe = currentId ? recipeById.get(currentId) : undefined;
        if (!currentRecipe) continue;
        const currentCost = proportional(currentRecipe, input.people, factor, input.live);
        for (const recipe of optionsFor(slot, input.drink)) {
          if (recipe.id === currentId) continue;
          const next = cloneChoices(current);
          next[day]![slot] = recipe.id;
          const signature = JSON.stringify(next);
          if (seen.has(signature)) continue;
          const cost = totalCost(next, input);
          if (cost > budget + 0.01) continue;
          const nextBalance = balanceScore(next);
          const nextCost = proportional(recipe, input.people, factor, input.live);
          if (nextBalance < before) continue;
          if (nextBalance === before && nextCost <= currentCost + 0.5) continue;
          const variety = current[day - 1]?.[slot] && current[day - 1]?.[slot] !== recipe.id ? 8 : 0;
          const score = nextBalance * 20 + variety + nextCost;
          if (!best || score > best.score) best = { day, slot, recipeId: recipe.id, score };
        }
      }
    }

    if (!best) break;
    current[best.day]![best.slot] = best.recipeId;
    seen.add(JSON.stringify(current));
  }

  return current;
}

function portions(recipe: Recipe, people: number): string[] {
  return recipe.lines.map((line) => {
    const ingredient = ingredientById(line.ingredientId);
    return `${ingredient.name}: ${humanQty(line.amount * people, ingredient.unit)}`;
  });
}

export function planMenu(input: PlanInput): PlanResult {
  const days = Math.min(14, Math.max(1, Math.round(input.days)));
  const people = Math.min(8, Math.max(1, Math.round(input.people)));
  const safe: PlanInput = { ...input, days, people, budget: Math.max(0, input.budget) };
  const slots = activeSlots(safe);
  const store = storeById(safe.storeId);
  const budget = safe.budgetMode === "dia" ? money2(safe.budget * days) : money2(safe.budget);
  const base = cheapestChoice(safe, slots);
  const seed = Array.from({ length: days }, () => ({ ...base }));
  const minimum = totalCost(seed, safe);
  const choices = minimum <= budget + 0.01 ? diversify(seed, safe, slots, budget) : seed;
  const factor = store.factor;
  const used = collect(choices, people);
  const lines: ShopLine[] = [];

  for (const [id, amount] of used) {
    const ingredient = ingredientById(id);
    const packs = Math.ceil(amount / ingredient.packSize - 1e-9);
    const bought = packs * ingredient.packSize;
    const live = safe.live[id];
    const leftover = bought - amount;
    lines.push({
      id,
      name: ingredient.name,
      aisle: ingredient.aisle,
      buy: buyLabel(packs, ingredient),
      use: `Usas ${humanQty(amount, ingredient.unit)}`,
      extra: leftover > ingredient.packSize * 0.12 ? `Sobran ${humanQty(leftover, ingredient.unit)}` : null,
      cost: money2(packs * packPrice(ingredient, factor, safe.live)),
      live: Boolean(live),
      liveNote: live ? `${live.name} · ${live.store}` : null,
    });
  }

  lines.sort((a, b) => {
    const aisle = AISLE_ORDER.indexOf(a.aisle) - AISLE_ORDER.indexOf(b.aisle);
    if (aisle !== 0) return aisle;
    return a.name.localeCompare(b.name, "es");
  });

  const dayViews: DayView[] = choices.map((choice, index) => {
    const meals: MealView[] = [];
    const groups = new Set<RecipeGroup>();
    for (const slot of ["desayuno", "comida", "postre", "bebida", "cena"] as RecipeSlot[]) {
      const recipeId = choice[slot];
      if (!recipeId) continue;
      const recipe = recipeById.get(recipeId);
      if (!recipe) continue;
      recipe.groups.forEach((group) => groups.add(group));
      meals.push({
        slot,
        slotLabel: SLOT_LABEL[slot],
        recipeId,
        name: recipe.name,
        minutes: recipe.minutes,
        steps: recipe.steps,
        portions: portions(recipe, people),
        groups: recipe.groups,
      });
    }
    const missing: string[] = [];
    if (!groups.has("proteina")) missing.push(GROUP_LABEL.proteina);
    if (!groups.has("cereal")) missing.push(GROUP_LABEL.cereal);
    if (!groups.has("verdura") && !groups.has("fruta")) missing.push("Verdura o fruta");
    return { day: index + 1, meals, balanced: missing.length === 0, missing };
  });

  const signatures = new Set(choices.map((choice) => JSON.stringify(choice)));
  const total = money2(lines.reduce((sum, line) => sum + line.cost, 0));

  return {
    days: dayViews,
    lines,
    total,
    budget,
    perDay: money2(budget / days),
    shortfall: money2(Math.max(0, total - budget)),
    balancedDays: dayViews.filter((day) => day.balanced).length,
    storeName: store.name,
    people,
    dayCount: days,
    sameEveryDay: signatures.size === 1,
  };
}

export function minimumBudget(input: PlanInput): number {
  const draft = planMenu({ ...input, budget: 0, budgetMode: "total" });
  return draft.total;
}
