import {
  createProposal,
  proposalSchema,
  replaceProposal,
  proposalToLead,
  safeWebsite,
  safeEmail,
  safeImage,
  serializedBytes,
  WORKSPACE_BYTE_LIMIT,
} from "./proposal-data.js";
import { readImage } from "./media.js";
import "./proposals.css";

import { proposalDocument } from "./proposal-document.js";
const photo = (src, alt, cls = "") =>
  safeImage(src)
    ? `<img class="${cls}" src="${src}" alt="${String(alt).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c])}">`
    : "";

export function createProposals(ctx) {
  const {
    getState,
    save,
    render,
    openModal,
    closeModal,
    toast,
    esc,
    btn,
    field,
    selectField,
    textarea,
    canEdit,
    download,
  } = ctx;
  let draft = null,
    mode = "edit",
    dirty = false,
    uploading = false;
  const imageField = (label, key, value) =>
    `<label class="field">${label}<input type="file" data-proposal-image="${key}" accept="image/png,image/jpeg,image/webp">${value ? `<span class="proposal-upload-thumb"><img src="${safeImage(value)}" alt="${label}"><button type="button" class="btn small" data-action="proposal-image-remove:${key}">Remover</button></span>` : ""}</label>`;
  const section = (title, content, open = false) =>
    `<details class="editor-section" ${open ? "open" : ""}><summary>${title}</summary><div class="form-grid">${content}</div></details>`;
  function list() {
    const rows = getState().proposals;
    return `<div class="toolbar"><p class="muted">Apresentações com a identidade do seu estúdio.</p>${btn("Criar proposta", "proposal-new")}</div>${rows.length ? `<div class="proposal-list">${rows.map((p) => `<article class="panel proposal-item"><div class="proposal-cover-mini" style="--proposal-accent:${p.accent}">${p.coverImage ? photo(p.coverImage, "") : ""}<span>${esc(p.badge)}</span><strong>${esc(p.name)}</strong></div><div class="proposal-item-body"><div><h3>${esc(p.client || "Cliente a definir")}</h3><p>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: p.currency }).format(p.value)} · ${esc(p.status)}</p></div><div class="proposal-item-actions">${btn("Abrir", "proposal-open:" + p.id, "file", "small")}${canEdit() ? btn("Duplicar", "proposal-copy:" + p.id, "plus", "small") : ""}</div></div></article>`).join("")}</div>` : `<div class="empty-state"><h2>Sua próxima proposta começa aqui.</h2><p>Um modelo completo: capa, escopo, investimento e portfólio. Personalize e exporte para apresentar ao cliente.</p>${btn("Usar modelo", "proposal-new")}</div>`}<p class="form-hint">Exporte uma página HTML completa ou use a impressão do navegador para salvar como PDF. Link público e aprovação online ainda não estão configurados.</p>`;
  }
  function open(id) {
    draft = structuredClone(
      getState().proposals.find((p) => p.id === id) ||
        createProposal(getState().workspace, getState().currency),
    );
    mode = canEdit() ? "edit" : "preview";
    dirty = false;
    draw();
  }
  function collect() {
    const form = document.getElementById("proposal-form");
    if (!form || !draft) return;
    for (const input of form.querySelectorAll("[data-p-field]"))
      draft[input.dataset.pField] =
        input.type === "number" ? Number(input.value) : input.value;
    draft.deliverables = [...form.querySelectorAll("[data-deliverable]")].map(
      (el) => ({
        name: el.querySelector('[name="deliverable-name"]').value,
        deadline: el.querySelector('[name="deliverable-deadline"]').value,
      }),
    );
    draft.investment = [...form.querySelectorAll("[data-investment]")].map(
      (el) => ({
        title: el.querySelector('[name="investment-title"]').value,
        description: el.querySelector('[name="investment-description"]').value,
      }),
    );
  }
  const f = (label, key, type = "text", extra = "") =>
    field(label, key, draft[key], type, false, extra).replace(
      `<input name="${key}"`,
      `<input data-p-field="${key}" name="${key}"`,
    );
  const t = (label, key) =>
    textarea(label, key, draft[key]).replace(
      `<textarea name="${key}"`,
      `<textarea data-p-field="${key}" name="${key}"`,
    );
  const s = (label, key, values) =>
    selectField(label, key, values, draft[key]).replace(
      `<select name="${key}"`,
      `<select data-p-field="${key}" name="${key}"`,
    );
  function draw() {
    const previousForm = document.getElementById("proposal-form");
    const expanded = previousForm
      ? [...previousForm.querySelectorAll("details[open]")].map(
          (el) => el.querySelector("summary").textContent,
        )
      : null;
    const previousScroll = document.getElementById("modal")?.scrollTop || 0;
    const disabled = canEdit() ? "" : "disabled";
    let editor =
      section(
        "Capa e identidade",
        f("Nome da proposta *", "name", "text", 'required maxlength="150"') +
          f("Cliente", "client") +
          f("Chamada", "badge") +
          f("Subtítulo", "subtitle") +
          f("Cor de destaque", "accent", "color") +
          f(
            "Escala do texto",
            "textScale",
            "number",
            'min="0.8" max="1.2" step="0.05"',
          ) +
          imageField("Logo da capa", "coverLogo", draft.coverLogo) +
          imageField("Imagem de capa", "coverImage", draft.coverImage),
        true,
      ) +
      section(
        "Contato e escopo",
        f("E-mail do cliente", "email", "email") +
          f("Telefone do cliente", "phone") +
          t("Objetivo do projeto", "objective") +
          t("Escopo de produção", "scope") +
          f("Equipe prevista", "team") +
          f(
            "Diárias de captação",
            "days",
            "number",
            'min="0" max="1000" step="1"',
          ),
      ) +
      section(
        "Entregáveis",
        `<div class="full editor-repeater">${draft.deliverables.map((d, i) => `<div data-deliverable class="editor-row">${field("Entrega", "deliverable-name", d.name)}${field("Prazo / formato", "deliverable-deadline", d.deadline)}<button class="btn small" type="button" data-action="proposal-remove-deliverable:${i}" aria-label="Remover entrega ${i + 1}">×</button></div>`).join("")}${btn("Adicionar entrega", "proposal-add-deliverable", "plus", "small")}</div>`,
      ) +
      section(
        "Investimento e condições",
        f(
          "Valor total",
          "value",
          "number",
          'min="0" step="0.01" max="10000000000"',
        ) +
          s("Moeda", "currency", ["BRL", "USD", "EUR"]) +
          `<div class="full editor-repeater">${draft.investment.map((d, i) => `<div data-investment class="editor-row investment-row">${field("Coluna", "investment-title", d.title)}${textarea("O que está incluído", "investment-description", d.description)}<button type="button" class="btn small" data-action="proposal-remove-investment:${i}" aria-label="Remover coluna ${i + 1}">×</button></div>`).join("")}${btn("Adicionar coluna", "proposal-add-investment", "plus", "small")}</div>` +
          t("Pagamento", "payment") +
          t("Termos e condições", "terms"),
      ) +
      section(
        "Estúdio, clientes e portfólio",
        imageField("Logo do estúdio", "studioLogo", draft.studioLogo) +
          f(
            "Altura dos logos (px)",
            "logoSize",
            "number",
            'min="20" max="120"',
          ) +
          t("Sobre o estúdio", "about") +
          f("E-mail comercial", "commercialEmail", "email") +
          f("Site do estúdio", "website") +
          `<label class="field full">Logos de clientes (${draft.clientLogos.length}/6)<input type="file" data-proposal-gallery="clientLogos" accept="image/png,image/jpeg,image/webp" multiple></label><div class="full editor-gallery">${draft.clientLogos.map((v, i) => `<div>${photo(v, `Logo ${i + 1}`)}${btn("Remover", "proposal-remove-clientLogos:" + i, "x", "small")}</div>`).join("")}</div><label class="field full">Imagens do portfólio (${draft.portfolio.length}/5)<input type="file" data-proposal-gallery="portfolio" accept="image/png,image/jpeg,image/webp" multiple></label><div class="full editor-gallery">${draft.portfolio.map((v, i) => `<div>${photo(v, `Portfólio ${i + 1}`)}${btn("Remover", "proposal-remove-portfolio:" + i, "x", "small")}</div>`).join("")}</div>`,
      ) +
      section(
        "Acompanhamento",
        s("Status (controle interno)", "status", [
          "Rascunho",
          "Enviada",
          "Aprovada",
          "Recusada",
        ]),
      );
    openModal(
      "Proposta comercial",
      `<div class="proposal-toolbar"><div class="segmented"><button type="button" data-action="proposal-mode-edit" class="${mode === "edit" ? "active" : ""}" ${disabled}>Configurar</button><button type="button" data-action="proposal-mode-preview" class="${mode === "preview" ? "active" : ""}">Visualizar</button></div><div class="proposal-item-actions">${btn("Exportar HTML", "proposal-export", "download", "small")}${btn("Imprimir / PDF", "proposal-print", "file", "small")}${canEdit() ? btn("Salvar proposta", "proposal-save", "check") : ""}</div></div><div class="proposal-editor ${mode === "preview" ? "preview-only" : ""}">${mode === "edit" ? `<form id="proposal-form" class="proposal-fields">${editor}<p class="form-hint">Imagens compactadas no navegador. O estúdio tem limite de 1 MB de dados nesta versão gratuita.</p></form>` : ""}<div class="proposal-preview"><div class="preview-caption">PRÉVIA DA APRESENTAÇÃO <span id="proposal-draft-state">${dirty ? "Alterações não salvas" : "Rascunho"}</span></div><iframe id="proposal-preview" title="Prévia da proposta" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div></div><div class="proposal-bottom">${canEdit() ? btn(draft.leadId ? "Abrir oportunidade" : "Criar oportunidade", "proposal-lead", "trend", "small") : ""}${getState().proposals.some((p) => p.id === draft.id) && canEdit() ? btn("Excluir proposta", "proposal-delete", "x", "small danger") : ""}</div>`,
      true,
    );
    updatePreview();
    const form = document.getElementById("proposal-form");
    if (form) {
      if (expanded)
        form
          .querySelectorAll("details")
          .forEach(
            (el) =>
              (el.open = expanded.includes(
                el.querySelector("summary").textContent,
              )),
          );
      document.getElementById("modal").scrollTop = previousScroll;
      form.onsubmit = (e) => e.preventDefault();
      let previewTimer;
      form.oninput = (e) => {
        if (e.target.type === "file") return;
        dirty = true;
        collect();
        clearTimeout(previewTimer);
        previewTimer = setTimeout(updatePreview, 160);
      };
      form.onchange = async (e) => {
        const key =
          e.target.dataset.proposalImage || e.target.dataset.proposalGallery;
        if (!key) return;
        const files = [...e.target.files];
        if (!files.length) return;
        uploading = true;
        try {
          collect();
          const limit = key === "clientLogos" ? 6 : 5;
          if (
            e.target.dataset.proposalGallery &&
            draft[key].length + files.length > limit
          )
            throw new Error(
              `Você pode adicionar até ${limit} imagens nesta seção.`,
            );
          const images = await Promise.all(
            files.map((file) =>
              readImage(file, key === "clientLogos" ? 25000 : 65000),
            ),
          );
          if (!form.isConnected || !document.getElementById("modal").open)
            return;
          const candidate = structuredClone(draft);
          if (e.target.dataset.proposalGallery) candidate[key].push(...images);
          else candidate[key] = images[0];
          if (
            serializedBytes(replaceProposal(getState(), candidate)) >
            WORKSPACE_BYTE_LIMIT
          )
            throw new Error(
              "Estas imagens ultrapassam 1 MB do estúdio. Remova imagens ou escolha arquivos menores.",
            );
          draft = candidate;
          dirty = true;
          draw();
          toast("Imagem adicionada à prévia. Salve a proposta para guardar.");
        } catch (error) {
          toast(error.message);
        } finally {
          uploading = false;
        }
      };
    }
  }
  function updatePreview() {
    const frame = document.getElementById("proposal-preview");
    if (!frame || !draft) return;
    try {
      frame.srcdoc = proposalDocument(
        { ...draft, name: draft.name || "Nome da proposta" },
        getState().workspace,
      );
    } catch {
      /* Keep last valid preview while a numeric input is temporarily empty. */
    }
    const status = document.getElementById("proposal-draft-state");
    if (status)
      status.textContent = dirty
        ? "Alterações não salvas"
        : "Prévia atualizada";
  }
  async function persist() {
    if (!canEdit() || uploading) return false;
    collect();
    if (document.getElementById("proposal-form")?.reportValidity() === false)
      return false;
    try {
      const candidate = proposalSchema.parse({
        ...draft,
        updatedAt: new Date().toISOString(),
      });
      if (
        serializedBytes(replaceProposal(getState(), candidate)) >
        WORKSPACE_BYTE_LIMIT
      )
        throw new Error(
          "A proposta ultrapassa o limite de 1 MB do estúdio. Reduza as imagens.",
        );
      getState().proposals = replaceProposal(getState(), candidate).proposals;
      if (!(await save())) return false;
      draft = structuredClone(candidate);
      dirty = false;
      render();
      toast("Proposta salva.");
      return true;
    } catch (error) {
      toast(error.issues?.[0]?.message || error.message);
      return false;
    }
  }
  async function handle(action) {
    if (!action.startsWith("proposal-")) return false;
    if (action.startsWith("proposal-open:")) {
      open(action.slice(14));
      return true;
    }
    const readOnly = [
      "proposal-export",
      "proposal-print",
      "proposal-mode-preview",
    ];
    if (!canEdit() && !readOnly.includes(action)) {
      toast("Seu perfil permite apenas consultar.");
      return true;
    }
    if (action === "proposal-new") {
      open();
      return true;
    }
    if (action.startsWith("proposal-copy:")) {
      const source = getState().proposals.find(
        (p) => p.id === action.slice(14),
      );
      if (source) {
        draft = {
          ...structuredClone(source),
          id: crypto.randomUUID(),
          name: `${source.name.slice(0, 140)} (cópia)`,
          status: "Rascunho",
          leadId: "",
          createdAt: new Date().toISOString(),
        };
        dirty = true;
        mode = "edit";
        draw();
      }
      return true;
    }
    if (!draft) return true;
    collect();
    if (action === "proposal-save") {
      if (await persist()) draw();
      return true;
    }
    if (action.startsWith("proposal-mode-")) {
      mode = action.slice(14);
      draw();
      return true;
    }
    if (action === "proposal-export") {
      download(
        `${draft.name.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "proposta"}.html`,
        proposalDocument(draft, getState().workspace),
        "text/html;charset=utf-8",
      );
      toast("Página HTML exportada.");
      return true;
    }
    if (action === "proposal-print") {
      const frame = document.createElement("iframe");
      frame.className = "print-frame";
      frame.title = "Impressão da proposta";
      frame.setAttribute("sandbox", "allow-same-origin allow-modals");
      document.body.append(frame);
      frame.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      };
      frame.srcdoc = proposalDocument(draft, getState().workspace);
      setTimeout(() => frame.remove(), 120000);
      return true;
    }
    if (action === "proposal-lead") {
      if (draft.currency !== getState().currency) {
        toast(
          "A proposta e o estúdio precisam usar a mesma moeda para criar uma oportunidade. Não fazemos conversão cambial automática.",
        );
        return true;
      }
      if (!(await persist())) return true;
      const stored = getState().proposals.find((p) => p.id === draft.id);
      if (!getState().leads.some((l) => l.id === stored.leadId)) {
        const lead = proposalToLead(stored);
        getState().leads.push(lead);
        stored.leadId = lead.id;
        if (!(await save())) return true;
      }
      closeModal();
      ctx.openLead?.(
        getState().proposals.find((p) => p.id === draft.id).leadId,
      );
      return true;
    }
    if (action === "proposal-delete") {
      openModal(
        "Excluir proposta?",
        `<p>Esta proposta será removida. Exporte uma cópia se quiser preservá-la. A oportunidade vinculada será mantida.</p><div class="form-actions">${btn("Voltar", "proposal-open:" + draft.id, "arrow", "")}${btn("Confirmar exclusão", "proposal-confirm-delete", "x", "danger")}</div>`,
      );
      return true;
    }
    if (action === "proposal-confirm-delete") {
      getState().proposals = getState().proposals.filter(
        (p) => p.id !== draft.id,
      );
      if (await save()) {
        dirty = false;
        closeModal();
        render();
        toast(
          "Proposta excluída. Só pode ser recuperada por um backup anterior.",
        );
      }
      return true;
    }
    if (action === "proposal-add-deliverable" && draft.deliverables.length < 40)
      draft.deliverables.push({ name: "", deadline: "" });
    if (action === "proposal-add-investment" && draft.investment.length < 8)
      draft.investment.push({ title: "", description: "" });
    const remove = action.match(
      /^proposal-remove-(deliverable|investment|clientLogos|portfolio):(\d+)$/,
    );
    if (remove)
      draft[remove[1] === "deliverable" ? "deliverables" : remove[1]].splice(
        Number(remove[2]),
        1,
      );
    if (action.startsWith("proposal-image-remove:"))
      draft[action.slice(22)] = "";
    dirty = true;
    draw();
    return true;
  }
  return {
    list,
    open,
    handle,
    isDirty: () => dirty && !!document.getElementById("proposal-preview"),
  };
}
