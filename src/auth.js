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
      form=`${googleEnabled && ['login','signup'].includes(mode)?'<button class="btn auth-google auth-wide" data-auth-action="google"><span aria-hidden="true">G</span> Continuar com Google</button><p class="auth-divider">ou com seu e-mail</p>':''}
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
    root.innerHTML=`<div class="auth-layout"><div class="auth-story"><a class="brand" href="#" aria-label="Project Lab">${brandLockup()}</a><div class="auth-hero-visual" aria-hidden="true"><video class="auth-hero-video" autoplay muted loop playsinline preload="auto"><source src="/brand/project-lab-login-video.mp4" type="video/mp4"></video><span class="auth-hero-glyph auth-hero-fallback">${brandGlyph('auth-hero-glyph-mark')}</span></div><div><span class="eyebrow">DO BRIEFING À ÚLTIMA ENTREGA</span><h1>Mais espaço<br>para criar.</h1><p>Projetos, pessoas e produção.<br>Seu estúdio inteiro, no mesmo lugar.</p><div class="auth-timeline"><span><i></i>Pré-produção</span><span><i></i>Captação</span><span><i></i>Entrega</span></div></div></div><div class="auth-form-area"><div class="auth-card"><span class="eyebrow">BEM-VINDO AO PROJECT LAB</span><h2>${titles[mode]}</h2><p class="auth-description">${mode==='workspaces'?esc(user?.email):'Organize o trabalho. Faça a produção acontecer.'}</p><p class="auth-message" role="alert" data-auth-message ${!message?'hidden':''}>${esc(message)}</p>${form}</div><p class="auth-bottom">Seu trabalho organizado, do primeiro contato ao arquivo final.</p></div></div>`;
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
  return {
    async start(){
      if(!configured){show('login');return;}
      show('loading');let ready=false;
      supabase.auth.onAuthStateChange((event,session)=>{
        if(event==='PASSWORD_RECOVERY'){recovery=true;activeId=null;}
        if(ready&&['SIGNED_IN','SIGNED_OUT','PASSWORD_RECOVERY'].includes(event))setTimeout(()=>acceptSession(session),0);
      });
      const {data,error}=await supabase.auth.getSession();ready=true;
      if(error)show('login',friendlyError(error));else await acceptSession(data.session);
    },
    showLogin:()=>{activeId=null;show('login');},
    chooseWorkspace:async()=>{await fetchWorkspaces();show('workspaces');},
    logout,
    get user(){return user;},
  };
}
