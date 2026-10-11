import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanText, matchesQuery, normalizeText } from "./text.ts";

test("normalizeText ignora mayúsculas y diacríticos", () => {
  assert.equal(normalizeText("Año Nuevo"), "ano nuevo");
  assert.equal(normalizeText("Querétaro"), "queretaro");
  assert.equal(normalizeText("  León "), "leon");
});

test("matchesQuery encuentra coincidencias sin acentos y acepta consulta vacía", () => {
  assert.equal(matchesQuery("Mérida", "merida"), true);
  assert.equal(matchesQuery("Cancún", "CAN"), true);
  assert.equal(matchesQuery("Puebla", "monterrey"), false);
  assert.equal(matchesQuery("Puebla", "   "), true);
});

test("cleanText quita control, colapsa espacios y acota la longitud", () => {
  assert.equal(cleanText("  hola\u0007   mundo\n", 50), "hola mundo");
  assert.equal(cleanText("", 10), null);
  assert.equal(cleanText(42, 10), null);
  const long = cleanText("a".repeat(40), 10);
  assert.ok(long && long.length <= 10);
  assert.ok(long?.endsWith("…"));
});
