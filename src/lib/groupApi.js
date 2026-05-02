import { supabase } from './supabase'

// ============================================================
// 自分が所属するグループ一覧を取得
// PostgREST の FK ジョインに頼らず profiles を別クエリで取得してマージする
// ============================================================
export async function fetchMyGroups() {
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members ( id, user_id, created_at )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!groups.length) return []

  // 全メンバーの user_id をまとめて profiles を1回のクエリで取得
  const userIds = [...new Set(groups.flatMap((g) => g.group_members.map((m) => m.user_id)))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds)

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))

  // メンバーに profiles データをマージして返す
  return groups.map((g) => ({
    ...g,
    group_members: g.group_members.map((m) => ({
      ...m,
      profiles: profileMap[m.user_id] ?? null,
    })),
  }))
}

// ============================================================
// グループを新規作成し、作成者を最初のメンバーとして追加
// ============================================================
export async function createGroup(userId, name) {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ owner_id: userId, name })
    .select()
    .single()

  if (groupError) throw groupError

  const { error: memberError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId })

  if (memberError) throw memberError
  return group
}

// ============================================================
// グループを削除（メンバー・共有レシピはCASCADEで自動削除）
// ============================================================
export async function deleteGroup(groupId) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  if (error) throw error
}

// ============================================================
// メールアドレスでユーザーを検索してメンバーに追加
// ============================================================
export async function addMemberByEmail(groupId, email) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (profileError || !profile) {
    throw new Error('このメールアドレスのユーザーは見つかりませんでした。')
  }

  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: profile.id })

  if (error) {
    if (error.code === '23505') throw new Error('このユーザーはすでにメンバーです。')
    throw error
  }
}

// ============================================================
// メンバーをグループから削除
// ============================================================
export async function removeMember(groupId, userId) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// ============================================================
// グループに共有されているレシピ一覧を取得
// profiles も別クエリで取得してマージする
// ============================================================
export async function fetchSharedRecipes(groupId) {
  const { data: shared, error } = await supabase
    .from('shared_recipes')
    .select(`
      id,
      shared_by,
      created_at,
      recipes ( * )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!shared.length) return []

  // 共有者の profiles を1回のクエリで取得
  const sharedByIds = [...new Set(shared.map((s) => s.shared_by))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('id', sharedByIds)

  const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]))

  return shared.map((s) => ({
    ...s,
    profiles: profileMap[s.shared_by] ?? null,
  }))
}

// ============================================================
// レシピをグループに共有
// ============================================================
export async function shareRecipe(groupId, recipeId, userId) {
  const { error } = await supabase
    .from('shared_recipes')
    .insert({ group_id: groupId, recipe_id: recipeId, shared_by: userId })

  if (error) {
    if (error.code === '23505') throw new Error('このレシピはすでに共有済みです。')
    throw error
  }
}

// ============================================================
// グループからレシピの共有を解除
// ============================================================
export async function unshareRecipe(sharedRecipeId) {
  const { error } = await supabase
    .from('shared_recipes')
    .delete()
    .eq('id', sharedRecipeId)

  if (error) throw error
}
