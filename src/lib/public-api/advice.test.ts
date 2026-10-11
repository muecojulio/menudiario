import { test } from "node:test";
import assert from "node:assert/strict";
import { describeWeather, menuTip } from "./advice.ts";

const base = { date: "2026-10-11", tmax: 24, tmin: 16, precip: 10, code: 1 };

test("describeWeather traduce los códigos WMO más comunes", () => {
  assert.equal(describeWeather(0).label, "Despejado");
  assert.equal(describeWeather(63).kind, "rain");
  assert.equal(describeWeather(95).kind, "storm");
  assert.equal(describeWeather(null).label, "Sin dato");
  assert.equal(describeWeather(999).kind, "cloudy");
});

test("menuTip prioriza calor, luego lluvia, luego frío", () => {
  assert.equal(menuTip({ ...base, tmax: 33 }).tone, "hot");
  assert.equal(menuTip({ ...base, precip: 80 }).tone, "rain");
  assert.equal(menuTip({ ...base, code: 82 }).tone, "rain");
  assert.equal(menuTip({ ...base, tmin: 9 }).tone, "cold");
  assert.equal(menuTip(base).tone, "mild");
});
