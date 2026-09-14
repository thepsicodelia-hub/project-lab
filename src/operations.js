import { equipmentMetrics, projectMetrics } from "./operations-data.js";
import { safeWebsite } from "./proposal-data.js";
import "./operations.css";
import { equipmentCard,equipmentCategory } from "./atelier-ui.js";
import { progressRing } from './progress-ring.js';
import { personAvatar,mediaField,clientForProject,safeLocalImage } from './profile-media.js';
import { taskDateBadge } from './weekly-planner.js';
import { INVENTORY_CATEGORIES,inventoryVector,inventoryGroups } from './inventory-identity.js';

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
    teamPerson = "all",
    inventoryFilter = 'all',
    inventoryAnimation = null,
    pendingDelete = null;
  const inventoryFilterKey='project-lab-inventory-category';
  const validInventoryFilter=value=>value==='all'||INVENTORY_CATEGORIES.some(c=>c.id===value);
  try {const saved=localStorage.getItem(inventoryFilterKey);if(validInventoryFilter(saved))inventoryFilter=saved;} catch {}
  const rememberInventoryFilter=()=>{try{localStorage.setItem(inventoryFilterKey,inventoryFilter)}catch{}};
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
    `<div class="ops-metrics">${items.map(([label, value, description, tone='']) => `<div><span>${label}</span><strong class="${tone}">${value}</strong>${description ? `<small>${description}</small>` : ""}</div>`).join("")}</div>`;
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
      content = `<div class="clean-people">${state().team.map(m=>{
        const d = state().memberDetails.find(d=>d.id===m.id);
        const assigned = state().tasks.filter(t=>t.assignee===m.initials && !t.done).length;
        const productions = state().projects.filter(p=>p.team.includes(m.initials) && p.stage!==3).length;
        const department = state().departments.find(x=>x.id===d?.departmentId)?.name;
        return `<article class="clean-person"><div class="clean-person-heading">${personAvatar(m,esc,'clean-person-avatar')}<div><h2>${esc(m.name)}</h2><p>${esc(m.role || 'Função a definir')}</p></div></div><div class="clean-person-contact"><span>${esc(department || 'Sem departamento')}</span><span>${esc(d?.email || 'Contato não informado')}</span></div><dl class="clean-person-work"><div><dt>Produções ativas</dt><dd>${productions}</dd></div><div><dt>Tarefas abertas</dt><dd>${assigned}</dd></div></dl><div class="clean-person-actions">${btn('Ver tarefas','ops:team-filter:'+m.id,'tasks','small')}${canEdit()?btn('Editar','ops:edit:member:'+m.id,'settings','small'):''}</div></article>`;
      }).join('') || blank('Adicione as pessoas que fazem parte da sua produção.')}</div>`;
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
      const person = state().team.find(m=>m.id===teamPerson);
      const tasks = state().tasks.filter(t=>!person || t.assignee===person.initials);
      content = `<div class="clean-team-filter" aria-label="Filtrar tarefas por pessoa"><button data-action="ops:team-filter:all" aria-pressed="${!person}">Todas as pessoas</button>${state().team.map(m=>`<button data-action="ops:team-filter:${esc(m.id)}" aria-pressed="${m.id===teamPerson}">${personAvatar(m,esc)}${esc(m.name)}</button>`).join('')}</div><div class="team-task-summary"><h2>${person?esc(person.name):'Trabalho da equipe'}</h2><span>${tasks.filter(t=>!t.done).length} em aberto <i aria-hidden="true">·</i> ${tasks.filter(t=>t.done).length} concluídas</span></div>`+table(
        ["TAREFA", "PROJETO", "RESPONSÁVEL", "PRAZO", "SITUAÇÃO", ""],
        tasks.map((t) => [
          `<strong class="team-task-name">${esc(t.name)}</strong>`,
          esc(t.project),
          (()=>{const member=state().team.find(m=>m.initials===t.assignee);return member?`<span class="team-table-person">${personAvatar(member,esc)}<span>${esc(member.name)}</span></span>`:'<span class="muted">A definir</span>'})(),
          taskDateBadge(t,new Date(),esc),
          `<span class="badge ${t.done?'green':'amber'}">${t.done?'Concluída':'Em aberto'}</span>`,
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
        )}</div><section class="${teamTab==='members'?'clean-team-surface':'panel ops-table'}">${content}</section><p class="form-hint">Os cadastros organizam a produção. Para conceder acesso ao sistema, use Configurações → Acessos da equipe.</p>`
    );
  }
  function equipment() {
    inventoryAnimation?.cancel();
    const groups=inventoryGroups(state().equipment);
    const category=INVENTORY_CATEGORIES.find(c=>c.id===inventoryFilter);
    const visible=inventoryFilter==='all'?groups:groups.filter(c=>c.id===inventoryFilter);
    const items=visible.flatMap(c=>c.items),ids=new Set(items.map(e=>e.id));
    const total=items.reduce((n,e)=>n+e.value,0);
    const revenue=state().equipmentLinks.filter(link=>ids.has(link.equipmentId)).reduce((n,link)=>n+link.revenue,0);
    const filters=[{id:'all',label:'Todos',items:state().equipment},...groups];
    const label=category?.label||'Todo o inventário';
    const sections=visible.filter(c=>c.items.length).map(c=>`<section class="inventory-section" data-inventory-section="${c.id}" data-equipment-category="${c.id}" aria-labelledby="inventory-title-${c.id}"><header class="inventory-section-heading"><div><span class="inventory-section-symbol">${inventoryVector(c.id)}</span><div><h2 id="inventory-title-${c.id}">${c.label}<span>${c.items.length}</span></h2><p>${c.hint}</p></div></div>${canEdit()?btn('Adicionar','ops:new:equipment:'+c.id,'plus','small'):''}</header><div class="ops-equipment-grid">${c.items.map(e=>equipmentCard(e,equipmentMetrics(state(),e),{esc,money,btn,canEdit})).join('')}</div></section>`).join('');
    return (
      heading(
        "Inventário",
        "Cada peça no seu lugar. Encontre o que vai para o próximo set.",
        canEdit() ? btn("Novo equipamento", "ops:new:equipment") : "",
      ) +
      `<div class="inventory-browser"><div class="inventory-browser-heading"><strong>Explore por categoria</strong><span>Selecione para ver só os itens desse grupo.</span></div><div class="inventory-filters" role="group" aria-label="Categorias do inventário">${filters.map(c=>`<button type="button" class="inventory-filter" data-action="ops:inventory-filter:${c.id}" data-inventory-filter="${c.id}" data-equipment-category="${c.id}" aria-pressed="${inventoryFilter===c.id}" aria-controls="inventory-results" aria-label="${c.label}: ${c.items.length} ${c.items.length===1?'item':'itens'}"><span class="inventory-filter-art">${inventoryVector(c.id)}<span class="inventory-filter-count">${c.items.length}</span></span><span class="inventory-filter-label">${c.label}</span><span class="inventory-filter-selected" aria-hidden="true">${icon('check')}</span></button>`).join('')}</div></div>`+
      `<div id="inventory-results"><div class="inventory-selection-summary" role="status" aria-live="polite" aria-atomic="true"><span>${label}</span><span>${items.length} ${items.length===1?'item':'itens'}${category?' nesta categoria':' em '+groups.filter(c=>c.items.length).length+' categorias'}</span></div>`+
      metrics([
        [category?'Investimento da categoria':'Investimento total', money(total), 'Valor de compra dos itens exibidos', 'value-accent'],
        [
          "Receita atribuída",
          money(revenue),
          "Registros de utilização, não lançamentos de caixa",
          revenue>0?'value-positive':'',
        ],
        ["Itens exibidos", items.length + (items.length===1?' item':' itens'),category?'Somente '+category.label.toLowerCase():'Todas as categorias'],
      ]) +
      `<div class="inventory-sections">${sections||`<section class="inventory-empty" data-equipment-category="${category?.id||'all'}"><span>${inventoryVector(category?.id||'all')}</span><h2>${category?'Nenhum item em '+category.label.toLowerCase():'Seu kit começa aqui'}</h2><p>${category?'Cadastre o primeiro item desta categoria ou volte para todo o inventário.':'Cadastre seu primeiro equipamento para acompanhar uso e investimento.'}</p><div>${canEdit()?btn('Adicionar item','ops:new:equipment:'+(category?.id||'camera'),'plus',''):''}${category?btn('Ver todos','ops:inventory-filter:all','grid','text'):''}</div></section>`}</div></div>`
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
          ["Recebido", money(m.received), "Entradas confirmadas", m.received>0?'value-positive':''],
          ["Custos pagos", money(m.spent), "Saídas confirmadas", m.spent>0?'value-negative':''],
          ["Resultado de caixa", money(m.profit), m.profit>0?'Caixa positivo':m.profit<0?'Caixa negativo':'Sem movimentação líquida', m.profit>0?'value-positive':m.profit<0?'value-negative':''],
          [
            "Margem realizada",
            m.received ? m.margin.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:1}) + "%" : "—",
            "Resultado ÷ recebido",
            m.received && m.margin!==0 ? m.margin>0?'value-positive':'value-negative' : '',
          ],
        ]) +
        `<section class="clean-payment-summary" aria-label="Recebimento do contrato">${progressRing(m.received,Number(p.value),'Contrato recebido')}<div><h3>Recebimento do contrato</h3><p><span class="value-positive">${money(m.received)} recebido</span> de ${money(p.value)} contratado.</p><small>${p.value>0 ? money(Math.max(0,p.value-m.received))+' ainda não recebido.' : 'Defina o valor contratado para acompanhar o percentual.'}</small></div></section><p class="form-hint">Margem de caixa: considera somente valores recebidos e custos pagos. Horas e uso dos equipamentos são estimativas separadas.</p><h3 class="ops-subtitle">Receitas</h3>` +
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
      const resource = (symbol, name, description = "") =>
        `<div class="project-resource-row"><span>${icon(symbol)}</span><div>${esc(name)}${description ? `<small>${esc(description)}</small>` : ""}</div></div>`;
      content = `<section class="panel project-progress-panel"><div class="project-progress-heading"><h2>Da ideia à entrega</h2>${canEdit() ? btn("Editar projeto", "edit-project:" + id, "settings", "small") : ""}</div><div class="project-progress-value"><div class="project-progress-track"><span style="width:${p.progress}%"></span></div><span>${["Pré-produção", "Captação", "Em edição", "Finalizado"][p.stage]} · ${p.progress}%</span></div></section>
      <div class="project-overview-grid"><section class="panel project-finance-panel"><h2>${icon("wallet")}Financeiro do projeto</h2><div class="project-finance-main">${progressRing(m.received,Number(p.value),'Contrato recebido')}<div><small>Valor contratado</small><strong>${money(p.value)}</strong></div></div><div class="project-finance-rows"><div><span>Recebido</span><strong class="${m.received>0 ? 'value-positive' : ''}">${money(m.received)}</strong></div><div><span>Custos pagos</span><strong class="${m.spent>0 ? 'value-negative' : ''}">${money(m.spent)}</strong></div><div><span>Contrato ainda não recebido</span><strong>${money(Math.max(0, p.value - m.received))}</strong></div><div><span>Resultado de caixa</span><strong class="${m.profit>0 ? 'value-positive' : m.profit<0 ? 'value-negative' : ''}">${money(m.profit)}</strong></div></div>${btn("Ver financeiro do projeto", "ops:tab:finance", "arrow", "")}<p class="form-hint">Caixa considera somente receitas recebidas e custos pagos.</p></section>
      <div class="project-side-stack"><section class="panel"><h2>${icon("calendar")}Datas importantes</h2>${p.captureDates.map((date, i) => `<div class="project-date-row"><span>Captação · diária ${i + 1}</span><strong>${dateLabel(date)}</strong></div>`).join("")}<div class="project-date-row"><span>Entrega</span><strong>${dateLabel(p.date)}</strong></div><div class="project-date-row"><span>Tarefas concluídas</span><strong>${tasks.filter((t) => t.done).length} de ${tasks.length}</strong></div></section><section class="panel"><h2>${icon("clock")}Tempo dedicado</h2><p class="project-hours-total">${m.hours.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}<span class="muted"> h</span></p>${btn("Ver lançamentos", "ops:tab:hours", "arrow", "small")}</section></div>
      <section class="panel project-resource-panel" aria-label="Recursos do projeto"><div class="project-resource-group"><h2>${icon("users")}Equipe do projeto</h2><div class="project-resources">${
        p.team
          .map((initial) => {
            const person = state().team.find((m) => m.initials === initial);
            return person?`<div class="project-resource-row">${personAvatar(person,esc,'clean-resource-avatar')}<div>${esc(person.name)}<small>${esc(person.role||'')}</small></div></div>`:resource('users',initial);
          })
          .join("") ||
        '<p class="muted">Equipe a definir. Vincule pessoas ao editar o projeto.</p>'
      }</div></div>
      <div class="project-resource-group"><h2>${icon("camera")}Equipamentos</h2><div class="project-resources">${
        p.equipmentIds
          .map((eid) => {
            const equipment = state().equipment.find((e) => e.id === eid);
            return equipment
              ? resource(equipmentCategory(equipment.category), equipment.name, equipment.category)
              : "";
          })
          .join("") || '<p class="muted">Nenhum equipamento vinculado. Adicione os recursos usados nesta produção ao editar o projeto.</p>'
      }</div>${canEdit() ? btn('Vincular equipamentos','edit-project:'+id,'plus','small') : ''}</div></section>
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
    const client=clientForProject(state(),p),logo=safeLocalImage(client?.logo);
    const clientAction=canEdit()?btn(client?(logo?'Alterar imagem do cliente':'Adicionar imagem do cliente'):'Vincular cliente',client?'edit-client:'+client.id:'edit-project:'+p.id,'image','small'):'';
    return `<div class="project-workspace"><a href="#projects" class="project-back">${icon("arrow")}Voltar aos projetos</a><header class="project-workspace-heading"><span class="project-workspace-mark">${logo?`<img src="${logo}" width="64" height="64" alt="Logo de ${esc(p.client)}">`:esc((p.client || p.name).slice(0, 1))}</span><div><h1>${esc(p.name)}</h1><p><span class="badge blue">${["Pré-produção", "Captação", "Em edição", "Finalizado"][p.stage]}</span><span>${esc(p.client || "Cliente a definir")}</span><span>·</span><span>${esc(p.type)}</span><span>·</span><span>${dateLabel(p.date)}</span></p></div></header><div class="tabs ops-project-tabs">${[
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
      )}</div>${clientAction?`<div class="project-client-actions">${clientAction}<span>Logo e capa compartilhadas com Conexões.</span></div>`:''}<div class="project-workspace-content">${canEdit() && cta ? `<div class="ops-project-context">${cta}</div>` : ""}${content}</div></div>`;
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
      savedEquipmentId = '',
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
      const categoryLabels=INVENTORY_CATEGORIES.map(c=>c.label);
      const selectedCategory=row.category||INVENTORY_CATEGORIES.find(c=>c.id===(context||inventoryFilter))?.label||'Câmeras';
      if(!categoryLabels.includes(selectedCategory))categoryLabels.push(selectedCategory);
      after=()=>{if(inventoryFilter!=='all'){const saved=state().equipment.find(e=>e.id===savedEquipmentId);if(saved){inventoryFilter=equipmentCategory(saved.category);rememberInventoryFilter();}}render();};
      fields =
        name() +
        selectField(
          "Categoria",
          "category",
          categoryLabels,
          selectedCategory,
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
        field("Telefone", "phone", details.phone || "") +
        mediaField('Foto da pessoa','photo',row.photo,esc,'photo') +
        field('Cor da pessoa','color',row.color||'#9bc9ff','color');
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
        if(kind==='equipment')savedEquipmentId=next.id;
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
    if(verb==='inventory-filter') {
      if(!validInventoryFilter(kind))return true;
      inventoryFilter=kind;rememberInventoryFilter();render();
      document.querySelector(`[data-inventory-filter="${kind}"]`)?.focus({preventScroll:true});
      const results=document.querySelector('.inventory-sections');
      if(results?.animate&&document.body.dataset.effects==='on'&&document.body.dataset.inputModality!=='keyboard'&&!matchMedia('(prefers-reduced-motion: reduce)').matches)inventoryAnimation=results.animate([{opacity:.65,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.22,1,.36,1)'});
      return true;
    }
    if (verb === 'team-filter') {
      teamPerson = kind === 'all' || state().team.some(m=>m.id===kind) ? kind : 'all';
      teamTab = 'tasks'; render(); return true;
    }
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
