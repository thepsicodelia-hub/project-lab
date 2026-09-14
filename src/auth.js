import { brandLockup, brandGlyph } from './brand.js';
import { supabase, configured, emailEnabled, googleEnabled, redirectURL, friendlyError } from './supabase.js';

const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createAuth({onWorkspace,onDemo,onLock}, dependencies={supabase,configured,emailEnabled,googleEnabled,redirectURL}) {
  const {supabase,configured,emailEnabled,googleEnabled,redirectURL}=dependencies;
  const root=document.getElementById('auth-screen');
  let mode='login',user=null,workspaces=[],activeId=null,loadingUser=null,epoch=0,recovery=false,busy=false;
  let message='';
  const query=new URLSearchParams(location.search);
  recovery=query.get('recovery')==='1';
  const invitation=query.get('invite');
  if(invitation && /^[a-f0-9-]{36}$/.test(invitation)) sessionStorage.setItem('project-lab-invite',invitation);
  const googleMark='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.4 2.9-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.2L6.5 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.7 9.7 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 5.9Z"/></svg>';
  const input=(label,name,type='text',autocomplete='',extra='')=>`<label class="field">${label}<input name="${name}" type="${type}" autocomplete="${autocomplete}" required ${extra}></label>`;
  function feedback(text) {
    message=text;
    const el=root.querySelector('[data-auth-message]');
    if(el) {el.textContent=text;el.hidden=!text;}
  }
  function lock() { onLock(); document.body.classList.add('auth-locked'); root.hidden=false; }
  function show(next='login',text='') {
    mode=next;message=text;lock();
    const titles={login:'Seu estúdio começa aqui.',signup:'Espaço para suas próximas ideias.',forgot:'Vamos recuperar seu acesso.',recover:'Escolha uma nova senha.',workspaces:'Qual estúdio vamos abrir?',loading:'Preparando seu estúdio…'};
    let form='';
    if(mode==='workspaces') {
      const invite=sessionStorage.getItem('project-lab-invite');
      form=`${invite?'<div class="notice">Você recebeu um convite para trabalhar em equipe.</div><button class="btn primary auth-wide" data-auth-action="accept-invite">Aceitar convite</button>':''}
        <div class="workspace-options">${workspaces.map(w=>`<button class="workspace-choice" data-workspace="${esc(w.id)}"><span>${esc(w.name)}</span><small>Abrir estúdio →</small></button>`).join('')}</div>
        ${!workspaces.some(w=>w.owner_id===user.id)?`<form id="auth-workspace-form">${input('Nome do seu estúdio','workspace','text','organization','maxlength="80"')}<button class="btn primary auth-wide" type="submit">Criar meu estúdio</button></form>`:''}
        <button class="btn text auth-wide" data-auth-action="logout">Sair da conta</button>`;
    } else if(mode!=='loading') {
      const password=mode==='login'||mode==='signup'||mode==='recover';
      const enabled=mode==='recover'||emailEnabled;
      const labels={login:'Entrar',signup:'Criar conta gratuita',forgot:'Enviar link de recuperação',recover:'Salvar nova senha'};
      form=`${googleEnabled && ['login','signup'].includes(mode)?`<button class="btn auth-google auth-wide" data-auth-action="google">${googleMark}<span>Continuar com Google</span></button><p class="auth-divider"><span>ou com seu e-mail</span></p>`:''}
        <p class="form-hint"><a href="/privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> · <a href="/termos.html" target="_blank" rel="noopener">Termos de Uso</a></p>
        <form id="auth-form">
          ${mode==='signup'?input('Seu nome','name','text','name','maxlength="80"'):''}
          ${mode!=='recover'?input('E-mail','email','email','email','maxlength="254"'):''}
          ${password?input(mode==='recover'?'Nova senha':'Senha','password','password',mode==='login'?'current-password':'new-password',mode==='login'?'minlength="1" maxlength="128"':'minlength="10" maxlength="128"'):''}
          ${mode==='signup'||mode==='recover'?input('Confirme a senha','confirm','password','new-password','minlength="10" maxlength="128"'):''}
          ${mode==='signup'?'<p class="form-hint">Use pelo menos 10 caracteres. Seu estúdio começa vazio, com seus próprios dados.</p>':''}
          <button class="btn primary auth-wide" type="submit" ${!enabled?'disabled':''}>${labels[mode]}</button>
        </form>
        ${mode==='login'?'<button class="auth-link" data-auth-mode="forgot">Esqueci minha senha</button><p class="auth-switch">Primeira vez aqui? <button class="auth-link" data-auth-mode="signup">Criar conta</button></p>':'<button class="auth-link" data-auth-mode="login">Voltar para entrar</button>'}
        ${!configured?'<p class="auth-setup">A conexão online ainda está em preparação. Você já pode explorar a demonstração abaixo.</p>':!emailEnabled?'<p class="auth-setup">Ative o provedor de e-mail no Supabase para liberar o cadastro. O envio gratuito tem limite de mensagens.</p>':''}
        <button class="btn auth-wide" data-auth-action="demo">Explorar demonstração</button>`;
    }
    root.innerHTML=`<div class="auth-login-stage"><div class="auth-grain" aria-hidden="true"></div><div class="auth-halo" aria-hidden="true"></div><div class="auth-card"><a class="auth-lockup" href="#" aria-label="Project Lab">${brandLockup()}</a><span class="eyebrow">BEM-VINDO AO PROJECT LAB</span><h2>${titles[mode]}</h2><p class="auth-description">${mode==='workspaces'?esc(user?.email):'Entre para continuar movendo seu estúdio.'}</p><p class="auth-message" role="alert" data-auth-message ${!message?'hidden':''}>${esc(message)}</p>${form}</div><p class="auth-bottom">Seu estúdio em movimento.</p></div>`;
    root.querySelectorAll('[data-auth-mode]').forEach(el=>el.onclick=()=>show(el.dataset.authMode));
    root.querySelectorAll('[data-workspace]').forEach(el=>el.onclick=()=>run(()=>openWorkspace(el.dataset.workspace)));
    root.querySelectorAll('[data-auth-action]').forEach(el=>el.onclick=()=>run(async()=>{
      if(el.dataset.authAction==='demo'){epoch++;loadingUser=null;activeId=null;root.hidden=true;document.body.classList.remove('auth-locked');onDemo();}
      if(el.dataset.authAction==='logout')await logout();
      if(el.dataset.authAction==='google') {
        const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:redirectURL()}});if(error)throw error;
      }
      if(el.dataset.authAction==='accept-invite') {
        const {data,error}=await supabase.rpc('accept_workspace_invite',{p_invite:sessionStorage.getItem('project-lab-invite')});
        if(error) throw new Error('Convite inválido, expirado ou destinado a outro e-mail. Entre com o e-mail convidado.');
        sessionStorage.removeItem('project-lab-invite'); history.replaceState({},'',redirectURL());
        await fetchWorkspaces(); await openWorkspace(data);
      }
    }));
    const f=root.querySelector('#auth-form');
    if(f) f.onsubmit=event=>{event.preventDefault();run(async()=>{
      if(!configured||(!emailEnabled&&mode!=='recover'))return;
      const data=Object.fromEntries(new FormData(f));
      if(data.confirm && data.password!==data.confirm)throw new Error('As senhas precisam ser iguais.');
      if(mode==='login'){const {error}=await supabase.auth.signInWithPassword({email:data.email.trim(),password:data.password});if(error)throw error;}
      if(mode==='signup') {
        const {data:result,error}=await supabase.auth.signUp({email:data.email.trim(),password:data.password,options:{emailRedirectTo:redirectURL(),data:{display_name:data.name.trim()}}});
        if(error)throw error;
        if(!result.session){f.reset();show('login','Se o endereço puder ser cadastrado, você receberá uma mensagem para confirmar seu e-mail.');}
      }
      if(mode==='forgot') {const recoveryURL=new URL(redirectURL());recoveryURL.searchParams.set('recovery','1');const {error}=await supabase.auth.resetPasswordForEmail(data.email.trim(),{redirectTo:recoveryURL.href});if(error)throw error;feedback('Se houver uma conta para esse e-mail, enviaremos o link de recuperação.');}
      if(mode==='recover') {const {error}=await supabase.auth.updateUser({password:data.password});if(error)throw error;recovery=false;activeId=null;history.replaceState({},'',redirectURL());await fetchWorkspaces();show('workspaces','Senha atualizada.');}
    });};
    const wf=root.querySelector('#auth-workspace-form');
    if(wf)wf.onsubmit=event=>{event.preventDefault();run(async()=>{
      const {data,error}=await supabase.rpc('create_workspace',{p_name:wf.elements.workspace.value.trim()});if(error)throw error;
      await fetchWorkspaces();await openWorkspace(data);
    });};
  }
  async function run(fn) {
    if(busy)return;busy=true;
    const buttons=[...root.querySelectorAll('button')];const disabled=buttons.map(b=>b.disabled);
    buttons.forEach(b=>b.disabled=true);feedback('');
    try{await fn();}catch(error){feedback(friendlyError(error));}finally{busy=false;buttons.forEach((b,i)=>b.disabled=disabled[i]);}
  }
  async function fetchWorkspaces(){const {data,error}=await supabase.from('workspaces').select('id,name,owner_id').order('created_at');if(error)throw error;workspaces=data;}
  async function openWorkspace(id) {
    const version=++epoch;
    const {data,error}=await supabase.from('workspace_members').select('role').eq('workspace_id',id).eq('user_id',user.id).single();if(error)throw error;
    if(version!==epoch)return;
    await onWorkspace({id,user,role:data.role,isCurrent:()=>version===epoch});
    if(version!==epoch)return;
    activeId=id;root.hidden=true;document.body.classList.remove('auth-locked');
  }
  async function acceptSession(session) {
    if(!session){epoch++;user=null;loadingUser=null;activeId=null;show('login');return;}
    if(user?.id===session.user.id&&(activeId||loadingUser))return;
    user=session.user;loadingUser=user.id;const version=++epoch;
    try{await fetchWorkspaces();if(version!==epoch)return;
      if(recovery)show('recover');
      else if(workspaces.length===1&&!sessionStorage.getItem('project-lab-invite')) {
        try {await openWorkspace(workspaces[0].id);}
        catch(error){if(user?.id===session.user.id && !root.hidden)show('workspaces',friendlyError(error));}
      }
      else show('workspaces');
    }catch(error){if(version===epoch)show('workspaces',friendlyError(error));}finally{if(user?.id===session.user.id)loadingUser=null;}
  }
  async function logout(){epoch++;activeId=null;loadingUser=null;user=null;show('login');if(supabase){const {error}=await supabase.auth.signOut();if(error)feedback(friendlyError(error));}}
  function playOpening(){
    if(typeof window==='undefined'||typeof navigator==='undefined')return Promise.resolve();
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const test=/jsdom/i.test(navigator.userAgent||'');
    if(test||reduced||sessionStorage.getItem('project-lab-opening-seen'))return Promise.resolve();
    lock();
    root.innerHTML=`<div class="auth-opening" aria-label="Preparando o Project Lab"><video autoplay muted loop playsinline preload="metadata"><source src="/brand/project-lab-login-video.mp4" type="video/mp4"></video><div class="auth-opening-veil"></div><div class="auth-grain"></div><div class="auth-opening-content">${brandGlyph('auth-opening-mark')}<div class="auth-loader"><div><span>Preparando seu estúdio</span><strong data-opening-progress>0%</strong></div><i><b data-opening-bar></b></i></div></div></div>`;
    const number=root.querySelector('[data-opening-progress]'),bar=root.querySelector('[data-opening-bar]');
    const started=performance.now(),duration=3600;
    return new Promise(resolve=>{
      const frame=now=>{const t=Math.min(1,(now-started)/duration),p=Math.round(100*(1-Math.pow(1-t,2.7)));number.textContent=`${p}%`;bar.style.transform=`scaleX(${p/100})`;if(t<1)requestAnimationFrame(frame);else setTimeout(()=>{sessionStorage.setItem('project-lab-opening-seen','1');resolve();},260)};
      requestAnimationFrame(frame);
    });
  }
  return {
    async start(){
      const opening=playOpening();
      if(!configured){await opening;show('login');return;}
      let ready=false;
      supabase.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){recovery=true;activeId=null;}
        if(ready&&['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>acceptSession(session),0);
      });
      const [{data,error}]=await Promise.all([supabase.auth.getSession(),opening]);ready=true;
      if(error)show('login',friendlyError(error));else await acceptSession(data.session);
    },
    showLogin:()=>{activeId=null;show('login');},
    chooseWorkspace:async()=>{await fetchWorkspaces();show('workspaces');},
    logout,
    get user(){return user;},
  };
}
