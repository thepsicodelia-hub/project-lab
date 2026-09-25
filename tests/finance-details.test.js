import { test } from 'node:test';
import assert from 'node:assert/strict';
import { financeDetailRows } from '../src/finance-details.js';
import { financialSummary, received, outstanding } from '../src/data.js';

test('finance shortcuts reconcile with cards including partial receipts and other months', () => {
  const state = { income:[
    {id:'partial',value:100,paid:40,status:'Parcial',date:'2026-08-01',paidDate:'2026-09-10'},
    {id:'pending',value:200,status:'Pendente',date:'2026-10-01'},
    {id:'paid',value:300,status:'Pago',date:'2026-09-01',paidDate:'2026-08-01'},
    {id:'undated',value:10,status:'Pago',paidDate:''},
  ], costs:[{value:50,paid:true,date:'2026-09-01'},{value:60,paid:false,date:'2026-09-01'},{value:20,paid:true,date:''}] };
  const summary=financialSummary(state,'2026-09');
  const rows=(view,detail)=>financeDetailRows(state,{view,detail,period:'2026-09'});
  assert.equal(rows('income','received').reduce((s,r)=>s+received(r),0),summary.revenue);
  assert.equal(rows('costs','paid').reduce((s,r)=>s+r.value,0),summary.costs);
  assert.equal(rows('income','outstanding').reduce((s,r)=>s+outstanding(r),0),summary.receivable);
  assert.deepEqual(rows('income','outstanding').map(r=>r.id),['partial','pending']);
  assert.equal(financeDetailRows(state,{view:'income',period:''}).length,4);
});
