const KEY = 'project-lab-pulse-motion';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const enabled = () => !reduced() && document.body.dataset.effects !== 'off';
const updateInlineControls = () => document.querySelectorAll('[data-motion-toggle]').forEach(button=>{
  button.textContent = enabled() ? 'Pausar movimento' : 'Retomar movimento';
  button.setAttribute('aria-pressed',String(enabled()));
});

export function installPulseEffects() {
  const control = document.getElementById('pulse-effects');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let requested = true;
  try { requested = localStorage.getItem(KEY) !== 'off'; } catch {}
  const update = () => {
    const on = requested && !reduced();
    document.body.dataset.effects = on ? 'on' : 'off';
    control.setAttribute('aria-pressed', String(on));
    control.querySelector('span:last-child').textContent = on ? 'Efeitos ligados' : 'Efeitos pausados';
    control.title = reduced() ? 'Movimento reduzido nas preferências do dispositivo' : on ? 'Pausar os efeitos de movimento' : 'Ativar os efeitos de movimento';
    if (!on) document.getAnimations?.().forEach(a=>a.cancel());
    document.dispatchEvent(new Event('projectlab:effects'));
    updateInlineControls();
  };
  control.addEventListener('click',()=>{requested=!enabled();try{localStorage.setItem(KEY,requested?'on':'off')}catch{}update();});
  document.addEventListener('click',event=>{if(event.target.closest('[data-motion-toggle]'))control.click()});
  preference.addEventListener?.('change',update);
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('tab-hidden',document.hidden));
  document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.dataset.inputModality='keyboard'});
  document.addEventListener('pointerdown',()=>document.body.dataset.inputModality='pointer');
  update();
}

/** Content is visible by default. Motion never gates access to a control or number. */
export function bindPulseMotion(root,{animate=true}={}) {
  updateInlineControls();
  if(!animate||!root.animate)return ()=>{};
  const animations = new Set();
  const track=a=>{animations.add(a);a.finished.then(()=>animations.delete(a)).catch(()=>{})};
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        observer.unobserve(entry.target);
        if(!enabled() || document.hidden || document.body.dataset.inputModality==='keyboard')return;
        if(entry.target.matches('.clean-journey')) {
          const fill=entry.target.querySelector('[data-journey-progress]');
          track(fill.animate([{transform:'scaleX(0)'},{transform:`scaleX(${fill.dataset.journeyProgress})`}],{duration:650,easing:'cubic-bezier(.22,1,.36,1)'}));
          const dot=entry.target.querySelector('.is-current .journey-dot');
          track(dot.animate([{opacity:.65,transform:'scale(.88)'},{opacity:1,transform:'scale(1)'}],{duration:450,easing:'cubic-bezier(.22,1,.36,1)'}));
          return;
        }
        if(entry.target.matches('.clean-data-ring,.distribution-donut')) {
          entry.target.querySelectorAll('.clean-ring-value,.distribution-slice').forEach(circle=>{
            const ring=circle.matches('.clean-ring-value');
            track(circle.animate(ring?[{strokeDashoffset:'100'},{strokeDashoffset:circle.getAttribute('stroke-dashoffset')}]:[{strokeDasharray:'0 100'},{strokeDasharray:circle.getAttribute('stroke-dasharray')}],{duration:650,easing:'cubic-bezier(.215,.61,.355,1)'}));
          });
          return;
        }
        const withBlur = entry.target.matches('.clean-focus,.page-heading,.page-header');
        const a = entry.target.animate([{opacity:.72,transform:'translateY(8px)',filter:withBlur?'blur(2px)':'none'},{opacity:1,transform:'translateY(0)',filter:'none'}],{duration:260,easing:'cubic-bezier(.22,1,.36,1)'});
        animations.add(a);a.finished.then(()=>animations.delete(a)).catch(()=>{});
        if (entry.target.matches('.data-table')) {
          [...entry.target.querySelectorAll('tbody tr')].slice(0,10).forEach((row,i)=>{
            const r=row.animate([{opacity:.5,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:280,delay:i*18,easing:'cubic-bezier(.22,1,.36,1)'});
            animations.add(r);r.finished.then(()=>animations.delete(r)).catch(()=>{});
          });
        }
      });
    },{threshold:.12});
    root.querySelectorAll('[data-reveal],.page-heading,.page-header,.clean-focus,.clean-journey,.atelier-equipment,.pulse-gallery .project-card,.data-table,.clean-person,.project-overview-grid>.panel,.clean-data-ring,.distribution-donut,.week-task,.goals-workspace>.panel').forEach(el=>observer.observe(el));
  }
  const stop=()=>{observer?.disconnect();animations.forEach(a=>a.cancel());animations.clear()};
  const pause=()=>{if(!enabled()||document.hidden)stop()};
  document.addEventListener('projectlab:effects',pause);document.addEventListener('visibilitychange',pause);
  return ()=>{stop();document.removeEventListener('projectlab:effects',pause);document.removeEventListener('visibilitychange',pause)};
}
