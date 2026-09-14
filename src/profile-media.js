export const safeLocalImage = value => typeof value==='string' && value.length<=220000 && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : '';
export const safeProfileImage = value => {
  if (safeLocalImage(value)) return value;
  if (typeof value !== 'string' || value.length > 2048) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && (url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com')) ? url.href : '';
  } catch { return ''; }
};
export const safeProfileColor = value => /^#[a-f\d]{6}$/i.test(value||'')?value:'#9bc9ff';
export const clientForProject = (state,project) => state.clients.find(c=>c.id===project.clientId)||state.clients.find(c=>c.name===project.client);
export function personAvatar(person,esc,cls='avatar') {
  const photo=safeLocalImage(person?.photo)||safeProfileImage(person?.accountPhoto),color=safeProfileColor(person?.color);
  return `<span class="${cls} person-avatar" style="--person-color:${color}" aria-label="${esc(person?.name||'Pessoa')}" role="img">${photo?`<img src="${photo}" alt="" width="80" height="80" loading="lazy">`:`<span>${esc(person?.initials||'PL')}</span>`}</span>`;
}
export function mediaField(label,name,value,esc,kind='logo') {
  const src=safeLocalImage(value);
  return `<div class="field full media-field" data-media-field data-media-kind="${kind}"><span>${label}</span><div class="media-field-body"><div class="media-field-preview ${kind}">${src?`<img src="${src}" alt="Prévia de ${label}">`:'<span>Sem imagem</span>'}</div><div><label class="btn media-choose">Escolher imagem<input type="file" accept="image/png,image/jpeg,image/webp" data-media-input aria-label="${label}"></label><button type="button" class="btn text small" data-media-remove ${src?'':'disabled'}>Remover</button><p class="form-hint" data-media-status role="status">JPG, PNG ou WebP · até 8 MB. A imagem é compactada antes de salvar.</p></div></div><input type="hidden" name="${esc(name)}" value="${src}"></div>`;
}
export async function compressLocalImage(file,kind) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Escolha JPG, PNG ou WebP.');
  if(file.size>8*1024*1024)throw Error('A imagem precisa ter até 8 MB.');
  const url=URL.createObjectURL(file);
  try {
    const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(Error('Não foi possível ler a imagem.'));i.src=url});
    if(img.naturalWidth*img.naturalHeight>50000000)throw Error('Reduza a resolução da imagem e tente novamente.');
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Este navegador não conseguiu preparar a imagem.');
    const size=kind==='cover'?960:320;
    const scale=Math.min(1,size/Math.max(img.naturalWidth,img.naturalHeight));
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    for(const quality of [.82,.68,.5,.35]){const data=canvas.toDataURL('image/webp',quality);if(safeLocalImage(data))return data;}
    throw Error('Use uma imagem menor para manter a prévia leve.');
  } finally {URL.revokeObjectURL(url)}
}
export function bindMediaFields(form) {
  form.querySelectorAll('[data-media-field]').forEach(field=>{
    const input=field.querySelector('[data-media-input]'),hidden=field.querySelector('input[type=hidden]'),preview=field.querySelector('.media-field-preview'),status=field.querySelector('[data-media-status]'),remove=field.querySelector('[data-media-remove]');
    let revision=0;
    const draw=()=>{preview.replaceChildren();if(hidden.value){const img=document.createElement('img');img.src=hidden.value;img.alt='Imagem escolhida';preview.append(img)}else preview.textContent='Sem imagem';remove.disabled=!hidden.value};
    remove.onclick=()=>{revision++;hidden.value='';input.value='';draw();status.textContent='Imagem removida. Salve para confirmar.'};
    input.onchange=async()=>{
      const file=input.files?.[0];if(!file)return;const request=++revision;
      form.dataset.mediaPending=String(Number(form.dataset.mediaPending||0)+1);status.textContent='Preparando imagem…';input.disabled=true;
      try{const image=await compressLocalImage(file,field.dataset.mediaKind);if(!field.isConnected||revision!==request)return;hidden.value=image;draw();status.textContent='Imagem pronta. Salve para confirmar.'}
      catch(error){if(field.isConnected&&revision===request)status.textContent=error.message}
      finally{input.disabled=false;form.dataset.mediaPending=String(Math.max(0,Number(form.dataset.mediaPending||0)-1));input.value=''}
    };
  });
}
