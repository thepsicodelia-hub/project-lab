import {received,outstanding} from './data.js';

export function distributionRows(state,{period='',metric='received',group='client'}={}) {
  const totals=new Map();
  for(const row of state.income) {
    if(metric==='received'&&(!row.paidDate||(period&&!row.paidDate.startsWith(period))))continue;
    const value=metric==='pending'?outstanding(row):received(row);
    if(!(value>0))continue;
    const project=state.projects.find(p=>p.id===row.projectId);
    const client=state.clients.find(c=>c.id===project?.clientId)||state.clients.find(c=>c.name===(project?.client||row.client));
    const label=group==='project'?(project?.name||'Sem projeto'):(client?.name||project?.client||row.client||'Sem cliente');
    // IDs distinguish homonyms; old unlinked rows still group by the visible name.
    const key=group==='project'?(project?.id||'unassigned'):(client?.id||label);
    const current=totals.get(key)||{key,label,value:0};current.value+=value;totals.set(key,current);
  }
  return [...totals.values()].sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
}
const tones=['var(--status-violet)','var(--status-cyan)','var(--positive)','var(--status-amber)','var(--negative)','var(--blue)'];
export function renderDistribution(state,{period,metric,group,esc,money}) {
  const rows=distributionRows(state,{period,metric,group});
  // Keep small segments usable: five named slices and a disclosed aggregate.
  const slices=rows.length>6?[...rows.slice(0,5),{label:`Outros (${rows.length-5})`,value:rows.slice(5).reduce((n,r)=>n+r.value,0)}]:rows;
  const total=rows.reduce((n,r)=>n+r.value,0);
  let offset=0;
  const circles=slices.map((r,i)=>{const pct=r.value/total*100,begin=offset;offset+=pct;return `<circle class="distribution-slice" data-distribution-slice="${i}" cx="100" cy="100" r="76" pathLength="100" fill="none" stroke="${tones[i]}" stroke-width="19" stroke-dasharray="${pct} ${100-pct}" stroke-dashoffset="${-begin}"/>`}).join('');
  const detail=metric==='pending'?'Valores pendentes de todos os períodos.':period?`Recebido em ${period.slice(5)}/${period.slice(0,4)}, pela data de pagamento.`:'Recebido em todos os períodos, com data de pagamento.';
  return `<section class="panel distribution-panel" data-distribution><header class="distribution-heading"><div><h2>De onde vem seu caixa</h2><p>${detail}</p></div><div class="distribution-controls"><label>Valores<select id="distribution-metric"><option value="received" ${metric==='received'?'selected':''}>Recebido</option><option value="pending" ${metric==='pending'?'selected':''}>A receber</option></select></label><label>Agrupar<select id="distribution-group"><option value="client" ${group==='client'?'selected':''}>Por cliente</option><option value="project" ${group==='project'?'selected':''}>Por projeto</option></select></label></div></header>${total>0?`<div class="distribution-body"><div class="distribution-visual"><div class="distribution-donut"><svg viewBox="0 0 200 200" role="img" aria-label="Distribuição ${group==='client'?'por cliente':'por projeto'}. Valores detalhados ao lado.">${circles}</svg><div class="distribution-center" aria-live="polite"><strong data-distribution-percent>100%</strong><span data-distribution-label>Total</span></div></div><strong class="distribution-total ${metric==='pending'?'value-pending':'value-positive'}" data-distribution-total data-total="${esc(money(total))}">${money(total)}</strong><button class="btn text small" data-distribution-reset>Mostrar total</button></div><div class="distribution-legend" aria-label="Selecione uma fatia para destacar">${slices.map((r,i)=>`<button class="distribution-item" data-distribution-select="${i}" data-percent="${(r.value/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%" data-value="${esc(money(r.value))}" data-label="${esc(r.label)}" style="--slice-color:${tones[i]}" aria-pressed="false"><i aria-hidden="true"></i><span>${esc(r.label)}</span><strong>${money(r.value)}</strong><small>${(r.value/total*100).toLocaleString('pt-BR',{maximumFractionDigits:1})}%</small></button>`).join('')}<p>Toque em uma linha para destacar sua participação.</p></div></div>${rows.length>6?`<details class="distribution-details"><summary>Ver todos os ${group==='client'?'clientes':'projetos'}</summary><table><thead><tr><th>Nome</th><th>Valor</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.label)}</td><td>${money(r.value)}</td></tr>`).join('')}</tbody></table></details>`:''}`:'<div class="distribution-empty">Nenhum valor para mostrar neste recorte. Troque os valores acima ou registre uma receita.</div>'}</section>`;
}
export function bindDistribution(root) {
  const panel=root.querySelector('[data-distribution]');if(!panel)return()=>{};
  const select=(index)=>{
    const item=panel.querySelector(`[data-distribution-select="${index}"]`);
    panel.querySelectorAll('[data-distribution-select]').forEach(el=>el.setAttribute('aria-pressed',String(el===item)));
    panel.querySelectorAll('[data-distribution-slice]').forEach(el=>el.classList.toggle('is-muted',!!item&&el.dataset.distributionSlice!==String(index)));
    const center=panel.querySelector('[data-distribution-percent]');if(!center)return;
    center.textContent=item?.dataset.percent||'100%';
    panel.querySelector('[data-distribution-label]').textContent=item?.dataset.label||'Total';
    const total=panel.querySelector('[data-distribution-total]');total.textContent=item?.dataset.value||total.dataset.total;
  };
  const click=e=>{const button=e.target.closest('[data-distribution-select],[data-distribution-reset]');if(!button)return;select(button.getAttribute('aria-pressed')==='true'?-1:button.dataset.distributionSelect??-1)};
  panel.addEventListener('click',click);
  return()=>panel.removeEventListener('click',click);
}
