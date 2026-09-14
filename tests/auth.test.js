import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createAuth} from '../src/auth.js';

function fixture(overrides={},hooks={},authOptions={}) {
  const dom=new JSDOM('<body><section id="auth-screen"></section></body>',{url:'http://localhost:4173/'});
  for(const name of ['document','location','sessionStorage','history','FormData'])globalThis[name]=dom.window[name];
  let events,opened=[],locked=0,demo=0,calls=[];
  const client={
    auth:{onAuthStateChange:fn=>events=fn,getSession:async()=>({data:{session:null}}),
      signInWithPassword:async args=>{calls.push(['signin',args]);events('SIGNED_IN',{user:{id:'u1',email:'owner@example.test'}});return{};},
      signUp:async args=>{calls.push(['signup',args]);return{data:{session:null}};},
      signInWithOAuth:async args=>{calls.push(['oauth',args]);return{};},
      signOut:async()=>{events('SIGNED_OUT',null);return{};},
      resetPasswordForEmail:async()=>({}),updateUser:async()=>({}),
    },
    from(table) {
      return {select() {
        if(table==='workspaces')return {order:async()=>({data:[{id:'w1',name:'Studio',owner_id:'u1'}]})};
        const chain={eq:()=>chain,single:async()=>({data:{role:'owner'}})};
        return chain;
      }};
    },
    ...overrides
  };
  const auth=createAuth({onWorkspace:async ctx=>opened.push(ctx),onDemo:()=>demo++,onLock:()=>locked++,...hooks},
    {supabase:client,configured:true,emailEnabled:true,googleEnabled:false,redirectURL:()=>location.origin+'/',...authOptions});
  return {dom,auth,calls,opened,emit:(event,session)=>events(event,session),get demo(){return demo;},get locked(){return locked;}};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
function submit(values){const form=document.querySelector('#auth-form');for(const [name,value] of Object.entries(values))form.elements[name].value=value;form.dispatchEvent(new document.defaultView.Event('submit',{bubbles:true,cancelable:true}));}

test('login opens a verified session studio; logout locks and clears the application',async()=>{
  const f=fixture();await f.auth.start();assert.match(document.body.textContent,/Seu estúdio começa aqui/);
  submit({email:'owner@example.test',password:'test-password'});await tick();
  assert.equal(f.calls[0][0],'signin');assert.equal(f.opened.length,1);assert.equal(f.opened[0].role,'owner');assert.equal(document.querySelector('#auth-screen').hidden,true);
  await f.auth.logout();await tick();assert.equal(document.querySelector('#auth-screen').hidden,false);assert.equal(f.auth.user,null);assert.ok(f.locked>=2);f.dom.window.close();
});
test('signup rejects mismatched passwords; successful signup waits for email verification',async()=>{
  const f=fixture();await f.auth.start();document.querySelector('[data-auth-mode="signup"]').click();
  submit({name:'Name',email:'new@example.test',password:'long-password',confirm:'different-password'});await tick();assert.equal(f.calls.length,0);assert.match(document.body.textContent,/senhas precisam ser iguais/);
  submit({name:'Name',email:'new@example.test',password:'long-password',confirm:'long-password'});await tick();
  assert.equal(f.calls[0][0],'signup');assert.equal(f.opened.length,0);assert.match(document.body.textContent,/confirmar seu e-mail/);f.dom.window.close();
});
test('expired sessions lock immediately and recovery does not open a studio automatically',async()=>{
  const f=fixture();await f.auth.start();f.emit('PASSWORD_RECOVERY',{user:{id:'u1',email:'owner@example.test'}});await tick();
  assert.match(document.body.textContent,/Escolha uma nova senha/);assert.equal(f.opened.length,0);
  f.emit('SIGNED_OUT',null);await tick();assert.match(document.body.textContent,/Seu estúdio começa aqui/);f.dom.window.close();
});
test('studio load errors offer a visible retry instead of leaving login stuck',async()=>{
  const f=fixture({}, {onWorkspace:async()=>{throw new Error('Falha ao carregar o estúdio.');}});
  await f.auth.start();submit({email:'owner@example.test',password:'test-password'});await tick();
  assert.equal(document.querySelector('#auth-screen').hidden,false);
  assert.match(document.body.textContent,/Falha ao carregar o estúdio/);
  assert.ok(document.querySelector('[data-workspace="w1"]'));
  f.dom.window.close();
});
test('a session closed during membership lookup never opens a studio',async()=>{
  let resolveMember;
  const f=fixture({from(table){return {select(){
    if(table==='workspaces')return {order:async()=>({data:[{id:'w1',name:'Studio',owner_id:'u1'}]})};
    const chain={eq:()=>chain,single:()=>new Promise(resolve=>{resolveMember=resolve;})};return chain;
  }}}});
  await f.auth.start();submit({email:'owner@example.test',password:'test-password'});await tick();
  await f.auth.logout();await tick();resolveMember({data:{role:'owner'}});await tick();
  assert.equal(f.opened.length,0);assert.equal(f.auth.user,null);f.dom.window.close();
});
test('Google login stays hidden until configured and is available in login and signup only',async()=>{
  const disabled=fixture();await disabled.auth.start();
  assert.equal(document.querySelector('[data-auth-action="google"]'),null);disabled.dom.window.close();
  const enabled=fixture({}, {}, {googleEnabled:true});await enabled.auth.start();
  assert.ok(document.querySelector('[data-auth-action="google"]'));
  document.querySelector('[data-auth-mode="signup"]').click();
  assert.ok(document.querySelector('[data-auth-action="google"]'));
  document.querySelector('[data-auth-mode="login"]').click();
  document.querySelector('[data-auth-mode="forgot"]').click();
  assert.equal(document.querySelector('[data-auth-action="google"]'),null);enabled.dom.window.close();
});
test('Google redirects to the same origin without extra scopes and preserves the team invitation',async()=>{
  const f=fixture({}, {}, {googleEnabled:true});
  const invitation='00000000-0000-0000-0000-000000000099';
  sessionStorage.setItem('project-lab-invite',invitation);
  await f.auth.start();document.querySelector('[data-auth-action="google"]').click();await tick();
  assert.deepEqual(f.calls,[['oauth',{provider:'google',options:{redirectTo:'http://localhost:4173/'}}]]);
  assert.equal(sessionStorage.getItem('project-lab-invite'),invitation);
  assert.equal(f.opened.length,0);
  f.emit('SIGNED_IN',{user:{id:'u1',email:'owner@example.test'}});await tick();
  assert.ok(document.querySelector('[data-auth-action="accept-invite"]'));
  assert.equal(f.opened.length,0);f.dom.window.close();
});
test('Google failures restore controls and do not open an unauthenticated studio',async()=>{
  let finish,requests=0;
  const f=fixture({}, {}, {googleEnabled:true,supabase:{auth:{
    onAuthStateChange(){},getSession:async()=>({data:{session:null}}),
    signInWithOAuth:()=>{requests++;return new Promise(resolve=>{finish=resolve;});}
  }}});
  await f.auth.start();const button=document.querySelector('[data-auth-action="google"]');
  button.click();button.click();assert.equal(requests,1);assert.equal(button.disabled,true);
  finish({error:new Error('Não foi possível entrar com Google.')});await tick();
  assert.equal(button.disabled,false);assert.match(document.querySelector('[data-auth-message]').textContent,/Não foi possível entrar com Google/);
  assert.equal(f.opened.length,0);f.dom.window.close();
});
