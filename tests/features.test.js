import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { emptyState, parseState, financialSummary } from "../src/data.js";
import { renderStudioDashboard } from "../src/studio-dashboard.js";
import {
  createProposal,
  normalizeProposals,
  replaceProposal,
  proposalToLead,
  safeWebsite,
  safeImage,
} from "../src/proposal-data.js";
import { proposalDocument } from "../src/proposal-document.js";
import { equipmentMetrics, projectMetrics } from "../src/operations-data.js";
import { cashChartData, chartGeometry } from "../src/finance-chart.js";

test("cash-flow chart keeps cumulative balance and stable geometry", () => {
  const rows = cashChartData(
    [
      { month: "Jan", revenue: 1000, costs: 300 },
      { month: "Fev", revenue: 250, costs: 500 },
    ],
    200,
  );
  assert.deepEqual(rows.map((row) => row.balance), [900, 650]);
  const geometry = chartGeometry(rows, 800, 280);
  assert.equal(geometry.points.length, 2);
  assert.equal(geometry.ticks.length, 5);
  assert.match(geometry.path, /^M[0-9.]+,[0-9.]+ L[0-9.]+,[0-9.]+$/);
  assert.ok(geometry.zero >= geometry.top && geometry.zero <= geometry.bottom);
});

test("studio dashboard shows actual totals, singular labels and accessible goal progress", () => {
  const state = emptyState("Studio <teste>");
  state.projects = [{ id: "finished", name: "Filme", stage: 3 }];
  const html = renderStudioDashboard({
    state,
    header: (title, subtitle) => `<h1>${title}</h1><p>${subtitle}</p>`,
    btn: (label) => `<button>${label}</button>`,
    icon: () => "",
    esc: (value) =>
      String(value).replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    money: (value) => String(value),
    today: new Date("2026-09-13T12:00:00Z"),
    isoDate: (date) => date.toISOString().slice(0, 10),
    financialSummary,
    projectCard: () => "",
    taskRows: () => "",
  });
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("[data-widget]").length, 6);
  assert.equal(
    doc.querySelector("[role=img]").getAttribute("aria-label"),
    "0% da meta mensal",
  );
  assert.match(
    doc.querySelector(".studio-kpis").textContent,
    /1 finalizado(?!s)/,
  );
  assert.equal(doc.querySelector("teste"), null);
  assert.doesNotMatch(html, /NaN|Infinity/);
  assert.match(
    doc.querySelector(".studio-event-list").textContent,
    /Agenda livre/,
  );
});

test("legacy proposal is migrated once with deliverables and monetary precision", () => {
  const input = {
    version: 2,
    workspace: "Studio",
    proposal: {
      name: "Anterior",
      client: "Cliente",
      value: "12500.50",
      objective: "Objetivo",
      deliverables: "Filme\nCorte",
      payment: "50%",
    },
  };
  const parsed = parseState(input);
  assert.equal(parsed.proposals.length, 1);
  assert.equal(parsed.proposals[0].value, 12500.5);
  assert.equal(parsed.proposals[0].deliverables.length, 2);
  assert.equal(parseState(parsed).proposals.length, 1);
  assert.equal(normalizeProposals(parsed).proposal, undefined);
  parsed.proposals = [];
  assert.equal(parseState(parsed).proposals.length, 0);
});
test("proposal export escapes markup and rejects executable or credential-bearing links", () => {
  const p = createProposal("Studio");
  p.name = "<script>alert(1)</script>";
  p.about = "<img src=x onerror=evil()> ";
  p.website = "javascript:alert(1)";
  p.commercialEmail = "a@b.com?subject=bad";
  const html = proposalDocument(p, "<unsafe>");
  const doc = new JSDOM(html).window.document;
  assert.equal(doc.querySelectorAll("script").length, 0);
  assert.equal(doc.querySelectorAll("[onerror]").length, 0);
  assert.equal(doc.querySelector("h1").textContent, p.name);
  assert.equal(doc.querySelectorAll('a[href^="javascript:"]').length, 0);
  assert.equal(doc.querySelectorAll('a[href^="mailto:"]').length, 0);
  assert.equal(safeWebsite("https://user:password@example.com"), "");
  assert.equal(safeWebsite("example.com"), "https://example.com/");
  assert.equal(safeImage("data:image/svg+xml;base64,PHN2Zz4="), "");
});
test("proposal images, independent colors, export and lead transfer survive save", () => {
  const p = createProposal("Studio");
  p.value = 1599.99;
  p.coverImage = "data:image/png;base64,AA==";
  p.accent = "#123456";
  const state = parseState(replaceProposal(emptyState(), p));
  assert.equal(state.proposals[0].accent, "#123456");
  assert.equal(state.proposals[0].coverImage, p.coverImage);
  const lead = proposalToLead(p);
  const next = parseState({ ...state, leads: [lead] });
  assert.equal(next.leads[0].value, 1599.99);
  assert.equal(next.leads[0].proposalId, p.id);
  assert.match(proposalDocument(p), /1\.599,99/);
  assert.throws(() => parseState({ ...state, proposals: [p, p] }));
  assert.throws(() =>
    parseState({ ...state, proposals: [{ ...p, accent: "red; color: pink" }] }),
  );
});
test("operation costs, actual margin and equipment amortization remain separate", () => {
  const state = parseState({
    ...emptyState(),
    equipment: [
      {
        id: "cam",
        name: "Camera",
        category: "Câmera",
        value: 2000,
        uses: 0,
        life: 40,
      },
    ],
    equipmentLinks: [
      { id: "use", equipmentId: "cam", projectId: "p", days: 2, revenue: 200 },
    ],
    income: [
      {
        id: "i",
        name: "Film",
        projectId: "p",
        status: "Pago",
        value: 1000,
        paid: 1000,
        date: "2026-09-13",
        paidDate: "2026-09-13",
      },
    ],
    costs: [
      {
        id: "c",
        name: "Team",
        projectId: "p",
        value: 300,
        paid: true,
        date: "2026-09-13",
      },
      { id: "c2", name: "Pending", projectId: "p", value: 100, paid: false },
    ],
    projectHours: [
      {
        id: "h",
        projectId: "p",
        name: "Editing",
        date: "2026-09-13",
        hours: 2.5,
        rate: 40,
      },
    ],
  });
  assert.deepEqual(equipmentMetrics(state, state.equipment[0]), {
    days: 2,
    revenue: 200,
    dailyCost: 50,
    recovered: 10,
  });
  assert.deepEqual(projectMetrics(state, "p"), {
    received: 1000,
    spent: 300,
    profit: 700,
    margin: 70,
    hours: 2.5,
    labor: 100,
  });
  assert.equal(state.income.length, 1);
});
test("all new operations and creative documents persist and reject invalid data", () => {
  const state = parseState({
    ...emptyState(),
    projectDeliveries: [
      {
        id: "d",
        projectId: "p",
        name: "Cut",
        status: "Aprovada",
        date: "2026-09-13",
      },
    ],
    deliveryFeedback: [
      {
        id: "f",
        deliveryId: "d",
        author: "Team",
        comment: "Good",
        timecode: "01:10",
      },
    ],
    projectMaterials: [
      { id: "m", projectId: "p", name: "Briefing", url: "https://example.com" },
    ],
    suppliers: [{ id: "s", name: "Partner" }],
    departments: [{ id: "dep", name: "Post" }],
    positions: [{ id: "pos", name: "Editor", departmentId: "dep" }],
    memberDetails: [{ id: "person", departmentId: "dep" }],
    scripts: [{ id: crypto.randomUUID(), name: "Script", content: "Cena 1" }],
    callsheets: [
      { id: crypto.randomUUID(), name: "Day 1", date: "2026-09-13" },
    ],
    moodboard: [
      {
        id: crypto.randomUUID(),
        image: "data:image/png;base64,AA==",
        caption: "Frame",
      },
    ],
  });
  const twice = parseState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(twice, state);
  assert.throws(() =>
    parseState({
      ...state,
      projectHours: [
        { id: "h", projectId: "p", name: "Bad", hours: 25, rate: 0 },
      ],
    }),
  );
  assert.throws(() =>
    parseState({
      ...state,
      projectDeliveries: [
        { id: "d", projectId: "p", name: "Bad", date: "2026-02-30" },
      ],
    }),
  );
});
test("legacy tools do not reappear after deliberate emptying of the new collection", () => {
  const old = parseState({
    version: 2,
    script: "Previous",
    scenes: [{ shot: "Wide", scene: "Action" }],
    callsheet: { project: "Day", date: "2026-09-13", time: "08:00" },
  });
  assert.equal(old.scripts.length, 1);
  assert.equal(old.storyFrames.length, 1);
  assert.equal(old.callsheets.length, 1);
  old.scripts = [];
  old.storyFrames = [];
  old.callsheets = [];
  const next = parseState(old);
  assert.equal(next.scripts.length, 0);
  assert.equal(next.storyFrames.length, 0);
  assert.equal(next.callsheets.length, 0);
});
