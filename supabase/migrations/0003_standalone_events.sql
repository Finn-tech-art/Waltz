-- Module 5: standalone calendar events
-- Allows a bring_up to exist without a file (e.g. "Office closed for
-- holiday"), which the flat file->branch join used for RLS since migration
-- 0001 cannot support once file_id can be null. This adds branch_id directly
-- to bring_ups, keeps it in sync with the linked file via trigger when one
-- exists, and rewrites the affected RLS policies to check it directly.

alter table public.bring_ups add column branch_id uuid references public.branches (id);
alter table public.bring_ups alter column file_id drop not null;

update public.bring_ups b
set branch_id = f.branch_id
from public.files f
where b.file_id = f.id and b.branch_id is null;

alter table public.bring_ups alter column branch_id set not null;

create function public.set_bring_up_branch()
returns trigger
language plpgsql
as $$
begin
  if new.file_id is not null then
    select branch_id into new.branch_id from public.files where id = new.file_id;
  end if;
  if new.branch_id is null then
    raise exception 'bring_ups.branch_id could not be determined: file_id must reference a valid file, or branch_id must be provided directly for a standalone event';
  end if;
  return new;
end;
$$;

create trigger trg_set_bring_up_branch
before insert or update on public.bring_ups
for each row execute function public.set_bring_up_branch();

-- Replace the file-join-based policies from migration 0001 with direct
-- branch_id checks, now that the column exists on the table itself.
drop policy "bring_ups_select" on public.bring_ups;
drop policy "bring_ups_insert" on public.bring_ups;
drop policy "bring_ups_update" on public.bring_ups;

create policy "bring_ups_select" on public.bring_ups
for select to authenticated using (public.is_admin() or public.is_branch_member(branch_id));

create policy "bring_ups_insert" on public.bring_ups
for insert to authenticated with check (public.is_admin() or public.is_branch_member(branch_id));

create policy "bring_ups_update" on public.bring_ups
for update to authenticated
using (public.is_admin() or public.is_branch_member(branch_id))
with check (public.is_admin() or public.is_branch_member(branch_id));

-- bring_up_staff can now join through bring_ups directly instead of
-- bring_ups -> files, since bring_ups carries its own branch_id.
drop policy "bring_up_staff_select" on public.bring_up_staff;
drop policy "bring_up_staff_insert" on public.bring_up_staff;
drop policy "bring_up_staff_delete" on public.bring_up_staff;

create policy "bring_up_staff_select" on public.bring_up_staff
for select to authenticated using (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(b.branch_id)
  )
);

create policy "bring_up_staff_insert" on public.bring_up_staff
for insert to authenticated with check (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(b.branch_id)
  )
);

create policy "bring_up_staff_delete" on public.bring_up_staff
for delete to authenticated using (
  public.is_admin() or exists (
    select 1 from public.bring_ups b
    where b.id = bring_up_staff.bring_up_id and public.is_branch_member(b.branch_id)
  )
);
