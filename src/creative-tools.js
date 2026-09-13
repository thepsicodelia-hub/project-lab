import { readImage } from "./media.js";
import {
  serializedBytes,
  WORKSPACE_BYTE_LIMIT,
  safeImage,
} from "./proposal-data.js";
import "./creative-tools.css";

export function createCreativeTools(ctx) {
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
    form,
  } = ctx;
  let current = "",
    draft = [],
    dirty = false,
    pendingDelete = null;
  const uid = () => crypto.randomUUID();
  const projectOptions = () => [
    ["", "Sem projeto"],
    ...getState().projects.map((p) => [p.id, p.name]),
  ];
  const description = {
    script: ["Roteiros", "Escreva e organize roteiros por projeto."],
    callsheet: [
      "Ordens do dia",
      "Tudo o que a equipe precisa para a gravação.",
    ],
  };
  function library(type) {
    current = type;
    const key = type === "script" ? "scripts" : "callsheets";
    openModal(
      description[type][0],
      `<div class="toolbar"><p class="muted">${description[type][1]}</p>${canEdit() ? btn("Criar documento", `creative:new:${type}`) : ""}</div><div class="creative-library">${
        getState()
          [key].map(
            (d) =>
              `<div><div><strong>${esc(d.name)}</strong><p class="muted">${esc(getState().projects.find((p) => p.id === d.projectId)?.name || "Sem projeto")}</p></div><div class="ops-actions">${btn("Abrir", `creative:edit:${type}:${d.id}`, "file", "small")}${canEdit() ? btn("Excluir", `creative:delete:${type}:${d.id}`, "x", "small") : ""}</div></div>`,
          )
          .join("") ||
        '<div class="ops-empty">Nenhum documento salvo. Crie o primeiro para começar.</div>'
      }</div>`,
      true,
    );
  }
  function documentEditor(type, id) {
    const key = type === "script" ? "scripts" : "callsheets",
      row = getState()[key].find((x) => x.id === id) || {
        id: uid(),
        name: "",
        projectId: "",
      };
    const content =
      field(
        "Nome do documento *",
        "name",
        row.name,
        "text",
        true,
        'required maxlength="150"',
      ) +
      selectField(
        "Projeto",
        "projectId",
        projectOptions(),
        row.projectId,
        true,
      ) +
      (type === "script"
        ? textarea(
            "Roteiro · cenas, narração e direção",
            "content",
            row.content || getState().script,
          )
        : field("Data", "date", row.date || "", "date") +
          field("Apresentação da equipe", "time", row.time || "08:00", "time") +
          field("Locação", "location", row.location || "", "text", true) +
          textarea(
            "Cronograma · horário e atividade",
            "timeline",
            row.timeline || "",
          ) +
          textarea(
            "Equipe · nomes, funções e contatos",
            "crew",
            row.crew || "",
          ) +
          textarea(
            "Orientações · transporte, figurino e segurança",
            "notes",
            row.notes || "",
          ));
    openModal(
      type === "script" ? "Editor de roteiro" : "Ordem do dia",
      `<form id="creative-document"><div class="form-grid">${content}</div><div class="form-actions">${btn("Baixar texto", "creative:export-document", "download", "")}${canEdit() ? '<button class="btn primary" type="submit">Salvar documento</button>' : ""}</div></form>`,
      true,
    );
    const editor = document.getElementById("creative-document");
    editor.dataset.type = type;
    editor.dataset.id = row.id;
    editor.oninput = () => (dirty = true);
    if (!canEdit())
      editor
        .querySelectorAll("input,textarea,select")
        .forEach((x) => (x.disabled = true));
    editor.onsubmit = async (e) => {
      e.preventDefault();
      if (!canEdit()) return;
      const d = { ...row, ...Object.fromEntries(new FormData(editor)) };
      d.name = d.name.trim();
      if (!d.name) return;
      getState()[key] = getState()
        [key].filter((x) => x.id !== d.id)
        .concat(d);
      if (await save()) {
        dirty = false;
        toast("Documento salvo.");
        render();
        library(type);
      }
    };
  }
  function collect() {
    if (current === "moodboard")
      document.querySelectorAll("[data-mood-caption]").forEach((el) => {
        const item = draft.find((x) => x.id === el.dataset.moodCaption);
        if (item) item.caption = el.value;
      });
    if (current === "storyboard")
      document.querySelectorAll("[data-story-frame]").forEach((el) => {
        const item = draft.find((x) => x.id === el.dataset.storyFrame);
        if (item) {
          item.shot = el.querySelector('input[name="shot"]').value;
          item.scene = el.querySelector("textarea").value;
        }
      });
  }
  function gallery() {
    const isMood = current === "moodboard";
    openModal(
      isMood ? "Moodboard" : "Storyboard",
      `<div class="toolbar"><p class="muted">${isMood ? "Referências visuais salvas no estúdio." : "Planeje a sequência de cenas, imagens e enquadramentos."}</p>${canEdit() ? (isMood ? '<label class="btn">Adicionar imagens<input class="creative-file" id="creative-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>' : btn("Adicionar cena", "creative:add-frame")) : ""}</div><div id="creative-gallery" class="${isMood ? "creative-mood-grid" : "creative-story-grid"}">${draft.map((row, i) => (isMood ? `<article>${safeImage(row.image) ? `<img src="${row.image}" alt="Referência ${i + 1}">` : ""}<label class="field">Legenda<input data-mood-caption="${row.id}" value="${esc(row.caption)}" maxlength="500"></label>${canEdit() ? btn("Remover", `creative:remove-image:${row.id}`, "x", "small") : ""}</article>` : `<article data-story-frame="${row.id}"><div class="story-frame-heading"><strong>Cena ${String(i + 1).padStart(2, "0")}</strong><div class="ops-actions">${canEdit() && i ? btn("Subir", `creative:move-frame:${row.id}`, "up", "small") : ""}${canEdit() ? btn("Remover", `creative:remove-image:${row.id}`, "x", "small") : ""}</div><label class="creative-frame-image">${safeImage(row.image) ? `<img src="${row.image}" alt="Cena ${i + 1}">` : "<span>Adicionar enquadramento</span>"}${canEdit() ? `<input class="creative-file" type="file" data-frame-upload="${row.id}" accept="image/jpeg,image/png,image/webp">` : ""}</label>${field("Enquadramento", "shot", row.shot)}${textarea("Ação, áudio e direção", "scene", row.scene)}</article>`)).join("") || '<div class="ops-empty">Adicione a primeira referência para começar.</div>'}</div><p class="form-hint">${dirty ? "Alterações não salvas. " : ""}JPG, PNG ou WebP compactados localmente. Limite total do estúdio: 1 MB. Sem busca de imagens ou API paga.</p><div class="form-actions">${btn("Exportar página HTML", "creative:export-gallery", "download", "")}${canEdit() ? btn("Salvar", "creative:save-gallery", "check") : ""}</div>`,
      true,
    );
    const galleryElement = document.getElementById("creative-gallery");
    galleryElement.oninput = () => (dirty = true);
    if (!canEdit())
      document
        .querySelectorAll("#creative-gallery input,#creative-gallery textarea")
        .forEach((x) => (x.disabled = true));
    const upload = async (files, id) => {
      collect();
      try {
        if (!id && draft.length + files.length > 20)
          throw new Error("Use até 20 referências no moodboard.");
        const images = await Promise.all(
          files.map((file) => readImage(file, 50000)),
        );
        if (!galleryElement.isConnected) return;
        collect();
        const next = structuredClone(draft);
        if (id) next.find((x) => x.id === id).image = images[0];
        else
          next.push(
            ...images.map((image) => ({ id: uid(), image, caption: "" })),
          );
        const key = isMood ? "moodboard" : "storyFrames";
        if (
          serializedBytes({ ...getState(), [key]: next }) > WORKSPACE_BYTE_LIMIT
        )
          throw new Error(
            "Limite de 1 MB atingido. Remova referências ou reduza as imagens.",
          );
        draft = next;
        dirty = true;
        gallery();
        toast("Imagem adicionada. Salve para guardar.");
      } catch (error) {
        toast(error.message);
      }
    };
    const input = document.getElementById("creative-upload");
    if (input) input.onchange = (e) => upload([...e.target.files]);
    document.querySelectorAll("[data-frame-upload]").forEach(
      (input) =>
        (input.onchange = (e) => {
          if (e.target.files.length)
            upload([...e.target.files], input.dataset.frameUpload);
        }),
    );
  }
  function open(type) {
    dirty = false;
    if (["script", "callsheet"].includes(type)) {
      library(type);
      return true;
    }
    if (["moodboard", "storyboard"].includes(type)) {
      current = type;
      draft = structuredClone(
        getState()[type === "moodboard" ? "moodboard" : "storyFrames"],
      );
      gallery();
      return true;
    }
    return false;
  }
  async function handle(action) {
    if (!action.startsWith("creative:")) return false;
    const [, verb, type, id] = action.split(":");
    if (verb === "edit") {
      documentEditor(type, id);
      return true;
    }
    if (verb === "export-document") {
      const editor = document.getElementById("creative-document");
      const elements = [...editor.querySelectorAll("[name]")];
      const rows = elements.map(
        (x) =>
          `${x.closest("label")?.childNodes[0]?.textContent || x.name}\n${x.value}`,
      );
      download(
        "documento-project-lab.txt",
        rows.join("\n\n"),
        "text/plain;charset=utf-8",
      );
      return true;
    }
    if (verb === "export-gallery") {
      collect();
      download(
        `${current}.html`,
        `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${current === "moodboard" ? "Moodboard" : "Storyboard"}</title><style>body{max-width:1100px;margin:40px auto;padding:20px;font:16px/1.5 system-ui;color:#172030}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px}img{width:100%;height:230px;object-fit:contain;background:#f0f2f5}article{break-inside:avoid}p{white-space:pre-wrap}h1{letter-spacing:-.04em}</style><h1>${esc(getState().workspace)} · ${current === "moodboard" ? "Moodboard" : "Storyboard"}</h1><main>${draft.map((x, i) => `<article>${safeImage(x.image) ? `<img src="${x.image}" alt="Referência ${i + 1}">` : ""}<h2>${esc(x.shot || x.caption || `Referência ${i + 1}`)}</h2><p>${esc(x.scene || "")}</p></article>`).join("")}</main></html>`,
        "text/html;charset=utf-8",
      );
      return true;
    }
    if (!canEdit()) {
      toast("Seu perfil permite apenas consultar.");
      return true;
    }
    if (verb === "new") {
      documentEditor(type);
      return true;
    }
    if (verb === "delete") {
      pendingDelete = { type, id };
      openModal(
        "Excluir documento?",
        `<p>O documento será removido. Exporte uma cópia se quiser guardá-lo.</p><div class="form-actions">${btn("Cancelar", "close", "x", "")}${btn("Confirmar exclusão", "creative:confirm-delete", "x", "danger")}</div>`,
      );
      return true;
    }
    if (verb === "confirm-delete" && pendingDelete) {
      const key = pendingDelete.type === "script" ? "scripts" : "callsheets";
      getState()[key] = getState()[key].filter(
        (x) => x.id !== pendingDelete.id,
      );
      if (await save()) {
        library(pendingDelete.type);
        toast("Documento excluído. Recuperação somente por backup anterior.");
      }
      return true;
    }
    collect();
    if (verb === "save-gallery") {
      getState()[current === "moodboard" ? "moodboard" : "storyFrames"] =
        structuredClone(draft);
      if (await save()) {
        dirty = false;
        gallery();
        toast("Salvo no estúdio.");
      }
      return true;
    }
    if (verb === "add-frame") {
      if (draft.length >= 40) {
        toast("Use até 40 cenas neste storyboard.");
        return true;
      }
      draft.push({ id: uid(), shot: "", scene: "", image: "" });
    }
    if (verb === "remove-image") draft = draft.filter((x) => x.id !== type);
    if (verb === "move-frame") {
      const index = draft.findIndex((x) => x.id === type);
      if (index > 0)
        [draft[index - 1], draft[index]] = [draft[index], draft[index - 1]];
    }
    dirty = true;
    gallery();
    return true;
  }
  return {
    open,
    handle,
    isDirty: () =>
      dirty && !!document.querySelector("#creative-gallery,#creative-document"),
  };
}
