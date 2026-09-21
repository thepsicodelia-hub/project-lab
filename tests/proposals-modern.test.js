import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  proposalSchema,
  proposalTotal,
  proposalToLead,
  createProposal,
} from "../src/proposal-data.js";
import { proposalDocument } from "../src/proposal-document.js";
import { createDemoProposal } from "../src/proposal-demo-data.js";
import { proposalEditor } from "../src/proposal-editor.js";

test("new proposals inherit the studio color while saved document colors stay independent", () => {
  const p = createProposal("Estúdio", "BRL", "#704cff");
  assert.equal(p.accent, "#704cff");
  p.accent = "#d7ee78";
  assert.equal(proposalSchema.parse(p).accent, "#d7ee78");
  assert.match(proposalDocument(p), /--accent:#d7ee78/);
  assert.throws(() => createProposal("Estúdio", "BRL", "red; color: blue"));
});

test("older proposals preserve their agreed total and acquire optional editing fields", () => {
  const p = proposalSchema.parse({
    id: "old",
    name: "Projeto anterior",
    value: 9500.55,
    investment: [{ title: "Produção", description: "Incluída" }],
  });
  assert.equal(proposalTotal(p), 9500.55);
  assert.equal(p.calculateTotal, false);
  assert.equal(p.investment[0].amount, 0);
  assert.deepEqual(p.timeline, []);
  assert.equal(p.headline, "");
});

test("item totals use cents, transfer to leads and reject totals above the supported limit", () => {
  const p = createDemoProposal("");
  p.investment = [
    { title: "A", description: "", amount: 0.1 },
    { title: "B", description: "", amount: 0.2 },
  ];
  assert.equal(proposalTotal(p), 0.3);
  assert.equal(proposalToLead(p).value, 0.3);
  assert.match(proposalDocument(p), /0,30/);
  p.investment[0].amount = 1e10;
  p.investment[1].amount = 1;
  assert.equal(proposalSchema.safeParse(p).success, false);
});

test("standalone presentation includes embedded assets, ordered timeline and escaped new fields", () => {
  const p = createDemoProposal("data:image/png;base64,AA==");
  p.headline = "<script>alert(1)</script>\nUm projeto";
  p.timeline[0].title = "<img src=x onerror=alert(1)>";
  p.email = "private@example.com";
  p.phone = "5511999999999";
  p.status = "Aprovada";
  const html = proposalDocument(p, "Estúdio");
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("script,[onerror]").length, 0);
  assert.equal(
    doc.querySelector(".timeline li h3").textContent,
    p.timeline[0].title,
  );
  assert.equal(doc.querySelectorAll(".timeline li").length, 4);
  assert.equal(doc.querySelector(".backdrop").src, p.coverImage);
  assert.match(html, /data:font\/woff2;base64,/);
  assert.doesNotMatch(
    doc.body.textContent,
    /private@example.com|5511999999999|Aprovada/,
  );
  assert.equal(
    doc.querySelector(".contact-cta").href,
    "https://www.projectlabstudio.com.br/",
  );
});

test("empty optional sections and unsafe contact links are omitted from the client document", () => {
  const p = createDemoProposal("");
  p.timeline = [];
  p.deliverables = [];
  p.commercialEmail = "a@b.com?subject=bad";
  p.website = "javascript:alert(1)";
  const doc = new JSDOM(proposalDocument(p)).window.document;
  assert.equal(doc.querySelector(".timeline"), null);
  assert.equal(doc.querySelector(".deliverables"), null);
  assert.equal(doc.querySelector(".contact-cta"), null);
  assert.equal(doc.querySelector('[href="#entregas"]'), null);
});

test("editor keeps device names accessible when visual labels are hidden and hides save in read-only mode", () => {
  const p = createDemoProposal("");
  const html = proposalEditor(p, {
    esc: String,
    mode: "preview",
    dirty: false,
    editable: false,
    saved: true,
    linked: false,
    device: "desktop",
  });
  const doc = new JSDOM(html).window.document;
  assert.equal(
    doc
      .querySelector('[data-action="proposal-device-desktop"]')
      .getAttribute("aria-label"),
    "Prévia desktop",
  );
  assert.equal(
    doc
      .querySelector('[data-action="proposal-device-mobile"]')
      .getAttribute("aria-label"),
    "Prévia no celular",
  );
  assert.equal(doc.querySelector('[data-action="proposal-save"]'), null);
  assert.equal(doc.querySelector("#proposal-form"), null);
  assert.equal(
    doc.querySelector('[data-action="proposal-mode-edit"]').disabled,
    true,
  );
});
