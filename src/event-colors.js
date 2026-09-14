export const EVENT_COLORS = ['auto','violet','cyan','amber','green','rose'];
const labels = {auto:'Pela categoria',violet:'Lilás',cyan:'Ciano',amber:'Âmbar',green:'Verde',rose:'Rosa'};
export function eventTone(event) {
  if (EVENT_COLORS.includes(event.color) && event.color !== 'auto') return event.color;
  return {Reunião:'violet',Captação:'amber',Entrega:'cyan',Pagamento:'green'}[event.type] || 'violet';
}
export function eventColorField(value='auto',type='Reunião') {
  const selected=EVENT_COLORS.includes(value)?value:'auto';
  return `<fieldset class="event-color-field field full"><legend>Cor do compromisso</legend><p>A mesma cor aparece na Agenda e no Radar.</p><div class="event-color-options">${EVENT_COLORS.map(key=>`<label class="event-color-option event-tone-${eventTone({color:key,type})}"><input type="radio" name="color" value="${key}" ${key===selected?'checked':''}><span><i aria-hidden="true"></i>${labels[key]}</span></label>`).join('')}</div></fieldset>`;
}
export function bindEventColors(form) {
  const category=form.querySelector('[name=type]');
  const automatic=form.querySelector('[name=color][value=auto]')?.closest('label');
  if(category&&automatic)category.addEventListener('change',()=>{automatic.className=`event-color-option event-tone-${eventTone({type:category.value})}`});
}
