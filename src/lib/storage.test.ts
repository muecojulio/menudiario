import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PREFS, readChecks, readPlan, readPrefs } from "./storage.ts";
import { planMenu } from "./planner.ts";

test("readPrefs acepta lo que guardó la app y corrige campos inválidos", () => {
  const stored = JSON.stringify({
    ...DEFAULT_PREFS,
    days: 99,
    storeId: "tienda-inventada",
    budget: "abc",
  });
  const prefs = readPrefs(stored);
  assert.equal(prefs.days, DEFAULT_PREFS.days);
  assert.equal(prefs.storeId, DEFAULT_PREFS.storeId);
  assert.equal(prefs.budget, DEFAULT_PREFS.budget);
  assert.equal(prefs.people, DEFAULT_PREFS.people);
});

test("readPrefs con JSON roto o no-objeto devuelve los valores por defecto", () => {
  assert.deepEqual(readPrefs("{roto"), DEFAULT_PREFS);
  assert.deepEqual(readPrefs("[1,2]"), DEFAULT_PREFS);
  assert.deepEqual(readPrefs(null), DEFAULT_PREFS);
});

test("readPlan acepta un plan real del planificador (ida y vuelta por JSON)", () => {
  const plan = planMenu({
    budget: 900,
    budgetMode: "total",
    days: 2,
    people: 2,
    desayuno: true,
    comida: true,
    cena: true,
    drink: "agua",
    storeId: "walmart",
    live: {},
  });
  const restored = readPlan(JSON.stringify(plan));
  assert.ok(restored, "el plan debe pasar la validación");
  assert.equal(restored.days.length, plan.days.length);
  assert.equal(restored.total, plan.total);
});

test("readPlan rechaza datos alterados o incompletos", () => {
  assert.equal(readPlan(JSON.stringify({ days: "x" })), null);
  assert.equal(readPlan("no json"), null);
  assert.equal(readPlan(null), null);
});

test("readChecks solo acepta listas de textos", () => {
  assert.deepEqual(readChecks(JSON.stringify(["huevo", "leche"])), ["huevo", "leche"]);
  assert.deepEqual(readChecks(JSON.stringify([1, 2])), []);
  assert.deepEqual(readChecks("{}"), []);
});
