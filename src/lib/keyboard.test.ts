import { test } from "node:test";
import assert from "node:assert/strict";
import { nextIndex } from "./keyboard.ts";

test("flechas horizontales avanzan y retroceden con envoltura", () => {
  assert.equal(nextIndex(0, "ArrowRight", 3), 1);
  assert.equal(nextIndex(2, "ArrowRight", 3), 0);
  assert.equal(nextIndex(0, "ArrowLeft", 3), 2);
});

test("Inicio y Fin van al primero y al último", () => {
  assert.equal(nextIndex(2, "Home", 5), 0);
  assert.equal(nextIndex(1, "End", 5), 4);
});

test("una tecla que no navega devuelve null y ninguna lista vacía navega", () => {
  assert.equal(nextIndex(1, "a", 5), null);
  assert.equal(nextIndex(0, "ArrowRight", 0), null);
});

test("orientación vertical ignora las flechas laterales", () => {
  assert.equal(nextIndex(0, "ArrowRight", 3, "vertical"), null);
  assert.equal(nextIndex(0, "ArrowDown", 3, "vertical"), 1);
  assert.equal(nextIndex(0, "ArrowUp", 3, "vertical"), 2);
});
