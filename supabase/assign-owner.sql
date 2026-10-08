-- Reemplazar SOLO el email por la cuenta exacta de Nacho creada en Authentication.
-- No modifica contraseñas ni borra usuarios. Falla si el usuario o el taller no existen.
do $$
declare owner_email text := 'REEMPLAZAR_EMAIL_DE_NACHO'; owner_id uuid; workspace_id uuid;
begin
  if owner_email = 'REEMPLAZAR_EMAIL_DE_NACHO' then raise exception 'Completar el email de Nacho'; end if;
  select id into owner_id from auth.users where lower(email)=lower(owner_email);
  if owner_id is null then raise exception 'Crear primero el usuario de Nacho en Authentication'; end if;
  select id into workspace_id from public.companies where slug='nachos-legacy';
  if workspace_id is null then raise exception 'Aplicar primero las migraciones del CRM'; end if;
  insert into public.memberships(company_id,user_id,role) values(workspace_id,owner_id,'admin') on conflict(company_id,user_id) do update set role='admin';
end $$;
