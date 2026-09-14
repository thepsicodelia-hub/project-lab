const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export function weekDates(today, offset=0) {
  const start=new Date(today.getFullYear(),today.getMonth(),today.getDate(),12);
  start.setDate(start.getDate()-(start.getDay()+6)%7+offset*7);
  return Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(d.getDate()+i);return d});
}
export function taskDateBadge(task,today,esc) {
  const now=iso(today),date=task.date;
  const tone=task.done?'complete':!date?'undated':date<now?'overdue':date===now?'today':'upcoming';
  const label=date?new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short'}).format(new Date(date+'T12:00:00')):'Sem prazo';
  return `<span class="task-date task-date-${tone}">${tone==='today'?'<i aria-hidden="true"></i>Hoje · ':tone==='overdue'?'Atrasada · ':''}${esc(label)}</span>`;
}
export function renderWeeklyPlanner(tasks,{today,offset,esc,icon,canEdit}) {
  const days=weekDates(today,offset),fmt=d=>new Intl.DateTimeFormat('pt-BR',{day:'numeric',month:'short'}).format(d);
  const start=iso(days[0]),end=iso(days[6]),weekTasks=tasks.filter(t=>t.date>=start&&t.date<=end);
  return `<section class="week-planner" aria-label="Planner semanal"><header class="week-toolbar"><div><h2>${fmt(days[0])} — ${fmt(days[6])}</h2><p>${weekTasks.length} tarefas · ${weekTasks.filter(t=>t.done).length} concluídas</p></div><div class="week-controls"><button class="btn" data-week-step="-1" aria-label="Semana anterior">${icon('chevron')}</button><button class="btn" data-week-step="today">Esta semana</button><button class="btn" data-week-step="1" aria-label="Próxima semana">${icon('chevron')}</button></div></header><div class="week-grid">${days.map(d=>{
    const date=iso(d),current=date===iso(today),items=tasks.filter(t=>t.date===date);
    return `<section class="week-day ${current?'is-today':''}"><header><span>${new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(d).replace('.','')}</span><strong ${current?'aria-current="date"':''}>${d.getDate()}</strong><small>${current?'Hoje':items.length?`${items.length} tarefa${items.length>1?'s':''}`:'Livre'}</small></header><div class="week-day-tasks">${items.map(t=>`<${canEdit?'button':'div'} class="week-task ${t.done?'is-done':''}" ${canEdit?`data-action="edit-task:${esc(t.id)}"`:''}><span class="week-task-state">${icon(t.done?'check':'clock')}${t.done?'Concluída':'Em aberto'}</span><strong>${esc(t.name)}</strong><small>${esc(t.project||'Sem projeto')}</small>${t.assignee?`<span class="week-assignee">${esc(t.assignee)}</span>`:''}</${canEdit?'button':'div'}>`).join('')||'<p class="week-empty">Sem tarefas</p>'}</div></section>`;
  }).join('')}</div>${tasks.some(t=>!t.date)?'<p class="form-hint">As tarefas sem prazo continuam disponíveis em Minhas tarefas.</p>':''}</section>`;
}
