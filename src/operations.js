import { equipmentMetrics, projectMetrics } from "./operations-data.js";
import { safeWebsite } from "./proposal-data.js";
import "./operations.css";

export function createOperations(ctx) {
  const {
    getState,
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
    form,
    dateLabel,
    isoDate,
  } = ctx;
  let projectId = "",
    projectTab = "overview",
    teamTab = "members",
    pendingDelete = null;
  const state = () => getState(),
    uid = () => crypto.randomUUID();
  const blank = (text) => `<div class="ops-empty">${esc(text)}</div>`;
  const table = (labels, rows) =>
    rows.length
      ? `<div class="table-wrap"><table><thead><tr>${labels.map((x) => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : blank("Nenhum registro ainda. Use o botão acima para começar.");
  const actions = (kind, id) =>
    canEdit()
      ? `<div class="ops-actions">${btn("Editar", `ops:edit:${kind}:${id}`, "settings", "small")}${btn("Excluir", `ops:delete:${kind}:${id}`, "x", "small")}</div>`
      : "";
  const metrics = (items) =>
    `<div class="ops-metrics">${items.map(([label, value, description]) => `<div><span>${label}</span><strong>${value}</strong>${description ? `<small>${description}</small>` : ""}</div>`).join("")}</div>`;
  const projectOptions = () => [
    ["", "Selecione um projeto"],
    ...state().projects.map((p) => [p.id, p.name]),
  ];
  const urlLink = (url) =>
    safeWebsite(url)
      ? `<a class="text-link" href="${esc(safeWebsite(url))}" target="_blank" rel="noopener noreferrer">Abrir arquivo ${icon("arrow")}</a>`
      : '<span class="muted">Sem link</span>';
  const memberName = (id) =>
    state().team.find((m) => m.id === id)?.name || "Não informado";
  function heading(title, description, action = "") {
    return `<div class="page-header"><div><h1>${title}</h1><p>${description}</p></div><div class="page-actions">${action}</div></div>`;
  }
  function team() {
    let content = "",
      cta = "";
    if (teamTab === "members") {
      cta = btn("Adicionar pessoa", "ops:new:member");
      content = table(
        ["PESSOA", "FUNÇÃO", "DEPARTAMENTO", "CONTATO", ""],
        state().team.map((m) => {
          const d = state().memberDetails.find((d) => d.id === m.id);
          return [
            `<span class="ops-person"><span class="avatar">${esc(m.initials)}</span><strong>${esc(m.name)}</strong></span>`,
            esc(m.role),
            esc(
              state().departments.find((x) => x.id === d?.departmentId)?.name ||
                "—",
            ),
            esc(d?.email || "—"),
            actions("member", m.id),
          ];
        }),
      );
    } else if (teamTab === "suppliers") {
      cta = btn("Novo fornecedor", "ops:new:supplier");
      content = table(
        ["FORNECEDOR", "SERVIÇO", "E-MAIL", "TELEFONE", ""],
        state().suppliers.map((x) => [
          esc(x.name),
          esc(x.service),
          esc(x.email),
          esc(x.phone),
          actions("supplier", x.id),
        ]),
      );
    } else if (teamTab === "organization") {
      cta =
        btn("Novo departamento", "ops:new:department") +
        btn("Novo cargo", "ops:new:position", "plus", "");
      content = `<div class="ops-org">${
        state()
          .departments.map(
            (d) =>
              `<section><h2>${esc(d.name)}</h2><p class="muted">${esc(d.note)}</p><div class="ops-role-list">${
                state()
                  .positions.filter((p) => p.departmentId === d.id)
                  .map(
                    (p) =>
                      `<div><strong>${esc(p.name)}</strong>${actions("position", p.id)}</div>`,
                  )
                  .join("") || '<p class="muted">Nenhum cargo cadastrado.</p>'
              }</div><p>${state().memberDetails.filter((m) => m.departmentId === d.id).length} pessoa(s)</p>${actions("department", d.id)}</section>`,
          )
          .join("") || blank("Crie os departamentos reais do seu estúdio.")
      }</div>${
        state().positions.some((p) => !p.departmentId)
          ? `<h2 class="ops-subtitle">Cargos sem departamento</h2>${table(
              ["CARGO", ""],
              state()
                .positions.filter((p) => !p.departmentId)
                .map((p) => [esc(p.name), actions("position", p.id)]),
            )}`
          : ""
      }`;
    } else {
      cta = btn("Nova tarefa", "new-task");
      content = table(
        ["TAREFA", "PROJETO", "RESPONSÁVEL", "PRAZO", "SITUAÇÃO", ""],
        state().tasks.map((t) => [
          esc(t.name),
          esc(t.project),
          esc(
            state().team.find((m) => m.initials === t.assignee)?.name ||
              "A definir",
          ),
          dateLabel(t.date),
          t.done ? "Concluída" : "Em aberto",
          btn("Abrir", "edit-task:" + t.id, "arrow", "small"),
        ]),
      );
    }
    return (
      heading(
        "Equipe",
        "Pessoas, parceiros e responsabilidades.",
        canEdit() ? cta : "",
      ) +
      `<div class="tabs">${[
        ["members", "Pessoas"],
        ["suppliers", "Fornecedores"],
        ["organization", "Organização"],
        ["tasks", "Tarefas"],
      ]
        .map(
          ([id, label]) =>
            `<button class="${teamTab === id ? "active" : ""}" data-action="ops:team:${id}">${label}</button>`,
        )
        .join(
          "",
        )}</div><section class="panel ops-table">${content}</section><p class="form-hint">Os cadastros organizam a produção. Para conceder acesso ao sistema, use Configurações → Acessos da equipe.</p>`
    );
  }
  function equipment() {
    const total = state().equipment.reduce((n, e) => n + e.value, 0),
      revenue = state().equipmentLinks.reduce((n, e) => n + e.revenue, 0);
    return (
      heading(
        "Equipamentos",
        "Seu inventário e o retorno de cada diária.",
        canEdit() ? btn("Novo equipamento", "ops:new:equipment") : "",
      ) +
      metrics([
        ["Investimento", money(total)],
        [
          "Receita atribuída",
          money(revenue),
          "Registros de utilização, não lançamentos de caixa",
        ],
        ["Inventário", state().equipment.length + " itens"],
      ]) +
      `<div class="ops-equipment-grid">${
        state()
          .equipment.map((e) => {
            const m = equipmentMetrics(state(), e);
            return `<article class="panel ops-equipment"><div class="ops-equipment-top"><span class="tool-icon">${icon("camera")}</span><span class="badge">${esc(e.category)}</span></div><h2>${esc(e.name)}</h2><div class="ops-equipment-numbers"><div><small>Compra</small><strong>${money(e.value)}</strong></div><div><small>Custo / diária</small><strong>${money(m.dailyCost)}</strong></div></div><div class="mini-progress"><span style="width:${Math.min(100, m.recovered)}%"></span></div><p class="form-hint">${m.recovered.toFixed(1)}% recuperado · ${money(m.revenue)} atribuídos</p><p class="muted">${m.days} diárias usadas · ${e.life} de vida útil estimada</p><div class="ops-actions">${btn("Utilização", "ops:equipment:" + e.id, "calendar", "small")}${canEdit() ? btn("Editar", "ops:edit:equipment:" + e.id, "settings", "small") : ""}</div></article>`;
          })
          .join("") ||
        blank(
          "Cadastre seu primeiro equipamento para acompanhar a amortização.",
        )
      }</div>`
    );
  }
  function projectDetail(id, tab = "overview") {
    ctx.openProject(id, tab);
  }
  function projectPage(id, tab = "overview") {
    projectId = id;
    if (
      ![
        "overview",
        "tasks",
        "deliveries",
        "schedule",
        "materials",
        "hours",
        "finance",
      ].includes(tab)
    )
      tab = "overview";
    projectTab = tab;
    const p = state().projects.find((p) => p.id === id);
    if (!p)
      return (
        '<a class="project-back" href="#projects">Voltar aos projetos</a>' +
        blank("Este projeto não foi encontrado.")
      );
    const m = projectMetrics(state(), id),
      tasks = state().tasks.filter(
        (t) => t.projectId === id || (!t.projectId && t.project === p.name),
      );
    let content = "",
      cta = "";
    if (tab === "overview") {
      content =
        metrics([
          ["Valor contratado", money(p.value)],
          ["Recebido", money(m.received)],
          ["Resultado de caixa", money(m.profit)],
        ]) +
        `<div class="ops-overview"><section><h3>Briefing</h3><p class="ops-prose">${esc(p.note || "Adicione o briefing ao editar o projeto.").replace(/\n/g, "<br>")}</p><div class="detail-grid"><div><small>Cliente</small><strong>${esc(p.client || "A definir")}</strong></div><div><small>Entrega</small><strong>${dateLabel(p.date)}</strong></div><div><small>Captações</small><strong>${p.captureDates.map(dateLabel).join(", ") || "A definir"}</strong></div><div><small>Tarefas</small><strong>${tasks.filter((t) => t.done).length}/${tasks.length} concluídas</strong></div></div></section><section><h3>Recursos da produção</h3><p class="ops-prose">${p.team.map((initial) => esc(state().team.find((m) => m.initials === initial)?.name || initial)).join("<br>") || "Equipe a definir"}</p><p class="ops-prose">${p.equipmentIds.map((id) => esc(state().equipment.find((e) => e.id === id)?.name || "Equipamento removido")).join("<br>") || "Equipamentos a definir"}</p><div class="form-grid">${selectField(
          "Etapa do projeto",
          "ops-stage",
          ["Pré-produção", "Produção", "Pós-produção", "Concluído"].map(
            (v, i) => [i, v],
          ),
          p.stage,
          true,
        )}</div>${canEdit() ? btn("Atualizar etapa", "ops:stage", "check", "small") : ""}</section></div>`;
      cta = canEdit()
        ? btn("Editar projeto", "edit-project:" + id, "settings", "small")
        : "";
    } else if (tab === "tasks") {
      cta = btn("Nova tarefa", "ops:new:task");
      content = table(
        ["TAREFA", "RESPONSÁVEL", "PRAZO", "ESTADO", ""],
        tasks.map((t) => [
          esc(t.name),
          esc(
            state().team.find((m) => m.initials === t.assignee)?.name ||
              "A definir",
          ),
          dateLabel(t.date),
          t.done ? "Concluída" : "Em aberto",
          `<div class="ops-actions">${btn(t.done ? "Reabrir" : "Concluir", "ops:task-toggle:" + t.id, "check", "small")}${btn("Editar", "edit-task:" + t.id, "settings", "small")}${canEdit() ? btn("Excluir", "ops:delete:task:" + t.id, "x", "small") : ""}</div>`,
        ]),
      );
    } else if (tab === "deliveries") {
      cta = btn("Nova entrega", "ops:new:delivery");
      content = table(
        ["ENTREGA", "PRAZO", "SITUAÇÃO", "ARQUIVO", ""],
        state()
          .projectDeliveries.filter((x) => x.projectId === id)
          .map((x) => [
            esc(x.name),
            dateLabel(x.date),
            esc(x.status),
            urlLink(x.url),
            `<div class="ops-actions">${btn("Revisar", "ops:delivery:" + x.id, "file", "small")}${actions("delivery", x.id)}</div>`,
          ]),
      );
    } else if (tab === "materials") {
      cta = btn("Adicionar material", "ops:new:material");
      content = table(
        ["MATERIAL", "TIPO", "OBSERVAÇÕES", "LINK", ""],
        state()
          .projectMaterials.filter((x) => x.projectId === id)
          .map((x) => [
            esc(x.name),
            esc(x.kind),
            esc(x.note),
            urlLink(x.url),
            actions("material", x.id),
          ]),
      );
    } else if (tab === "hours") {
      cta = btn("Registrar horas", "ops:new:hour");
      content =
        metrics([
          ["Horas registradas", m.hours.toFixed(2) + " h"],
          [
            "Custo estimado",
            money(m.labor),
            "Não duplicado automaticamente no financeiro",
          ],
        ]) +
        table(
          ["ATIVIDADE", "PESSOA", "DATA", "HORAS", "CUSTO", ""],
          state()
            .projectHours.filter((x) => x.projectId === id)
            .map((x) => [
              esc(x.name),
              esc(memberName(x.memberId)),
              dateLabel(x.date),
              x.hours.toFixed(2),
              money(x.hours * x.rate),
              actions("hour", x.id),
            ]),
        );
    } else if (tab === "schedule") {
      const milestones = [
        ...p.captureDates.map((date, i) => ({
          date,
          name: `Captação · diária ${i + 1}`,
          description: p.client || "Produção",
        })),
        ...(p.date
          ? [{ date: p.date, name: "Entrega do projeto", description: p.name }]
          : []),
        ...state()
          .projectDeliveries.filter((d) => d.projectId === id && d.date)
          .map((d) => ({ date: d.date, name: d.name, description: d.status })),
        ...state()
          .events.filter(
            (e) => e.projectId === id && !e.id.startsWith("capture-"),
          )
          .map((e) => ({
            date: e.date,
            name: e.name,
            description: e.time + " · " + e.type,
          })),
      ].sort((a, b) => a.date.localeCompare(b.date));
      content = `<div class="project-schedule">${milestones.map((event) => `<article><time datetime="${event.date}">${dateLabel(event.date)}</time><div><strong>${esc(event.name)}</strong><p>${esc(event.description)}</p></div></article>`).join("") || blank("Defina as datas de captação e entrega ao editar o projeto.")}</div>`;
      cta = btn("Editar datas", "edit-project:" + id, "calendar", "");
    } else {
      cta =
        btn("Nova receita", "ops:finance:income") +
        btn("Novo custo", "ops:finance:cost", "plus", "");
      content =
        metrics([
          ["Recebido", money(m.received)],
          ["Custos pagos", money(m.spent)],
          ["Resultado de caixa", money(m.profit)],
          [
            "Margem realizada",
            m.received ? m.margin.toFixed(1) + "%" : "—",
            "Resultado ÷ recebido",
          ],
        ]) +
        `<p class="form-hint">Margem de caixa: considera somente valores recebidos e custos pagos. Horas e uso dos equipamentos são estimativas separadas.</p><h3 class="ops-subtitle">Receitas</h3>` +
        table(
          ["DESCRIÇÃO", "VALOR", "SITUAÇÃO", "DATA", ""],
          state()
            .income.filter((x) => x.projectId === id)
            .map((x) => [
              esc(x.name),
              money(x.value),
              esc(x.status),
              dateLabel(x.date),
              btn("Editar", "edit-income:" + x.id, "settings", "small"),
            ]),
        ) +
        `<h3 class="ops-subtitle">Custos</h3>` +
        table(
          ["DESCRIÇÃO", "VALOR", "SITUAÇÃO", "DATA", ""],
          state()
            .costs.filter((x) => x.projectId === id)
            .map((x) => [
              esc(x.name),
              money(x.value),
              x.paid ? "Pago" : "Pendente",
              dateLabel(x.date),
              btn("Editar", "edit-cost:" + x.id, "settings", "small"),
            ]),
        );
    }
    if (tab === "overview") {
      const paymentPercent = p.value
        ? Math.round((m.received / p.value) * 100)
        : 0;
      const resource = (symbol, name, description = "") =>
        `<div class="project-resource-row"><span>${icon(symbol)}</span><div>${esc(name)}${description ? `<small>${esc(description)}</small>` : ""}</div></div>`;
      content = `<section class="panel project-progress-panel"><div class="project-progress-heading"><h2>Da ideia à entrega</h2>${canEdit() ? btn("Editar projeto", "edit-project:" + id, "settings", "small") : ""}</div><div class="project-progress-value"><div class="project-progress-track"><span style="width:${p.progress}%"></span></div><span>${["Pré-produção", "Captação", "Em edição", "Finalizado"][p.stage]} · ${p.progress}%</span></div></section>
      <div class="project-overview-grid"><section class="panel project-finance-panel"><h2>${icon("wallet")}Financeiro do projeto</h2><div class="project-finance-main"><div class="ring-wrap"><svg viewBox="0 0 140 140" role="img" aria-label="${paymentPercent}% do contrato recebido"><circle class="ring-bg" cx="70" cy="70" r="57" fill="none" stroke-width="8"/><circle class="ring-fill" cx="70" cy="70" r="57" fill="none" stroke-width="8" style="stroke-dashoffset:${358 * (1 - Math.min(100, paymentPercent) / 100)}"/></svg><div class="ring-text"><strong>${paymentPercent}%</strong></div></div><div><small>Valor contratado</small><strong>${money(p.value)}</strong></div></div><div class="project-finance-rows"><div><span>Recebido</span><strong>${money(m.received)}</strong></div><div><span>Custos pagos</span><strong>${money(m.spent)}</strong></div><div><span>Contrato ainda não recebido</span><strong>${money(Math.max(0, p.value - m.received))}</strong></div><div><span>Resultado de caixa</span><strong>${money(m.profit)}</strong></div></div>${btn("Ver financeiro do projeto", "ops:tab:finance", "arrow", "")}<p class="form-hint">Caixa considera somente receitas recebidas e custos pagos.</p></section>
      <div class="project-side-stack"><section class="panel"><h2>${icon("calendar")}Datas importantes</h2>${p.captureDates.map((date, i) => `<div class="project-date-row"><span>Captação · diária ${i + 1}</span><strong>${dateLabel(date)}</strong></div>`).join("")}<div class="project-date-row"><span>Entrega</span><strong>${dateLabel(p.date)}</strong></div><div class="project-date-row"><span>Tarefas concluídas</span><strong>${tasks.filter((t) => t.done).length} de ${tasks.length}</strong></div></section><section class="panel"><h2>${icon("clock")}Tempo dedicado</h2><p class="project-hours-total">${m.hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}<span class="muted"> h</span></p>${btn("Ver lançamentos", "ops:tab:hours", "arrow", "small")}</section></div>
      <section class="panel"><h2>${icon("users")}Equipe do projeto</h2><div class="project-resources">${
        p.team
          .map((initial) => {
            const person = state().team.find((m) => m.initials === initial);
            return resource(
              "users",
              person?.name || initial,
              person?.role || "",
            );
          })
          .join("") ||
        '<p class="muted">Equipe a definir. Vincule pessoas ao editar o projeto.</p>'
      }</div></section>
      <section class="panel"><h2>${icon("camera")}Equipamentos</h2><div class="project-resources">${
        p.equipmentIds
          .map((eid) => {
            const equipment = state().equipment.find((e) => e.id === eid);
            return equipment
              ? resource("camera", equipment.name, equipment.category)
              : "";
          })
          .join("") || '<p class="muted">Nenhum equipamento vinculado.</p>'
      }</div></section>
      <section class="panel project-brief"><h2>${icon("file")}Briefing & direção</h2><p class="ops-prose">${esc(p.note || "Adicione o briefing ao editar o projeto.").replace(/\n/g, "<br>")}</p>${
        canEdit()
          ? `<div class="project-stage-actions">${selectField(
              "Etapa do projeto",
              "ops-stage",
              [
                ["0", "Pré-produção"],
                ["1", "Captação"],
                ["2", "Em edição"],
                ["3", "Finalizado"],
              ],
              p.stage,
            )}${btn("Atualizar etapa", "ops:stage", "check", "")}</div>`
          : ""
      }</section></div>`;
      cta = "";
    }
    return `<div class="project-workspace"><a href="#projects" class="project-back">${icon("arrow")}Voltar aos projetos</a><header class="project-workspace-heading"><span class="project-workspace-mark">${esc((p.client || p.name).slice(0, 1))}</span><div><h1>${esc(p.name)}</h1><p><span class="badge blue">${["Pré-produção", "Captação", "Em edição", "Finalizado"][p.stage]}</span><span>${esc(p.client || "Cliente a definir")}</span><span>·</span><span>${esc(p.type)}</span><span>·</span><span>${dateLabel(p.date)}</span></p></div></header><div class="tabs ops-project-tabs">${[
      ["overview", "Visão geral"],
      ["tasks", "Tarefas"],
      ["deliveries", "Entregas"],
      ["schedule", "Cronograma"],
      ["materials", "Materiais"],
      ["hours", "Horas"],
      ["finance", "Financeiro"],
    ]
      .map(
        ([key, label]) =>
          `<button aria-current="${tab === key ? "page" : "false"}" class="${tab === key ? "active" : ""}" data-action="ops:tab:${key}">${label}</button>`,
      )
      .join(
        "",
      )}</div><div class="project-workspace-content">${canEdit() && cta ? `<div class="ops-project-context">${cta}</div>` : ""}${content}</div></div>`;
  }
  function useEquipment(id) {
    const equipment = state().equipment.find((e) => e.id === id);
    if (!equipment) return;
    openModal(
      equipment.name,
      `<p class="form-hint">Associe as diárias e a receita atribuída. Os valores não criam receitas automaticamente no financeiro.</p><div class="toolbar">${canEdit() ? btn("Registrar utilização", "ops:new:usage:" + id) : ""}</div>${table(
        ["PROJETO", "DIÁRIAS", "RECEITA ATRIBUÍDA", ""],
        state()
          .equipmentLinks.filter((x) => x.equipmentId === id)
          .map((x) => [
            esc(
              state().projects.find((p) => p.id === x.projectId)?.name ||
                "Projeto removido",
            ),
            x.days,
            money(x.revenue),
            actions("usage", x.id),
          ]),
      )}<div class="form-actions">${canEdit() ? btn("Excluir equipamento", "ops:delete:equipment:" + id, "x", "danger") : ""}</div>`,
      true,
    );
  }
  function delivery(id) {
    const row = state().projectDeliveries.find((d) => d.id === id);
    if (!row) return;
    const url = safeWebsite(row.url);
    openModal(
      "Revisar · " + row.name,
      `<div class="ops-project-context"><span>${esc(row.status)}</span>${urlLink(row.url)}</div>${url && /\.(mp4|webm|mov)(\?|$)/i.test(url) ? `<video class="ops-video" controls preload="metadata" src="${esc(url)}"></video>` : '<div class="ops-empty">Abra o link para assistir ao vídeo. Links externos não recebem acesso automático do Project Lab.</div>'}<p class="ops-prose">${esc(row.note)}</p><div class="toolbar">${canEdit() ? btn("Adicionar comentário", "ops:new:feedback:" + id, "plus", "") : ""}${canEdit() ? btn("Alterar status", "ops:edit:delivery:" + id, "check", "") : ""}</div><div class="ops-feedback">${
        state()
          .deliveryFeedback.filter((f) => f.deliveryId === id)
          .map(
            (f) =>
              `<article><div><strong>${esc(f.author || "Equipe")}</strong><span class="badge">${esc(f.timecode || "Geral")}</span></div><p>${esc(f.comment).replace(/\n/g, "<br>")}</p><small>${esc(new Date(f.createdAt).toLocaleString("pt-BR"))}</small>${canEdit() ? btn("Remover", "ops:delete:feedback:" + f.id, "x", "small") : ""}</article>`,
          )
          .join("") || blank("Nenhum comentário registrado.")
      }</div><p class="form-hint">Revisão interna do estúdio. Nenhum comentário, convite ou aprovação é enviado ao cliente automaticamente.</p>`,
      true,
    );
  }
  const keys = {
    equipment: "equipment",
    member: "team",
    supplier: "suppliers",
    department: "departments",
    position: "positions",
    delivery: "projectDeliveries",
    material: "projectMaterials",
    hour: "projectHours",
    usage: "equipmentLinks",
    feedback: "deliveryFeedback",
    task: "tasks",
  };
  function edit(kind, id, context) {
    const key = keys[kind],
      row = state()[key]?.find((x) => x.id === id) || {};
    let fields = "",
      title = "",
      after = () => render();
    const name = (label = "Nome *") =>
      field(
        label,
        "name",
        row.name || "",
        "text",
        true,
        'required maxlength="150"',
      );
    const amount = (label, key, value = 0, extra = "") =>
      field(
        label,
        key,
        row[key] ?? value,
        "number",
        false,
        `min="0" max="10000000000" step="0.01" required ${extra}`,
      );
    if (kind === "equipment") {
      title = "Equipamento";
      fields =
        name() +
        selectField(
          "Categoria",
          "category",
          [
            "Câmeras",
            "Lentes",
            "Iluminação",
            "Áudio",
            "Estabilização",
            "Outros",
          ],
          row.category || "Câmeras",
        ) +
        amount("Valor de compra", "value") +
        field(
          "Vida útil (diárias)",
          "life",
          row.life || 120,
          "number",
          false,
          'min="1" max="10000000" step="1" required',
        ) +
        field(
          "Usos anteriores ao cadastro",
          "uses",
          row.uses || 0,
          "number",
          false,
          'min="0" max="10000000" step="1" required',
        );
    } else if (kind === "member") {
      title = "Pessoa";
      const details = state().memberDetails.find((d) => d.id === id) || {};
      fields =
        name() +
        field("Função", "role", row.role || "") +
        selectField(
          "Departamento",
          "departmentId",
          [
            ["", "Não definido"],
            ...state().departments.map((d) => [d.id, d.name]),
          ],
          details.departmentId || "",
        ) +
        field("E-mail", "email", details.email || "", "email") +
        field("Telefone", "phone", details.phone || "");
    } else if (kind === "supplier") {
      title = "Fornecedor";
      fields =
        name() +
        field("Serviço", "service", row.service || "") +
        field("E-mail", "email", row.email || "", "email") +
        field("Telefone", "phone", row.phone || "") +
        textarea("Observações", "note", row.note || "");
    } else if (kind === "department") {
      title = "Departamento";
      fields = name() + textarea("Responsabilidade", "note", row.note || "");
    } else if (kind === "position") {
      title = "Cargo";
      fields =
        name() +
        selectField(
          "Departamento",
          "departmentId",
          [
            ["", "Sem departamento"],
            ...state().departments.map((d) => [d.id, d.name]),
          ],
          row.departmentId || "",
          true,
        );
    } else if (kind === "delivery") {
      title = "Entrega";
      fields =
        name("Nome da entrega *") +
        field("Link do arquivo / vídeo", "url", row.url || "", "url", true) +
        field("Prazo", "date", row.date || "", "date") +
        selectField(
          "Situação (controle interno)",
          "status",
          ["Em produção", "Em revisão", "Ajustes solicitados", "Aprovada"],
          row.status || "Em produção",
        ) +
        textarea("Orientações", "note", row.note || "");
      after = () => projectDetail(projectId, "deliveries");
    } else if (kind === "material") {
      title = "Material";
      fields =
        name() +
        selectField(
          "Tipo",
          "kind",
          ["Briefing", "Referência", "Arquivo bruto", "Documento", "Outro"],
          row.kind || "Referência",
        ) +
        field("Link", "url", row.url || "", "url", true, "required") +
        textarea("Observações", "note", row.note || "");
      after = () => projectDetail(projectId, "materials");
    } else if (kind === "hour") {
      title = "Horas de trabalho";
      fields =
        name("Atividade *") +
        selectField(
          "Pessoa",
          "memberId",
          [["", "Não informada"], ...state().team.map((m) => [m.id, m.name])],
          row.memberId || "",
        ) +
        field(
          "Data *",
          "date",
          row.date || isoDate(new Date()),
          "date",
          false,
          "required",
        ) +
        field(
          "Horas *",
          "hours",
          row.hours || 1,
          "number",
          false,
          'min="0.01" max="24" step="0.01" required',
        ) +
        amount("Custo por hora", "rate");
      after = () => projectDetail(projectId, "hours");
    } else if (kind === "usage") {
      title = "Utilização do equipamento";
      fields =
        selectField(
          "Projeto *",
          "projectId",
          projectOptions(),
          row.projectId || projectId,
          true,
        ) +
        field(
          "Diárias *",
          "days",
          row.days || 1,
          "number",
          false,
          'min="1" max="10000" step="1" required',
        ) +
        amount("Receita atribuída ao equipamento", "revenue");
      after = () => useEquipment(row.equipmentId || context);
    } else if (kind === "feedback") {
      title = "Comentário da revisão";
      fields =
        field("Autor", "author", row.author || "Equipe") +
        field("Tempo no vídeo (ex.: 01:25)", "timecode", row.timecode || "") +
        textarea("Comentário *", "comment", row.comment || "").replace(
          "<textarea",
          "<textarea required",
        );
      after = () => delivery(row.deliveryId || context);
    } else if (kind === "task") {
      title = "Tarefa do projeto";
      fields =
        name("Título *") +
        selectField(
          "Responsável",
          "assignee",
          [["", "A definir"], ...state().team.map((m) => [m.initials, m.name])],
          row.assignee || "",
        ) +
        field(
          "Prazo",
          "date",
          row.date || isoDate(new Date()),
          "date",
          false,
          "required",
        );
      after = () => projectDetail(projectId, "tasks");
    }
    if (!fields) return;
    form(
      `${id ? "Editar" : "Novo registro"} · ${title}`,
      fields,
      (data) => {
        const next = { ...row, ...data, id: id || uid() };
        for (const key of [
          "value",
          "life",
          "uses",
          "hours",
          "rate",
          "days",
          "revenue",
        ])
          if (key in next) next[key] = Number(next[key]);
        if (
          ["delivery", "material"].includes(kind) &&
          next.url &&
          !safeWebsite(next.url)
        )
          throw new Error("Use um link http ou https válido.");
        if (["delivery", "material", "hour", "task"].includes(kind))
          next.projectId = row.projectId || projectId;
        if (kind === "task") {
          next.project =
            state().projects.find((p) => p.id === projectId)?.name || "";
          next.done = row.done || false;
        }
        if (kind === "usage") {
          if (!state().projects.some((p) => p.id === data.projectId))
            throw new Error("Selecione um projeto.");
          next.equipmentId = row.equipmentId || context;
        }
        if (kind === "feedback") {
          next.deliveryId = row.deliveryId || context;
          next.createdAt = row.createdAt || new Date().toISOString();
        }
        if (kind === "member") {
          next.initials = next.name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase();
          const details = {
            id: next.id,
            departmentId: data.departmentId,
            email: data.email,
            phone: data.phone,
          };
          state().memberDetails = state()
            .memberDetails.filter((d) => d.id !== next.id)
            .concat(details);
          if (row.initials && next.initials !== row.initials) {
            state().projects.forEach(
              (p) =>
                (p.team = p.team.map((v) =>
                  v === row.initials ? next.initials : v,
                )),
            );
            state().tasks.forEach((t) => {
              if (t.assignee === row.initials) t.assignee = next.initials;
            });
          }
        }
        const index = state()[key].findIndex((x) => x.id === next.id);
        if (index >= 0) state()[key][index] = next;
        else state()[key].push(next);
      },
      "Salvar",
      after,
    );
  }
  async function handle(action) {
    if (!action.startsWith("ops:")) return false;
    const [, verb, kind, id] = action.split(":");
    if (verb === "team") {
      teamTab = kind;
      render();
      return true;
    }
    if (verb === "tab") {
      projectDetail(projectId, kind);
      return true;
    }
    if (verb === "equipment") {
      useEquipment(kind);
      return true;
    }
    if (verb === "delivery") {
      delivery(kind);
      return true;
    }
    if (!canEdit()) {
      toast("Seu perfil permite apenas consultar.");
      return true;
    }
    if (verb === "new") {
      edit(kind, null, id);
      return true;
    }
    if (verb === "edit") {
      edit(kind, id);
      return true;
    }
    if (verb === "finance") {
      ctx.financialForm(kind === "cost", undefined, projectId);
      return true;
    }
    if (verb === "stage") {
      const p = state().projects.find((p) => p.id === projectId);
      p.stage = Number(document.querySelector('[name="ops-stage"]').value);
      p.progress = [15, 40, 75, 100][p.stage];
      if (await save()) {
        render();
        projectDetail(projectId);
        toast("Etapa atualizada.");
      }
      return true;
    }
    if (verb === "task-toggle") {
      const t = state().tasks.find((t) => t.id === kind);
      if (t) {
        t.done = !t.done;
        if (await save()) {
          render();
          projectDetail(projectId, "tasks");
        }
      }
      return true;
    }
    if (verb === "delete") {
      const row = state()[keys[kind]]?.find((x) => x.id === id);
      if (!row) return true;
      pendingDelete = { kind, id, row };
      openModal(
        "Excluir registro?",
        `<p>Excluir ${esc(row.name || row.comment || "este registro")}?</p><p class="form-hint">Esta ação também remove os vínculos internos associados. Lançamentos financeiros permanecem. Faça um backup para permitir recuperação.</p><div class="form-actions">${btn("Cancelar", "close", "x", "")}${btn("Confirmar exclusão", "ops:confirm-delete", "x", "danger")}</div>`,
      );
      return true;
    }
    if (verb === "confirm-delete" && pendingDelete) {
      const { kind, id, row } = pendingDelete;
      state()[keys[kind]] = state()[keys[kind]].filter((x) => x.id !== id);
      if (kind === "equipment") {
        state().equipmentLinks = state().equipmentLinks.filter(
          (x) => x.equipmentId !== id,
        );
        state().projects.forEach(
          (p) => (p.equipmentIds = p.equipmentIds.filter((x) => x !== id)),
        );
      }
      if (kind === "member") {
        state().memberDetails = state().memberDetails.filter(
          (x) => x.id !== id,
        );
        state().projects.forEach(
          (p) => (p.team = p.team.filter((x) => x !== row.initials)),
        );
        state().tasks.forEach((t) => {
          if (t.assignee === row.initials) t.assignee = "";
        });
      }
      if (kind === "department") {
        state().memberDetails.forEach((m) => {
          if (m.departmentId === id) m.departmentId = "";
        });
        state().positions.forEach((p) => {
          if (p.departmentId === id) p.departmentId = "";
        });
      }
      if (kind === "delivery")
        state().deliveryFeedback = state().deliveryFeedback.filter(
          (f) => f.deliveryId !== id,
        );
      if (await save()) {
        closeModal();
        render();
        toast("Registro excluído. Recuperação somente por backup anterior.");
      }
      pendingDelete = null;
      return true;
    }
    return true;
  }
  return { team, equipment, projectDetail, projectPage, handle };
}
