-- Single shared board row read and written by the app (id = 1).
create table if not exists public.boggle_board (
  id int primary key,
  letters text[] not null default '{}'
);

insert into public.boggle_board (id) values (1) on conflict (id) do nothing;

alter table public.boggle_board enable row level security;

-- The app has no login, so anonymous clients may read and update (but not
-- insert or delete) the one board row.
create policy "anyone can read the board" on public.boggle_board
  for select using (true);
create policy "anyone can update the board" on public.boggle_board
  for update using (id = 1) with check (id = 1);
