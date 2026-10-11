import { test } from "node:test";
import assert from "node:assert/strict";
import { horizontalSwipe, lockAxis, settleRow } from "./gesture.ts";

test("el eje se bloquea solo con desplazamiento claro (proporción ≈1,2)", () => {
  assert.equal(lockAxis(4, 2), null, "movimiento muy corto no decide");
  assert.equal(lockAxis(50, 45), "y", "proporción 1,1 no supera 1,2: vertical gana");
  assert.equal(lockAxis(80, 40), "x", "80 vs 40 supera 1,2: horizontal");
  assert.equal(lockAxis(10, 60), "y");
});

test("un swipe horizontal necesita distancia o velocidad suficientes", () => {
  assert.equal(horizontalSwipe(-80, 10, 300), "left");
  assert.equal(horizontalSwipe(90, 5, 400), "right");
  assert.equal(horizontalSwipe(-30, 5, 800), null, "lento y corto");
  assert.equal(horizontalSwipe(-30, 5, 60), "left", "corto pero rápido");
  assert.equal(horizontalSwipe(-100, 90, 300), null, "gesto vertical no cambia de sección");
});

test("una fila abre o cierra según umbral o gesto rápido", () => {
  assert.equal(
    settleRow({ offset: -50, velocity: 0, width: 160 }),
    false,
    "31% no alcanza el umbral",
  );
  assert.equal(settleRow({ offset: -80, velocity: 0, width: 160 }), true, "50% abre");
  assert.equal(
    settleRow({ offset: -10, velocity: -1, width: 160 }),
    true,
    "flick hacia la izquierda abre",
  );
  assert.equal(
    settleRow({ offset: -150, velocity: 1, width: 160 }),
    false,
    "flick hacia la derecha cierra",
  );
  assert.equal(settleRow({ offset: 0, velocity: 0, width: 0 }), false);
});
