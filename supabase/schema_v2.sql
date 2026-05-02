-- =============================================
-- グループ共有機能の追加マイグレーション
-- schema.sql を実行済みの環境に追加で実行してください
-- =============================================

-- ============================================================
-- 1. プロフィールテーブル
--    メールアドレスでユーザーを検索するために使用
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now()
);

-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 既存ユーザーのプロフィールを作成（初回実行時のみ必要）
insert into public.profiles (id, email)
  select id, email from auth.users
  on conflict (id) do nothing;

alter table public.profiles enable row level security;

-- 認証済みユーザーはメールアドレス検索のため全プロフィールを参照可
create policy "認証済みユーザーはプロフィールを参照できる"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- ============================================================
-- 2. グループテーブル
-- ============================================================
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.groups enable row level security;

-- groupsのSELECTポリシーはgroup_membersテーブル作成後に追加する（下記を参照）
create policy "認証済みユーザーはグループを作成できる"
  on public.groups for insert
  with check (auth.uid() = owner_id);

create policy "オーナーのみグループを更新できる"
  on public.groups for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "オーナーのみグループを削除できる"
  on public.groups for delete
  using (auth.uid() = owner_id);

-- ============================================================
-- 3. グループメンバーテーブル
-- ============================================================
create table if not exists public.group_members (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

-- 同じグループのメンバーはメンバー一覧を参照可
create policy "グループメンバーはメンバー一覧を参照できる"
  on public.group_members for select
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- グループオーナーのみメンバーを追加できる
create policy "オーナーのみメンバーを追加できる"
  on public.group_members for insert
  with check (
    group_id in (
      select id from public.groups where owner_id = auth.uid()
    )
  );

-- オーナーによる除名、または自分自身の退会を許可
create policy "オーナーまたは本人のみメンバーを削除できる"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or group_id in (
      select id from public.groups where owner_id = auth.uid()
    )
  );

-- group_members が作成されたので groups の SELECT ポリシーをここで追加
create policy "グループメンバーはグループを参照できる"
  on public.groups for select
  using (
    id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. 共有レシピテーブル
-- ============================================================
create table if not exists public.shared_recipes (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups(id) on delete cascade,
  recipe_id    uuid not null references public.recipes(id) on delete cascade,
  shared_by    uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(group_id, recipe_id)
);

alter table public.shared_recipes enable row level security;

-- グループメンバーは共有レシピを参照できる
create policy "グループメンバーは共有レシピを参照できる"
  on public.shared_recipes for select
  using (
    group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- グループメンバーはレシピを共有できる
create policy "グループメンバーはレシピを共有できる"
  on public.shared_recipes for insert
  with check (
    auth.uid() = shared_by
    and group_id in (
      select group_id from public.group_members where user_id = auth.uid()
    )
  );

-- 共有した本人またはグループオーナーは共有を解除できる
create policy "本人またはオーナーは共有を解除できる"
  on public.shared_recipes for delete
  using (
    shared_by = auth.uid()
    or group_id in (
      select id from public.groups where owner_id = auth.uid()
    )
  );

-- ============================================================
-- 5. recipes の SELECT ポリシーを更新
--    自分のレシピに加え、グループで共有されたレシピも参照可能にする
-- ============================================================
drop policy if exists "自分のレシピのみ取得できる" on public.recipes;

create policy "自分のレシピまたはグループ共有レシピを参照できる"
  on public.recipes for select
  using (
    auth.uid() = user_id
    or id in (
      select recipe_id from public.shared_recipes
      where group_id in (
        select group_id from public.group_members where user_id = auth.uid()
      )
    )
  );
