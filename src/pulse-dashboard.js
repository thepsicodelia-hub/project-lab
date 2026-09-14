import { progressRing } from './progress-ring.js';
import { eventTone } from './event-colors.js';
export function focusJourney(project) {
  if(!project)return '';
  const step=project.stage===0?0:project.stage===3?2:1;
  return `<div class="clean-journey" aria-label="Etapa atual da produção"><div class="journey-rail" aria-hidden="true"><span style="transform:scaleX(${step/2})" data-journey-progress="${step/2}"></span></div><ol>${['Planejar','Produzir','Entregar'].map((label,i)=>`<li class="journey-step ${i<step?'is-done':i===step?'is-current':''}" ${i===step?'aria-current="step"':''}><span class="journey-dot" aria-hidden="true">${i<step?'✓':i+1}</span><span>${label}</span></li>`).join('')}</ol><p>${['Briefing e preparação.','Captação em andamento.','O projeto está na edição.','Produção finalizada.'][project.stage]}</p></div>`;
}
/** A production desk, not a second data source: every number uses the demo state. */
export function renderStudioDashboard({state, btn, icon, esc, money, dateLabel, isoDate, today, financialSummary, monthlySeries, renderFinanceChart, taskRows}) {
  const current = isoDate(today);
  const summary = financialSummary(state, current.slice(0,7));
  const active = state.projects.filter(p=>p.stage!==3);
  const tasks = state.tasks.filter(t=>!t.done);
  const events = [...state.events].filter(e=>e.date>=current).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,3);
  const stages = ['Pré-produção','Captação','Em edição','Finalizado'];
  const goal = state.goal > 0 ? Math.round(summary.revenue / state.goal * 100) : 0;
  const capGoal = Math.max(0,Math.min(100,goal));
  const sectionHeading = (number,title,url,label) => `<div class="pulse-section-heading"><div><h2>${title}</h2></div><a href="#${url}">${label}${icon('arrow')}</a></div>`;
  const focusProject = [...active].sort((a,b)=>(a.date || '9999').localeCompare(b.date || '9999'))[0];
  return `<div class="pulse-home">
    <header class="clean-home-heading" data-reveal>
      <div><p class="clean-date-label">${new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(today)}</p><h1>Seu estúdio. <span>No seu ritmo.</span></h1><p>Entregas, resultados e próximos passos em um só lugar.</p></div>
      <div class="clean-home-actions">${btn('Personalizar','dashboard-customize','settings','text')}${btn('Novo projeto','new-project','plus')}</div>
    </header>
    <div class="clean-top-grid">
      <section class="clean-focus" aria-label="Próxima entrega"><div class="clean-focus-top"><span>Próxima entrega</span><a href="#projects">Ver produções ${icon('arrow')}</a></div>${focusProject ? `<button class="clean-focus-project" data-project="${esc(focusProject.id)}"><span class="clean-focus-symbol">${icon('film')}</span><span><strong>${esc(focusProject.name)}</strong><small>${esc(focusProject.client)} · ${dateLabel(focusProject.date)}</small></span>${icon('arrow')}</button><div class="clean-focus-progress"><span>${stages[focusProject.stage]}</span><strong>${focusProject.progress}% concluído</strong></div><div class="clean-focus-track"><span style="width:${focusProject.progress}%"></span></div>` : `<h2>Sua próxima ideia começa aqui.</h2><p>Crie uma produção para acompanhar suas entregas.</p>`}${focusJourney(focusProject)}</section>
    <section class="pulse-stat-strip" data-widget="stats" data-reveal aria-label="Indicadores do mês">
      <a class="clean-metric-active" href="#projects"><span>Produções ativas ${icon('film')}</span><strong>${String(active.length).padStart(2,'0')}</strong><small>Acompanhar entregas ${icon('arrow')}</small></a>
      <a class="clean-metric-received" href="#finance"><span>Recebido no mês ${icon('trend')}</span><strong>${money(summary.revenue)}</strong><small>Recebimentos confirmados ${icon('arrow')}</small></a>
      <a class="clean-metric-pending" href="#finance"><span>A receber ${icon('wallet')}</span><strong>${money(summary.receivable)}</strong><small>Valores pendentes ${icon('arrow')}</small></a>
      <a class="clean-metric-tasks" href="#tasks"><span>Tarefas em aberto ${icon('check')}</span><strong>${String(tasks.length).padStart(2,'0')}</strong><small>Planejar próximos passos ${icon('arrow')}</small></a>
    </section>
    </div>
    <section class="pulse-sequence" data-widget="production" data-reveal>${sectionHeading('01','Sequência de produção','projects','Todas as produções')}<div class="sequence-rail">${stages.map((s,i)=>{const items=state.projects.filter(p=>p.stage===i);return `<div class="sequence-stage stage-${i}"><div class="sequence-stage-title"><span class="sequence-index">0${i+1}</span><h3>${s}</h3><span>${items.length}</span></div><div class="sequence-items">${items.map(p=>`<button class="sequence-project" data-project="${esc(p.id)}"><span class="sequence-project-copy"><strong>${esc(p.name)}</strong><small>${esc(p.client)} · ${dateLabel(p.date)}</small></span><span class="sequence-progress" aria-label="${p.progress}% concluído">${p.progress}<small>%</small></span></button>`).join('') || '<p class="sequence-empty">Espaço para o próximo projeto.</p>'}</div></div>`}).join('')}</div></section>
    <div class="pulse-insights-grid"><div data-widget="projects">${renderFinanceChart(monthlySeries(state,today.getFullYear()),{year:today.getFullYear(),currency:state.currency || 'BRL',selectedMonth:today.getMonth()})}</div>
      <section class="pulse-agenda" data-widget="agenda" data-reveal>${sectionHeading('02','No radar','calendar','Agenda')}<div class="pulse-date"><strong>${String(today.getDate()).padStart(2,'0')}</strong><div><span>${new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(today)}</span><small>${new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(today)}</small></div></div><div class="pulse-events">${events.map(e=>`<button class="pulse-event event-tone-${eventTone(e)}" data-action="event:${esc(e.id)}"><span class="event-time">${esc(e.time)}<small>${dateLabel(e.date)}</small></span><span><strong>${esc(e.name)}</strong><small class="event-kind"><i aria-hidden="true"></i>${esc(e.type)}</small></span>${icon('chevron')}</button>`).join('') || '<p class="empty">Sua agenda está livre. Reserve o próximo encontro.</p>'}</div>${btn('Novo compromisso','new-event','plus','')}</section>
    </div>
    <div class="pulse-bottom-grid"><section class="pulse-task-panel" data-widget="tasks" data-reveal>${sectionHeading('03','Um passo de cada vez','tasks','Ver tarefas')}<div class="pulse-task-list">${taskRows(tasks.slice(0,4)) || '<p class="empty">Tudo em dia. Nenhuma tarefa pendente.</p>'}</div></section>
      <section class="pulse-goal" data-widget="goal" data-reveal>${sectionHeading('04','Sua próxima marca','goals','Metas')}<div class="pulse-goal-heading">${progressRing(summary.revenue,Number(state.goal),'Meta mensal')}<span>da meta mensal<br>${money(state.goal)}</span>${btn('Editar','goal','settings','text')}</div><div class="pulse-goal-meter" role="img" aria-label="${goal}% da meta mensal"><span style="width:${capGoal}%"></span>${Array.from({length:19},(_,i)=>`<i style="left:${(i+1)*5}%"></i>`).join('')}</div><p>${goal>=100 ? 'Meta alcançada. Seu trabalho chegou mais longe.' : `Faltam ${money(Math.max(0,state.goal-summary.revenue))} em recebimentos para alcançar a meta.`}</p></section></div>
    <nav class="pulse-shortcuts" data-reveal aria-label="Outras áreas"><a href="#commercial">${icon('trend')}<span>Transforme conversas em projetos<small>Negócios, propostas e oportunidades</small></span>${icon('arrow')}</a><a href="#equipment">${icon('camera')}<span>Tudo pronto para produzir<small>Inventário, diárias e retorno por equipamento</small></span>${icon('arrow')}</a><a href="#tools">${icon('tools')}<span>Abra sua bancada criativa<small>Ferramentas para o trabalho acontecer</small></span>${icon('arrow')}</a></nav>
  </div>`;
}
