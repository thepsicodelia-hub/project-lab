import {
  createProposal,
  proposalSchema,
  proposalTotal,
  replaceProposal,
  proposalToLead,
  safeImage,
  serializedBytes,
  WORKSPACE_BYTE_LIMIT,
} from "./proposal-data.js";
import { readImage } from "./media.js";
import { proposalEditor } from "./proposal-editor.js";
import "./proposals.css";
import "./proposal-workbench.css";

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
    canEdit,
    download,
  } = ctx;
  let draft = null,
    mode = "edit",
    dirty = false,
    uploading = false;
  let device = "desktop",
    previewTimer,
    previewScroll = 0,
    editorSections = ["capa"],
    sidebarPosition = 0,
    saving = false,
    revision = 0;
  function list() {
    const rows = getState().proposals;
    return `<div class="toolbar"><p class="muted">Apresentações com a identidade do seu estúdio.</p>${btn("Criar proposta", "proposal-new")}</div>${rows.length ? `<div class="proposal-list">${rows.map((p) => `<article class="panel proposal-item"><div class="proposal-cover-mini" style="--proposal-accent:${p.accent}">${p.coverImage ? photo(p.coverImage, "") : ""}<span>${esc(p.badge)}</span><strong>${esc(p.name)}</strong></div><div class="proposal-item-body"><div><h3>${esc(p.client || "Cliente a definir")}</h3><p>${new Intl.NumberFormat("pt-BR", { style: "currency", currency: p.currency }).format(proposalTotal(p))} · ${esc(p.status)}</p></div><div class="proposal-item-actions">${btn("Abrir", "proposal-open:" + p.id, "file", "small")}${canEdit() ? btn("Duplicar", "proposal-copy:" + p.id, "plus", "small") : ""}</div></div></article>`).join("")}</div>` : `<div class="empty-state"><h2>Sua próxima proposta começa aqui.</h2><p>Um modelo completo: capa, escopo, investimento e portfólio. Personalize e exporte para apresentar ao cliente.</p>${btn("Usar modelo", "proposal-new")}</div>`}<p class="form-hint">Exporte uma página HTML completa ou use a impressão do navegador para salvar como PDF. Link público e aprovação online ainda não estão configurados.</p>`;
  }
  function open(id) {
    clearTimeout(previewTimer);
    draft = proposalSchema.parse(
      structuredClone(
        getState().proposals.find((p) => p.id === id) ||
          createProposal(
            getState().workspace,
            getState().currency,
            getState().accent,
          ),
      ),
    );
    previewScroll = 0;
    editorSections = ["capa"];
    sidebarPosition = 0;
    mode = canEdit() ? "edit" : "preview";
    dirty = false;
    draw();
  }
  function collect() {
    const form = document.getElementById("proposal-form");
    if (!form || !draft) return;
    for (const input of form.querySelectorAll("[data-p-field]"))
      draft[input.dataset.pField] =
        input.type === "checkbox"
          ? input.checked
          : ["number", "range"].includes(input.type)
            ? Number(input.value)
            : input.value;
    draft.deliverables = [...form.querySelectorAll("[data-deliverable]")].map(
      (el) => ({
        name: el.querySelector('[name="deliverable-name"]').value,
        deadline: el.querySelector('[name="deliverable-deadline"]').value,
      }),
    );
    draft.timeline = [...form.querySelectorAll("[data-timeline]")].map(
      (el) => ({
        title: el.querySelector('[name="timeline-title"]').value,
        description: el.querySelector('[name="timeline-description"]').value,
      }),
    );
    draft.investment = [...form.querySelectorAll("[data-investment]")].map(
      (el) => ({
        title: el.querySelector('[name="investment-title"]').value,
        description: el.querySelector('[name="investment-description"]').value,
        amount: Number(el.querySelector('[name="investment-amount"]').value),
      }),
    );
    if (draft.calculateTotal) draft.value = proposalTotal(draft);
  }
  function syncControls() {
    const form = document.getElementById("proposal-form");
    if (!form) return;
    for (const input of form.querySelectorAll('input[type="range"]')) {
      form.querySelector(`[data-range-output="${input.name}"]`).textContent =
        input.value + input.dataset.suffix;
    }
    const total = document.getElementById("pe-total");
    if (total)
      total.textContent = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: draft.currency,
      }).format(proposalTotal(draft));
    const value = form.querySelector('[name="value"]');
    if (value) {
      value.readOnly = draft.calculateTotal;
      if (draft.calculateTotal) value.value = draft.value;
    }
    const color = document.getElementById("pe-color-value");
    if (color) color.textContent = draft.accent;
    for (const swatch of form.querySelectorAll(".pe-swatch")) {
      const selected =
        swatch.dataset.action === "proposal-color:" + draft.accent;
      swatch.classList.toggle("active", selected);
      swatch.setAttribute("aria-pressed", String(selected));
    }
  }
  function jumpPreview(id) {
    const frame = document.getElementById("proposal-preview");
    const target = frame?.contentDocument?.getElementById(id);
    if (!target) return;
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    document.querySelectorAll(".pe-document-nav button").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.action === "proposal-jump:" + id,
      );
    });
  }
  function draw() {
    clearTimeout(previewTimer);
    const previousForm = document.getElementById("proposal-form");
    const expanded = previousForm
      ? [...previousForm.querySelectorAll("details[open]")].map(
          (el) => el.dataset.section,
        )
      : editorSections;
    editorSections = expanded;
    const sidebarScroll = previousForm
      ? document.querySelector(".pe-sidebar")?.scrollTop || 0
      : sidebarPosition;
    sidebarPosition = sidebarScroll;
    const focusAction = document.activeElement?.dataset?.action;
    const oldFrame = document.getElementById("proposal-preview");
    previewScroll = oldFrame?.contentWindow?.scrollY || previewScroll;
    openModal(
      "Proposta comercial",
      proposalEditor(draft, {
        esc,
        mode,
        dirty,
        device,
        editable: canEdit(),
        saved: getState().proposals.some((p) => p.id === draft.id),
        linked: ctx.localOnly ? false : draft.leadId ? "existing" : "new",
      }),
      true,
    );
    const form = document.getElementById("proposal-form");
    if (form) {
      if (expanded)
        form.querySelectorAll("details").forEach((el) => {
          el.open = expanded.includes(el.dataset.section);
        });
      const sidebar = document.querySelector(".pe-sidebar");
      sidebar.scrollTop = sidebarScroll;
      // Let initial toggle events settle before responding to intentional section changes.
      requestAnimationFrame(() => {
        if (!form.isConnected) return;
        form.querySelectorAll("details").forEach((details) => {
          details.ontoggle = () => {
            if (details.open && details.dataset.section !== "interno")
              jumpPreview(details.dataset.section);
          };
        });
      });
      form.onsubmit = (e) => e.preventDefault();
      form.oninput = (e) => {
        if (e.target.type === "file") return;
        dirty = true;
        revision++;
        collect();
        syncControls();
        const status = document.getElementById("proposal-draft-state");
        if (status) status.textContent = "Alterações não salvas";
        clearTimeout(previewTimer);
        previewTimer = setTimeout(updatePreview, 180);
      };
      form.onchange = async (e) => {
        const key =
          e.target.dataset.proposalImage || e.target.dataset.proposalGallery;
        if (!key || uploading) return;
        const files = [...e.target.files];
        if (!files.length) return;
        uploading = true;
        const status = document.getElementById("proposal-draft-state");
        if (status) status.textContent = "Otimizando imagem…";
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
              readImage(file, key === "clientLogos" ? 25000 : 85000),
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
          revision++;
          draw();
          toast("Imagem pronta. Salve a proposta para guardar.");
        } catch (error) {
          toast(error.message);
          e.target.value = "";
        } finally {
          uploading = false;
          if (status?.isConnected)
            status.textContent = dirty
              ? "Alterações não salvas"
              : "Prévia atualizada";
        }
      };
    }
    updatePreview();
    if (focusAction)
      document
        .querySelector(`[data-action="${CSS.escape(focusAction)}"]`)
        ?.focus({ preventScroll: true });
  }
  function updatePreview() {
    const frame = document.getElementById("proposal-preview");
    if (!frame || !draft) return;
    const status = document.getElementById("proposal-draft-state");
    try {
      const scroll = frame.dataset.loaded
        ? frame.contentWindow.scrollY
        : previewScroll;
      frame.onload = async () => {
        await frame.contentDocument?.fonts?.ready;
        if (!frame.isConnected) return;
        frame.contentWindow.scrollTo({ top: scroll, behavior: "instant" });
        frame.dataset.loaded = "true";
        previewScroll = scroll;
      };
      frame.srcdoc = proposalDocument(
        { ...draft, name: draft.name || "Nome da proposta" },
        getState().workspace,
      ).replace("<head>", '<head><base href="about:srcdoc">');
    } catch {
      if (status)
        status.textContent = "Revise os campos para atualizar a prévia";
      return;
    }
    if (status)
      status.textContent = dirty
        ? "Alterações não salvas"
        : "Prévia atualizada";
  }
  async function persist() {
    if (!canEdit() || saving) return false;
    if (uploading) {
      toast("Aguarde a imagem terminar de carregar.");
      return false;
    }
    collect();
    if (!validateDraft()) return false;
    const savedRevision = revision;
    const previous = getState().proposals;
    saving = true;
    const saveButton = document.querySelector('[data-action="proposal-save"]');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.querySelector("span").textContent = "Salvando…";
    }
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
      if (!(await save())) {
        getState().proposals = previous;
        return false;
      }
      if (revision === savedRevision) {
        draft = structuredClone(candidate);
        dirty = false;
      }
      render();
      toast("Proposta salva.");
      return true;
    } catch (error) {
      getState().proposals = previous;
      toast(error.issues?.[0]?.message || error.message);
      return false;
    } finally {
      saving = false;
      if (saveButton?.isConnected) {
        saveButton.disabled = false;
        saveButton.querySelector("span").textContent = "Salvar proposta";
      }
    }
  }
  function validateDraft() {
    const invalid = document.querySelector("#proposal-form :invalid");
    if (invalid) {
      const details = invalid.closest("details");
      if (details) details.open = true;
      invalid.reportValidity();
      return false;
    }
    const result = proposalSchema.safeParse(draft);
    if (!result.success) {
      toast(result.error.issues[0].message);
      return false;
    }
    return true;
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
    if (
      !canEdit() &&
      !readOnly.includes(action) &&
      !action.startsWith("proposal-device-") &&
      !action.startsWith("proposal-jump:")
    ) {
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
          ...proposalSchema.parse(structuredClone(source)),
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
    if (action.startsWith("proposal-jump:")) {
      jumpPreview(action.slice(14));
      return true;
    }
    if (action.startsWith("proposal-device-")) {
      device = action.endsWith("mobile") ? "mobile" : "desktop";
      document.querySelector(".proposal-workbench").dataset.device = device;
      document.querySelectorAll(".pe-device button").forEach((button) => {
        const active = button.dataset.action === action;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      return true;
    }
    if (
      action.startsWith("proposal-color:") &&
      /^#[\da-f]{6}$/i.test(action.slice(15))
    ) {
      draft.accent = action.slice(15);
      document.querySelector('[name="accent"]').value = draft.accent;
      dirty = true;
      revision++;
      syncControls();
      updatePreview();
      return true;
    }
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
      if (uploading) {
        toast("Aguarde a imagem terminar de carregar.");
        return true;
      }
      if (!validateDraft()) return true;
      download(
        `${draft.name.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 80) || "proposta"}.html`,
        proposalDocument(draft, getState().workspace),
        "text/html;charset=utf-8",
      );
      toast("Página HTML exportada.");
      return true;
    }
    if (action === "proposal-print") {
      if (uploading) {
        toast("Aguarde a imagem terminar de carregar.");
        return true;
      }
      if (!validateDraft()) return true;
      const frame = document.createElement("iframe");
      frame.className = "print-frame";
      frame.title = "Impressão da proposta";
      frame.setAttribute("sandbox", "allow-same-origin allow-modals");
      document.body.append(frame);
      frame.onload = async () => {
        await frame.contentDocument.fonts.ready;
        await Promise.all(
          [...frame.contentDocument.images].map((image) =>
            image.decode().catch(() => {}),
          ),
        );
        frame.contentWindow.focus();
        frame.contentWindow.print();
        if (ctx.localOnly)
          toast(
            "Escolha ‘Salvar como PDF’ na impressão. Se a janela não abrir aqui, use esta página no Chrome ou Safari.",
          );
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
      draft.investment.push({ title: "", description: "", amount: 0 });
    if (action === "proposal-add-timeline" && draft.timeline.length < 8)
      draft.timeline.push({ title: "", description: "" });
    const move = action.match(
      /^proposal-move-(deliverable|investment|timeline):(\d+):(-?1)$/,
    );
    if (move) {
      const rows = draft[move[1] === "deliverable" ? "deliverables" : move[1]];
      const from = Number(move[2]),
        to = from + Number(move[3]);
      if (from >= 0 && from < rows.length && to >= 0 && to < rows.length)
        [rows[from], rows[to]] = [rows[to], rows[from]];
    }
    const remove = action.match(
      /^proposal-remove-(deliverable|investment|timeline|clientLogos|portfolio):(\d+)$/,
    );
    if (remove)
      draft[remove[1] === "deliverable" ? "deliverables" : remove[1]].splice(
        Number(remove[2]),
        1,
      );
    if (action.startsWith("proposal-image-remove:"))
      draft[action.slice(22)] = "";
    dirty = true;
    revision++;
    if (draft.calculateTotal) draft.value = proposalTotal(draft);
    draw();
    const added = action.match(
      /^proposal-add-(deliverable|investment|timeline)$/,
    );
    if (added)
      [...document.querySelectorAll(`[data-${added[1]}]`)]
        .at(-1)
        ?.querySelector("input")
        ?.focus();
    return true;
  }
  return {
    list,
    open,
    handle,
    isDirty: () => dirty && !!document.getElementById("proposal-preview"),
  };
}
