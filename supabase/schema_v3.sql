-- =============================================
-- RLS ポリシーの再帰問題を修正するマイグレーション
-- schema_v2.sql を実行済みの環境に追加で実行してください
-- =============================================

-- ============================================================
-- 問題の原因：RLS ポリシー内での無限再帰
--
-- group_members の SELECT ポリシーが自分自身を参照していたため、
-- recipes SELECT → shared_recipes → group_members → group_members → ...
-- という無限ループが発生し、レシピの登録・取得が失敗していた。
--
-- 解決策：SECURITY DEFINER 関数でグループIDを取得する。
-- この関数は RLS をバイパスして実行されるため、再帰が発生しない。
-- ============================================================

create or replace function public.get_my_group_ids()
returns setof uuid as $$
  select group_id from public.group_members where user_id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- group_members ポリシーを修正（自己参照をなくす）
-- ============================================================
drop policy if exists "グループメンバーはメンバー一覧を参照できる" on public.group_members;
create policy "グループメンバーはメンバー一覧を参照できる"
  on public.group_members for select
  using (group_id in (select public.get_my_group_ids()));

drop policy if exists "オーナーのみメンバーを追加できる" on public.group_members;
create policy "オーナーのみメンバーを追加できる"
  on public.group_members for insert
  with check (
    group_id in (select id from public.groups where owner_id = auth.uid())
  );

-- ============================================================
-- groups ポリシーを修正
-- ============================================================
drop policy if exists "グループメンバーはグループを参照できる" on public.groups;
create policy "グループメンバーはグループを参照できる"
  on public.groups for select
  using (id in (select public.get_my_group_ids()));

-- ============================================================
-- shared_recipes ポリシーを修正
-- ============================================================
drop policy if exists "グループメンバーは共有レシピを参照できる" on public.shared_recipes;
create policy "グループメンバーは共有レシピを参照できる"
  on public.shared_recipes for select
  using (group_id in (select public.get_my_group_ids()));

drop policy if exists "グループメンバーはレシピを共有できる" on public.shared_recipes;
create policy "グループメンバーはレシピを共有できる"
  on public.shared_recipes for insert
  with check (
    auth.uid() = shared_by
    and group_id in (select public.get_my_group_ids())
  );

drop policy if exists "本人またはオーナーは共有を解除できる" on public.shared_recipes;
create policy "本人またはオーナーは共有を解除できる"
  on public.shared_recipes for delete
  using (
    shared_by = auth.uid()
    or group_id in (select id from public.groups where owner_id = auth.uid())
  );

-- ============================================================
-- recipes の SELECT ポリシーを修正（再帰しない関数を使用）
-- ============================================================
drop policy if exists "自分のレシピまたはグループ共有レシピを参照できる" on public.recipes;
create policy "自分のレシピまたはグループ共有レシピを参照できる"
  on public.recipes for select
  using (
    auth.uid() = user_id
    or id in (
      select recipe_id from public.shared_recipes
      where group_id in (select public.get_my_group_ids())
    )
  );
