/** Real progress only; an unknown denominator stays unavailable, never 100%. */
export function progressRing(value,total,label='Progresso') {
  const valid=Number.isFinite(value)&&Number.isFinite(total)&&total>0;
  const percent=valid?Math.round(value/total*100):null;
  const fill=percent===null?0:Math.max(0,Math.min(100,percent));
  const safeLabel=label.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
  return `<div class="clean-data-ring"><svg viewBox="0 0 100 100" role="img" aria-label="${safeLabel}: ${percent===null?'não disponível':percent+'%'}"><circle class="clean-ring-track" cx="50" cy="50" r="40"/><circle class="clean-ring-value" cx="50" cy="50" r="40" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-fill}"/></svg><strong aria-hidden="true">${percent===null?'—':percent+'%'}</strong></div>`;
}
