create table public.cluster_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  company_name text,
  hectares numeric check (hectares >= 0),
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert on public.cluster_inquiries to authenticated;
grant all on public.cluster_inquiries to service_role;

alter table public.cluster_inquiries enable row level security;

create policy "Users can insert their own cluster inquiry"
on public.cluster_inquiries
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own cluster inquiries"
on public.cluster_inquiries
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can manage all cluster inquiries"
on public.cluster_inquiries
for all
to authenticated
using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'sub_admin'))
with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'sub_admin'));

create index idx_cluster_inquiries_created_at on public.cluster_inquiries(created_at desc);
create index idx_cluster_inquiries_status on public.cluster_inquiries(status);
