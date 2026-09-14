-- Law Firm MVP: initial schema
-- Tables per PRD section 6, with two deliberate deviations (approved before writing):
--   1. "users" (PRD 6.2) becomes "profiles", keyed to auth.users, with no password_hash
--      column, since Supabase Auth owns credentials.
--   2. created_by/updated_at are added to clients and invoices (not listed in PRD 6.4/6.9)
--      to match the audit-trail principle stated in PRD section 8, applied consistently.

-- =========================================================================
-- 1. Tables
-- =========================================================================

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

create table public.user_branches (
  user_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  primary key (user_id, branch_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('individual', 'organization')),
  name text not null,
  contact_email text,
  contact_phone text,
  branch_id uuid not null references public.branches (id),
  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  file_number text not null unique,
  client_id uuid not null references public.clients (id),
  branch_id uuid not null references public.branches (id),
  matter_type text,
  responsible_lawyer_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bring_ups (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files (id) on delete cascade,
  event_type text not null check (event_type in ('court_date', 'other')),
  title text not null,
  description text,
  due_date timestamptz not null,
  created_by uuid references public.profiles (id),
  status text not null default 'upcoming' check (status in ('upcoming', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bring_up_staff (
  bring_up_id uuid not null references public.bring_ups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (bring_up_id, user_id)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files (id) on delete cascade,
  uploaded_by uuid references public.profiles (id),
  file_name text not null,
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.files (id),
  client_id uuid not null references public.clients (id),
  branch_id uuid not null references public.branches (id),
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'unpaid')),
  subtotal numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  fee_basis text not null check (fee_basis in ('fixed', 'hourly', 'percentage_of_value')),
  rate numeric(14, 2),
  hours numeric(8, 2),
  amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 2. Indexes for the lookups the PRD calls out (branch scoping, search/filter,
--    dashboard counts, and joins through parent records)
-- =========================================================================

create index idx_user_branches_branch on public.user_branches (branch_id);
create index idx_clients_branch on public.clients (branch_id);
create index idx_clients_name on public.clients (name);
create index idx_files_branch on public.files (branch_id);
create index idx_files_client on public.files (client_id);
create index idx_files_status on public.files (status);
create index idx_bring_ups_file on public.bring_ups (file_id);
create index idx_bring_ups_due_date on public.bring_ups (due_date);
create index idx_bring_up_staff_user on public.bring_up_staff (user_id);
create index idx_documents_file on public.documents (file_id);
create index idx_invoices_branch on public.invoices (branch_id);
create index idx_invoices_client on public.invoices (client_id);
create index idx_invoice_line_items_invoice on public.invoice_line_items (invoice_id);

-- =========================================================================
-- 3. Auto-numbering for file_number / invoice_number
-- =========================================================================

create sequence public.file_number_seq;
create sequence public.invoice_number_seq;

create function public.set_file_number()
returns trigger
language plpgsql
as $$
begin
  if new.file_number is null then
    new.file_number := 'F-' || lpad(nextval('public.file_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_set_file_number
before insert on public.files
for each row execute function public.set_file_number();

create function public.set_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

create trigger trg_set_invoice_number
before insert on public.invoices
for each row execute function public.set_invoice_number();

-- =========================================================================
-- 4. updated_at maintenance (clients, files, bring_ups, invoices)
-- =========================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger trg_files_updated_at
before update on public.files
for each row execute function public.set_updated_at();

create trigger trg_bring_ups_updated_at
before update on public.bring_ups
for each row execute function public.set_updated_at();

create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

-- =========================================================================
-- 5. RLS helper functions
-- =========================================================================

create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create function public.is_branch_member(target_branch_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.user_branches
    where user_id = auth.uid() and branch_id = target_branch_id
  );
$$;

-- =========================================================================
-- 6. Row Level Security
-- =========================================================================

alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.user_branches enable row level security;
alter table public.clients enable row level security;
alter table public.files enable row level security;
alter table public.bring_ups enable row level security;
alter table public.bring_up_staff enable row level security;
alter table public.documents enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_line_items enable row level security;

-- branches: any authenticated user can see the branch list; only admin manages it
create policy "branches_select" on public.branches
for select to authenticated using (true);

create policy "branches_write" on public.branches
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- profiles: any authenticated user can see names/roles (small firm, low sensitivity);
-- only admin creates/edits/removes profiles; a user may update their own row
create policy "profiles_select" on public.profiles
for select to authenticated using (true);

create policy "profiles_insert" on public.profiles
for insert to authenticated with check (public.is_admin());

create policy "profiles_update" on public.profiles
for update to authenticated
using (public.is_admin() or id = auth.uid())
with check (public.is_admin() or id = auth.uid());

create policy "profiles_delete" on public.profiles
for delete to authenticated using (public.is_admin());

-- user_branches: admin manages assignments; a staff member can see their own assignments
create policy "user_branches_select" on public.user_branches
for select to authenticated using (public.is_admin() or user_id = auth.uid());

create policy "user_branches_write" on public.user_branches
for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- clients: branch-scoped read/write, admin-only delete
create policy "clients_select" on public.clients
for select to authenticated using (public.is_admin() or public.is_branch_member(branch_id));

create policy "clients_insert" on public.clients
for insert to authenticated with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "clients_update" on public.clients
for update to authenticated
using (public.is_admin() or public.is_branch_member(branch_id))
with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "clients_delete" on public.clients
for delete to authenticated using (public.is_admin());

-- files: branch-scoped read/write, admin-only delete
create policy "files_select" on public.files
for select to authenticated using (public.is_admin() or public.is_branch_member(branch_id));

create policy "files_insert" on public.files
for insert to authenticated with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "files_update" on public.files
for update to authenticated
using (public.is_admin() or public.is_branch_member(branch_id))
with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "files_delete" on public.files
for delete to authenticated using (public.is_admin());

-- bring_ups: scoped through the parent file's branch
create policy "bring_ups_select" on public.bring_ups
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = bring_ups.file_id and public.is_branch_member(f.branch_id)
  )
);

create policy "bring_ups_insert" on public.bring_ups
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = bring_ups.file_id and public.is_branch_member(f.branch_id)
  )
);

create policy "bring_ups_update" on public.bring_ups
for update to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = bring_ups.file_id and public.is_branch_member(f.branch_id)
  )
)
with check (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = bring_ups.file_id and public.is_branch_member(f.branch_id)
  )
);

create policy "bring_ups_delete" on public.bring_ups
for delete to authenticated using (public.is_admin());

-- bring_up_staff: scoped through bring_ups -> files branch
create policy "bring_up_staff_select" on public.bring_up_staff
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    join public.files f on f.id = b.file_id
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(f.branch_id)
  )
);

create policy "bring_up_staff_insert" on public.bring_up_staff
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    join public.files f on f.id = b.file_id
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(f.branch_id)
  )
);

create policy "bring_up_staff_delete" on public.bring_up_staff
for delete to authenticated using (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    join public.files f on f.id = b.file_id
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(f.branch_id)
  )
);

-- documents: scoped through the parent file's branch, admin-only delete
create policy "documents_select" on public.documents
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = documents.file_id and public.is_branch_member(f.branch_id)
  )
);

create policy "documents_insert" on public.documents
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.files f
    where f.id = documents.file_id and public.is_branch_member(f.branch_id)
  )
);

create policy "documents_delete" on public.documents
for delete to authenticated using (public.is_admin());

-- invoices: branch-scoped read/write, admin-only delete
create policy "invoices_select" on public.invoices
for select to authenticated using (public.is_admin() or public.is_branch_member(branch_id));

create policy "invoices_insert" on public.invoices
for insert to authenticated with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "invoices_update" on public.invoices
for update to authenticated
using (public.is_admin() or public.is_branch_member(branch_id))
with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "invoices_delete" on public.invoices
for delete to authenticated using (public.is_admin());

-- invoice_line_items: scoped through the parent invoice's branch
create policy "invoice_line_items_select" on public.invoice_line_items
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id and public.is_branch_member(i.branch_id)
  )
);

create policy "invoice_line_items_insert" on public.invoice_line_items
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id and public.is_branch_member(i.branch_id)
  )
);

create policy "invoice_line_items_update" on public.invoice_line_items
for update to authenticated
using (
  public.is_admin() or exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id and public.is_branch_member(i.branch_id)
  )
)
with check (
  public.is_admin() or exists (
    select 1 from public.invoices i
    where i.id = invoice_line_items.invoice_id and public.is_branch_member(i.branch_id)
  )
);

create policy "invoice_line_items_delete" on public.invoice_line_items
for delete to authenticated using (public.is_admin());
