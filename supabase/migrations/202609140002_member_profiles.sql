create function public.list_workspace_member_profiles(p_workspace uuid)
returns table(user_id uuid,email text,role text,display_name text,avatar_url text)
language plpgsql security definer set search_path=''
as $$
begin
  if private.member_role(p_workspace) is null then raise exception 'membership_required'; end if;
  return query
    select m.user_id,
      u.email::text,
      m.role,
      coalesce(u.raw_user_meta_data->>'display_name',u.raw_user_meta_data->>'full_name',split_part(u.email::text,'@',1))::text,
      coalesce(u.raw_user_meta_data->>'avatar_url','')::text
    from public.workspace_members m
    join auth.users u on u.id=m.user_id
    where m.workspace_id=p_workspace
    order by m.created_at;
end;
$$;

revoke all on function public.list_workspace_member_profiles(uuid) from public,anon;
grant execute on function public.list_workspace_member_profiles(uuid) to authenticated;
