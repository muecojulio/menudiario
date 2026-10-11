import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, dayChip, planDates, todayIn, yearsCovered } from "./calendar.ts";

test("addDays cruza meses y años", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-02-27", 2), "2026-03-01");
  assert.equal(addDays("2026-10-11", 0), "2026-10-11");
});

test("planDates genera una fecha por día del plan", () => {
  assert.deepEqual(planDates("2026-10-11", 3), ["2026-10-11", "2026-10-12", "2026-10-13"]);
});

test("todayIn usa la zona horaria de la ciudad, no la del navegador", () => {
  // 2026-10-11 03:00 UTC = 2026-10-10 21:00 en Ciudad de México (UTC-6) y 2026-10-11 en Hermosillo? (UTC-7, sin horario de verano)
  const instant = new Date("2026-10-11T03:00:00Z");
  assert.equal(todayIn("America/Mexico_City", instant), "2026-10-10");
  assert.equal(todayIn("UTC", instant), "2026-10-11");
});

test("yearsCovered devuelve los años únicos del plan", () => {
  assert.deepEqual(yearsCovered(["2026-12-30", "2027-01-02", "2027-01-03"]), [2026, 2027]);
});

test("dayChip entrega etiquetas en español", () => {
  const chip = dayChip("2026-09-16");
  assert.equal(chip.day, "16");
  assert.match(chip.long, /septiembre/);
});
