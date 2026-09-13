import { z } from "zod";

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const text = z.string().max(500).default("");
const note = z.string().max(12000).default("");
const number = z.number().finite().min(0).max(1e10).default(0);
const date = z
  .string()
  .refine(
    (v) =>
      !v ||
      (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
        !isNaN(new Date(v + "T12:00:00Z")) &&
        new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v),
    "Data inválida",
  )
  .default("");
const base = { id, name: z.string().trim().min(1).max(150) };
const rows = (schema) =>
  z
    .array(schema)
    .max(1000)
    .default([])
    .superRefine((items, ctx) => {
      if (new Set(items.map((i) => i.id)).size !== items.length)
        ctx.addIssue({ code: "custom", message: "IDs duplicados" });
    });
export const operationsFields = {
  projectDeliveries: rows(
    z.object({
      ...base,
      projectId: id,
      url: text,
      date,
      status: z
        .enum(["Em produção", "Em revisão", "Ajustes solicitados", "Aprovada"])
        .default("Em produção"),
      note,
    }),
  ),
  deliveryFeedback: rows(
    z.object({
      id,
      deliveryId: id,
      author: text,
      timecode: text,
      comment: note,
      createdAt: text,
    }),
  ),
  projectMaterials: rows(
    z.object({ ...base, projectId: id, url: text, kind: text, note }),
  ),
  projectHours: rows(
    z.object({
      ...base,
      projectId: id,
      memberId: text,
      date,
      hours: z.number().finite().min(0.01).max(24),
      rate: number,
    }),
  ),
  equipmentLinks: rows(
    z.object({
      id,
      equipmentId: id,
      projectId: id,
      days: z.number().int().min(1).max(10000),
      revenue: number,
    }),
  ),
  suppliers: rows(
    z.object({ ...base, service: text, email: text, phone: text, note }),
  ),
  departments: rows(z.object({ ...base, note })),
  positions: rows(z.object({ ...base, departmentId: text })),
  memberDetails: rows(
    z.object({ id, departmentId: text, email: text, phone: text }),
  ),
};

export function equipmentMetrics(state, equipment) {
  const links = (state.equipmentLinks || []).filter(
    (x) => x.equipmentId === equipment.id,
  );
  const days = equipment.uses + links.reduce((n, x) => n + x.days, 0);
  const revenue = links.reduce((n, x) => n + x.revenue, 0);
  return {
    days,
    revenue,
    dailyCost: equipment.value / equipment.life,
    recovered: equipment.value ? (revenue / equipment.value) * 100 : 0,
  };
}
export function projectMetrics(state, id) {
  const income = state.income.filter((x) => x.projectId === id),
    costs = state.costs.filter((x) => x.projectId === id);
  const received = income.reduce(
    (n, x) =>
      n + (x.status === "Pago" ? x.value : x.status === "Parcial" ? x.paid : 0),
    0,
  );
  const spent = costs.filter((x) => x.paid).reduce((n, x) => n + x.value, 0);
  const hours = (state.projectHours || []).filter((x) => x.projectId === id);
  return {
    received,
    spent,
    profit: received - spent,
    margin: received ? ((received - spent) / received) * 100 : 0,
    hours: hours.reduce((n, x) => n + x.hours, 0),
    labor: hours.reduce((n, x) => n + x.hours * x.rate, 0),
  };
}
