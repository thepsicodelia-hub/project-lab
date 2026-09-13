/** The home screen prioritizes the next production decision, not a wall of tables. */
export function renderStudioDashboard({
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
  projectCard,
  taskRows,
}) {
  const month = isoDate(today).slice(0, 7),
    summary = financialSummary(state, month);
  const active = state.projects.filter((p) => p.stage !== 3);
  const completed = state.projects.length - active.length;
  const percent = Math.round((summary.revenue / state.goal) * 100),
    remaining = Math.max(0, state.goal - summary.revenue);
  const due = active
    .filter((p) => p.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const events = state.events
    .filter((e) => e.date >= isoDate(today))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);
  const stages = ["Pré-produção", "Captação", "Em edição", "Finalizado"];
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(today);
  const widget = (key, html) => `<div data-widget="${key}">${html}</div>`;
  const empty = (text) =>
    `<div class="studio-empty">${icon("check")}<p>${text}</p></div>`;
  const kpi = (title, value, sub, ic, tone) =>
    `<article class="studio-kpi ${tone}"><div class="studio-kpi-top"><span class="studio-icon">${icon(ic)}</span><span>${sub}</span></div><p>${title}</p><strong>${value}</strong></article>`;
  return (
    `<div class="studio-context"><span class="studio-signal"></span>${esc(state.workspace)}<span class="studio-context-divider">/</span>Central de produção</div>` +
    header(
      "Seu estúdio, em movimento.",
      `Cada ideia no seu próximo passo. ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}.`,
      btn("Personalizar", "dashboard-customize", "settings", "") +
        btn("Novo projeto", "new-project"),
    ) +
    widget(
      "stats",
      `<div class="studio-kpis">${kpi("Recebido no mês", money(summary.revenue), "Entradas confirmadas", "wallet", "mint")}${kpi("Projetos em andamento", String(active.length).padStart(2, "0"), `${completed} ${completed === 1 ? "finalizado" : "finalizados"}`, "film", "accent")}${kpi("Ainda a receber", money(summary.receivable), "Recebimentos pendentes", "clock", "sand")}</div>`,
    ) +
    `<div class="studio-dashboard-grid">${widget("goal", `<section class="panel studio-mission"><div class="studio-panel-heading"><div><span class="studio-section-icon">${icon("target")}</span><h2>Na direção da sua meta</h2></div>${btn("Editar meta", "goal", "settings", "small ghost")}</div><div class="mission-body"><div class="mission-orbit"><svg viewBox="0 0 220 220" role="img" aria-label="${percent}% da meta mensal"><circle class="orbit-track" cx="110" cy="110" r="88"/><circle class="orbit-progress" cx="110" cy="110" r="88" style="stroke-dashoffset:${553 * (1 - Math.min(100, percent) / 100)}"/></svg><div><strong>${percent}<span>%</span></strong><small>da meta mensal</small></div></div><div class="mission-ledger"><div><span><i class="ledger-dot mint"></i>Recebido</span><strong>${money(summary.revenue)}</strong></div><div><span><i class="ledger-dot accent"></i>Meta do mês</span><strong>${money(state.goal)}</strong></div><div><span><i class="ledger-dot sand"></i>Falta alcançar</span><strong>${money(remaining)}</strong></div></div></div><div class="mission-footer"><span>${icon(percent >= 100 ? "check" : "trend")}${percent >= 100 ? "Meta alcançada. Que venha a próxima." : "Cada entrega aproxima você do objetivo."}</span><a href="#goals">Ver objetivos ${icon("arrow")}</a></div></section>`)}
  ${widget(
    "agenda",
    `<section class="panel studio-agenda"><div class="studio-panel-heading"><div><span class="studio-section-icon">${icon("calendar")}</span><h2>No seu radar</h2></div><a class="studio-text-link" href="#calendar">Agenda ${icon("arrow")}</a></div><p class="studio-panel-intro">Os próximos encontros da produção.</p><div class="studio-event-list">${
      events
        .map((e) => {
          const d = new Date(e.date + "T12:00:00");
          return `<button class="studio-event" data-action="event:${e.id}"><span class="event-date"><strong>${d.getDate()}</strong><small>${new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "")}</small></span><span class="event-title"><strong>${esc(e.name)}</strong><small>${esc(e.type)} <span>·</span> ${esc(e.time)} ${e.client ? "· " + esc(e.client) : ""}</small></span>${icon("chevron")}</button>`;
        })
        .join("") || empty("Agenda livre por aqui. Reserve o próximo encontro.")
    }</div><div class="studio-agenda-bottom">${btn("Agendar compromisso", "new-event", "plus", "ghost")}</div></section>`,
  )}
  ${widget("production", `<section class="studio-production"><div class="studio-section-heading"><div><h2>A produção, de ponta a ponta.</h2><p>${state.projects.length} projetos. Um fluxo compartilhado.</p></div><a href="#projects" class="studio-text-link">Abrir quadro ${icon("arrow")}</a></div><div class="studio-stage-track">${stages.map((s, i) => `<a href="#projects" class="studio-stage stage-${i}"><span class="stage-label"><i></i>${s}</span><strong>${String(state.projects.filter((p) => p.stage === i).length).padStart(2, "0")}</strong><span class="stage-connector">${icon("arrow")}</span></a>`).join("")}</div></section>`)}
  ${widget("projects", `<section class="studio-projects"><div class="studio-section-heading"><div><h2>Projetos em foco</h2><p>As próximas entregas merecem atenção.</p></div><a href="#projects" class="studio-text-link">Ver projetos ${icon("arrow")}</a></div><div class="studio-focus-grid">${due.map(projectCard).join("") || empty("Nenhuma entrega com prazo marcado. Abra um projeto para definir a data.")}</div></section>`)}
  ${widget("tasks", `<section class="panel studio-tasks"><div class="studio-panel-heading"><div><span class="studio-section-icon">${icon("tasks")}</span><h2>Seu próximo passo</h2></div><a href="#tasks" class="studio-text-link">Todas as tarefas ${icon("arrow")}</a></div><div class="studio-task-list">${taskRows(state.tasks.filter((t) => !t.done).slice(0, 3)) || empty("Tudo em dia. Sua próxima ideia já pode começar.")}</div></section>`)}
  </div>`
  );
}
