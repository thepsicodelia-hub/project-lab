import {
  parseState,
  emptyState,
  financialSummary,
  monthlySeries,
  received,
  outstanding,
} from "./src/data.js";
import { WorkspaceRepository } from "./src/repository.js";
import { parseCaptureDates } from './src/project-dates.js';
import { deleteProduction } from './src/delete-production.js';
import { addRentalCosts } from './src/rental-costs.js';
import { createAuth } from "./src/auth.js";
import { createGoogleIntegrations } from './src/google-integrations.js';
import './src/google-integrations.css';
import { supabase, friendlyError } from "./src/supabase.js";
import { createProposals } from "./src/proposals.js";
import { openBudgetCalculator } from "./src/budget-calculator.js";
import "./src/budget-calculator.css";
import { createOperations } from "./src/operations.js";
import { createCreativeTools } from "./src/creative-tools.js";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { BRAND_ACCENT, brandLockup } from "./src/brand.js";
import { renderFinanceChart, bindFinanceChart } from "./src/finance-chart.js";
import { animateSurface } from "./src/motion.js";
import { renderStudioDashboard } from "./src/pulse-dashboard.js";
import { bindPulseMotion, installPulseEffects } from "./src/pulse-motion.js";
import { cleanIcon } from "./src/clean-icons.js";
import { appearanceTokens } from "./src/appearance.js";
import { bindMediaFields,mediaField,safeLocalImage,safeProfileImage,personAvatar,clientForProject } from './src/profile-media.js';
import { progressRing } from './src/progress-ring.js';
import { taskDateBadge,renderWeeklyPlanner } from './src/weekly-planner.js';
import { renderDistribution,bindDistribution } from './src/finance-distribution.js';
import { eventTone,eventColorField,bindEventColors } from './src/event-colors.js';
document.querySelector("#home-brand").innerHTML = brandLockup();
document
  .querySelector("#home-brand")
  .setAttribute("aria-label", "Project Lab · Painel");
let disposeChart = () => {},
  disposePolishMotion = () => {},
  disposeSurface = () => {},
  disposeDistribution = () => {},
  lastMotionView = "",
  dashboardVisited = false;
installPulseEffects();
document.addEventListener(
  "pointerdown",
  () => {
    document.body.dataset.inputModality = "pointer";
  },
  { capture: true },
);
document.addEventListener(
  "keydown",
  () => {
    document.body.dataset.inputModality = "keyboard";
  },
  { capture: true },
);
const icon = cleanIcon;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: state.currency || "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n || 0);
const today = new Date(),
  isoDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateIn = (n) => {
  let d = new Date(today);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
const dateLabel = (s) =>
  s
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
        .format(new Date(s + "T12:00:00"))
        .replace(".", "")
    : "Sem data";
const initial = {
  version: 1,
  workspace: "Meu estúdio",
  theme: "light",
  accent: "#f5f5f7",
  goal: 40000,
  script:
    "CENA 01 — ABERTURA\n\nPlano geral do estúdio. Luz natural atravessa a janela.\n\nNARRAÇÃO\nToda grande ideia começa com um novo olhar.\n\nCENA 02 — PROCESSO\n\nDetalhes das mãos preparando a câmera. Corte para a equipe no set.",
  projects: [
    {
      id: "p1",
      name: "Horizontes · filme de marca",
      client: "Aurora",
      stage: 2,
      date: dateIn(2),
      value: 12800,
      team: ["LM", "AC"],
      type: "Institucional",
      progress: 75,
      color: "",
      note: "Filme institucional de 90 segundos, com versões para redes sociais.",
    },
    {
      id: "p2",
      name: "Coleção Essência",
      client: "Forma",
      stage: 1,
      date: dateIn(4),
      value: 8600,
      team: ["BC", "LM"],
      type: "Campanha",
      progress: 40,
      color: "purple",
      note: "Campanha audiovisual da nova coleção. Captação em estúdio.",
    },
    {
      id: "p3",
      name: "Conexões 2026",
      client: "Nexo",
      stage: 0,
      date: dateIn(7),
      value: 6400,
      team: ["AC"],
      type: "Evento",
      progress: 20,
      color: "amber",
      note: "Cobertura de evento com vídeo de abertura e aftermovie.",
    },
    {
      id: "p4",
      name: "Um novo jeito de mover",
      client: "Vértice",
      stage: 2,
      date: dateIn(1),
      value: 10400,
      team: ["BC", "AC"],
      type: "Social",
      progress: 85,
      color: "teal",
      note: "Série de quatro vídeos verticais para a campanha de lançamento.",
    },
    {
      id: "p5",
      name: "Histórias que ficam",
      client: "Aurora",
      stage: 3,
      date: dateIn(-3),
      value: 8200,
      team: ["LM"],
      type: "Documentário",
      progress: 100,
      color: "",
      note: "Minidocumentário sobre histórias de transformação.",
    },
    {
      id: "p6",
      name: "Retratos da cidade",
      client: "Nexo",
      stage: 0,
      date: dateIn(12),
      value: 5900,
      team: ["BC"],
      type: "Institucional",
      progress: 10,
      color: "purple",
      note: "Série de retratos urbanos com entrevistas e cenas de apoio.",
    },
  ],
  clients: [
    {
      id: "c1",
      name: "Aurora",
      segment: "Tecnologia",
      email: "contato@aurora.example",
      contact: "Marina Costa",
    },
    {
      id: "c2",
      name: "Forma",
      segment: "Moda & Lifestyle",
      email: "criacao@forma.example",
      contact: "João Mendes",
    },
    {
      id: "c3",
      name: "Nexo",
      segment: "Eventos",
      email: "producao@nexo.example",
      contact: "Carla Reis",
    },
    {
      id: "c4",
      name: "Vértice",
      segment: "Mobilidade",
      email: "marca@vertice.example",
      contact: "Pedro Lima",
    },
  ],
  team: [
    {
      id: "m1",
      name: "Lucas Martins",
      role: "Direção & fotografia",
      initials: "LM",
    },
    { id: "m2", name: "Ana Costa", role: "Produção executiva", initials: "AC" },
    { id: "m3", name: "Bruno Campos", role: "Edição & motion", initials: "BC" },
  ],
  tasks: [
    {
      id: "t1",
      name: "Finalizar corte do filme Horizontes",
      project: "Aurora · Pós-produção",
      date: dateIn(0),
      done: false,
    },
    {
      id: "t2",
      name: "Revisar roteiro da campanha Essência",
      project: "Forma · Pré-produção",
      date: dateIn(0),
      done: false,
    },
    {
      id: "t3",
      name: "Enviar versão vertical para aprovação",
      project: "Vértice · Entrega",
      date: dateIn(1),
      done: false,
    },
    {
      id: "t4",
      name: "Confirmar locação e equipe",
      project: "Nexo · Produção",
      date: dateIn(2),
      done: true,
    },
  ],
  events: [
    {
      id: "e1",
      name: "Alinhamento de campanha",
      client: "Forma",
      type: "Reunião",
      date: dateIn(0),
      time: "10:00",
    },
    {
      id: "e2",
      name: "Revisão do primeiro corte",
      client: "Aurora",
      type: "Entrega",
      date: dateIn(0),
      time: "14:30",
    },
    {
      id: "e3",
      name: "Captação · Coleção Essência",
      client: "Forma",
      type: "Captação",
      date: dateIn(1),
      time: "08:00",
    },
  ],
  equipment: [
    {
      id: "q1",
      name: "Sony FX3",
      category: "Câmeras",
      value: 28000,
      uses: 42,
      life: 120,
    },
    {
      id: "q2",
      name: "Sigma 24–70mm",
      category: "Lentes",
      value: 6900,
      uses: 65,
      life: 160,
    },
    {
      id: "q3",
      name: "Aputure 300d II",
      category: "Iluminação",
      value: 8200,
      uses: 38,
      life: 150,
    },
    {
      id: "q4",
      name: "DJI RS 4 Pro",
      category: "Estabilização",
      value: 6100,
      uses: 28,
      life: 120,
    },
    {
      id: "q5",
      name: "Ilha de edição Studio",
      category: "Ilha de edição",
      value: 12500,
      uses: 54,
      life: 180,
    },
  ],
  leads: [
    {
      id: "l1",
      name: "Manifesto de marca",
      client: "Soma",
      value: 15000,
      stage: 0,
    },
    {
      id: "l2",
      name: "Lançamento de produto",
      client: "Onda",
      value: 9200,
      stage: 1,
    },
    {
      id: "l3",
      name: "Série de entrevistas",
      client: "Ponto",
      value: 7800,
      stage: 2,
    },
  ],
  income: [
    {
      name: "Horizontes · primeira parcela",
      client: "Aurora",
      value: 6400,
      status: "Pago",
    },
    {
      name: "Coleção Essência · produção",
      client: "Forma",
      value: 8600,
      status: "Pago",
    },
    {
      name: "Um novo jeito de mover",
      client: "Vértice",
      value: 10400,
      status: "Pago",
    },
    {
      name: "Histórias que ficam · entrega",
      client: "Aurora",
      value: 4800,
      status: "Pago",
    },
    {
      name: "Horizontes · saldo",
      client: "Aurora",
      value: 6400,
      status: "Pendente",
    },
  ],
  costs: [
    { name: "Equipe de captação", category: "Produção", value: 5200 },
    { name: "Locação de estúdio", category: "Locação", value: 1800 },
    { name: "Softwares & assinaturas", category: "Fixo", value: 740 },
    { name: "Transporte e alimentação", category: "Logística", value: 860 },
  ],
};
const storageKey = "project-lab-demo-v2";
const demoState = () => {
  const demo = parseState(initial);
  for (const row of demo.income) {
    row.date = isoDate(today);
    row.paidDate = row.status === "Pago" ? isoDate(today) : "";
  }
  for (const row of demo.costs) row.date = isoDate(today);
  return demo;
};
let state = emptyState(),
  acknowledged = structuredClone(state),
  repository = null,
  workspaceContext = null,
  appMode = "locked",
  profileAvatar = "",
  saving = false,
  failedDraft = null,
  saveConflict = false,
  refreshing = false;

const profileAvatarKey = () =>
  `project-lab-avatar:${appMode === "online" ? workspaceContext?.user?.id || "online" : "demo"}`;
const profileUserName = () => {
  const metadata = workspaceContext?.user?.user_metadata || {};
  return (
    metadata.display_name ||
    metadata.full_name ||
    workspaceContext?.user?.email?.split("@")[0] ||
    "Project Lab"
  );
};
const profileInitials = () => {
  const initials = profileUserName()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "PL";
};
const profileAvatarSource = () =>
  profileAvatar || workspaceContext?.user?.user_metadata?.avatar_url || "";
function syncCurrentUserToTeam() {
  const user = workspaceContext?.user;
  if (!user?.id || !user?.email) return false;
  const email = user.email.trim().toLowerCase();
  const member = state.team.find((item) => item.accountId === user.id) || state.team.find((item) => {
    const details = state.memberDetails.find((entry) => entry.id === item.id);
    return details?.email?.trim().toLowerCase() === email;
  });
  if (!member) return false;
  const photo = safeProfileImage(profileAvatarSource());
  const changed = member.accountId !== user.id || member.accountPhoto !== photo;
  member.accountId = user.id;
  member.accountPhoto = photo;
  return changed;
}
async function syncWorkspaceAccountsToTeam(context) {
  if (!context?.id || !supabase) return false;
  const { data: accounts, error } = await supabase.rpc("list_workspace_member_profiles", {
    p_workspace: context.id,
  });
  if (error) throw error;
  let changed = false;
  for (const account of accounts || []) {
    const email = String(account.email || "").trim().toLowerCase();
    let member = state.team.find((item) => item.accountId === account.user_id) || state.team.find((item) => {
      const details = state.memberDetails.find((entry) => entry.id === item.id);
      return email && details?.email?.trim().toLowerCase() === email;
    });
    if (!member) {
      const name = String(account.display_name || email.split("@")[0] || "Integrante").trim();
      member = {
        id: `account-${account.user_id}`,
        name,
        role: "Membro do estúdio",
        initials: name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PL",
        photo: "",
        accountId: account.user_id,
        accountPhoto: safeProfileImage(account.avatar_url),
        color: "#9bc9ff",
      };
      state.team.push(member);
      state.memberDetails.push({ id: member.id, departmentId: "", email, phone: "" });
      changed = true;
      continue;
    }
    const photo = safeProfileImage(account.avatar_url);
    if (member.accountId !== account.user_id || member.accountPhoto !== photo) {
      member.accountId = account.user_id;
      member.accountPhoto = photo;
      changed = true;
    }
    const details = state.memberDetails.find((entry) => entry.id === member.id);
    if (details && email && details.email !== email) { details.email = email; changed = true; }
  }
  return changed;
}
const profileAvatarMarkup = (account = false) => {
  const source = profileAvatarSource();
  return source
    ? `<img class="${account ? "account-avatar-image" : "profile-avatar-image"}" src="${esc(source)}" alt="">`
    : `<span class="${account ? "account-avatar-initials" : "profile-avatar-initials"}">${esc(profileInitials())}</span>`;
};
function loadProfileAvatar() {
  const fallback = workspaceContext?.user?.user_metadata?.avatar_url || "";
  try {
    profileAvatar = localStorage.getItem(profileAvatarKey()) || fallback;
  } catch {
    profileAvatar = fallback;
  }
  syncProfileAvatar();
}
function syncProfileAvatar() {
  const button = document.querySelector(".topbar .profile-avatar");
  if (!button) return;
  button.innerHTML = profileAvatarMarkup();
  button.classList.toggle("has-image", Boolean(profileAvatarSource()));
}
function updateAccountAvatarPreview() {
  const preview = modal?.querySelector("[data-account-avatar]");
  if (preview) preview.innerHTML = profileAvatarMarkup(true);
}
function optimizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const max = 320;
      const scale = Math.min(1, max / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler essa imagem."));
    };
    image.src = url;
  });
}
async function saveProfileAvatar(source) {
  profileAvatar = source || "";
  try {
    if (profileAvatar) localStorage.setItem(profileAvatarKey(), profileAvatar);
    else localStorage.removeItem(profileAvatarKey());
  } catch {
    // Private browsing can block local storage; the current session still works.
  }
  let remoteSaved = true;
  if (appMode === "online" && supabase && workspaceContext?.user) {
    const metadata = { ...(workspaceContext.user.user_metadata || {}) };
    if (profileAvatar) metadata.avatar_url = profileAvatar;
    else delete metadata.avatar_url;
    const { data, error } = await supabase.auth.updateUser({ data: metadata });
    if (error) remoteSaved = false;
    if (data?.user) workspaceContext.user = data.user;
  }
  if (syncCurrentUserToTeam() && canEdit()) await save();
  syncProfileAvatar();
  updateAccountAvatarPreview();
  return remoteSaved;
}
const canEdit = () =>
  appMode === "demo" ||
  (appMode === "online" && workspaceContext?.role !== "viewer");
const isOwner = () => appMode === "demo" || workspaceContext?.role === "owner";
const currentMonth = () => isoDate(new Date()).slice(0, 7);
let route = "dashboard",
  view = "gallery",
  taskView = "list",
  plannerWeekOffset = 0,
  financeView = "overview",
  financePeriod = currentMonth(),
  distributionMetric = 'received',
  distributionGroup = 'client',
  teamView = "members",
  commercialView = "pipeline",
  calendarDate = new Date(today.getFullYear(), today.getMonth(), 1),
  projectQuery = "",
  clientQuery = "",
  clientSort = "name",
  lastTrigger = null;
const stages = ["Pré-produção", "Captação", "Em edição", "Finalizado"],
  colors = ["purple", "amber", "blue", "green"],
  stageColors = ["var(--status-violet)", "var(--status-amber)", "var(--status-cyan)", "var(--positive)"];
const navItems = [
  ["dashboard", "Painel", "grid"],
  ["projects", "Produções", "film"],
  ["tasks", "Tarefas", "tasks"],
  ["calendar", "Agenda", "calendar"],
  ["clients", "Conexões", "users"],
  ["commercial", "Negócios", "trend"],
  ["finance", "Caixa", "wallet"],
  ["goals", "Metas", "target"],
  ["team", "Equipe", "users"],
  ["equipment", "Inventário", "camera"],
  ["tools", "Bancada", "tools"],
];
function renderIcons(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((e) => (e.innerHTML = icon(e.dataset.icon)));
}
async function save() {
  if (saving || !canEdit()) {
    toast("Seu acesso permite apenas consultar este estúdio.");
    state = structuredClone(acknowledged);
    return false;
  }
  const currentRepo = repository,
    currentMode = appMode;
  saving = true;
  document.querySelector(".app-shell").inert = true;
  modal.inert = true;
  try {
    const next = parseState(state);
    if (currentMode === "online") await currentRepo.save(next);
    else localStorage.setItem(storageKey, JSON.stringify(next));
    if (repository !== currentRepo || appMode !== currentMode) return false;
    state = next;
    acknowledged = structuredClone(state);
    failedDraft = null;
    saveConflict = false;
    document.getElementById("sync-notice").hidden = true;
    document.getElementById("save-status").textContent =
      appMode === "online"
        ? "Salvo na nuvem"
        : "Demonstração salva neste navegador";
    return true;
  } catch (error) {
    if (repository !== currentRepo || appMode !== currentMode) return false;
    failedDraft = structuredClone(state);
    state = structuredClone(acknowledged);
    saveConflict = error.code === "CONFLICT";
    const notice = document.getElementById("sync-notice");
    notice.hidden = false;
    notice.innerHTML = `<span>${esc(friendlyError(error))} A alteração não foi salva.</span>${btn("Baixar rascunho", "export-draft", "download", "small")}${saveConflict ? btn("Carregar versão atual", "refresh-data", "arrow", "small") : btn("Tentar novamente", "retry-save", "check", "small")}`;
    document.getElementById("save-status").textContent = "Alteração não salva";
    toast(
      "Não foi possível salvar. O rascunho está disponível no aviso acima.",
    );
    return false;
  } finally {
    saving = false;
    document.querySelector(".app-shell").inert = false;
    modal.inert = false;
  }
}
function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 3500);
}
const btn = (text, action, ic = "plus", cls = "primary") =>
  `<button type="button" class="btn ${cls}" data-action="${action}" ${!text ? 'aria-label="Editar meta mensal"' : ""}>${icon(ic)}${text}</button>`;
const link = (text, to) =>
  `<a class="btn text" href="#${to}">${text}${icon("arrow")}</a>`;
const badge = (text, color = "blue") =>
  `<span class="badge ${color}">${esc(text)}</span>`;
const avatars = (members = ["LM", "AC"]) =>
  `<div class="avatars" aria-label="Responsáveis">${members.map(n=>personAvatar(state.team.find(m=>m.initials===n)||{initials:n,name:n},esc)).join('')}</div>`;
const empty = (text) =>
  `<div class="empty-state">${icon("search")}<p>${text}</p></div>`;
const header = (
  title,
  sub,
  actions = "",
  eyebrow = "SEU ESTÚDIO, EM MOVIMENTO",
) =>
  `<div class="page-heading"><div><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${sub}</p></div><div class="heading-actions">${actions}</div></div>`;
const panel = (title, sub, body, action = "", cls = "") =>
  `<section class="panel ${cls}"><div class="panel-head"><div><h2>${title}</h2>${sub ? `<p class="panel-sub">${sub}</p>` : ""}</div>${action}</div>${body}</section>`;
const stat = (label, value, note, ic = "chart", tone = "") =>
  `<article class="stat"><div class="stat-top"><span>${label}</span><span>${icon(ic)}</span></div><p class="stat-number ${tone}">${value}</p><div class="stat-note">${note}</div></article>`;
const revenue = () => financialSummary(state, currentMonth()).revenue;
const costs = () => financialSummary(state, currentMonth()).costs;
function renderNav() {
  if (!document.getElementById('sidebar-toggle')) {
    const toggle = document.createElement('button');
    toggle.id = 'sidebar-toggle'; toggle.className = 'sidebar-toggle';
    toggle.setAttribute('aria-controls', 'navigation');
    toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16m7-12-4 4 4 4"/></svg>';
    const update = () => {const compact = document.body.classList.contains('sidebar-compact');toggle.setAttribute('aria-expanded',String(!compact));toggle.setAttribute('aria-label',compact?'Mostrar nomes das áreas':'Compactar navegação em ícones');toggle.title=toggle.getAttribute('aria-label');};
    toggle.onclick = () => {document.body.classList.toggle('sidebar-compact');update();};
    update();document.getElementById('sidebar').prepend(toggle);
  }
  document.getElementById("navigation").innerHTML = navItems
    .map(
      ([id, name, ic], i) =>
        `<a class="nav-link ${route === id ? "active" : ""}" href="#${id}" ${route === id ? 'aria-current="page"' : ""}>${icon(ic)}<span class="nav-text">${name}</span></a>`,
    )
    .join("");
  document
    .getElementById("settings-link")
    .classList.toggle("active", route === "settings");
  document.getElementById('settings-link').setAttribute('aria-current', route === 'settings' ? 'page' : 'false');
  document.querySelector(".workspace strong").textContent = state.workspace;
  document.body.classList.toggle("light", state.theme === "light");
  document.body.dataset.page = route;
  applyAppearance();
  const demoNote = document.querySelector(".demo-note");
  if (demoNote) {
    demoNote.querySelector("strong").textContent = appMode === "demo" ? "Demonstração local" : "Estúdio online";
    demoNote.querySelector("small").textContent = appMode === "demo" ? "Dados de exemplo" : workspaceContext?.role === "viewer" ? "Acesso de leitura" : "Compartilhado com a equipe";
  }
  syncProfileAvatar();
  document.querySelectorAll('.sidebar .nav-link').forEach(link => {const name=navItems.find(item=>link.getAttribute('href')==='#'+item[0])?.[1] || 'Configurações';link.setAttribute('aria-label',name);link.title=name;});
}
function projectTable(items) {
  return `<div class="table-wrap"><table class="data-table project-table"><thead><tr><th>PROJETO</th><th>ETAPA</th><th>ENTREGA</th><th class="team-cell">EQUIPE</th></tr></thead><tbody>${items.map((p) => `<tr><td><div class="project-title"><span class="project-symbol ${p.color}">${icon("film")}</span><div><button class="project-name" data-project="${p.id}">${esc(p.name)}</button><span class="project-client">${esc(p.client)} · ${esc(p.type)}</span></div></div></td><td>${badge(stages[p.stage], colors[p.stage])}</td><td class="muted">${dateLabel(p.date)}</td><td class="team-cell">${avatars(p.team)}</td></tr>`).join("")}</tbody></table>${!items.length ? empty("Nenhum projeto encontrado.") : ""}</div>`;
}
function goalCard() {
  const value=revenue();
  return `<section class="panel goal-summary-panel"><header><div><span class="goal-period">${new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(today)}</span><h2>Meta do mês</h2></div>${btn('Editar','goal','target','small')}</header><div class="monthly-goal-body">${progressRing(value,state.goal,'Meta do mês')}<div class="goal-details"><div><small>Recebido no mês</small><strong class="value-positive">${money(value)}</strong></div><div><small>Objetivo mensal</small><strong>${money(state.goal)}</strong></div></div></div><footer>${value>=state.goal?'Meta alcançada. Hora de celebrar.':`Faltam <strong>${money(Math.max(0,state.goal-value))}</strong> para sua próxima marca.`}</footer></section>`;
}
function agendaList() {
  return `<p class="day-label">${new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(today).toUpperCase()}</p><div class="agenda-list">${state.events
    .filter((e) => e.date >= isoDate(today))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3)
    .map(
      (e) =>
        `<div class="agenda-item"><span class="agenda-time">${esc(e.time)}${e.date !== isoDate(today) ? `<small style="display:block;font-size:8px">${dateLabel(e.date)}</small>` : ""}</span><div class="agenda-desc"><strong>${esc(e.name)}</strong><p>${esc(e.client)}</p>${badge(e.type, e.type === "Captação" ? "amber" : e.type === "Entrega" ? "purple" : "blue")}</div></div>`,
    )
    .join("")}</div>`;
}
const notificationPanel = document.getElementById("notification-panel");
function closeNotifications({ focus = true } = {}) {
  if (notificationPanel.hidden) return;
  notificationPanel.hidden = true;
  document.querySelector('[data-action="notifications"]')?.setAttribute("aria-expanded", "false");
  if (focus) lastTrigger?.focus?.();
}
function notificationPanelMarkup() {
  const start = isoDate(today), limit = new Date(today);
  limit.setDate(limit.getDate() + 7);
  const events = state.events.filter((event) => event.date >= start && event.date <= isoDate(limit)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 6);
  const captureCount = events.filter((event) => event.type === "Captação").length;
  const deliveryCount = events.filter((event) => event.type === "Entrega").length;
  let currentDate = "";
  const rows = events.map((event) => {
    const heading = event.date !== currentDate ? `<div class="notification-date"><span>${event.date === start ? "HOJE" : dateLabel(event.date).toUpperCase()}</span></div>` : "";
    currentDate = event.date;
    return `${heading}<button class="notification-event event-tone-${eventTone(event)}" data-action="notification-event:${esc(event.id)}"><time>${esc(event.time)}</time><span><strong>${esc(event.name)}</strong><small>${esc([event.client, event.type].filter(Boolean).join(" · ") || "Compromisso do estúdio")}</small></span><i aria-hidden="true"></i></button>`;
  }).join("");
  return `<div class="notification-head"><div><h2>Próximos compromissos</h2><p>Sua produção nos próximos 7 dias.</p></div><button class="icon-button" data-action="close-notifications" aria-label="Fechar compromissos">${icon("x")}</button></div>${events.length ? `<div class="notification-summary"><strong>${events.length}</strong><span><b>Uma semana em movimento</b><small>${captureCount} ${captureCount === 1 ? "captação" : "captações"} e ${deliveryCount} ${deliveryCount === 1 ? "entrega programada" : "entregas programadas"}</small></span></div><div class="notification-list">${rows}</div>` : `<div class="notification-empty">${icon("calendar")}<strong>Agenda livre por enquanto</strong><p>Nenhum compromisso marcado para os próximos 7 dias.</p></div>`}<div class="notification-footer"><button class="btn primary" data-route="calendar">Abrir agenda ${icon("arrow")}</button></div>`;
}
function showNotifications() {
  lastTrigger = document.activeElement;
  notificationPanel.innerHTML = notificationPanelMarkup();
  notificationPanel.hidden = false;
  document.querySelector('[data-action="notifications"]')?.setAttribute("aria-expanded", "true");
  renderIcons(notificationPanel);
  notificationPanel.querySelector("button")?.focus();
}
function dashboard() {
  return renderStudioDashboard({
    state,
    header,
    btn,
    icon,
    esc,
    money,
    dateLabel,
    isoDate,
    today,
    received,
    outstanding,
    financialSummary,
    monthlySeries,
    renderFinanceChart,
    projectCard,
    taskRows,
  });
}
function projectCard(p) {
  const style = ["purple", "amber", "blue", "green"][p.stage];
  const client=clientForProject(state,p),logo=safeLocalImage(client?.logo),cover=safeLocalImage(client?.cover);
  return `<button class="project-card studio-project-card" draggable="${canEdit()}" data-project="${p.id}">
 <span class="project-cover atelier-cover ${style} ${cover?'has-client-cover':''}">${cover?`<img class="project-client-cover" src="${cover}" alt="" width="960" height="400" loading="lazy">`:''}<span class="project-cover-type">${esc(p.type || "Produção")}</span>${logo?`<span class="project-client-logo"><img src="${logo}" alt="Logo de ${esc(p.client)}" width="64" height="64" loading="lazy"></span>`:''}<span class="project-cover-client">${esc(p.client || "Project Lab")}</span></span>
 <span class="project-card-content"><span class="project-card-heading"><h3>${esc(p.name)}</h3>${icon("arrow")}</span><span class="atelier-project-progress"><span>Concluído</span><strong>${p.progress}%</strong></span><span class="mini-progress"><span style="width:${p.progress}%"></span></span><span class="card-bottom"><span>${icon("calendar")} ${dateLabel(p.date)}</span>${avatars(p.team)}</span></span></button>`;
}
function projects() {
  let items = state.projects.filter((p) =>
    (p.name + " " + p.client)
      .toLowerCase()
      .includes(projectQuery.toLowerCase()),
  );
  return (
    header(
      "Sua próxima grande entrega.",
      "Todas as produções. Cada uma no seu tempo.",
      btn("Novo projeto", "new-project"),
    ) +
    `<div class="toolbar"><div class="toolbar-left"><label class="input-search">${icon("search")}<input id="project-search" aria-label="Buscar projetos" placeholder="Buscar projeto ou cliente…" value="${esc(projectQuery)}"></label></div><div class="segmented"><button data-view="gallery" class="${view === "gallery" ? "active" : ""}">${icon("image")} Galeria</button><button data-view="board" class="${view === "board" ? "active" : ""}">${icon("grid")} Quadro</button><button data-view="list" class="${view === "list" ? "active" : ""}">${icon("tasks")} Lista</button></div></div><div id="project-results">${projectResults(items)}</div>`
  );
}
function projectResults(items) {
  if (view === "gallery") return `<div class="pulse-gallery">${items.map(projectCard).join('') || empty('Nenhuma produção encontrada. Tente outro nome ou crie um projeto.')}</div>`;
  return view === "list"
    ? `<div class="panel">${projectTable(items)}</div>`
    : `<div class="kanban">${stages
        .map(
          (s, i) =>
            `<section class="kanban-column" data-stage-drop="${i}"><h2 class="column-head"><i class="stage-dot" style="--stage-color:${stageColors[i]}"></i>${s}<span>${items.filter((p) => p.stage === i).length}</span></h2>${items
              .filter((p) => p.stage === i)
              .map(projectCard)
              .join(
                "",
              )}${!items.filter((p) => p.stage === i).length ? '<p class="panel-sub">Nenhum projeto nesta etapa.</p>' : ""}</section>`,
        )
        .join("")}</div>`;
}
function clientLogo(name) {
  const logo=safeLocalImage(state.clients.find(c=>c.name===name)?.logo);
  if(logo)return `<div class="contact-logo client-logo has-image"><img src="${logo}" alt="Logo de ${esc(name)}" width="64" height="64" loading="lazy"></div>`;
  const clean = String(name || "").trim();
  const initials = clean
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "•";
  const hue = [...clean].reduce((total, char) => (total * 31 + char.charCodeAt(0)) % 360, 0);
  return `<div class="contact-logo client-logo" style="--logo-hue:${hue}" aria-hidden="true"><span>${esc(initials)}</span><i></i></div>`;
}
function clientCards() {
  let list = state.clients.filter((c) =>
    (c.name + " " + c.segment)
      .toLowerCase()
      .includes(clientQuery.toLowerCase()),
  );
  list.sort((a, b) =>
    clientSort === "name"
      ? a.name.localeCompare(b.name)
      : state.projects
          .filter((p) => p.client === b.name)
          .reduce((n, p) => n + p.value, 0) -
        state.projects
          .filter((p) => p.client === a.name)
          .reduce((n, p) => n + p.value, 0),
  );
  return `<div class="grid-three">${list
    .map((c) => {
      let p = state.projects.filter((p) => p.client === c.name);
      return `<article class="panel contact-card">${clientLogo(c.name)}<h3>${esc(c.name)}</h3><p>${esc(c.segment)}</p><div class="contact-meta"><span>${p.length} projetos</span><strong>${money(p.reduce((a, b) => a + b.value, 0))}</strong></div><div style="margin-top:18px">${btn("Ver cliente", "client:" + c.id, "arrow", "text")}</div></article>`;
    })
    .join("")}</div>${!list.length ? empty("Nenhum cliente encontrado.") : ""}`;
}
function clients() {
  return (
    header(
      "Conexões",
      "Clientes, contatos e as histórias que vocês criam juntos.",
      btn("Novo cliente", "new-client"),
    ) +
    `<div class="toolbar"><label class="input-search">${icon("search")}<input id="client-search" aria-label="Buscar clientes" placeholder="Buscar cliente…" value="${esc(clientQuery)}"></label><select class="btn" id="client-sort" aria-label="Ordenar clientes"><option value="name" ${clientSort === "name" ? "selected" : ""}>Ordem alfabética</option><option value="revenue" ${clientSort === "revenue" ? "selected" : ""}>Maior valor em projetos</option></select></div><div id="client-results">${clientCards()}</div>`
  );
}
function tabs(items, selected, attr) {
  return `<div class="tabs">${items.map(([key, title]) => `<button class="tab ${selected === key ? "active" : ""}" data-${attr}="${key}">${title}</button>`).join("")}</div>`;
}
function finance() {
  const selected = financePeriod,
    summary = financialSummary(state, selected);
  const undated =
    state.income.filter((i) => received(i) > 0 && !i.paidDate).length +
    state.costs.filter((c) => c.paid && !c.date).length;
  let html =
    header(
      "Caixa do estúdio",
      "Recebimentos, despesas e caixa por data de pagamento.",
      btn("Nova receita", "new-income") +
        btn("Novo custo", "new-cost", "plus", ""),
    ) +
    tabs(
      [
        ["overview", "Visão geral"],
        ["income", "Receitas"],
        ["costs", "Custos & despesas"],
        ["cash", "Fluxo de caixa"],
      ],
      financeView,
      "finance-view",
    ) +
    `<div class="finance-filters"><label class="field">Período<input id="finance-period" type="month" value="${esc(selected)}"></label><span class="form-hint">Em branco: todos os períodos.</span></div>` +
    (undated
      ? `<div class="notice">${undated} lançamento(s) recebido(s)/pago(s) sem data. Edite as datas para incluí-los no caixa e nos gráficos.</div>`
      : "") +
    `<div class="stats">${stat("Recebido", money(summary.revenue), "Pela data de recebimento", "wallet", summary.revenue>0?'value-positive':'')}${stat("Despesas pagas", money(summary.costs), "Pela data de pagamento", "chart", summary.costs>0?'value-negative':'')}${stat("Resultado de caixa", money(summary.profit), "Recebimentos − despesas pagas", "trend", summary.profit>0?'value-positive':summary.profit<0?'value-negative':'')}${stat("A receber", money(summary.receivable), "Pendências de todos os períodos", "clock", summary.receivable>0?'value-pending':'')}</div>`;
  if (financeView === "income" || financeView === "costs") {
    const isCost = financeView === "costs";
    const rows = (isCost ? state.costs : state.income).filter(
      (i) => !selected || !i.date || i.date.startsWith(selected),
    );
    return (
      html +
      panel(
        isCost ? "Despesas" : "Receitas",
        "Lista por vencimento / data do lançamento.",
        simpleTable(
          ["DESCRIÇÃO", "PROJETO", "VALOR", "DATA", "STATUS", ""],
          rows.map((i) => [
            esc(i.name),
            esc(
              state.projects.find((p) => p.id === i.projectId)?.name ||
                i.client ||
                "—",
            ),
            money(i.value),
            i.date ? dateLabel(i.date) : badge("Sem data", "amber"),
            badge(
              isCost ? (i.paid ? "Pago" : "Pendente") : i.status,
              (isCost ? i.paid : i.status === "Pago") ? "green" : "amber",
            ),
            canEdit()
              ? btn(
                  "Editar",
                  (isCost ? "edit-cost:" : "edit-income:") + i.id,
                  "file",
                  "small",
                )
              : "",
          ]),
        ) + (rows.length ? "" : empty("Nenhum lançamento neste período.")),
      )
    );
  }
  const year = Number(selected.slice(0, 4)) || today.getFullYear(),
    series = monthlySeries(state, year);
  let balance =
    state.openingBalance +
    state.income
      .filter((i) => i.paidDate && i.paidDate < `${year}-01-01`)
      .reduce((n, i) => n + received(i), 0) -
    state.costs
      .filter((c) => c.paid && c.date && c.date < `${year}-01-01`)
      .reduce((n, c) => n + c.value, 0);
  const chart = renderFinanceChart(series, {
    year,
    currency: state.currency,
    opening: balance,
    selectedMonth: selected
      ? Number(selected.slice(5, 7)) - 1
      : today.getMonth(),
  });
  const cashRows = series.map((row, i) => {
    balance += row.profit;
    return [
      new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(
        new Date(year, i, 1),
      ),
      money(row.revenue),
      money(row.costs),
      money(row.profit),
      money(balance),
    ];
  });
  return (
    html +
    chart +
    (financeView==='overview'?renderDistribution(state,{period:selected,metric:distributionMetric,group:distributionGroup,esc,money}):'') +
    (financeView === "cash"
      ? `<div class="history-table">${panel("Fluxo de caixa", "Saldo de abertura anterior ao primeiro lançamento: " + money(state.openingBalance), simpleTable(["MÊS", "ENTRADAS", "SAÍDAS", "RESULTADO", "ACUMULADO"], cashRows), canEdit() ? btn("Editar abertura", "opening-balance", "wallet", "small") : "")}</div>`
      : "")
  );
}
function simpleTable(headers, rows) {
  return `<div class="table-wrap"><table class="data-table"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function taskRows(tasks) {
  return tasks
    .map(
      (t) =>
        `<div class="task-row ${t.done ? "done" : ""}"><label><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""}><span>${esc(t.name)}<small>${esc(t.project)}</small></span></label>${taskDateBadge(t,today,esc)}${t.assignee ? avatars([t.assignee]) : '<span class="muted">A definir</span>'}${canEdit() ? btn("Editar", "edit-task:" + t.id, "file", "small") : ""}</div>`,
    )
    .join("");
}
function tasks() {
  return (
    header(
      "Tarefas",
      "Menos pendências. Mais espaço para criar.",
      btn("Nova tarefa", "new-task"),
    ) +
    tabs(
      [
        ["list", "Minhas tarefas"],
        ["planner", "Planner semanal"],
        ["done", "Concluídas"],
      ],
      taskView,
      "task-view",
    ) +
    (taskView === "planner"
      ? renderWeeklyPlanner(state.tasks,{today,offset:plannerWeekOffset,esc,icon,canEdit:canEdit()})
      : `<div class="panel">${taskRows(state.tasks.filter((t) => (taskView === "done" ? t.done : !t.done))) || empty("Nenhuma tarefa por aqui.")}</div>`)
  );
}
function calendar() {
  if (location.hash === '#calendar/google') return googleIntegrations.calendarPage();
  let y = calendarDate.getFullYear(),
    m = calendarDate.getMonth(),
    offset = new Date(y, m, 1).getDay(),
    days = new Date(y, m + 1, 0).getDate();
  return (
    header(
      "Agenda",
      "Captações, reuniões e entregas. Tudo no seu tempo.",
      btn("Novo compromisso", "new-event"),
    ) +
    googleIntegrations.calendarTabs() +
    `<div class="toolbar"><div class="calendar-nav"><button class="icon-button" data-action="prev-month" aria-label="Mês anterior" style="transform:rotate(180deg)">${icon("chevron")}</button><strong>${new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarDate)}</strong><button class="icon-button" data-action="next-month" aria-label="Próximo mês">${icon("chevron")}</button>${btn("Hoje", "today", "calendar", "small")}</div><span class="muted" style="font-size:11px">${state.events.filter((e) => e.date.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`)).length} compromissos neste mês</span></div><section class="panel calendar-scroller"><div class="calendar-weekdays">${["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((s) => `<span>${s}</span>`).join("")}</div><div class="calendar">${Array.from(
      { length: Math.ceil((offset + days) / 7) * 7 },
      (_, i) => {
        let d = i - offset + 1;
        if (d < 1 || d > days) return '<div class="calendar-day empty"></div>';
        let s = isoDate(new Date(y, m, d));
        return `<div class="calendar-day ${s === isoDate(today) ? "today" : ""}"><span class="day-number">${d}</span>${state.events
          .filter((e) => e.date === s)
          .map(
            (e) =>
              `<button class="calendar-event event-tone-${eventTone(e)}" data-action="event:${e.id}" aria-label="${esc(e.type)}: ${esc(e.name)}, ${esc(e.time)}"><i aria-hidden="true"></i><span><strong>${esc(e.time)}</strong> ${esc(e.name)}<small>${esc(e.type)}</small></span></button>`,
          )
          .join("")}</div>`;
      },
    ).join("")}</div></section>`
  );
}
function commercial() {
  let html =
    header(
      "Negócios",
      "Transforme conversas em novos projetos.",
      btn("Nova oportunidade", "new-lead"),
    ) +
    tabs(
      [
        ["pipeline", "Funil de oportunidades"],
        ["list", "Leads"],
        ["proposals", "Propostas"],
      ],
      commercialView,
      "commercial-view",
    );
  if (commercialView === "proposals") return html + proposalsModule.list();
  html += `<div class="stats">${stat("Valor em negociação", money(state.leads.filter((l) => l.stage < 3).reduce((n, l) => n + l.value, 0)), "Oportunidades ainda abertas", "wallet")}${stat("Oportunidades", state.leads.length, "No funil comercial", "trend")}${stat("Propostas enviadas", state.leads.filter((l) => l.stage === 2).length, "Aguardando retorno", "file")}${stat("Ticket médio", money(state.leads.reduce((n, l) => n + l.value, 0) / Math.max(state.leads.length, 1)), "Por oportunidade", "chart")}</div>`;
  return (
    html +
    (commercialView === "list"
      ? `<div class="panel">${simpleTable(
          ["OPORTUNIDADE", "CLIENTE", "VALOR", "ETAPA"],
          state.leads.map((l) => [
            `<button class="project-name" data-action="lead:${l.id}">${esc(l.name)}</button>`,
            esc(l.client),
            money(l.value),
            badge(
              [
                "Primeiro contato",
                "Em conversa",
                "Proposta enviada",
                "Fechado",
              ][l.stage],
            ),
          ]),
        )}</div>`
      : `<div class="kanban">${[
          "Primeiro contato",
          "Em conversa",
          "Proposta enviada",
          "Fechado",
        ]
          .map(
            (s, i) =>
              `<section class="kanban-column"><h2 class="column-head"><i class="stage-dot" style="--stage-color:${stageColors[i]}"></i>${s}<span>${state.leads.filter((l) => l.stage === i).length}</span></h2>${state.leads
                .filter((l) => l.stage === i)
                .map(
                  (l) =>
                    `<button class="project-card" data-action="lead:${l.id}"><div class="card-top">${badge(l.client, colors[i])}${icon("more")}</div><h3>${esc(l.name)}</h3><div class="card-bottom"><strong style="font-size:14px">${money(l.value)}</strong>${icon("arrow")}</div></button>`,
                )
                .join("")}</section>`,
          )
          .join("")}</div>`)
  );
}
function goals() {
  const annual = financialSummary(state, String(today.getFullYear()));
  return (
    header(
      "Metas",
      "Acompanhe os resultados do seu estúdio.",
      btn("Editar meta", "goal", "target"),
    ) +
    `<div class="goals-workspace">${goalCard()}<section class="panel goal-summary-panel annual-goal-panel"><header><div><span class="goal-period">${today.getFullYear()} · Visão de longo prazo</span><h2>Meta anual</h2></div>${btn('Editar','annual-goal','target','small')}</header><div class="annual-goal-target"><span>Seu objetivo para o ano</span><strong class="big-amount">${money(state.annualGoal)}</strong></div><div class="annual-goal-progress"><div><span>Progresso no ano</span><strong>${state.annualGoal>0?Math.round(annual.revenue/state.annualGoal*100)+'%':'—'}</strong></div><div class="mini-progress"><span style="width:${state.annualGoal>0?Math.min(100,annual.revenue/state.annualGoal*100):0}%"></span></div></div><div class="goal-details"><div><small>Recebido no ano</small><strong class="value-positive">${money(annual.revenue)}</strong></div><div><small>Falta alcançar</small><strong>${money(Math.max(0,state.annualGoal-annual.revenue))}</strong></div></div><footer>Objetivo independente da meta mensal. Valores por data de recebimento.</footer></section></div>`
  );
}

const toolCard = (id, title, description, ic, note) =>
  `<button class="tool-card tool-${id}" data-tool="${id}"><span class="tool-icon">${icon(ic)}</span><span class="tool-arrow">${icon("arrow")}</span><h3>${title}</h3><p>${description}</p><span class="tool-note">${note}</span></button>`;
function toolsPage() {
  return (
    header(
      "Bancada criativa",
      "Do planejamento ao set. Um lugar para organizar suas ideias.",
      "",
    ) +
    `<div class="studio-tool-launcher"><button class="tool-card tool-proposal tool-featured" data-tool="proposal"><span class="tool-icon">${icon("file")}</span><span class="tool-arrow">${icon("arrow")}</span><span class="tool-featured-label">PROPOSTAS COM SUA IDENTIDADE</span><h2>Venda a ideia.<br>Mostre a visão.</h2><p>Transforme escopo, imagens e portfólio em uma apresentação que dá vontade de abrir.</p><span class="tool-featured-cta">Criar proposta ${icon("arrow")}</span><span class="tool-sheet-art" aria-hidden="true"><i></i><i></i><i></i></span></button>${toolCard("calculator", "Encontre o preço certo", "Custos, impostos e margem. O orçamento sem adivinhação.", "chart", "Calculadora de orçamento")}${toolCard("script", "Uma boa história começa aqui", "Cenas, narração e direção. Espaço para organizar seu roteiro.", "film", "Roteiros")}${toolCard("moodboard", "Dê forma à sua referência", "Reúna imagens, encontre a atmosfera e alinhe a direção visual.", "image", "Moodboard")}${toolCard("storyboard", "Pense em cada enquadramento", "Planeje o filme cena a cena, antes de ligar a câmera.", "grid", "Storyboard")}${toolCard("callsheet", "Todo mundo na mesma página", "Horários, locação e equipe. O plano de gravação pronto para o set.", "calendar", "Ordem do dia")}</div><div class="studio-tools-note">${icon("check")}Ferramentas manuais, arquivos seus. Sem créditos e sem APIs pagas.</div>`
  );
}
function settings() {
  const disabled = !canEdit() ? "disabled" : "";
  const accentPresets = [
    ["Grafite", "#6d6e73"],
    ["Citrino", "#d7ee78"],
    ["Céu", "#9bc9ff"],
    ["Lilás", "#cbb8ff"],
    ["Menta", "#9fe7c2"],
    ["Pêssego", "#ffd39a"],
  ];
  const presetMarkup = `<div class="accent-presets"><span class="accent-presets-label">Escolha uma cor pronta</span>${accentPresets.map(([name, value]) => `<button type="button" class="accent-preset" style="--preset:${value}" data-action="accent-preset:${value}" aria-label="Usar cor ${name}" aria-pressed="${(state.accent || "").toLowerCase() === value.toLowerCase() ? "true" : "false"}" title="${name}" ${disabled}></button>`).join("")}</div>`;
  return (
    header(
      "Configurações",
      "Identidade, preferências e segurança do estúdio.",
    ) +
    `<section class="panel">
    <div class="settings-section"><h2>Seu estúdio</h2><p>Nome compartilhado entre os membros.</p><form id="workspace-form" class="settings-row"><label class="field">Nome do estúdio<input name="workspace" value="${esc(state.workspace)}" maxlength="80" required ${!isOwner() ? "disabled" : ""}></label>${isOwner() ? '<button class="btn primary" type="submit">Salvar nome</button>' : ""}</form></div>
    <div class="settings-section"><h2>Aparência</h2><p>Sua cor acompanha botões, navegação e indicadores. As preferências são compartilhadas com o estúdio.</p><form id="appearance-form"><div class="settings-row"><div class="segmented"><button type="button" data-action="theme-dark" class="${state.theme === "dark" ? "active" : ""}" ${disabled}>Escuro</button><button type="button" data-action="theme-light" class="${state.theme === "light" ? "active" : ""}" ${disabled}>Claro</button></div><label class="field color-control">Cor do estúdio<input type="color" name="accent" value="${state.accent}" ${disabled}></label>${selectField("Moeda de exibição", "currency", ["BRL", "USD", "EUR"], state.currency)}${canEdit() ? '<button class="btn primary" type="submit">Salvar preferências</button>' : ""}</div>${presetMarkup}<p class="form-hint">A moeda altera a exibição; não converte os valores existentes. Cada proposta pode ter sua própria moeda.</p></form></div>
    ${googleIntegrations.settingsEntry()}
    <div class="settings-section"><h2>Seu painel</h2><p>Escolha quais informações aparecem na visão geral.</p>${btn("Personalizar visão geral", "dashboard-customize", "grid", "")}</div>
    <div class="settings-section"><h2>Backup e restauração</h2><p>${appMode === "online" ? "Os registros são salvos no estúdio online. Exporte uma cópia periódica." : "Os dados desta demonstração são salvos neste navegador. Exporte uma cópia antes de limpar os dados do site."}</p><p class="storage-caption">${(new TextEncoder().encode(JSON.stringify(state)).length / 1024).toFixed(0)} KB de 1.024 KB utilizados</p><div class="settings-row">${btn("Exportar backup", "export", "download", "")}${isOwner() ? btn("Importar backup", "import", "file", "") : ""}${appMode === "demo" ? btn("Restaurar demonstração", "reset", "grid", "") : ""}</div></div>
    <div class="settings-section"><h2>Acessos da equipe</h2><p>Administradores gerenciam convites e backups. Editores alteram o trabalho. Leitores apenas consultam.</p><div class="settings-row">${btn("Gerenciar acessos", "access", "users", "")}${btn("Minha conta", "account", "settings", "")}</div></div>
    <div class="settings-section"><h2>Sem serviços pagos integrados</h2><p>As ferramentas não usam IA, créditos ou APIs pagas. Vídeos e arquivos grandes ficam no armazenamento que você escolher. Publicação, login online e aprovação pública dependem da configuração dos serviços externos.</p></div></section>`
  );
}
function render() {
  if (appMode === "locked") return;
  disposeChart();
  disposePolishMotion();
  disposeSurface();
  disposeDistribution();
  const renderers = {
    dashboard,
    projects,
    clients,
    finance,
    commercial,
    goals,
    tasks,
    team: operationsModule.team,
    equipment: operationsModule.equipment,
    tools: toolsPage,
    calendar,
    settings,
    integrations: googleIntegrations.page,
  };
  const parts = location.hash.slice(1).split("/");
  const projectRoute = parts[0] === "project";
  route = projectRoute ? "projects" : parts[0] || "dashboard";
  if (!renderers[route]) route = "dashboard";
  const content = document.getElementById("content");
  content.innerHTML = projectRoute
    ? operationsModule.projectPage(parts[1], parts[2] || "overview")
    : renderers[route]();
  document.getElementById("crumb").textContent =
    navItems.find((n) => n[0] === route)?.[1] || "Configurações";
  renderNav();
  if (projectRoute) {
    document.body.dataset.page = "project-detail";
    document.getElementById("crumb").textContent = "Projetos / Detalhes";
  }
  renderIcons();
  document.title = `${navItems.find((n) => n[0] === route)?.[1] || "Configurações"} — Project Lab`;
  bindForms();
  googleIntegrations.bind(content);
  if (route === 'integrations') { document.getElementById('crumb').textContent = 'Suas integrações'; document.title = 'Integrações — Project Lab'; }
  disposeDistribution = bindDistribution(content);
  content.querySelectorAll('[data-week-step]').forEach(button=>button.onclick=()=>{plannerWeekOffset=button.dataset.weekStep==='today'?0:plannerWeekOffset+Number(button.dataset.weekStep);render();content.querySelector(`[data-week-step="${button.dataset.weekStep}"]`)?.focus({preventScroll:true})});
  for(const id of ['distribution-metric','distribution-group']) {
    const control=content.querySelector('#'+id);
    if(control)control.onchange=()=>{if(id==='distribution-metric')distributionMetric=control.value;else distributionGroup=control.value;render();content.querySelector('#'+id)?.focus({preventScroll:true})};
  }
  if (route === "dashboard") applyDashboardPreferences();
  const motionView = `${location.hash}:${financeView}:${financePeriod}:${taskView}:${commercialView}`;
  const enabled =
    motionView !== lastMotionView &&
    document.body.dataset.inputModality !== "keyboard";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.dataset.effects === 'off';
  disposePolishMotion = bindPulseMotion(content,{animate:enabled&&!reduced});
  disposeChart = bindFinanceChart(content, {
    animate: enabled,
    reducedMotion: reduced,
  });
  disposeSurface = animateSurface(content, { enabled, reduced, numberMode:route==='dashboard'&&!dashboardVisited?'count':'reveal' });
  if(route==='dashboard')dashboardVisited=true;
  lastMotionView = motionView;
  if (!canEdit())
    document
      .querySelectorAll(
        '#content [data-action^="new-"],#content [data-action="goal"],#content input[type="checkbox"]',
      )
      .forEach((el) => (el.disabled = true));
}
const modal = document.getElementById("modal");
function openModal(title, html, wide = false) {
  lastTrigger = document.activeElement;
  document.getElementById("modal-title").textContent = title;
  document.getElementById("modal-content").innerHTML = html;
  modal.classList.toggle("wide", wide);
  if (!modal.open) modal.showModal();
  renderIcons(modal);
  if (document.body.dataset.effects === 'on' && document.body.dataset.inputModality !== 'keyboard' && title !== 'Buscar no estúdio' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    modal.animate([{opacity:.7,transform:'translateY(6px) scale(.99)',filter:'blur(2px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0)'}],{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
  }
}
function closeModal() {
  if (saving) return;
  if (
    hasUnsavedEditor() &&
    !window.confirm("Você tem alterações não salvas. Descartar e fechar?")
  )
    return false;
  modal.close();
  // Disconnect closed editors so an unfinished image read cannot reopen them.
  document.getElementById("modal-content").replaceChildren();
  if (lastTrigger?.isConnected) lastTrigger.focus();
  return true;
}
function hasUnsavedEditor() {
  return modal.open && (proposalsModule.isDirty() || creativeModule.isDirty());
}
const field = (
  label,
  name,
  value = "",
  type = "text",
  full = false,
  extra = "",
) =>
  `<label class="field ${full ? "full" : ""}">${label}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const selectField = (label, name, options, value = "", full = false) =>
  `<label class="field ${full ? "full" : ""}">${label}<select name="${name}">${options
    .map((o, i) => {
      let val = Array.isArray(o) ? o[0] : o,
        txt = Array.isArray(o) ? o[1] : o;
      return `<option value="${esc(val)}" ${String(val) === String(value) ? "selected" : ""}>${esc(txt)}</option>`;
    })
    .join("")}</select></label>`;
const textarea = (label, name, value = "") =>
  `<label class="field full">${label}<textarea name="${name}">${esc(value)}</textarea></label>`;
function form(title, fields, onSubmit, button = "Salvar", afterSave) {
  if (!canEdit())
    return toast("Seu acesso permite apenas consultar este estúdio.");
  openModal(
    title,
    `<form id="entry-form"><div class="form-grid">${fields}</div><p class="form-hint">${appMode === "online" ? "As alterações são compartilhadas com os membros deste estúdio." : "Demonstração: as alterações ficam neste navegador."}</p><div class="form-actions"><button type="button" class="btn" data-action="close">Cancelar</button><button type="submit" class="btn primary">${button}</button></div></form>`,
  );
  document.getElementById("entry-form").onsubmit = async (e) => {
    e.preventDefault();
    const showError = message => {
      let error = e.target.querySelector('[data-form-error]');
      if (!error) {
        error = document.createElement('p');
        error.dataset.formError = '';
        error.setAttribute('role', 'alert');
        error.tabIndex = -1;
        error.style.cssText = 'color:var(--danger,#ff8994);padding:12px 0;';
        e.target.querySelector('.form-actions').before(error);
      }
      error.textContent = message;
      error.focus();
    };
    if(Number(e.target.dataset.mediaPending)>0)return toast('Aguarde a imagem ficar pronta antes de salvar.');
    if (saving || saveConflict)
      return toast("Carregue a versão atual antes de continuar.");
    let data = Object.fromEntries(new FormData(e.target));
    for (const k in data)
      if (typeof data[k] === "string") data[k] = data[k].trim();
    if (
      [...e.target.querySelectorAll("[required]")].some(
        (input) => !String(input.value).trim(),
      )
    ) {
      toast("Preencha os campos obrigatórios.");
      return;
    }
    try {
      onSubmit(data);
    } catch (error) {
      state = structuredClone(acknowledged);
      showError(friendlyError(error));
      toast(friendlyError(error));
      return;
    }
    const saved = await save();
    if (!saved) {
      showError('Não foi possível salvar. Confira sua conexão. Se houver conflito, feche este formulário e carregue a versão atual no aviso do estúdio.');
      return;
    }
    closeModal();
    render();
    toast(
      appMode === "online" ? "Salvo no estúdio." : "Salvo na demonstração.",
    );
    if (afterSave) afterSave(data);
  };
  bindMediaFields(document.getElementById('entry-form'));
  bindEventColors(document.getElementById('entry-form'));
}
function newProject(id) {
  const p = state.projects.find((item) => item.id === id);
  const checks = (label, name, items, selected) =>
    `<div class="field full"><span>${label}</span><div class="resource-checks">${items.map((item) => `<label><input type="checkbox" name="${name}" value="${esc(item.value)}" ${selected.includes(item.value) ? "checked" : ""}>${esc(item.label)}</label>`).join("") || '<span class="muted">Nenhum recurso cadastrado.</span>'}</div></div>`;
  form(
    p ? "Editar projeto" : "Novo projeto",
    '<h3 class="form-section">1 · Informações</h3>' +
      field(
        "Nome do projeto *",
        "name",
        p?.name || "",
        "text",
        true,
        'required maxlength="100"',
      ) +
      selectField(
        "Cliente",
        "clientId",
        [["", "Sem cliente"], ...state.clients.map((c) => [c.id, c.name])],
        p?.clientId ||
          state.clients.find((c) => c.name === p?.client)?.id ||
          "",
      ) +
      selectField(
        "Etapa",
        "stage",
        stages.map((name, i) => [i, name]),
        p?.stage || 0,
      ) +
      field("Entrega", "date", p?.date || "", "date") +
      selectField(
        "Tipo de produção",
        "type",
        ["Institucional", "Campanha", "Evento", "Social", "Documentário", "Videoclipe", "Comercial de TV", "Casamento", "Reels / Instagram", "Conteúdo para YouTube", "Podcast / Videocast", "Transmissão ao vivo", "Curta-metragem", "Longa-metragem", "Vídeo de produto", "Vídeo imobiliário", "Curso / Videoaula", "Edição / Pós-produção", "Motion design / Animação", "VFX / Efeitos visuais", "Fotografia", "Outros"],
        p?.type || "Institucional",
      ) +
      textarea(
        "Datas de captação (uma por linha, DD/MM/AAAA ou AAAA-MM-DD)",
        "captureDates",
        p?.captureDates?.join("\n") || "",
      ) +
      textarea("Briefing e entregáveis", "note", p?.note || "") +
      '<h3 class="form-section">2 · Financeiro</h3>' +
      field(
        "Valor contratado (R$)",
        "value",
        p?.value || 0,
        "number",
        true,
        'min="0" max="10000000000" step="0.01"',
      ) +
      (!p
        ? selectField(
            "Como deseja registrar este projeto?",
            "createIncome",
            [
              ["no", "Só criar o projeto"],
              ["yes", "Também registrar o valor a receber"],
            ],
            "no",
            true,
          ) + field("Quando o cliente deve pagar?", "incomeDate", "", "date", true, 'aria-describedby="project-income-help"') + '<p id="project-income-help" class="form-hint full" aria-live="polite"></p>'
        : '<p class="form-hint full">Alterar o valor contratado não modifica receitas já lançadas. Edite cada receita no financeiro.</p>') +
      '<h3 class="form-section">3 · Recursos</h3>' +
      checks(
        "Equipe",
        "projectTeam",
        state.team.map((m) => ({ value: m.initials, label: m.name })),
        p?.team || [],
      ) +
      checks(
        "Equipamentos",
        "projectEquipment",
        state.equipment.map((q) => ({ value: q.id, label: q.name + (q.ownership === 'rented' ? ' · Alugado · ' + money(q.rentalRate) + '/dia' : '') })),
        p?.equipmentIds || [],
      ) + field('Diárias de aluguel para os itens selecionados', 'rentalDays', p?.rentalDays || 1, 'number', true, 'min="1" max="10000" step="1" required') + '<p class="form-hint full">Itens alugados criam custos pendentes automaticamente: diária × quantidade de dias. Não contam como pagos. Custos já lançados não são recalculados ou excluídos ao editar o projeto; ajuste cada lançamento no Financeiro para evitar duplicidade.</p>',
    (d) => {
      if (!p && d.createIncome === 'yes' && (!d.incomeDate || !(Number(d.value) > 0)))
        throw new Error('Para registrar o valor a receber, informe um valor contratado maior que zero e a data prevista de pagamento.');
      const client = state.clients.find((c) => c.id === d.clientId);
      const dates = parseCaptureDates(d.captureDates);
      const project = {
        id: p?.id || crypto.randomUUID(),
        name: d.name,
        client: client?.name || "",
        clientId: client?.id || "",
        stage: Number(d.stage),
        date: d.date,
        type: d.type,
        note: d.note,
        value: Number(d.value),
        progress: [15, 40, 75, 100][Number(d.stage)],
        color: p?.color || "",
        captureDates: [...new Set(dates)],
        rentalDays: Number(d.rentalDays),
        team: [
          ...document.querySelectorAll('[name="projectTeam"]:checked'),
        ].map((e) => e.value),
        equipmentIds: [
          ...document.querySelectorAll('[name="projectEquipment"]:checked'),
        ].map((e) => e.value),
      };
      if (p)
        state.projects[state.projects.findIndex((item) => item.id === p.id)] =
          project;
      else state.projects.unshift(project);
      addRentalCosts(state, project);
      // Preserve chosen colors when dates of generated events are edited.
      const previousEvents=state.events.filter(e=>e.projectId===project.id&&e.id.startsWith('auto-'));
      state.events = state.events.filter(
        (event) =>
          !(event.projectId === project.id && event.id.startsWith("auto-")),
      );
      for (const [index, date] of project.captureDates.entries())
        state.events.push({
          id: `auto-${project.id}-capture-${index}`,
          name: "Captação · " + project.name,
          client: project.client,
          projectId: project.id,
          type: "Captação",
          color: previousEvents.find(e=>e.type==='Captação'&&e.date===date)?.color || previousEvents.find(e=>e.id===`auto-${project.id}-capture-${index}`)?.color || 'auto',
          date,
          time: "08:00",
        });
      if (project.date)
        state.events.push({
          id: `auto-${project.id}-delivery`,
          name: "Entrega · " + project.name,
          client: project.client,
          projectId: project.id,
          type: "Entrega",
          color: previousEvents.find(e=>e.type==='Entrega')?.color || 'auto',
          date: project.date,
          time: "18:00",
        });
      if (!p && d.createIncome === "yes" && project.value > 0)
        state.income.push({
          id: crypto.randomUUID(),
          name: project.name,
          client: project.client,
          projectId: project.id,
          value: project.value,
          status: "Pendente",
          paid: 0,
          date: d.incomeDate,
          paidDate: "",
        });
    },
    p ? "Salvar alterações" : "Criar projeto",
  );
  modal.classList.add("wide");
  if (!p) {
    const choice = modal.querySelector('[name="createIncome"]');
    const date = modal.querySelector('[name="incomeDate"]');
    const help = modal.querySelector('#project-income-help');
    if (choice && date && help) {
      const updateIncomeFields = () => {
        const enabled = choice.value === 'yes';
        date.closest('label').style.display = enabled ? '' : 'none';
        date.disabled = !enabled;
        date.required = enabled;
        help.textContent = enabled
          ? 'É a previsão de pagamento do cliente, não a entrega do projeto. O valor contratado ficará em Caixa → Receitas como pendente. Isso não envia cobrança nem marca o valor como recebido.'
          : 'O projeto será criado sem lançamento no financeiro. Você pode adicionar o valor a receber depois, em Caixa → Nova receita.';
      };
      choice.addEventListener('change', updateIncomeFields);
      updateIncomeFields();
    }
  }
}
function projectDetail(id) {
  operationsModule.projectDetail(id);
}
function openTool(id) {
  if (id === "proposal") {
    proposalsModule.open();
    return;
  }
  if (creativeModule.open(id)) return;
  if (id !== "calculator") return;
  openBudgetCalculator({ openModal, money, currency: state.currency || "BRL", icon, toast });
}

function download(name, content, type = "application/json") {
  let url = URL.createObjectURL(new Blob([content], { type }));
  let a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("Arquivo preparado para download.");
}
function showSearch() {
  openModal(
    "Buscar no estúdio",
    `<label class="field">Projetos, clientes e módulos<input class="editor-input" id="global-search" placeholder="Digite para buscar…" autocomplete="off"></label><div id="search-results" class="search-results"></div>`,
  );
  document.getElementById("global-search").oninput = (e) =>
    searchResults(e.target.value);
  searchResults("");
  document.getElementById("global-search").focus();
}
function searchResults(query) {
  const q = query.toLowerCase();
  const matches = [
    ...navItems.map(([id, name, ic]) => ({ name, type: "Módulo", to: id, ic })),
    ...state.projects.map((p) => ({
      name: p.name,
      type: p.client,
      id: p.id,
      ic: "film",
    })),
    ...state.clients.map((c) => ({
      name: c.name,
      type: "Cliente",
      client: c.id,
      ic: "users",
    })),
  ]
    .filter((i) => (i.name + " " + i.type).toLowerCase().includes(q))
    .slice(0, 12);
  document.getElementById("search-results").innerHTML = matches.length
    ? matches
        .map(
          (i) =>
            `<button class="search-result" ${i.to ? `data-route="${i.to}"` : i.id ? `data-project="${i.id}"` : `data-action="client:${i.client}"`}>${icon(i.ic)}<span>${esc(i.name)}<small>${esc(i.type)}</small></span></button>`,
        )
        .join("")
    : empty("Nenhum resultado para esta busca.");
}
function bindForms() {
  const appearance = document.getElementById("appearance-form");
  if (appearance) {
    if (!canEdit())
      appearance
        .querySelectorAll("input,select")
        .forEach((x) => (x.disabled = true));
    appearance.onsubmit = async (event) => {
      event.preventDefault();
      if (!canEdit()) return;
      const data = Object.fromEntries(new FormData(appearance));
      state.accent = data.accent;
      state.currency = data.currency;
      if (await save()) {
        render();
        toast("Preferências atualizadas.");
      }
    };
  }
  const period = document.getElementById("finance-period");
  if (period)
    period.onchange = (e) => {
      financePeriod = e.target.value;
      render();
    };
  const ps = document.getElementById("project-search");
  if (ps)
    ps.oninput = (e) => {
      projectQuery = e.target.value;
      document.getElementById("project-results").innerHTML = projectResults(
        state.projects.filter((p) =>
          (p.name + " " + p.client)
            .toLowerCase()
            .includes(projectQuery.toLowerCase()),
        ),
      );
    };
  const cs = document.getElementById("client-search");
  if (cs)
    cs.oninput = (e) => {
      clientQuery = e.target.value;
      document.getElementById("client-results").innerHTML = clientCards();
    };
  const sort = document.getElementById("client-sort");
  if (sort)
    sort.onchange = (e) => {
      clientSort = e.target.value;
      document.getElementById("client-results").innerHTML = clientCards();
    };
  const wf = document.getElementById("workspace-form");
  if (wf)
    wf.onsubmit = async (e) => {
      e.preventDefault();
      let v = e.target.workspace.value.trim();
      if (!v) return;
      if (!isOwner()) return;
      state.workspace = v;
      if (await save()) {
        renderNav();
        toast("Nome do estúdio atualizado.");
      }
    };
}
async function action(a) {
  if (a.startsWith('delete-production:') || a.startsWith('confirm-delete-production:')) {
    if (!canEdit() || saving || saveConflict) return;
    const id = a.split(':')[1];
    const project = state.projects.find(row => row.id === id);
    if (!project) return;
    if (a.startsWith('delete-production:')) return openModal('Excluir produção?', `<p>Excluir <strong>${esc(project.name)}</strong>?</p><p class="form-hint">O briefing, as entregas, os materiais, as horas e os compromissos automáticos desta produção serão removidos. Receitas, despesas, tarefas, compromissos manuais e histórico de utilização dos equipamentos serão preservados. Esta ação não pode ser desfeita.</p><div class="form-actions">${btn('Cancelar','close','x','')}${btn('Excluir produção','confirm-delete-production:'+id,'trash','danger')}</div>`);
    deleteProduction(state, id);
    if (await save()) { closeModal(); location.hash = 'projects'; render(); toast('Produção excluída. Histórico financeiro preservado.'); }
    return;
  }
  if (a.startsWith('delete-event:') || a.startsWith('confirm-delete-event:')) {
    if (!canEdit()) return;
    const id = a.split(':')[1];
    const event = state.events.find(item => item.id === id);
    if (!event || id.startsWith('auto-')) return;
    if (a.startsWith('delete-event:')) {
      return openModal('Excluir compromisso?', `<p>${esc(event.name)} será removido da agenda compartilhada do estúdio.</p><div class="form-actions">${btn('Cancelar','edit-event:'+id,'x','')}${btn('Excluir compromisso','confirm-delete-event:'+id,'trash','')}</div>`);
    }
    state.events = state.events.filter(item => item.id !== id);
    if (await save()) { closeModal(); render(); toast('Compromisso excluído.'); }
    return;
  }
  if (appMode === "locked" || saving) return;
  if (await googleIntegrations.handle(a)) return;
  if (await extendedAction(a)) return;
  if (
    (await proposalsModule.handle(a)) ||
    (await operationsModule.handle(a)) ||
    (await creativeModule.handle(a))
  )
    return;
  if (a === "lead-new" || a === "new-lead") {
    leadEditor();
    return;
  }
  if (a.startsWith("lead:")) return leadEditor(a.slice(5));
  if (a === "new-project") return newProject();
  if (a === "close") return closeModal();
  if (a === "search") return showSearch();
  if (a === "notifications") return notificationPanel.hidden ? showNotifications() : closeNotifications();
  if (a === "close-notifications") return closeNotifications();
  if (a.startsWith("notification-event:")) {
    closeNotifications({ focus: false });
    location.hash = "calendar";
    return;
  }
  if (a === "new-equipment")
    return operationsModule.handle("ops:new:equipment");
  if (a === "new-member") return operationsModule.handle("ops:new:member");
  if (a === "dashboard-customize") return customizeDashboard();
  if (a === "goal" || a === "annual-goal")
    return form(
      a === "goal" ? "Meta mensal" : "Meta anual",
      field(
        "Valor da meta",
        "value",
        a === "goal" ? state.goal : state.annualGoal,
        "number",
        true,
        'min="1" max="10000000000" step="0.01" required',
      ),
      (d) => (state[a === "goal" ? "goal" : "annualGoal"] = Number(d.value)),
    );
  if (a === "new-client" || a.startsWith("edit-client:"))
    return clientEditor(a.split(":")[1]);
  if (a === "new-event" || a.startsWith("edit-event:"))
    return eventEditor(a.split(":")[1]);
  if(a.startsWith('event-color:')) {
    const event=state.events.find(e=>e.id===a.slice(12));if(!event)return;
    return form('Cor do compromisso',eventColorField(event.color,event.type),data=>{event.color=data.color});
  }
  if (a.startsWith("client:")) {
    const c = state.clients.find((c) => c.id === a.slice(7));
    if (!c) return;
    return openModal(
      c.name,
      `<div class="client-detail-identity">${clientLogo(c.name)}<div><strong>${esc(c.name)}</strong><p>${esc(c.segment)}</p></div>${canEdit()?btn(c.logo?'Alterar imagem':'Adicionar imagem','edit-client:'+c.id,'image','small'):''}</div><div class="detail-grid"><div><small>Contato</small><strong>${esc(c.contact || "Não informado")}</strong></div><div><small>E-mail</small><strong>${esc(c.email || "Não informado")}</strong></div></div>${canEdit() ? `<div class="form-actions">${btn("Editar cliente", "edit-client:" + c.id, "settings", "")}</div>` : ""}<h3 class="ops-subtitle">Projetos do cliente</h3>${projectTable(state.projects.filter((p) => p.clientId === c.id || (!p.clientId && p.client === c.name)))}`,
      true,
    );
  }
  if (a.startsWith("event:")) {
    const e = state.events.find((e) => e.id === a.slice(6));
    if (!e) return;
    return openModal(
      e.name,
      `<span class="event-category event-tone-${eventTone(e)}"><i aria-hidden="true"></i>${esc(e.type)}</span><div class="detail-grid"><div><small>Data</small><strong>${dateLabel(e.date)}</strong></div><div><small>Horário</small><strong>${esc(e.time)}</strong></div><div><small>Cliente / projeto</small><strong>${esc(e.client || "Não informado")}</strong></div></div><div class="form-actions">${canEdit()?btn('Alterar cor','event-color:'+e.id,'settings',''):''}${e.id.startsWith("auto-") && e.projectId ? btn("Editar no projeto", "edit-project:" + e.projectId, "film", "") : canEdit() ? btn("Editar compromisso", "edit-event:" + e.id, "settings", "") : ""}</div>`,
    );
  }
  if (a === "prev-month" || a === "next-month") {
    calendarDate.setMonth(
      calendarDate.getMonth() + (a === "next-month" ? 1 : -1),
    );
    render();
    return;
  }
  if (a === "today") {
    calendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    render();
    return;
  }
  if (a === "theme-dark" || a === "theme-light") {
    state.theme = a.slice(6);
    await save();
    render();
    return;
  }
  if (a.startsWith("accent-preset:")) {
    if (!canEdit()) return toast("Seu acesso permite apenas consultar este estúdio.");
    const value = a.slice("accent-preset:".length);
    if (!/^#[0-9a-f]{6}$/i.test(value)) return;
    state.accent = value;
    if (await save()) {
      render();
      toast("Cor do estúdio atualizada.");
    }
    return;
  }
  if (a === "export")
    return download("project-lab-previa.json", JSON.stringify(state, null, 2));
  if (a === "reset") {
    openModal(
      "Restaurar demonstração",
      `<p class="muted">Isso substitui as alterações desta prévia pelos dados fictícios iniciais. Exporte uma cópia antes, se quiser guardar seus testes.</p><div class="form-actions">${btn("Cancelar", "close", "x", "")}${btn("Restaurar exemplos", "confirm-reset", "grid")}</div>`,
    );
    return;
  }
  if (a === "confirm-reset") {
    if (appMode !== "demo") return;
    state = demoState();
    if (!(await save())) return;
    closeModal();
    render();
    toast("Dados de demonstração restaurados.");
    return;
  }
  if (a === "print") window.print();
}
document.addEventListener("click", (e) => {
  if (appMode === "locked" || saving) return;
  if (!notificationPanel.hidden && !e.target.closest("#notification-panel,[data-action=notifications]")) closeNotifications({ focus: false });
  const target = e.target.closest(
    "[data-action],[data-project],[data-tool],[data-route],[data-view],[data-task-view],[data-finance-view],[data-team-view],[data-commercial-view]",
  );
  if (!target) return;
  const d = target.dataset;
  if (d.action)
    return action(d.action).catch((error) => toast(friendlyError(error)));
  if (d.project) return projectDetail(d.project);
  if (d.tool) return openTool(d.tool);
  if (d.route) {
    closeNotifications({ focus: false });
    closeModal();
    location.hash = d.route;
    return;
  }
  if (d.view) view = d.view;
  if (d.taskView) taskView = d.taskView;
  if (d.financeView) financeView = d.financeView;
  if (d.teamView) teamView = d.teamView;
  if (d.commercialView) commercialView = d.commercialView;
  render();
});
document.addEventListener("change", async (e) => {
  if (appMode === "locked" || saving) return;
  if (e.target.dataset.task) {
    let t = state.tasks.find((t) => t.id === e.target.dataset.task);
    if (t) {
      t.done = e.target.checked;
      const done = t.done;
      if (await save()) toast(done ? "Tarefa concluída." : "Tarefa reaberta.");
      render();
    }
  }
});
document.getElementById("close-modal").onclick = closeModal;
modal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal();
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    let r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
function setMenuOpen(open) {
  document.getElementById('sidebar').classList.toggle('open', open);
  document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
}
document.getElementById("menu-toggle").onclick = () =>
  setMenuOpen(!document.getElementById('sidebar').classList.contains('open'));
document.getElementById("shade").onclick = () => setMenuOpen(false);
document.addEventListener("keydown", (e) => {
  if (appMode === "locked" || saving) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    showSearch();
  }
  if (e.key === "Escape") {
    closeNotifications();
    setMenuOpen(false);
  }
});
window.addEventListener("hashchange", () => {
  setMenuOpen(false);
  if (modal.open) closeModal();
  render();
  window.scrollTo(0, 0);
});

const auth = createAuth({
  onLock() {
    googleIntegrations.reset();
    appMode = "locked";
    repository = null;
    workspaceContext = null;
    profileAvatar = "";
    state = emptyState();
    acknowledged = structuredClone(state);
    failedDraft = null;
    saveConflict = false;
    if (modal.open) modal.close();
    document.getElementById("content").replaceChildren();
    document.getElementById("modal-content").replaceChildren();
    document.getElementById("sync-notice").hidden = true;
    document.body.classList.remove("light");
  },
  onDemo() {
    googleIntegrations.reset();
    repository = null;
    workspaceContext = null;
    appMode = "demo";
    loadProfileAvatar();
    let warning = "";
    try {
      const saved = localStorage.getItem(storageKey);
      state = saved ? parseState(JSON.parse(saved)) : demoState();
    } catch {
      state = demoState();
      warning =
        "Não foi possível ler o salvamento local. Os exemplos foram abertos sem apagar o conteúdo anterior.";
    }
    // Update appearance once without removing the user's existing demo records.
    try {
      if (!localStorage.getItem('project-lab-pulse-clean-appearance')) {
        state.theme = 'light'; state.accent = '#f5f5f7';
        localStorage.setItem(storageKey, JSON.stringify(state));
        localStorage.setItem('project-lab-pulse-clean-appearance', '1');
      }
    } catch { /* Keep the in-memory preview usable when storage is unavailable. */ }
    acknowledged = structuredClone(state);
    render();
    document.getElementById("save-status").textContent =
      "Demonstração local · sem sincronização";
    if (warning) toast(warning);
  },
  async onWorkspace(context) {
    googleIntegrations.reset();
    const next = new WorkspaceRepository(supabase, context.id);
    const data = await next.load();
    if (!context.isCurrent()) return;
    repository = next;
    workspaceContext = context;
    state = data;
    appMode = "online";
    loadProfileAvatar();
    const accountsChanged = await syncWorkspaceAccountsToTeam(context);
    const currentChanged = syncCurrentUserToTeam();
    if ((accountsChanged || currentChanged) && context.role !== "viewer") {
      try { state = await next.save(state); } catch { state = data; syncCurrentUserToTeam(); }
    }
    acknowledged = structuredClone(state);
    failedDraft = null;
    saveConflict = false;
    render();
    document.getElementById("save-status").textContent = "Conectado ao estúdio";
  },
});

async function refreshData(force = false) {
  if (
    appMode !== "online" ||
    saving ||
    refreshing ||
    (!force && (modal.open || failedDraft || document.hidden))
  )
    return;
  refreshing = true;
  const current = repository;
  try {
    if (!force && !(await current.hasUpdates())) return;
    const snapshot = await current.snapshot();
    if (
      repository !== current ||
      appMode !== "online" ||
      saving ||
      (!force &&
        (modal.open ||
          document.activeElement?.matches("input,textarea,select")))
    )
      return;
    current.revision = snapshot.revision;
    state = snapshot.state;
    acknowledged = structuredClone(state);
    saveConflict = false;
    if (force) {
      if (modal.open) closeModal();
    }
    render();
    document.getElementById("sync-notice").hidden = true;
    if (failedDraft) {
      const notice = document.getElementById("sync-notice");
      notice.hidden = false;
      notice.innerHTML = `<span>Versão atual carregada. Seu rascunho anterior continua disponível para consulta; refaça apenas a alteração desejada.</span>${btn("Baixar rascunho", "export-draft", "download", "small")}`;
    }
    document.getElementById("save-status").textContent =
      "Atualizado com a equipe";
  } catch (error) {
    if (repository === current)
      document.getElementById("save-status").textContent =
        "Não foi possível atualizar. Verifique sua conexão ou acesso.";
    if (force) toast(friendlyError(error));
  } finally {
    refreshing = false;
  }
}
setInterval(() => refreshData(), 60000);
window.addEventListener("focus", () => refreshData());
window.addEventListener("beforeunload", (event) => {
  if (saving || failedDraft || hasUnsavedEditor()) {
    event.preventDefault();
    event.returnValue = "";
  }
});

async function extendedAction(a) {
  if (a === "account") {
    const source = profileAvatarSource();
    const email = appMode === "online" ? workspaceContext?.user?.email || "" : "Demonstração local";
    const role = appMode === "online"
      ? { owner: "Administrador", editor: "Editor", viewer: "Leitura" }[workspaceContext?.role] || "Membro"
      : "Dados locais neste navegador";
    openModal(
      "Minha conta",
      `<div class="account-profile"><div class="account-avatar-preview" data-account-avatar>${profileAvatarMarkup(true)}</div><div><strong>${esc(profileUserName())}</strong><p>${esc(email)}<br>${esc(role)}</p></div></div><div class="account-avatar-form"><label class="field">Foto de perfil<input id="account-avatar-file" type="file" accept="image/*"></label><p class="form-hint">Use uma imagem quadrada de até 8 MB. ${appMode === "online" ? "Ela fica vinculada à sua conta." : "Na demonstração, fica salva apenas neste navegador."}</p><div class="form-actions"><button type="button" class="btn ghost" data-action="remove-avatar" ${source ? "" : "disabled"}>Remover foto</button></div></div><p class="account-role">${appMode === "online" ? "Cada pessoa deve entrar com o próprio e-mail. Convide a equipe em Acessos da equipe, sem compartilhar sua senha." : "Ao publicar o estúdio online, cada membro poderá ter seu próprio acesso e foto."}</p><div class="form-actions">${appMode === "online" ? btn("Trocar estúdio", "choose-workspace", "users", "") : ""}${appMode === "online" ? btn("Gerenciar equipe", "access", "users", "") : ""}${btn(appMode === "demo" ? "Entrar na minha conta" : "Sair da conta", "logout", "arrow")}</div>`,
    );
    const input = modal.querySelector("#account-avatar-file");
    if (input) {
      input.onchange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
          toast("Escolha um arquivo de imagem.");
          input.value = "";
          return;
        }
        if (file.size > 8 * 1024 * 1024) {
          toast("A imagem precisa ter até 8 MB.");
          input.value = "";
          return;
        }
        input.disabled = true;
        try {
          const savedOnline = await saveProfileAvatar(await optimizeAvatar(file));
          toast(savedOnline ? "Foto de perfil atualizada." : "Foto salva neste dispositivo. Não foi possível sincronizar agora.");
          const remove = modal.querySelector('[data-action="remove-avatar"]');
          if (remove) remove.disabled = false;
        } catch (error) {
          toast(error.message || "Não foi possível atualizar a foto.");
        } finally {
          input.disabled = false;
          input.value = "";
        }
      };
    }
    return true;
  }
  if (a === "remove-avatar") {
    const savedOnline = await saveProfileAvatar("");
    toast(savedOnline ? "Foto de perfil removida." : "Foto removida neste dispositivo. Não foi possível sincronizar agora.");
    const remove = modal.querySelector('[data-action="remove-avatar"]');
    if (remove) remove.disabled = true;
    return true;
  }
  if (a === "logout") {
    closeModal();
    if (appMode === "demo") auth.showLogin();
    else await auth.logout();
    return true;
  }
  if (a === "choose-workspace") {
    await auth.chooseWorkspace();
    return true;
  }
  if (a === "refresh-data") {
    await refreshData(true);
    return true;
  }
  if (a === "export-draft") {
    if (failedDraft)
      download(
        "project-lab-rascunho.json",
        JSON.stringify(failedDraft, null, 2),
      );
    return true;
  }
  if (a === "retry-save") {
    if (failedDraft && !saveConflict) {
      state = structuredClone(failedDraft);
      if (await save()) {
        closeModal();
        render();
        toast("Alteração salva.");
      }
    }
    return true;
  }
  if (
    saveConflict &&
    !["close", "export", "search", "notifications", "print"].includes(a)
  ) {
    toast("Carregue a versão atual antes de fazer outra alteração.");
    return true;
  }
  if (a === "access") {
    await showAccess();
    return true;
  }
  if (a === "invite") {
    if (!isOwner()) return true;
    openModal(
      "Convidar para o estúdio",
      `<form id="invite-form"><div class="form-grid">${field("E-mail da pessoa", "email", "", "email", true, 'required maxlength="254"')}${selectField(
        "Permissão",
        "role",
        [
          ["editor", "Editar o estúdio"],
          ["viewer", "Somente leitura"],
        ],
        "editor",
        true,
      )}</div><p class="form-hint">O convite expira em 7 dias e só funciona com esse e-mail. Você compartilha o link com a pessoa.</p><div class="form-actions"><button class="btn primary" type="submit">Criar link de convite</button></div></form>`,
    );
    document.getElementById("invite-form").onsubmit = async (event) => {
      event.preventDefault();
      const formElement = event.target;
      const button = formElement.querySelector("button");
      button.disabled = true;
      try {
        const data = Object.fromEntries(new FormData(formElement));
        const { data: token, error } = await supabase.rpc(
          "create_workspace_invite",
          {
            p_workspace: repository.id,
            p_email: data.email,
            p_role: data.role,
          },
        );
        if (error) throw error;
        const url = new URL(location.pathname, location.origin);
        url.searchParams.set("invite", token);
        openModal(
          "Convite pronto",
          `<p class="form-hint">Copie este link e envie para ${esc(data.email)}. Nenhuma mensagem foi enviada automaticamente.</p><label class="field">Link do convite<input readonly value="${esc(url.href)}"></label>`,
        );
      } catch (error) {
        toast(friendlyError(error));
      } finally {
        button.disabled = false;
      }
    };
    return true;
  }
  if (a.startsWith("revoke-invite:")) {
    const { error } = await supabase.rpc("revoke_workspace_invite", {
      p_invite: a.slice(14),
    });
    if (error) throw error;
    await showAccess();
    return true;
  }
  if (a.startsWith("remove-member:")) {
    openModal(
      "Remover acesso",
      `<p class="form-hint">Esta pessoa perderá acesso ao estúdio. Os registros de trabalho permanecem.</p><div class="form-actions">${btn("Cancelar", "close", "x", "")}${btn("Confirmar remoção", "confirm-member:" + a.slice(14), "check")}</div>`,
    );
    return true;
  }
  if (a.startsWith("confirm-member:")) {
    const { error } = await supabase.rpc("remove_workspace_member", {
      p_workspace: repository.id,
      p_user: a.slice(15),
    });
    if (error) throw error;
    await showAccess();
    return true;
  }
  if (a === "import") {
    openImport();
    return true;
  }
  if (a === "new-income" || a === "new-cost") {
    financialForm(a === "new-cost");
    return true;
  }
  if (a.startsWith("edit-income:")) {
    financialForm(false, a.slice(12));
    return true;
  }
  if (a.startsWith("edit-cost:")) {
    financialForm(true, a.slice(10));
    return true;
  }
  if (a.startsWith("edit-project:")) {
    newProject(a.slice(13));
    return true;
  }
  if (a === "new-task") {
    taskForm();
    return true;
  }
  if (a.startsWith("edit-task:")) {
    taskForm(a.slice(10));
    return true;
  }
  if (a === "opening-balance") {
    form(
      "Saldo de abertura",
      field(
        "Saldo inicial (R$)",
        "value",
        state.openingBalance,
        "number",
        true,
        'step="0.01" required',
      ),
      (d) => (state.openingBalance = Number(d.value)),
    );
    return true;
  }
  if (a.startsWith("convert-lead:")) {
    const lead = state.leads.find((item) => item.id === a.slice(13));
    if (!lead) return true;
    if (lead.projectId) {
      projectDetail(lead.projectId);
      return true;
    }
    let client = state.clients.find((item) => item.name === lead.client);
    if (!client && lead.client) {
      client = {
        id: crypto.randomUUID(),
        name: lead.client,
        segment: "",
        contact: "",
        email: "",
      };
      state.clients.push(client);
    }
    const id = crypto.randomUUID();
    state.projects.push({
      id,
      name: lead.name,
      client: client?.name || "",
      clientId: client?.id || "",
      stage: 0,
      date: "",
      value: lead.value,
      team: [],
      type: "Institucional",
      progress: 15,
      color: "",
      note: "",
      captureDates: [],
      equipmentIds: [],
    });
    lead.projectId = id;
    lead.stage = 3;
    if (await save()) {
      render();
      projectDetail(id);
    }
    return true;
  }
  return false;
}

async function showAccess() {
  if (appMode !== "online") {
    openModal(
      "Acessos da equipe",
      '<p class="form-hint">Entre na sua conta para convidar pessoas para um estúdio online.</p>',
    );
    return;
  }
  const current = repository;
  const { data: members, error } = await supabase.rpc(
    "list_workspace_members",
    { p_workspace: current.id },
  );
  if (error) throw error;
  let invites = [];
  if (isOwner()) {
    const result = await supabase
      .from("workspace_invites")
      .select("id,email,role,expires_at")
      .eq("workspace_id", current.id)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .gt("expires_at", new Date().toISOString());
    if (result.error) throw result.error;
    invites = result.data;
  }
  if (repository !== current) return;
  openModal(
    "Acessos da equipe",
    simpleTable(
      ["PESSOA", "PERMISSÃO", ""],
      members.map((member) => [
        esc(member.email),
        esc(
          { owner: "Administrador", editor: "Editor", viewer: "Leitura" }[
            member.role
          ],
        ),
        isOwner() && member.role !== "owner"
          ? btn(
              "Remover acesso",
              "remove-member:" + member.user_id,
              "x",
              "small",
            )
          : "",
      ]),
    ) +
      (isOwner()
        ? `<div class="form-actions">${btn("Convidar pessoa", "invite", "plus")}</div><h3>Convites pendentes</h3>${
            invites.length
              ? simpleTable(
                  ["E-MAIL", "EXPIRA", ""],
                  invites.map((i) => [
                    esc(i.email),
                    dateLabel(i.expires_at.slice(0, 10)),
                    btn("Revogar", "revoke-invite:" + i.id, "x", "small"),
                  ]),
                )
              : '<p class="form-hint">Nenhum convite pendente.</p>'
          }`
        : ""),
    true,
  );
}

function openImport() {
  if (!isOwner())
    return toast("Somente o administrador pode restaurar um backup.");
  openModal(
    "Restaurar backup",
    `<p class="form-hint">Escolha um backup JSON do Project Lab. Você verá o resumo antes de substituir os dados deste estúdio.</p><label class="field">Arquivo JSON<input id="backup-file" type="file" accept=".json,application/json"></label><div id="backup-summary"></div>`,
  );
  const originalRepo = repository,
    originalMode = appMode;
  document.getElementById("backup-file").onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 1048576) throw new Error("Use um backup de até 1 MB.");
      const incoming = parseState(JSON.parse(await file.text()));
      if (repository !== originalRepo || appMode !== originalMode) return;
      const summary = document.getElementById("backup-summary");
      if (!summary) return;
      summary.innerHTML = `<div class="notice">${incoming.projects.length} projetos · ${incoming.clients.length} clientes · ${incoming.income.length} receitas · ${incoming.costs.length} custos</div><p class="form-hint">A substituição afeta todos os membros do estúdio. Exporte o conteúdo atual antes de continuar.</p><div class="form-actions">${btn("Exportar dados atuais", "export", "download", "")}<button id="confirm-import" class="btn primary">Substituir pelos dados do backup</button></div>`;
      document.getElementById("confirm-import").onclick = async () => {
        if (repository !== originalRepo || appMode !== originalMode || saving)
          return;
        if (appMode === "online") incoming.workspace = state.workspace;
        state = incoming;
        if (await save()) {
          closeModal();
          render();
          toast("Backup restaurado.");
        }
      };
    } catch (error) {
      toast(friendlyError(error));
    }
  };
}

function financialForm(isCost, id, projectId = "") {
  const key = isCost ? "costs" : "income",
    item = state[key].find((row) => row.id === id);
  form(
    item ? "Editar lançamento" : isCost ? "Novo custo" : "Nova receita",
    field(
      "Descrição *",
      "name",
      item?.name || "",
      "text",
      true,
      'required maxlength="150"',
    ) +
      selectField(
        "Projeto vinculado",
        "projectId",
        [["", "Sem projeto"], ...state.projects.map((p) => [p.id, p.name])],
        item?.projectId || projectId,
        true,
      ) +
      (isCost
        ? selectField(
            "Categoria",
            "category",
            ["Produção", "Editor freelancer", "Motion designer freelancer", "VFX / Efeitos visuais", "Colorização", "Som / Mixagem", "Equipe freelancer", "Modelos / Elenco", "Locação de espaço", "Locação", "Fixo", "Logística", "Outros"],
            item?.category || "Produção",
          ) + '<p class="form-hint full">Contratou um editor? Selecione Editor freelancer e informe o nome do profissional na descrição. Vincule a um projeto ou escolha Sem projeto para uma despesa geral do estúdio.</p>'
        : field("Cliente", "client", item?.client || "")) +
      field(
        "Valor total (R$) *",
        "value",
        item?.value || "",
        "number",
        false,
        'required min="0.01" max="10000000000" step="0.01"',
      ) +
      field(
        isCost ? "Data do pagamento / previsão" : "Vencimento",
        "date",
        item?.date || isoDate(today),
        "date",
        false,
        "required",
      ) +
      (isCost
        ? selectField(
            "Situação",
            "paid",
            [
              ["yes", "Pago"],
              ["no", "Pendente"],
            ],
            item?.paid === false ? "no" : "yes",
          )
        : selectField(
            "Situação",
            "status",
            ["Pendente", "Parcial", "Pago"],
            item?.status || "Pendente",
          ) +
          field(
            "Total já recebido (se parcial)",
            "paid",
            item?.paid || 0,
            "number",
            false,
            'min="0" step="0.01"',
          ) +
          field(
            "Data do recebimento",
            "paidDate",
            item?.paidDate || "",
            "date",
          ) +
          '<p class="form-hint full">Cada lançamento tem uma data de recebimento. Para receber em datas diferentes, cadastre as parcelas separadamente.</p>'),
    (d) => {
      const value = Number(d.value),
        paid = isCost ? d.paid === "yes" : Number(d.paid);
      if (!isCost && d.status !== "Pendente" && !d.paidDate)
        throw new Error("Informe a data do recebimento.");
      if (!isCost && d.status === "Parcial" && (paid <= 0 || paid >= value))
        throw new Error(
          "O valor parcial deve ser maior que zero e menor que o total.",
        );
      const row = {
        ...(item || {}),
        id: item?.id || crypto.randomUUID(),
        name: d.name,
        projectId: d.projectId,
        value,
        date: d.date,
        ...(isCost
          ? { category: d.category, paid }
          : {
              client:
                d.client ||
                state.projects.find((p) => p.id === d.projectId)?.client ||
                "",
              status: d.status,
              paid:
                d.status === "Pago" ? value : d.status === "Parcial" ? paid : 0,
              paidDate: d.status === "Pendente" ? "" : d.paidDate,
            }),
      };
      if (item)
        state[key][state[key].findIndex((record) => record.id === item.id)] =
          row;
      else state[key].push(row);
    },
  );
}

function taskForm(id) {
  const task = state.tasks.find((item) => item.id === id);
  form(
    task ? "Editar tarefa" : "Nova tarefa",
    field(
      "Título *",
      "name",
      task?.name || "",
      "text",
      true,
      'required maxlength="150"',
    ) +
      selectField(
        "Projeto",
        "projectId",
        [["", "Sem projeto"], ...state.projects.map((p) => [p.id, p.name])],
        task?.projectId || "",
        true,
      ) +
      selectField(
        "Responsável",
        "assignee",
        [["", "A definir"], ...state.team.map((m) => [m.initials, m.name])],
        task?.assignee || "",
      ) +
      field(
        "Prazo *",
        "date",
        task?.date || isoDate(today),
        "date",
        false,
        "required",
      ),
    (d) => {
      const next = {
        id: task?.id || crypto.randomUUID(),
        ...d,
        project: state.projects.find((p) => p.id === d.projectId)?.name || "",
        done: task?.done || false,
      };
      if (task)
        state.tasks[state.tasks.findIndex((item) => item.id === task.id)] =
          next;
      else state.tasks.push(next);
    },
  );
}

document.addEventListener("dragstart", (event) => {
  const card = event.target.closest("[data-project]");
  if (!card || !canEdit()) return;
  event.dataTransfer.setData("text/plain", card.dataset.project);
  event.dataTransfer.effectAllowed = "move";
});
document.addEventListener("dragover", (event) => {
  const column = event.target.closest("[data-stage-drop]");
  if (column && canEdit()) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }
});
document.addEventListener("drop", async (event) => {
  const column = event.target.closest("[data-stage-drop]");
  if (!column || !canEdit() || saving || saveConflict) return;
  event.preventDefault();
  const project = state.projects.find(
    (p) => p.id === event.dataTransfer.getData("text/plain"),
  );
  if (!project) return;
  project.stage = Number(column.dataset.stageDrop);
  project.progress = [15, 40, 75, 100][project.stage];
  if (await save()) toast("Projeto movido.");
  render();
});

function applyAppearance() {
  const tokens = appearanceTokens(state.accent, state.theme);
  for (const [name, value] of Object.entries(tokens)) document.body.style.setProperty("--" + name, value);
}
const dashboardWidgets = [
  ["stats", "Indicadores financeiros"],
  ["production", "Etapas da produção"],
  ["projects", "Panorama financeiro"],
  ["tasks", "Próximas tarefas"],
  ["goal", "Meta do mês"],
  ["agenda", "Agenda"],
];
function customizeDashboard() {
  if (!canEdit()) return toast("Seu perfil permite apenas consultar.");
  openModal(
    "Personalizar visão geral",
    `<form id="dashboard-form"><p class="form-hint">Selecione os blocos que ajudam no seu dia a dia.</p><div class="preference-list">${dashboardWidgets.map(([key, label]) => `<label><input type="checkbox" name="${key}" ${!state.dashboardHidden.includes(key) ? "checked" : ""}>${label}</label>`).join("")}</div><div class="form-actions"><button class="btn primary" type="submit">Salvar painel</button></div></form>`,
  );
  document.getElementById("dashboard-form").onsubmit = async (event) => {
    event.preventDefault();
    state.dashboardHidden = dashboardWidgets
      .filter(([key]) => !event.target.elements[key].checked)
      .map(([key]) => key);
    if (await save()) {
      closeModal();
      render();
      toast("Painel personalizado.");
    }
  };
}
function applyDashboardPreferences() {
  const widgets = document.querySelectorAll("[data-widget]");
  if (widgets.length) {
    widgets.forEach(
      (el) => (el.hidden = state.dashboardHidden.includes(el.dataset.widget)),
    );
    const grid = document.querySelector(".studio-dashboard-grid");
    grid?.classList.toggle(
      "solo-top",
      state.dashboardHidden.includes("goal") ||
        state.dashboardHidden.includes("agenda"),
    );
    if (state.dashboardHidden.length === 6)
      document
        .getElementById("content")
        .insertAdjacentHTML(
          "beforeend",
          '<div class="empty-state"><p>Seu painel está vazio. Use Personalizar para exibir os blocos novamente.</p></div>',
        );
    return;
  }
  const root = document.getElementById("content");
  const stats = root.querySelector(".stats");
  if (stats) stats.hidden = state.dashboardHidden.includes("stats");
  const panels = [...root.querySelectorAll(".dashboard-grid .panel")];
  ["production", "projects", "tasks", "goal", "agenda"].forEach((key, i) => {
    if (panels[i]) panels[i].hidden = state.dashboardHidden.includes(key);
  });
  root
    .querySelectorAll(".main-stack,.side-stack")
    .forEach(
      (stack) =>
        (stack.hidden = [...stack.children].every((child) => child.hidden)),
    );
  const grid = root.querySelector(".dashboard-grid");
  if (grid) {
    const count = [...grid.children].filter((child) => !child.hidden).length;
    grid.classList.toggle("single-column", count === 1);
  }
  if (state.dashboardHidden.length === 6)
    root.insertAdjacentHTML(
      "beforeend",
      '<div class="empty-state"><p>Seu painel está vazio. Use Personalizar para exibir os blocos novamente.</p></div>',
    );
}
function leadEditor(id) {
  const lead = state.leads.find((l) => l.id === id);
  if (!canEdit()) {
    if (lead)
      openModal(
        lead.name,
        `<p>${esc(lead.client)} · ${money(lead.value)}</p><p class="ops-prose">${esc(lead.notes)}</p>`,
      );
    return;
  }
  form(
    lead ? "Editar oportunidade" : "Nova oportunidade",
    field(
      "Nome *",
      "name",
      lead?.name || "",
      "text",
      true,
      'required maxlength="150"',
    ) +
      field("Cliente", "client", lead?.client || "") +
      field("E-mail", "email", lead?.email || "", "email") +
      field("Telefone", "phone", lead?.phone || "") +
      field("Origem", "source", lead?.source || "") +
      field(
        "Valor estimado",
        "value",
        lead?.value || 0,
        "number",
        false,
        'min="0" max="10000000000" step="0.01"',
      ) +
      selectField(
        "Etapa",
        "stage",
        [
          [0, "Primeiro contato"],
          [1, "Em conversa"],
          [2, "Proposta enviada"],
          [3, "Fechado"],
        ],
        lead?.stage || 0,
      ) +
      selectField(
        "Interesse",
        "temperature",
        ["Frio", "Morno", "Quente"],
        lead?.temperature || "Morno",
      ) +
      field("Próximo passo", "nextStep", lead?.nextStep || "", "text", true) +
      textarea("Histórico e observações", "notes", lead?.notes || ""),
    (data) => {
      const row = {
        ...lead,
        ...data,
        id: lead?.id || crypto.randomUUID(),
        stage: Number(data.stage),
        value: Number(data.value),
        projectId: lead?.projectId || "",
        proposalId: lead?.proposalId || "",
      };
      state.leads = state.leads.filter((l) => l.id !== row.id).concat(row);
    },
    "Salvar oportunidade",
  );
  if (lead)
    document
      .querySelector("#entry-form .form-actions")
      .insertAdjacentHTML(
        "afterbegin",
        btn(
          lead.projectId ? "Abrir projeto" : "Converter em projeto",
          "convert-lead:" + lead.id,
          "film",
          "",
        ),
      );
}
function clientEditor(id) {
  const client = state.clients.find((c) => c.id === id);
  form(
    client ? "Editar cliente" : "Novo cliente",
    field(
      "Nome *",
      "name",
      client?.name || "",
      "text",
      true,
      'required maxlength="150"',
    ) +
      field("Segmento", "segment", client?.segment || "") +
      field("Pessoa de contato", "contact", client?.contact || "") +
      field("E-mail", "email", client?.email || "", "email", true)+
      mediaField('Logo do cliente','logo',client?.logo,esc)+
      mediaField('Capa das produções deste cliente','cover',client?.cover,esc,'cover'),
    (data) => {
      const next = { ...data, id: client?.id || crypto.randomUUID() };
      state.clients = state.clients
        .filter((c) => c.id !== next.id)
        .concat(next);
      if (client)
        state.projects.forEach((p) => {
          if (
            p.clientId === client.id ||
            (!p.clientId && p.client === client.name)
          ) {
            p.client = data.name;
            p.clientId = client.id;
          }
        });
    },
  );
}
function eventEditor(id) {
  const event = state.events.find((e) => e.id === id);
  form(
    event ? "Editar compromisso" : "Novo compromisso",
    field(
      "Título *",
      "name",
      event?.name || "",
      "text",
      true,
      'required maxlength="150"',
    ) +
      selectField(
        "Projeto",
        "projectId",
        [["", "Sem projeto"], ...state.projects.map((p) => [p.id, p.name])],
        event?.projectId || "",
        true,
      ) +
      field(
        "Data *",
        "date",
        event?.date || isoDate(today),
        "date",
        false,
        "required",
      ) +
      field(
        "Horário *",
        "time",
        event?.time || "09:00",
        "time",
        false,
        "required",
      ) +
      field("Cliente / contato", "client", event?.client || "") +
      selectField(
        "Categoria",
        "type",
        ["Reunião", "Captação", "Entrega", "Pagamento"],
        event?.type || "Reunião",
      )+eventColorField(event?.color,event?.type)+(event && !event.id.startsWith('auto-') ? `<div class="field full">${btn('Excluir compromisso','delete-event:'+event.id,'trash','')}</div>` : ''),
    (data) => {
      const next = {
        ...data,
        id: event?.id || crypto.randomUUID(),
        client:
          data.client ||
          state.projects.find((p) => p.id === data.projectId)?.client ||
          "",
      };
      state.events = state.events.filter((e) => e.id !== next.id).concat(next);
    },
  );
}
const moduleContext = {
  getState: () => state,
  save,
  render,
  openModal,
  closeModal,
  toast,
  esc,
  icon,
  money,
  btn,
  field,
  selectField,
  textarea,
  canEdit,
  download,
  dateLabel,
  isoDate,
  form,
  financialForm,
  openProject: (id, tab = "overview") => {
    if (modal.open && closeModal() === false) return;
    const hash = `#project/${id}/${tab}`;
    if (location.hash === hash) render();
    else location.hash = hash;
  },
  openLead: (id) => {
    commercialView = "pipeline";
    if (location.hash !== "#commercial") {
      window.addEventListener("hashchange", () => leadEditor(id), {
        once: true,
      });
      location.hash = "commercial";
    } else {
      render();
      leadEditor(id);
    }
  },
};
const proposalsModule = createProposals(moduleContext);
const googleIntegrations = createGoogleIntegrations(moduleContext);
const operationsModule = createOperations(moduleContext);
const creativeModule = createCreativeTools(moduleContext);
auth.start().catch((error) => toast(friendlyError(error)));
