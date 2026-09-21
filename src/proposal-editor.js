import { safeImage, proposalTotal } from "./proposal-data.js";

export const editorIcon = (name) => {
  const paths = {
    edit: '<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
    print: '<path d="M6 8V3h12v5M6 16H3V8h18v8h-3M6 13h12v8H6z"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 4-6 5 7"/>',
    text: '<path d="M4 5h16M12 5v15M8 20h8"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M3 6h.1M3 12h.1M3 18h.1"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    money:
      '<rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.1M18 12h.1"/>',
    studio: '<path d="M3 21V9l9-6 9 6v12M8 21v-6h8v6M8 9h.1M16 9h.1"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    monitor:
      '<rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M8 21h8"/>',
    phone:
      '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  };
  return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.edit}</svg>`;
};

export function proposalEditor(
  draft,
  { esc: e, mode, dirty, editable, saved, linked, device },
) {
  const icon = editorIcon;
  const button = (label, action, glyph, cls = "", extra = "") =>
    `<button type="button" class="pe-button ${cls}" data-action="proposal-${action}" ${extra}>${glyph ? icon(glyph) : ""}<span>${label}</span></button>`;
  const input = (label, key, type = "text", extra = "") =>
    `<label class="field">${label}<input data-p-field="${key}" name="${key}" type="${type}" value="${e(draft[key])}" ${extra}></label>`;
  const area = (label, key, max = 12000) =>
    `<label class="field full">${label}<textarea data-p-field="${key}" name="${key}" rows="3" maxlength="${max}">${e(draft[key])}</textarea></label>`;
  const select = (label, key, options) =>
    `<label class="field">${label}<select data-p-field="${key}" name="${key}">${options.map((o) => `<option ${draft[key] === o ? "selected" : ""}>${e(o)}</option>`).join("")}</select></label>`;
  const slider = (label, key, min, max, step, suffix = "") =>
    `<label class="field full pe-range"><span>${label}<output data-range-output="${key}">${e(draft[key])}${suffix}</output></span><input type="range" aria-label="${label}" data-p-field="${key}" name="${key}" min="${min}" max="${max}" step="${step}" value="${e(draft[key])}" data-suffix="${suffix}"></label>`;
  const upload = (label, key) =>
    `<div class="pe-upload full">${safeImage(draft[key]) ? `<img src="${draft[key]}" alt="${label}" class="${key === "coverImage" ? "" : "is-logo"}">` : `<div class="pe-upload-empty">${icon("image")}</div>`}<label class="pe-upload-pick"><input type="file" data-proposal-image="${key}" accept="image/png,image/jpeg,image/webp"><strong>${label}</strong><span>${draft[key] ? "Trocar imagem" : "Escolher imagem"} ${icon("plus")}</span></label>${draft[key] ? button("Remover", `image-remove:${key}`, "trash", "pe-icon-only", `aria-label="Remover ${label.toLowerCase()}"`) : ""}</div>`;
  const section = (key, title, hint, glyph, content, open = false) =>
    `<details class="pe-section" data-section="${key}" ${open ? "open" : ""}><summary>${icon(glyph)}<span><strong>${title}</strong><small>${hint}</small></span>${icon("down")}</summary><div class="form-grid">${content}</div></details>`;
  const rowInput = (label, name, value, type = "text", extra = "") =>
    `<label class="field">${label}<input name="${name}" value="${e(value)}" type="${type}" ${extra}></label>`;
  const rowArea = (label, name, value) =>
    `<label class="field full">${label}<textarea name="${name}" rows="2" maxlength="12000">${e(value)}</textarea></label>`;
  const rowTools = (kind, i, length) =>
    `<div class="pe-row-tools">${button("Subir", `move-${kind}:${i}:-1`, "up", "pe-icon-only", `aria-label="Mover ${i + 1} para cima" ${i === 0 ? "disabled" : ""}`)}${button("Descer", `move-${kind}:${i}:1`, "down", "pe-icon-only", `aria-label="Mover ${i + 1} para baixo" ${i === length - 1 ? "disabled" : ""}`)}${button("Remover", `remove-${kind}:${i}`, "trash", "pe-icon-only", `aria-label="Remover ${kind === "deliverable" ? "entrega" : kind === "timeline" ? "etapa" : "item"} ${i + 1}"`)}</div>`;
  const gallery = (title, key, limit) =>
    `<div class="full pe-gallery-field"><div class="pe-mini-heading"><span>${title}</span><small>${draft[key].length}/${limit}</small></div><div class="editor-gallery">${draft[key].map((v, i) => `<div><img src="${safeImage(v)}" alt="${e(title)} ${i + 1}">${button("Remover", `remove-${key}:${i}`, "trash", "pe-icon-only", `aria-label="Remover imagem ${i + 1} de ${e(title)}"`)}</div>`).join("")}<label class="pe-gallery-add">${icon("plus")}<span>Adicionar</span><input type="file" data-proposal-gallery="${key}" accept="image/png,image/jpeg,image/webp" multiple ${draft[key].length >= limit ? "disabled" : ""}></label></div></div>`;
  const total = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: draft.currency,
  }).format(proposalTotal(draft));
  const sections =
    section(
      "capa",
      "Capa e identidade",
      "A primeira impressão do projeto",
      "image",
      input(
        "Nome interno da proposta",
        "name",
        "text",
        'required maxlength="150"',
      ) +
        area("Título da apresentação", "headline", 150) +
        area("Subtítulo", "subtitle", 600) +
        input("Etiqueta da capa", "badge", "text", 'maxlength="80"') +
        input("Cliente", "client", "text", 'maxlength="500"') +
        input("Tipo de projeto", "projectType", "text", 'maxlength="500"') +
        input("Data / período", "period", "text", 'maxlength="500"') +
        upload("Imagem de capa", "coverImage") +
        slider("Enquadramento horizontal", "coverPosition", 0, 100, 1, "%") +
        slider("Escurecer imagem", "coverShade", 20, 80, 1, "%") +
        upload("Logo da capa", "coverLogo") +
        `<div class="field full"><span>Cor de destaque</span><div class="pe-colors">${[
          ["#d7ee78", "Lima"],
          ["#b4d4ff", "Azul"],
          ["#f8bb9d", "Pêssego"],
          ["#e6bbf0", "Orquídea"],
          ["#f6f6f4", "Branco"],
        ]
          .map(([color, name]) =>
            button(
              name,
              `color:${color}`,
              null,
              `pe-swatch ${draft.accent === color ? "active" : ""}`,
              `style="--swatch:${color}" aria-label="Cor ${name}" aria-pressed="${draft.accent === color}"`,
            ),
          )
          .join(
            "",
          )}<label class="pe-custom-color" title="Escolher outra cor"><input type="color" name="accent" data-p-field="accent" value="${draft.accent}" aria-label="Cor personalizada">${icon("plus")}</label><code id="pe-color-value">${draft.accent}</code></div></div>` +
        slider("Tamanho dos textos", "textScale", 0.8, 1.2, 0.05, "×"),
      true,
    ) +
    section(
      "escopo",
      "O projeto",
      "Contexto, objetivo e produção",
      "text",
      area("Título da seção", "introTitle", 150) +
        area("Objetivo do projeto", "objective") +
        area("O que vamos fazer", "scope") +
        input("Equipe prevista", "team", "text", 'maxlength="500"') +
        input(
          "Diárias de captação",
          "days",
          "number",
          'min="0" max="1000" step="1"',
        ),
    ) +
    section(
      "entregas",
      "Entregas",
      "Formatos e detalhes de cada entrega",
      "list",
      `<div class="full pe-repeater">${draft.deliverables.map((d, i) => `<div data-deliverable class="pe-repeat-item"><div class="pe-mini-heading"><span>Entrega ${String(i + 1).padStart(2, "0")}</span>${rowTools("deliverable", i, draft.deliverables.length)}</div>${rowInput("O que será entregue", "deliverable-name", d.name, "text", 'maxlength="500"')}${rowInput("Formato / prazo", "deliverable-deadline", d.deadline, "text", 'maxlength="500"')}</div>`).join("")}${button("Adicionar entrega", "add-deliverable", "plus", "pe-add", draft.deliverables.length >= 40 ? "disabled" : "")}</div>`,
    ) +
    section(
      "cronograma",
      "Cronograma",
      "O caminho até a entrega final",
      "clock",
      `<div class="full pe-repeater">${draft.timeline.map((d, i) => `<div data-timeline class="pe-repeat-item"><div class="pe-mini-heading"><span>Etapa ${String(i + 1).padStart(2, "0")}</span>${rowTools("timeline", i, draft.timeline.length)}</div>${rowInput("Nome da etapa", "timeline-title", d.title, "text", 'maxlength="500"')}${rowInput("Período / descrição", "timeline-description", d.description, "text", 'maxlength="500"')}</div>`).join("")}${button("Adicionar etapa", "add-timeline", "plus", "pe-add", draft.timeline.length >= 8 ? "disabled" : "")}</div>`,
    ) +
    section(
      "investimento",
      "Investimento",
      "Valores, pagamento e condições",
      "money",
      `<label class="pe-toggle full"><span><strong>Somar os itens</strong><small>Atualiza o valor total automaticamente</small></span><input type="checkbox" name="calculateTotal" data-p-field="calculateTotal" ${draft.calculateTotal ? "checked" : ""}><span class="pe-switch" aria-hidden="true"></span></label><div class="pe-total full"><span>Total da proposta</span><strong id="pe-total">${total}</strong></div>` +
        input(
          "Valor total",
          "value",
          "number",
          `min="0" max="10000000000" step="0.01" ${draft.calculateTotal ? "readonly" : ""}`,
        ) +
        select("Moeda", "currency", ["BRL", "USD", "EUR"]) +
        `<div class="full pe-repeater">${draft.investment.map((d, i) => `<div data-investment class="pe-repeat-item"><div class="pe-mini-heading"><span>Item ${String(i + 1).padStart(2, "0")}</span>${rowTools("investment", i, draft.investment.length)}</div>${rowInput("Etapa / serviço", "investment-title", d.title, "text", 'maxlength="500"')}${rowInput("Valor", "investment-amount", d.amount, "number", 'min="0" max="10000000000" step="0.01"')}${rowArea("O que está incluído", "investment-description", d.description)}</div>`).join("")}${button("Adicionar item", "add-investment", "plus", "pe-add", draft.investment.length >= 8 ? "disabled" : "")}</div>` +
        area("Condições de pagamento", "payment") +
        area("Termos do projeto", "terms"),
    ) +
    section(
      "estudio",
      "Estúdio e contato",
      "Sua marca e os próximos passos",
      "studio",
      upload("Logo do estúdio", "studioLogo") +
        area("Sobre o estúdio", "about") +
        input(
          "E-mail comercial",
          "commercialEmail",
          "email",
          'maxlength="500"',
        ) +
        input(
          "Site do estúdio",
          "website",
          "text",
          'maxlength="500" placeholder="seuestudio.com.br"',
        ) +
        `<p class="pe-hint full">O botão “Vamos conversar” abre o e-mail comercial ou, se estiver vazio, o site do estúdio.</p>` +
        gallery("Logos de clientes", "clientLogos", 6) +
        slider("Altura dos logos", "logoSize", 20, 120, 1, "px") +
        gallery("Imagens do portfólio", "portfolio", 5),
    ) +
    section(
      "interno",
      "Controle interno",
      "Contato do cliente e andamento",
      "list",
      input("E-mail do cliente", "email", "email", 'maxlength="500"') +
        input("Telefone do cliente", "phone", "text", 'maxlength="500"') +
        select("Status da proposta", "status", [
          "Rascunho",
          "Enviada",
          "Aprovada",
          "Recusada",
        ]) +
        `<p class="pe-hint full">Essas informações ficam no editor e não aparecem na apresentação.</p>`,
    );

  return `<div class="proposal-workbench" data-mode="${mode}" data-device="${device}"><div class="pe-toolbar"><div class="pe-modes" aria-label="Modo do editor">${button("Editar", "mode-edit", "edit", mode === "edit" ? "active" : "", `aria-pressed="${mode === "edit"}" ${editable ? "" : "disabled"}`)}${button("Visualizar", "mode-preview", "eye", mode === "preview" ? "active" : "", `aria-pressed="${mode === "preview"}"`)}</div><div class="pe-actions">${button("Exportar HTML", "export", "download", "pe-export")}${button("PDF", "print", "print")}${editable ? button("Salvar proposta", "save", "check", "pe-primary") : ""}</div></div><div class="pe-layout">${mode === "edit" ? `<aside class="pe-sidebar"><div class="pe-sidebar-heading"><span>Personalizar proposta</span><small>Modelo Horizonte</small></div><form id="proposal-form">${sections}</form><p class="pe-hint pe-storage">JPG, PNG ou WebP · Imagens otimizadas ao enviar.<br>Até 1 MB de dados por estúdio.</p></aside>` : ""}<section class="pe-preview-area" aria-label="Apresentação"><div class="pe-preview-toolbar"><span class="pe-live"><i></i><span id="proposal-draft-state" role="status">${dirty ? "Alterações não salvas" : "Prévia atualizada"}</span></span><div class="pe-device">${button("Desktop", "device-desktop", "monitor", device === "desktop" ? "active" : "", `aria-label="Prévia desktop" title="Prévia desktop" aria-pressed="${device === "desktop"}"`)}${button("Celular", "device-mobile", "phone", device === "mobile" ? "active" : "", `aria-label="Prévia no celular" title="Prévia no celular" aria-pressed="${device === "mobile"}"`)}</div></div><div class="pe-preview-stage"><div class="pe-document-shell"><iframe id="proposal-preview" title="Prévia da proposta" sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div></div><nav class="pe-document-nav" aria-label="Ir para seção da prévia">${[
    ["capa", "Capa"],
    ["escopo", "Projeto"],
    ["entregas", "Entregas"],
    ["cronograma", "Cronograma"],
    ["investimento", "Investimento"],
    ["estudio", "Estúdio"],
  ]
    .filter(
      ([id]) =>
        (id !== "entregas" ||
          draft.deliverables.some((row) => row.name.trim())) &&
        (id !== "cronograma" || draft.timeline.some((row) => row.title.trim())),
    )
    .map(([id, label]) =>
      button(
        label,
        `jump:${id}`,
        null,
        "",
        `aria-label="Ver ${label.toLowerCase()} na prévia"`,
      ),
    )
    .join(
      "",
    )}</nav></section></div><div class="pe-bottom"><span>${editable ? "Personalize, revise e salve sua proposta." : "Modo de consulta"}</span><div>${editable && linked ? button(linked === "existing" ? "Abrir oportunidade" : "Criar oportunidade", "lead", "arrow") : ""}${editable && saved ? button("Excluir proposta", "delete", "trash", "pe-muted-button") : ""}</div></div></div>`;
}
