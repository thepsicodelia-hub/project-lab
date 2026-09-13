-- Project Lab: apply once to a new Supabase project, before exposing the application.
begin;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id,user_id)
);
create index workspace_members_user_idx on public.workspace_members(user_id,workspace_id);
create table public.workspace_data (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check (jsonb_typeof(data)='object' and octet_length(data::text)<=1048576)
);
create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null check (length(email) between 3 and 254),
  role text not null check (role in ('editor','viewer')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index workspace_invites_workspace_idx on public.workspace_invites(workspace_id);

create function private.member_role(p_workspace uuid) returns text
language sql stable security definer set search_path='' as $$
  select role from public.workspace_members where workspace_id=p_workspace and user_id=(select auth.uid());
$$;
revoke all on function private.member_role(uuid) from public;
grant execute on function private.member_role(uuid) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_data enable row level security;
alter table public.workspace_invites enable row level security;
revoke all on public.workspaces,public.workspace_members,public.workspace_data,public.workspace_invites from anon,authenticated;
grant select on public.workspaces,public.workspace_members,public.workspace_data,public.workspace_invites to authenticated;
create policy workspace_read on public.workspaces for select to authenticated using (private.member_role(id) is not null);
create policy members_read on public.workspace_members for select to authenticated using (private.member_role(workspace_id) is not null);
create policy data_read on public.workspace_data for select to authenticated using (private.member_role(workspace_id) is not null);
create policy invite_read on public.workspace_invites for select to authenticated using (private.member_role(workspace_id)='owner');

create function private.validate_data(p_data jsonb) returns void
language plpgsql set search_path='' as $$
declare k text; item jsonb;
begin
  if p_data is null or jsonb_typeof(p_data) is distinct from 'object' or octet_length(p_data::text)>1048576
    or (p_data->>'version') is distinct from '2'
    or jsonb_typeof(p_data->'workspace') is distinct from 'string'
    or length(trim(p_data->>'workspace')) not between 1 and 80
    or jsonb_typeof(p_data->'goal') is distinct from 'number'
    or (p_data->>'goal')::numeric not between 1 and 10000000000
    or coalesce(p_data->>'theme','') not in ('dark','light') then
    raise exception 'invalid_workspace_data';
  end if;
  foreach k in array array['projects','clients','team','tasks','events','equipment','leads','income','costs'] loop
    if jsonb_typeof(p_data->k) is distinct from 'array' or jsonb_array_length(p_data->k)>2000 then raise exception 'invalid_collection'; end if;
    for item in select value from jsonb_array_elements(p_data->k) loop
      if jsonb_typeof(item) is distinct from 'object'
        or jsonb_typeof(item->'id') is distinct from 'string'
        or (item->>'id') !~ '^[a-zA-Z0-9_-]{1,100}$'
        or jsonb_typeof(item->'name') is distinct from 'string'
        or length(trim(item->>'name')) not between 1 and 150 then raise exception 'invalid_record'; end if;
    end loop;
    if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p_data->k)) then raise exception 'duplicate_id'; end if;
  end loop;
end;
$$;
revoke all on function private.validate_data(jsonb) from public;

create function public.create_workspace(p_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare w uuid; u uuid:=auth.uid();
begin
  if u is null or not exists (select 1 from auth.users where id=u and email_confirmed_at is not null) then raise exception 'verified_login_required'; end if;
  if p_name is null or length(trim(p_name)) not between 1 and 80 then raise exception 'invalid_name'; end if;
  insert into public.workspaces(owner_id,name) values(u,trim(p_name))
    on conflict(owner_id) do nothing returning id into w;
  if w is null then select id into w from public.workspaces where owner_id=u; return w; end if;
  insert into public.workspace_members(workspace_id,user_id,role) values(w,u,'owner');
  insert into public.workspace_data(workspace_id,updated_by,data) values(w,u,jsonb_build_object(
    'version',2,'workspace',trim(p_name),'theme','dark','goal',40000,'openingBalance',0,'script','',
    'projects','[]'::jsonb,'clients','[]'::jsonb,'team','[]'::jsonb,'tasks','[]'::jsonb,'events','[]'::jsonb,
    'equipment','[]'::jsonb,'leads','[]'::jsonb,'income','[]'::jsonb,'costs','[]'::jsonb,'scenes','[]'::jsonb));
  return w;
end;
$$;

create function public.save_workspace(p_workspace uuid,p_revision integer,p_data jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare r integer; access_role text;
begin
  -- Row lock serializes saves; the revision check rejects stale clients.
  select role into access_role from public.workspace_members
    where workspace_id=p_workspace and user_id=auth.uid() for share;
  if access_role is null or access_role not in ('owner','editor') then raise exception 'write_forbidden'; end if;
  perform private.validate_data(p_data);
  if access_role<>'owner' and (p_data->>'workspace') is distinct from (select name from public.workspaces where id=p_workspace) then raise exception 'owner_required'; end if;
  update public.workspace_data set data=p_data,revision=revision+1,updated_at=now(),updated_by=auth.uid()
    where workspace_id=p_workspace and revision=p_revision returning revision into r;
  if r is null then raise exception 'revision_conflict'; end if;
  update public.workspaces set name=p_data->>'workspace' where id=p_workspace;
  return r;
end;
$$;

create function public.create_workspace_invite(p_workspace uuid,p_email text,p_role text) returns uuid
language plpgsql security definer set search_path='' as $$
declare token uuid;
begin
  if private.member_role(p_workspace) is distinct from 'owner' then raise exception 'owner_required'; end if;
  if p_email is null or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(p_email)>254
    or p_role is null or p_role not in ('editor','viewer') then raise exception 'invalid_invite'; end if;
  if (select count(*) from public.workspace_invites where workspace_id=p_workspace and created_at>now()-interval '1 day')>=20 then raise exception 'daily_invite_limit'; end if;
  insert into public.workspace_invites(workspace_id,email,role) values(p_workspace,lower(trim(p_email)),p_role) returning id into token;
  return token;
end;
$$;

create function public.accept_workspace_invite(p_invite uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare invitation public.workspace_invites; user_email text;
begin
  select lower(email) into user_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  if user_email is null then raise exception 'verified_login_required'; end if;
  select * into invitation from public.workspace_invites where id=p_invite for update;
  if not found or invitation.email<>user_email or invitation.expires_at<=now() or invitation.revoked_at is not null or invitation.accepted_at is not null then raise exception 'invalid_or_expired_invite'; end if;
  insert into public.workspace_members(workspace_id,user_id,role) values(invitation.workspace_id,auth.uid(),invitation.role)
    on conflict(workspace_id,user_id) do nothing;
  update public.workspace_invites set accepted_at=now() where id=p_invite;
  return invitation.workspace_id;
end;
$$;

create function public.revoke_workspace_invite(p_invite uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.workspace_invites where id=p_invite and private.member_role(workspace_id)='owner') then raise exception 'owner_required'; end if;
  update public.workspace_invites set revoked_at=now() where id=p_invite;
end;
$$;

create function public.remove_workspace_member(p_workspace uuid,p_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if private.member_role(p_workspace) is distinct from 'owner' then raise exception 'owner_required'; end if;
  if p_user=auth.uid() then raise exception 'cannot_remove_owner'; end if;
  delete from public.workspace_members where workspace_id=p_workspace and user_id=p_user and role<>'owner';
end;
$$;

create function public.list_workspace_members(p_workspace uuid) returns table(user_id uuid,email text,role text)
language plpgsql security definer set search_path='' as $$
begin
  if private.member_role(p_workspace) is null then raise exception 'membership_required'; end if;
  return query select m.user_id,u.email::text,m.role from public.workspace_members m join auth.users u on u.id=m.user_id where m.workspace_id=p_workspace order by m.created_at;
end;
$$;

revoke all on function public.create_workspace(text),public.save_workspace(uuid,integer,jsonb),public.create_workspace_invite(uuid,text,text),public.accept_workspace_invite(uuid),public.revoke_workspace_invite(uuid),public.remove_workspace_member(uuid,uuid),public.list_workspace_members(uuid) from public,anon;
grant execute on function public.create_workspace(text),public.save_workspace(uuid,integer,jsonb),public.create_workspace_invite(uuid,text,text),public.accept_workspace_invite(uuid),public.revoke_workspace_invite(uuid),public.remove_workspace_member(uuid,uuid),public.list_workspace_members(uuid) to authenticated;
commit;
