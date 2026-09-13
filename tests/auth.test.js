import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createAuth} from '../src/auth.js';

function fixture(overrides={},hooks={}) {
  const dom=new JSDOM('<body><section id="auth-screen"></section></body>',{url:'http://localhost:4173/'});
  for(const name of ['document','location','sessionStorage','history','FormData'])globalThis[name]=dom.window[name];
  let events,opened=[],locked=0,demo=0,calls=[];
  const client={
    auth:{onAuthStateChange:fn=>events=fn,getSession:async()=>({data:{session:null}}),
      signInWithPassword:async args=>{calls.push(['signin',args]);events('SIGNED_IN',{user:{id:'u1',email:'owner@example.test'}});return{};},
      signUp:async args=>{calls.push(['signup',args]);return{data:{session:null}};},
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
    {supabase:client,configured:true,emailEnabled:true,googleEnabled:false,redirectURL:()=>location.origin+'/'});
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
