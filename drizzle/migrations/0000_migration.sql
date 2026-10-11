-- Roles
create type public.app_role as enum ('admin', 'user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text,
  hide_values boolean not null default false,
  status text not null default 'active' check (status in ('active','suspended')),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_active_user(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'active' from public.profiles where id = _user_id), false)
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create policy "Users read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Users may not change their own status
create or replace function public.protect_profile_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and coalesce(auth.role(),'') <> 'service_role' then
    new.status := old.status;
  end if;
  new.updated_at := now();
  return new;
end; $$;
create trigger profiles_protect before update on public.profiles for each row execute function public.protect_profile_status();

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 40),
  kind text not null check (kind in ('income','expense')),
  icon text not null default 'tag',
  created_at timestamptz not null default now(),
  unique (user_id, kind, name)
);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Own categories" on public.categories for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_active_user(auth.uid()));

-- Recurring expenses
create table public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  amount numeric(14,2) not null check (amount > 0),
  category_id uuid references public.categories(id) on delete set null,
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  start_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.recurring_expenses to authenticated;
grant all on public.recurring_expenses to service_role;
alter table public.recurring_expenses enable row level security;
create policy "Own recurring" on public.recurring_expenses for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_active_user(auth.uid()));

-- Transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null check (type in ('income','expense','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null default '' check (char_length(description) <= 200),
  category_id uuid references public.categories(id) on delete set null,
  occurred_on date not null default current_date,
  payment_method text,
  status text not null default 'paid' check (status in ('paid','pending')),
  paid_at timestamptz,
  recurring_id uuid references public.recurring_expenses(id) on delete cascade,
  installment_group uuid,
  installment_number int,
  installment_total int,
  client_request_id uuid,
  source text not null default 'manual' check (source in ('manual','assistant','recurring')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_request_id),
  unique (recurring_id, occurred_on)
);
create index transactions_user_date on public.transactions (user_id, occurred_on desc);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "Own transactions" on public.transactions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_active_user(auth.uid()));

-- Tools / links
create table public.user_tools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 160),
  url text not null check (url ~* '^https://[^\s/$.?#].[^\s]*$'),
  icon text not null default 'link',
  position int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.user_tools to authenticated;
grant all on public.user_tools to service_role;
alter table public.user_tools enable row level security;
create policy "Own tools" on public.user_tools for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_active_user(auth.uid()));

-- Assistant history
create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index assistant_messages_user on public.assistant_messages (user_id, created_at);
grant select, insert, delete on public.assistant_messages to authenticated;
grant all on public.assistant_messages to service_role;
alter table public.assistant_messages enable row level security;
create policy "Own messages" on public.assistant_messages for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_active_user(auth.uid()));

-- Admin settings
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
grant select, insert, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "Admins manage settings" on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
insert into public.app_settings (key, value) values
  ('assistant_enabled', 'true'::jsonb),
  ('signups_message', '""'::jsonb);

-- Audit log
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_user_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "Admins read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Signup: profile + default categories
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  insert into public.categories (user_id, name, kind, icon) values
    (new.id,'Alimentação','expense','utensils'),
    (new.id,'Supermercado','expense','shopping-cart'),
    (new.id,'Transporte','expense','car'),
    (new.id,'Moradia','expense','home'),
    (new.id,'Saúde','expense','heart-pulse'),
    (new.id,'Lazer','expense','gamepad-2'),
    (new.id,'Contas','expense','receipt'),
    (new.id,'Outros','expense','tag'),
    (new.id,'Salário','income','briefcase'),
    (new.id,'Freelance','income','laptop'),
    (new.id,'Outras receitas','income','coins');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Generate recurring occurrences for the caller (idempotent)
create or replace function public.generate_recurring_occurrences(_until date default (current_date + 60))
returns int language plpgsql security invoker set search_path = public as $$
declare r record; d date; n int := 0; step interval;
begin
  for r in select * from public.recurring_expenses where user_id = auth.uid() and active loop
    step := case r.frequency when 'weekly' then interval '7 days' when 'monthly' then interval '1 month' else interval '1 year' end;
    d := r.start_date;
    while d <= _until loop
      insert into public.transactions (user_id, type, amount, description, category_id, occurred_on, status, recurring_id, source)
      values (r.user_id, 'expense', r.amount, r.name, r.category_id, d, 'pending', r.id, 'recurring')
      on conflict (recurring_id, occurred_on) do nothing;
      if found then n := n + 1; end if;
      d := (r.start_date + step * (select count(*) from generate_series(r.start_date, d, step)))::date;
    end loop;
  end loop;
  return n;
end; $$;
grant execute on function public.generate_recurring_occurrences(date) to authenticated;