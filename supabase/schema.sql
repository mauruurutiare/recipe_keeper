-- =============================================
-- レシピ管理アプリ用テーブル定義
-- Supabase の SQL Editor に貼り付けて実行してください
-- =============================================

-- recipesテーブルの作成
create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  genre       text not null,
  ingredients text not null,  -- 改行区切りで複数の材料を1フィールドに格納
  steps       text not null,  -- 改行区切りで複数の手順を1フィールドに格納
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_atを自動更新するトリガー関数
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row
  execute function public.set_updated_at();

-- =============================================
-- Row Level Security (RLS) の設定
-- =============================================

-- RLSを有効化（デフォルトで全アクセスを拒否）
alter table public.recipes enable row level security;

-- SELECT: 自分が登録したレシピのみ取得可能
create policy "自分のレシピのみ取得できる"
  on public.recipes
  for select
  using (auth.uid() = user_id);

-- INSERT: ログイン中のユーザーのみ登録可能（user_idは自動でセット）
create policy "自分のレシピのみ登録できる"
  on public.recipes
  for insert
  with check (auth.uid() = user_id);

-- UPDATE: 自分が登録したレシピのみ更新可能
create policy "自分のレシピのみ更新できる"
  on public.recipes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: 自分が登録したレシピのみ削除可能
create policy "自分のレシピのみ削除できる"
  on public.recipes
  for delete
  using (auth.uid() = user_id);
