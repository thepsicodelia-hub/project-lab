import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emptyState,parseState,financialSummary,monthlySeries,outstanding} from '../src/data.js';

test('new studios start empty; legacy backups migrate without inventing payment dates',()=>{
  const empty=emptyState('Studio');assert.equal(empty.projects.length,0);assert.equal(empty.version,2);
  const migrated=parseState({...empty,version:1,income:[{name:'Receita antiga',value:100,status:'Pago'}]});
  assert.ok(migrated.income[0].id);assert.equal(migrated.income[0].paidDate,'');assert.equal(financialSummary(migrated,'2026-09').revenue,0);
});
test('cash uses payment dates, partial amounts, and paid expenses; future invoices remain outstanding',()=>{
  const state=parseState({...emptyState(),income:[
    {id:'i1',name:'Pago em agosto',value:1000,status:'Pago',paidDate:'2026-08-31',date:'2026-09-01'},
    {id:'i2',name:'Parcial',value:800,status:'Parcial',paid:300,paidDate:'2026-09-05'},
    {id:'i3',name:'Pendente',value:200,status:'Pendente',date:'2026-10-01'}
  ],costs:[{id:'c1',name:'Pago',value:100,paid:true,date:'2026-09-02'},{id:'c2',name:'Pendente',value:70,paid:false,date:'2026-09-03'}]});
  assert.deepEqual(financialSummary(state,'2026-09'),{revenue:300,costs:100,profit:200,receivable:700});
  assert.equal(outstanding(state.income[1]),500);assert.equal(monthlySeries(state,2026)[7].revenue,1000);
});
test('rejects invalid dates, unsafe ids, duplicate ids, non-finite money and oversized backups',()=>{
  const state=emptyState();
  assert.throws(()=>parseState({...state,events:[{id:'e1',name:'Invalid',date:'2026-02-30'}]}));
  assert.throws(()=>parseState({...state,clients:[{id:'" onclick="evil()',name:'Bad'}]}));
  assert.throws(()=>parseState({...state,clients:[{id:'a',name:'A'},{id:'a',name:'B'}]}));
  assert.throws(()=>parseState({...state,goal:Infinity}));
  assert.throws(()=>parseState({...state,income:[{id:'i',name:'Overpaid',value:2,paid:3,status:'Parcial'}]}));
  assert.throws(()=>parseState({...state,script:'a'.repeat(50001)}));
  assert.throws(()=>parseState({...state,projects:Array.from({length:30},(_,i)=>({id:`p${i}`,name:'Project',stage:0,note:'x'.repeat(50000)}))}));
});
test('team profiles accept Google photos and reject untrusted remote images',()=>{
  const state=emptyState();
  const parsed=parseState({...state,team:[{id:'m1',name:'Ana',role:'Direção',initials:'AN',accountId:'user-1',accountPhoto:'https://lh3.googleusercontent.com/a/avatar'}]});
  assert.equal(parsed.team[0].accountPhoto,'https://lh3.googleusercontent.com/a/avatar');
  assert.throws(()=>parseState({...state,team:[{id:'m1',name:'Ana',accountPhoto:'https://tracker.example/avatar.jpg'}]}));
});
