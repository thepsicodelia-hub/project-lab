const $=s=>document.querySelector(s);
const embedded=JSON.parse(document.querySelector('#embedded-assets')?.textContent||'{}');
const asset=name=>embedded[name]||new URL('./assets/'+name,document.baseURI).href;
const media=matchMedia('(prefers-reduced-motion: reduce)');
const images={
  painel:{name:'Painel',height:2262,description:'O próximo prazo, as produções em andamento e o movimento do caixa. Comece o dia sabendo onde olhar.',alt:'Painel do Project Lab com próxima entrega, indicadores e sequência de produção'},
  producoes:{name:'Produções',height:1278,description:'Da pré-produção à entrega. Visualize as etapas, os responsáveis e o progresso de cada projeto.',alt:'Quadro real de produções do Project Lab, dividido em pré-produção, captação, edição e finalizado'},
  caixa:{name:'Caixa',height:1891,description:'Recebimentos, despesas e valores pendentes. Veja o movimento do estúdio e a participação de cada cliente.',alt:'Tela de caixa do Project Lab com recebimentos, despesas, gráfico mensal e distribuição por cliente'},
  bancada:{name:'Bancada',height:1052,description:'Propostas, roteiros, referências e planejamento de cenas. Um lugar para preparar o trabalho antes do set.',alt:'Bancada criativa real com propostas, calculadora de orçamento, roteiros, moodboard, storyboard e ordem do dia'}
};
let selected='painel';
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectScreen(key,focus=false){
  if(!images[key])return;selected=key;const data=images[key];
  for(const tab of tabs){const active=tab.dataset.screen===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus();}
  $('#screen-panel').setAttribute('aria-labelledby','tab-'+key);
  const img=$('#product-screen');img.alt=data.alt;img.height=data.height;
  // Resolve public assets against the document so the build also works in a subfolder.
  img.src=asset(`${key}.webp`);
  $('#screen-name').textContent=data.name;$('#screen-description').textContent=data.description;$('#expand-screen').setAttribute('aria-label','Ampliar tela de '+data.name);
  $('#screen-count').textContent=String(Object.keys(images).indexOf(key)+1).padStart(2,'0');
  $('#screen-panel').dataset.screen=key;
}
for(const tab of tabs){tab.addEventListener('click',()=>selectScreen(tab.dataset.screen));tab.addEventListener('keydown',event=>{
  let index=tabs.indexOf(tab);if((event.key==='ArrowRight'||event.key==='ArrowDown'))index=(index+1)%tabs.length;else if((event.key==='ArrowLeft'||event.key==='ArrowUp'))index=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')index=0;else if(event.key==='End')index=tabs.length-1;else return;
  event.preventDefault();selectScreen(tabs[index].dataset.screen,true);
});}
for(const button of document.querySelectorAll('[data-open-screen]'))button.addEventListener('click',()=>{selectScreen(button.dataset.openScreen);$('#por-dentro').scrollIntoView({behavior:media.matches?'instant':'smooth'});});
const dialog=$('#screen-dialog');
$('#expand-screen').addEventListener('click',()=>{const data=images[selected];$('#dialog-title').textContent=data.name+' — Project Lab';const img=$('#dialog-image');img.src=asset(`${selected}.webp`);img.alt=data.alt;img.height=data.height;dialog.showModal();document.body.style.overflow='hidden';$('.dialog-scroll').scrollTop=0;});
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';$('#expand-screen').focus();});
const menu=$('.menu-toggle');const nav=$('#mobile-nav');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.hidden=true;}
menu.addEventListener('click',()=>{const opened=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!opened));menu.setAttribute('aria-label',opened?'Abrir menu':'Fechar menu');nav.hidden=opened;});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!nav.hidden){closeMenu();menu.focus();}});
document.addEventListener('click',event=>{if(!nav.hidden&&!$('.header').contains(event.target))closeMenu();});
window.addEventListener('resize',()=>{if(innerWidth>760)closeMenu();});
const header=$('.header');const updateHeader=()=>header.classList.toggle('scrolled',scrollY>30);window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
$('#year').textContent=new Date().getFullYear();
// Enhance visible content; nothing depends on animation to become readable.
const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){if(!media.matches)e.target.animate([{transform:'translateY(18px)'},{transform:'translateY(0)'}],{duration:850,easing:'cubic-bezier(.22,1,.36,1)'});io.unobserve(e.target);}},{threshold:.12});
document.querySelectorAll('.section-top,.capability-grid article,.faq-list').forEach(el=>io.observe(el));
let prism=null,featureLogos=null;
media.addEventListener('change',()=>{prism?.reduceMotion(media.matches);featureLogos?.reduceMotion(media.matches);});
async function init(){try{const {createPrism,createFeatureLogos}=await import('./prism.js');featureLogos=createFeatureLogos(document.querySelectorAll('.feature-logo'),{reducedMotion:media.matches});prism=createPrism($('#scene'),{reducedMotion:media.matches});}catch(error){$('#scene').dataset.renderer='unavailable';console.warn('A cena 3D não está disponível. Exibindo a marca estática.',error);}}
requestAnimationFrame(()=>requestAnimationFrame(init));
window.addEventListener('pagehide',event=>{if(!event.persisted){prism?.dispose();featureLogos?.dispose();io.disconnect();}});
if(import.meta.hot)import.meta.hot.dispose(()=>{prism?.dispose();featureLogos?.dispose();io.disconnect();});
