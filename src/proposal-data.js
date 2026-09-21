import { z } from "zod";

export const WORKSPACE_BYTE_LIMIT = 1024 * 1024;
export const PROPOSAL_IMAGE_LIMIT = 100_000;
const short = z.string().max(500).default("");
const prose = z.string().max(12_000).default("");
const image = z
  .string()
  .max(PROPOSAL_IMAGE_LIMIT)
  .refine(
    (value) =>
      !value ||
      /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value),
    "Use uma imagem JPG, PNG ou WebP.",
  )
  .default("");
const timestamp = z.string().max(40).default("");
const amount = z.number().finite().min(0).max(1e10).default(0);

export const proposalSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    name: z.string().trim().min(1, "Dê um nome à proposta.").max(150),
    headline: z.string().max(150).default(""),
    projectType: short,
    period: short,
    introTitle: z.string().max(150).default("Da ideia à realização."),
    client: short,
    email: short,
    phone: short,
    badge: z.string().max(80).default("Proposta comercial"),
    subtitle: z
      .string()
      .max(600)
      .default("Uma ideia com propósito. Uma produção com direção."),
    coverLogo: image,
    coverImage: image,
    coverPosition: z.number().min(0).max(100).default(50),
    coverShade: z.number().min(20).max(80).default(35),
    studioLogo: image,
    textScale: z.number().min(0.8).max(1.2).default(1),
    objective: prose,
    scope: prose,
    team: short,
    days: z.number().int().min(0).max(1000).default(1),
    deliverables: z
      .array(z.object({ name: short, deadline: short }))
      .max(40)
      .default([]),
    value: amount,
    calculateTotal: z.boolean().default(false),
    timeline: z
      .array(z.object({ title: short, description: short }))
      .max(8)
      .default([]),
    investment: z
      .array(z.object({ title: short, description: prose, amount }))
      .max(8)
      .default([]),
    payment: prose,
    terms: prose,
    about: prose,
    clientLogos: z.array(image).max(6).default([]),
    logoSize: z.number().int().min(20).max(120).default(60),
    portfolio: z.array(image).max(5).default([]),
    commercialEmail: short,
    website: short,
    accent: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal com 6 dígitos.")
      .default("#d7ee78"),
    currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
    status: z
      .enum(["Rascunho", "Enviada", "Aprovada", "Recusada"])
      .default("Rascunho"),
    createdAt: timestamp,
    updatedAt: timestamp,
    leadId: z.string().max(100).default(""),
  })
  .superRefine((proposal, ctx) => {
    if (proposal.calculateTotal && proposalTotal(proposal) > 1e10)
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "O total dos itens ultrapassa o valor máximo da proposta.",
      });
  });

export const proposalFields = {
  proposals: z
    .array(proposalSchema)
    .max(100)
    .default([])
    .superRefine((rows, ctx) => {
      if (new Set(rows.map((row) => row.id)).size !== rows.length)
        ctx.addIssue({
          code: "custom",
          message: "Existem propostas com IDs duplicados.",
        });
    }),
};

/** One-way migration of the original single-proposal field; never duplicates it. */
export function normalizeProposals(data) {
  const next = { ...data };
  if (
    !Array.isArray(next.proposals) &&
    next.proposal &&
    typeof next.proposal === "object"
  ) {
    const old = next.proposal;
    next.proposals = [
      {
        id: "legacy-proposal",
        name: old.name || "Proposta anterior",
        client: old.client || "",
        value: Number(old.value) || 0,
        objective: old.objective || "",
        payment: old.payment || "",
        deliverables: String(old.deliverables || "")
          .split("\n")
          .filter(Boolean)
          .slice(0, 40)
          .map((name) => ({ name, deadline: "" })),
      },
    ];
  }
  delete next.proposal;
  return next;
}

export function createProposal(
  workspace = "Meu estúdio",
  currency = "BRL",
  accent = "#d7ee78",
) {
  const now = new Date().toISOString();
  return proposalSchema.parse({
    id: crypto.randomUUID(),
    name: "Nova proposta",
    currency,
    accent,
    payment: "50% na aprovação da proposta e 50% na entrega final.",
    terms:
      "O início da produção está sujeito à aprovação do escopo e à confirmação do pagamento inicial. Alterações de escopo serão orçadas à parte.",
    about: `${workspace} reúne estratégia, produção e pós-produção para transformar boas ideias em histórias bem contadas.`,
    deliverables: [{ name: "", deadline: "" }],
    investment: [
      {
        title: "Produção",
        description: "Planejamento, equipe e equipamentos.",
      },
      { title: "Pós-produção", description: "Edição, cor e finalização." },
    ],
    createdAt: now,
    updatedAt: now,
  });
}

export const serializedBytes = (data) =>
  new TextEncoder().encode(JSON.stringify(data)).length;

export function replaceProposal(state, proposal) {
  const rows = state.proposals || [];
  return {
    ...state,
    proposals: rows.some((row) => row.id === proposal.id)
      ? rows.map((row) => (row.id === proposal.id ? proposal : row))
      : [...rows, proposal],
  };
}

export function proposalToLead(proposal) {
  return {
    id: crypto.randomUUID(),
    name: proposal.name,
    client: proposal.client,
    value: proposalTotal(proposal),
    stage: 0,
    projectId: "",
    proposalId: proposal.id,
    email: proposal.email,
    phone: proposal.phone,
    source: "Proposta",
    temperature: "Morno",
    nextStep: "Apresentar a proposta e combinar o retorno.",
    notes: "",
  };
}

/** Round each line to cents so 0.1 + 0.2 exports as exactly 0.30. */
export function proposalTotal(proposal) {
  return proposal.calculateTotal
    ? proposal.investment.reduce(
        (total, item) => total + Math.round((item.amount || 0) * 100),
        0,
      ) / 100
    : proposal.value;
}

export function safeWebsite(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const input = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:/i.test(input)) return "";
  try {
    const url = new URL(
      /^https?:\/\//i.test(input) ? input : `https://${input}`,
    );
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}

export const safeEmail = (value) =>
  typeof value === "string" &&
  /^[^\s@<>"'?#&]+@[^\s@<>"'?#&]+\.[^\s@<>"'?#&]+$/.test(value)
    ? value
    : "";
export const safeImage = (value) =>
  typeof value === "string" &&
  value.length <= PROPOSAL_IMAGE_LIMIT &&
  /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
    ? value
    : "";
