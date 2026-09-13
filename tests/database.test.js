import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {emptyState} from '../src/data.js';

test('SQL migration, tenant isolation, permissions, invites and concurrent revisions',async()=>{
  const db=new PGlite();
  try {
    await db.exec(`create role anon;create role authenticated;
      create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;
      insert into auth.users values
      ('00000000-0000-0000-0000-000000000001','owner@example.test',now()),
      ('00000000-0000-0000-0000-000000000002','other@example.test',now()),
      ('00000000-0000-0000-0000-000000000003','editor@example.test',now()),
      ('00000000-0000-0000-0000-000000000004','viewer@example.test',now()),
      ('00000000-0000-0000-0000-000000000005','unverified@example.test',null);`);
    await db.exec(await readFile(new URL('../supabase/migrations/202609130001_workspaces.sql',import.meta.url),'utf8'));
    const asUser=async n=>{await db.exec('reset role;set role authenticated;');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[`00000000-0000-0000-0000-${String(n).padStart(12,'0')}`]);};
    const scalar=async(sql,args=[])=>Object.values((await db.query(sql,args)).rows[0])[0];
    await asUser(1);const a=await scalar("select create_workspace('Studio A')");
    assert.equal(await scalar("select create_workspace('Duplicate')"),a);
    await asUser(2);const b=await scalar("select create_workspace('Studio B')");
    assert.equal((await db.query('select id from workspaces')).rows.length,1);
    assert.equal((await db.query('select * from workspace_data where workspace_id=$1',[a])).rows.length,0);
    assert.equal((await db.query('select * from workspace_members where workspace_id=$1',[a])).rows.length,0);
    await assert.rejects(db.query('select save_workspace($1,1,$2)',[a,emptyState('Studio A')]),/write_forbidden/);
    await assert.rejects(db.query("insert into workspace_members values($1,auth.uid(),'owner',now())",[a]),/permission denied/);
    await assert.rejects(db.query('select create_workspace_invite($1,$2,$3)',[a,'x@example.test','owner']),/owner_required/);
    await asUser(1);
    assert.equal(await scalar('select save_workspace($1,1,$2)',[a,emptyState('Renamed A')]),2);
    await assert.rejects(db.query('select save_workspace($1,1,$2)',[a,emptyState('Stale')]),/revision_conflict/);
    assert.equal(await scalar('select name from workspaces where id=$1',[a]),'Renamed A');
    await assert.rejects(db.query('select save_workspace($1,2,$2)',[a,{...emptyState(),projects:[{id:'unsafe"',name:'Bad'}]}]),/invalid_record/);
    await assert.rejects(db.query('select create_workspace_invite($1,$2,$3)',[a,'editor@example.test','owner']),/invalid_invite/);
    const invite=await scalar('select create_workspace_invite($1,$2,$3)',[a,'editor@example.test','editor']);
    const viewInvite=await scalar('select create_workspace_invite($1,$2,$3)',[a,'viewer@example.test','viewer']);
    const revoked=await scalar('select create_workspace_invite($1,$2,$3)',[a,'editor@example.test','editor']);
    await db.query('select revoke_workspace_invite($1)',[revoked]);
    await asUser(2);await assert.rejects(db.query('select accept_workspace_invite($1)',[invite]),/invalid_or_expired_invite/);
    await asUser(3);assert.equal(await scalar('select accept_workspace_invite($1)',[invite]),a);
    await assert.rejects(db.query('select accept_workspace_invite($1)',[invite]),/invalid_or_expired_invite/);
    await assert.rejects(db.query('select accept_workspace_invite($1)',[revoked]),/invalid_or_expired_invite/);
    assert.equal((await db.query('select id from workspaces')).rows.length,1);
    assert.equal(await scalar('select save_workspace($1,2,$2)',[a,emptyState('Renamed A')]),3);
    await assert.rejects(db.query('select save_workspace($1,3,$2)',[a,emptyState('Editor rename')]),/owner_required/);
    await assert.rejects(db.query('select create_workspace_invite($1,$2,$3)',[a,'viewer@example.test','editor']),/owner_required/);
    await asUser(4);await db.query('select accept_workspace_invite($1)',[viewInvite]);
    assert.equal((await db.query('select * from workspace_data')).rows.length,1);
    await assert.rejects(db.query('select save_workspace($1,3,$2)',[a,emptyState('Renamed A')]),/write_forbidden/);
    await asUser(1);await db.query('select remove_workspace_member($1,$2)',[a,'00000000-0000-0000-0000-000000000003']);
    await asUser(3);assert.equal((await db.query('select * from workspace_data')).rows.length,0);
    await assert.rejects(db.query('select list_workspace_members($1)',[b]),/membership_required/);
    await asUser(5);await assert.rejects(db.query("select create_workspace('Unverified')"),/verified_login_required/);
    await db.exec('reset role;set role anon;');
    await assert.rejects(db.query('select * from workspace_data'),/permission denied/);
    await assert.rejects(db.query("select create_workspace('Anonymous')"),/permission denied/);
    await assert.rejects(db.query('select save_workspace($1,3,$2)',[a,emptyState()]),/permission denied/);
  }finally{await db.close();}
});
