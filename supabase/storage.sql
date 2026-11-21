-- Online photo storage for the maker. Run this once in the Supabase SQL editor.
-- Photos are shrunk in the browser before upload (about 300 KB at most), saved under a random folder name,
-- and readable by anyone who has the share link. Nobody needs an account to add or see a photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('door-photos', 'door-photos', true, 600000, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = true, file_size_limit = 600000, allowed_mime_types = array['image/webp', 'image/jpeg'];

-- Anyone may add a photo to this bucket. They cannot overwrite or delete existing ones.
drop policy if exists "door photos can be added by anyone" on storage.objects;
create policy "door photos can be added by anyone"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'door-photos');

-- Public read for the bucket is already granted by `public = true`.
