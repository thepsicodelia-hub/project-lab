// Slower data storytelling is intentional here; controls keep their short feedback.
export const NUMBER_MOTION = Object.freeze({duration:1600,settle:240,stagger:55});
export const countEase = progress => 1-Math.pow(1-Math.max(0,Math.min(1,progress)),3);
/** Parse displayed metrics, not dates, IDs or project names. Preserve every unit. */
export function numericPresentation(text) {
  const match=text.match(/^(\s*(?:R\$|US\$|€|\$)?\s*)([-−]?\d[\d.,]*)(\s*(?:%(?:\s+concluído)?)?\s*)$/);
  if(!match)return null;
  const [,prefix,raw,suffix]=match;
  const comma=raw.includes(','),dotDecimal=!comma && /\.\d{1,2}$/.test(raw);
  const digits=comma?raw.split(',')[1].length:dotDecimal?raw.split('.')[1].length:0;
  const value=Number(raw.replace('−','-').replace(comma?/\./g:dotDecimal?/$^/:/\./g,'').replace(',','.'));
  if(!Number.isFinite(value))return null;
  const leading=/^0\d+$/.test(raw)?raw.length:1;
  const formatter=new Intl.NumberFormat(dotDecimal?'en-US':'pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits,minimumIntegerDigits:Math.min(leading,21),useGrouping:/\d[.,]\d{3}(?:[.,]|$)/.test(raw)});
  const sign=raw.startsWith('−')?'−':'-';
  const format=n=>prefix+(n<0?sign:'')+formatter.format(Math.abs(n))+suffix;
  return {value,digits,format};
}

export function animateNumbers(root,{mode='count'}={}) {
  const jobs=[],frames=new Set(),animations=new Set();let disposed=false,observer;
  const disabled=()=>document.body.dataset.effects==='off'||document.hidden||document.body.dataset.inputModality==='keyboard'||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clean=()=>{if(disposed)return;disposed=true;observer?.disconnect();frames.forEach(cancelAnimationFrame);frames.clear();animations.forEach(a=>a.cancel());animations.clear();jobs.forEach(j=>j.wrap.replaceWith(j.original));};
  const selectors='.stat-number,.ops-metrics strong,.pulse-stat-strip>a>strong,.ring-text strong,.clean-data-ring>strong,.project-finance-main>div>strong,.project-finance-rows strong,.project-hours-total,.pulse-goal-heading>strong,.clean-focus-progress strong,.sequence-progress,.atelier-equipment-price strong,.atelier-recovery strong,.clean-person-work dd,.chart-year-total strong,.card-bottom>strong,.goal-summary-panel .goal-details strong,.annual-goal-target .big-amount,.annual-goal-progress strong';
  const run=(el,index)=>{
    if(disposed||disabled())return;
    // Other areas reveal the real value, never a fabricated intermediate amount.
    if(mode==='reveal') {
      if(!el.animate||![...el.childNodes].some(n=>n.nodeType===3&&numericPresentation(n.textContent)))return;
      const a=el.animate([{opacity:.65,transform:'translateY(3px)',filter:'blur(2px)',textShadow:'0 0 10px currentColor'},{opacity:1,transform:'translateY(0)',filter:'blur(0)',textShadow:'0 0 0 transparent'}],{duration:380,delay:index%4*25,easing:'cubic-bezier(.22,1,.36,1)'});
      animations.add(a);a.finished?.then(()=>animations.delete(a)).catch(()=>{});
      return;
    }
    [...el.childNodes].filter(n=>n.nodeType===3).forEach(original=>{
      const info=numericPresentation(original.textContent);if(!info||info.value===0)return;
      const wrap=document.createElement('span');wrap.className='metric-roll';
      // Final text reserves its exact width and remains the only accessible value.
      const fixed=document.createElement('span');fixed.className='metric-roll-final';fixed.textContent=original.textContent;
      const moving=document.createElement('span');moving.className='metric-roll-moving';moving.setAttribute('aria-hidden','true');
      moving.textContent=info.format(0);wrap.append(fixed,moving);original.replaceWith(wrap);jobs.push({wrap,original});
      const delay=index%4*NUMBER_MOTION.stagger;
      const precision=10**Math.min(info.digits,20);
      let start;
      const frame=t=>{
        if(disposed)return;
        if(disabled()){clean();return;}
        start??=t;
        const elapsed=Math.max(0,t-start-delay);
        const progress=Math.min(1,elapsed/NUMBER_MOTION.duration);
        const eased=countEase(progress);
        // Floor displayed steps toward zero so even small integers settle at the end.
        const count=Math.sign(info.value)*Math.floor(Math.abs(info.value)*eased*precision)/precision;
        moving.textContent=progress<1?info.format(count):original.textContent;
        moving.style.filter=`blur(${(1.5*Math.pow(1-progress,2)).toFixed(3)}px)`;
        moving.style.transform=`translateY(${(2*(1-eased)).toFixed(3)}px)`;
        const settle=Math.min(1,Math.max(0,(elapsed-NUMBER_MOTION.duration)/NUMBER_MOTION.settle));
        const blend=settle*settle*(3-2*settle);
        moving.style.opacity=String((.88+.12*eased)*(1-blend));
        fixed.style.opacity=String(blend);
        if(settle<1){const id=requestAnimationFrame(time=>{frames.delete(id);frame(time)});frames.add(id)}else wrap.replaceWith(original);
      };
      const id=requestAnimationFrame(t=>{frames.delete(id);frame(t)});frames.add(id);
    });
  };
  const elements=[...root.querySelectorAll(selectors)];
  if('IntersectionObserver' in window){observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);run(entry.target,elements.indexOf(entry.target))}}),{threshold:.2});elements.forEach(el=>observer.observe(el))}
  else elements.forEach(run);
  const onPause=()=>{if(disabled())clean()};
  document.addEventListener('projectlab:effects',onPause);document.addEventListener('visibilitychange',onPause);
  return ()=>{clean();document.removeEventListener('projectlab:effects',onPause);document.removeEventListener('visibilitychange',onPause)};
}
