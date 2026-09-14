-- Module 4: document storage
-- Documents are stored as {branch_id}/{file_id}/{timestamp}-{filename} in a
-- private bucket. Storage RLS extracts branch_id from the path itself and
-- reuses the is_admin()/is_branch_member() helpers from migration 0001, so
-- branch isolation for documents works the same way it does everywhere else.
-- The public.documents table (row metadata) already has its own RLS from
-- migration 0001; this migration only covers the storage.objects layer.

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_storage_select" on storage.objects
for select to authenticated using (
  bucket_id = 'documents' and (
    public.is_admin() or public.is_branch_member((storage.foldername(name))[1]::uuid)
  )
);

create policy "documents_storage_insert" on storage.objects
for insert to authenticated with check (
  bucket_id = 'documents' and (
    public.is_admin() or public.is_branch_member((storage.foldername(name))[1]::uuid)
  )
);

create policy "documents_storage_delete" on storage.objects
for delete to authenticated using (
  bucket_id = 'documents' and public.is_admin()
);
