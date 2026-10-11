import { test } from "node:test";
import assert from "node:assert/strict";
import { CITIES, cityOrDefault, findCity } from "./cities.ts";

test("cada ciudad tiene id único y zona horaria IANA", () => {
  const ids = new Set(CITIES.map((city) => city.id));
  assert.equal(ids.size, CITIES.length);
  for (const city of CITIES) {
    assert.match(city.tz, /^[A-Za-z_]+\/[A-Za-z_]+$/);
    assert.ok(city.lat > 14 && city.lat < 33 && city.lon < -86 && city.lon > -118);
  }
});

test("una ciudad desconocida cae en la predeterminada", () => {
  assert.equal(findCity("atlantis"), undefined);
  assert.equal(cityOrDefault("atlantis").id, "cdmx");
  assert.equal(cityOrDefault("merida").name, "Mérida");
});
