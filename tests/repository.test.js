import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WorkspaceRepository} from '../src/repository.js';
import {emptyState} from '../src/data.js';

test('stale editors cannot overwrite another save and revision only advances on success',async()=>{
  let row={data:emptyState('Original'),revision:1};
  const client={from:()=>({select:()=>({eq:()=>({single:async()=>({data:structuredClone(row),error:null})})})}),
    rpc:async(name,args)=>{
      if(args.p_revision!==row.revision)return {error:{message:'revision_conflict'}};
      row={data:args.p_data,revision:row.revision+1};return {data:row.revision};
    }};
  const a=new WorkspaceRepository(client,'studio'),b=new WorkspaceRepository(client,'studio');
  const first=await a.load(),second=await b.load();first.workspace='Saved A';second.workspace='Saved B';
  await a.save(first);assert.equal(a.revision,2);
  await assert.rejects(b.save(second),{code:'CONFLICT'});assert.equal(row.data.workspace,'Saved A');assert.equal(b.revision,1);
  assert.equal(await b.hasUpdates(),true);await b.load();assert.equal(b.revision,2);
});
test('save errors do not advance revision or mutate committed data',async()=>{
  const client={rpc:async()=>({error:{message:'network unavailable'}})};
  const repo=new WorkspaceRepository(client,'studio');
  await assert.rejects(repo.save(emptyState()),/Carregue/);repo.revision=4;
  await assert.rejects(repo.save(emptyState()));assert.equal(repo.revision,4);
});
