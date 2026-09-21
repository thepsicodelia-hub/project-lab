import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  calculateBudget,
  openBudgetCalculator,
} from "../src/budget-calculator.js";

test("budget keeps margin on the final sale price and reconciles its breakdown", () => {
  const result = calculateBudget({
    services: 6000,
    rental: 1800,
    tax: 6,
    margin: 30,
  });
  assert.deepEqual(result, {
    cost: 7800,
    total: 12187.5,
    taxes: 731.25,
    profit: 3656.25,
  });
  assert.equal(result.cost + result.taxes + result.profit, result.total);
  assert.equal(
    calculateBudget({ services: 0, rental: 0, tax: 6, margin: 30 }).total,
    0,
  );
  const fractional = calculateBudget({
    services: 1200.55,
    rental: 300.45,
    tax: 7.5,
    margin: 22.5,
  });
  assert.equal(fractional.total, 1501 / 0.7);
});

test("invalid costs or impossible rates never produce a sale price", () => {
  const base = { services: 6000, rental: 1800, tax: 6, margin: 30 };
  for (const change of [
    { services: NaN },
    { rental: -1 },
    { services: Infinity },
    { tax: -2 },
    { margin: 94 },
    { tax: 101 },
    { services: 1e308, rental: 1e308 },
  ]) {
    const result = calculateBudget({ ...base, ...change });
    assert.ok(result.error);
    assert.equal(result.total, undefined);
  }
});

test("margin controls, invalid input, reset and copied summary stay in sync", async (t) => {
  const dom = new JSDOM('<body><div id="modal-content"></div></body>');
  const previousDocument = globalThis.document;
  const previousNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator",
  );
  let copied = "";
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        writeText: async (text) => {
          copied = text;
        },
      },
    },
  });
  t.after(() => {
    dom.window.document.body.replaceChildren();
    dom.window.close();
    globalThis.document = previousDocument;
    if (previousNavigator)
      Object.defineProperty(globalThis, "navigator", previousNavigator);
    else delete globalThis.navigator;
  });
  const money = (n) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
    }).format(n);
  openBudgetCalculator({
    openModal: (_title, html) => {
      document.querySelector("#modal-content").innerHTML = html;
    },
    money,
    currency: "USD",
    icon: () => "",
    toast: () => {},
  });
  const query = (selector) => document.querySelector(selector);
  const input = (id, value) => {
    const el = query(id);
    el.value = value;
    el.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  };
  query('[data-budget-margin="40"]').click();
  assert.equal(query("#bc-margin").value, "40");
  assert.equal(query("#bc-margin-slider").value, "40");
  assert.equal(query("#bc-total").textContent, money(7800 / 0.54));
  input("#bc-margin-slider", "25");
  assert.equal(query("#bc-margin").value, "25");
  assert.equal(
    query('[data-budget-margin="40"]').getAttribute("aria-pressed"),
    "false",
  );
  input("#bc-tax", "75");
  assert.equal(query("#bc-copy").disabled, true);
  assert.equal(query("#bc-total").textContent, "—");
  assert.equal(query("#bc-tax").getAttribute("aria-invalid"), "true");
  input("#bc-services", "");
  assert.equal(query("#bc-services").getAttribute("aria-invalid"), "true");
  query("#budget-form").reset();
  assert.equal(query("#bc-services").value, "6000");
  assert.equal(query("#bc-margin-slider").value, "30");
  assert.equal(query("#bc-error").hidden, true);
  assert.equal(query("#bc-copy").disabled, false);
  assert.equal(query("#bc-total").textContent, money(12187.5));
  query("#bc-copy").click();
  await Promise.resolve();
  assert.ok(copied.includes(`Preço sugerido: ${money(12187.5)}`));
  assert.ok(copied.includes("Resultado estimado (30%)"));
  assert.equal(query("#bc-copy span").textContent, "Resumo copiado");
});
