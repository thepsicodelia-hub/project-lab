import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, parseState } from '../src/data.js';
import { deleteProduction } from '../src/delete-production.js';

test('production deletion preserves financial and equipment history and unlinks manual events', () => {
  const state = emptyState('Teste');
  state.projects = [{ id:'p1', name:'Produção', stage:0 }];
  state.costs = [{id:'c1',name:'Editor',projectId:'p1',value:500,date:'2026-09-23',paid:true}];
  state.events = [{id:'auto-p1-delivery',name:'Entrega',projectId:'p1',date:'2026-09-23',time:'10:00',type:'Entrega'}, {id:'manual',name:'Reunião',projectId:'p1',date:'2026-09-23',time:'10:00',type:'Reunião'}];
  state.equipmentLinks = [{id:'link',equipmentId:'eq1',projectId:'p1',days:2,revenue:100}];
  deleteProduction(state,'p1');
  assert.equal(state.projects.length,0);
  assert.equal(state.costs[0].value,500);
  assert.equal(state.costs[0].projectId,'');
  assert.deepEqual(state.events.map(row=>row.id),['manual']);
  assert.equal(state.events[0].projectId,'');
  assert.equal(state.equipmentLinks[0].revenue,100);
  assert.doesNotThrow(()=>parseState(state));
});
