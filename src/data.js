import { z } from "zod";
import { proposalFields, normalizeProposals } from "./proposal-data.js";
import { operationsFields } from "./operations-data.js";
import { creativeFields } from "./creative-data.js";
import { safeLocalImage, safeProfileImage } from './profile-media.js';
import { EVENT_COLORS } from './event-colors.js';

const text = z.string().max(500).default("");
const note = z.string().max(50000).default("");
const localImage = z.string().max(220000).refine(v=>v===''||Boolean(safeLocalImage(v)),'Imagem inválida').default('');
const profileImage = z.string().max(220000).refine(v=>v===''||Boolean(safeProfileImage(v)),'Foto de perfil inválida').default('');
const amount = z.number().finite().min(0).max(1e10).default(0);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
export const dateSchema = z
  .string()
  .refine((value) => {
    if (value === "") return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + "T12:00:00Z");
    return !Number.isNaN(d.valueOf()) && d.toISOString().slice(0, 10) === value;
  }, "Data inválida")
  .default("");
const base = { id, name: z.string().trim().min(1).max(150) };
const list = (schema) => z.array(schema).max(2000).default([]);
const proposal = z.object({
  name: text,
  client: text,
  value: z.union([amount, z.string().regex(/^\d+(\.\d+)?$/)]),
  objective: note,
  deliverables: note,
  payment: note,
});

export const stateSchema = z
  .object({
    version: z.literal(2).default(2),
    workspace: z.string().trim().min(1).max(80).default("Meu estúdio"),
    theme: z.enum(["dark", "light"]).default("dark"),
    goal: z.number().finite().min(1).max(1e10).default(40000),
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#f5f5f7"),
    currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
    annualGoal: z.number().finite().min(1).max(1e11).default(480000),
    dashboardHidden: z
      .array(
        z.enum(["stats", "production", "projects", "tasks", "goal", "agenda"]),
      )
      .max(6)
      .default([]),
    ...proposalFields,
    ...operationsFields,
    ...creativeFields,
    openingBalance: z.number().finite().min(-1e10).max(1e10).default(0),
    script: note,
    projects: list(
      z.object({
        ...base,
        client: text,
        clientId: text,
        stage: z.number().int().min(0).max(3),
        date: dateSchema,
        value: amount,
        team: list(z.string().max(80)),
        type: text,
        progress: z.number().min(0).max(100).default(0),
        color: z.enum(["", "purple", "amber", "teal"]).default(""),
        note,
        captureDates: list(dateSchema),
        equipmentIds: list(id),
      }),
    ),
    clients: list(
      z.object({ ...base, segment: text, email: text, contact: text, logo:localImage, cover:localImage }),
    ),
    team: list(
      z.object({
        ...base,
        role: text,
        initials: z.string().max(8).default("PL"),
        photo:localImage,
        accountId:text,
        accountPhoto:profileImage,
        color:z.string().regex(/^#[a-f\d]{6}$/i).default('#9bc9ff'),
      }),
    ),
    tasks: list(
      z.object({
        ...base,
        project: text,
        projectId: text,
        assignee: text,
        date: dateSchema,
        done: z.boolean().default(false),
      }),
    ),
    events: list(
      z.object({
        ...base,
        color: z.enum(EVENT_COLORS).default('auto'),
        client: text,
        projectId: text,
        type: text,
        date: dateSchema,
        time: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
          .default("09:00"),
      }),
    ),
    equipment: list(
      z.object({
        ...base,
        category: text,
        value: amount,
        uses: z.number().int().min(0).max(1e7).default(0),
        life: z.number().int().min(1).max(1e7),
      }),
    ),
    leads: list(
      z.object({
        ...base,
        client: text,
        value: amount,
        stage: z.number().int().min(0).max(3),
        projectId: text,
        email: text,
        phone: text,
        source: text,
        temperature: z.enum(["Frio", "Morno", "Quente"]).default("Morno"),
        nextStep: text,
        notes: note,
        proposalId: text,
      }),
    ),
    income: list(
      z.object({
        ...base,
        client: text,
        projectId: text,
        value: amount,
        status: z.enum(["Pendente", "Pago", "Parcial"]),
        paid: amount,
        date: dateSchema,
        paidDate: dateSchema,
      }),
    ),
    costs: list(
      z.object({
        ...base,
        category: text,
        projectId: text,
        value: amount,
        date: dateSchema,
        paid: z.boolean().default(true),
      }),
    ),
    proposal: proposal.optional(),
    scenes: list(z.object({ shot: text, scene: note })),
    callsheet: z
      .object({
        project: text,
        date: dateSchema,
        time: text,
        location: text,
        timeline: note,
        crew: note,
      })
      .optional(),
  })
  .superRefine((state, ctx) => {
    for (const key of [
      "projects",
      "clients",
      "team",
      "tasks",
      "events",
      "equipment",
      "leads",
      "income",
      "costs",
    ]) {
      if (new Set(state[key].map((row) => row.id)).size !== state[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "IDs duplicados",
        });
    }
    for (const row of state.income) {
      if (row.paid > row.value)
        ctx.addIssue({
          code: "custom",
          path: ["income"],
          message: "Recebimento maior que o valor da receita",
        });
    }
  });

export function parseState(input) {
  if (!input || typeof input !== "object" || ![1, 2].includes(input.version))
    throw new Error("Backup inválido ou versão não suportada.");
  const data = normalizeProposals(structuredClone(input));
  // Refresh only the retired default. Explicit custom accents stay untouched.
  if (data.accent?.toLowerCase() === "#4f7cff") data.accent = "#d7ee78";
  if (data.annualGoal === undefined)
    data.annualGoal = (data.goal || 40000) * 12;
  if (!Array.isArray(data.storyFrames) && data.scenes?.length)
    data.storyFrames = data.scenes.map((row) => ({
      id: crypto.randomUUID(),
      ...row,
      image: "",
    }));
  if (!Array.isArray(data.scripts) && data.script)
    data.scripts = [
      {
        id: crypto.randomUUID(),
        name: "Roteiro anterior",
        projectId: "",
        content: data.script,
      },
    ];
  if (!Array.isArray(data.callsheets) && data.callsheet)
    data.callsheets = [
      {
        id: crypto.randomUUID(),
        name: data.callsheet.project || "Ordem do dia anterior",
        projectId: "",
        ...data.callsheet,
      },
    ];
  if (data.version === 1) {
    data.version = 2;
    // Do not invent financial dates during migration. The UI highlights undated records.
    for (const key of ["income", "costs"])
      data[key] = (data[key] || []).map((row, i) => ({
        ...row,
        id: row.id || `legacy-${key}-${i}`,
      }));
  }
  const result = stateSchema.safeParse(data);
  if (!result.success)
    throw new Error(
      "Dados inválidos: " +
        result.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
    );
  if (
    new TextEncoder().encode(JSON.stringify(result.data)).length >
    1024 * 1024
  )
    throw new Error("O backup excede o limite de 1 MB por estúdio.");
  return result.data;
}

export const emptyState = (name) =>
  stateSchema.parse({ workspace: name || "Meu estúdio" });
export const received = (row) =>
  row.status === "Pago" ? row.value : row.status === "Parcial" ? row.paid : 0;
export const outstanding = (row) => Math.max(0, row.value - received(row));
export function financialSummary(state, month) {
  const income = state.income.filter(
    (row) => row.paidDate && (!month || row.paidDate.startsWith(month)),
  );
  const expenses = state.costs.filter(
    (row) => row.paid && row.date && (!month || row.date.startsWith(month)),
  );
  const revenue = income.reduce((sum, row) => sum + received(row), 0);
  const costs = expenses.reduce((sum, row) => sum + row.value, 0);
  return {
    revenue,
    costs,
    profit: revenue - costs,
    receivable: state.income.reduce((sum, row) => sum + outstanding(row), 0),
  };
}
export function monthlySeries(state, year) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i,
    ...financialSummary(state, `${year}-${String(i + 1).padStart(2, "0")}`),
  }));
}
