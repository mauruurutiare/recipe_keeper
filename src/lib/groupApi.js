import { supabase } from './supabase'

// ============================================================
// 自分が所属するグループ一覧を取得（オーナー・メンバー問わず）
// ============================================================
export async function fetchMyGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        id,
        user_id,
        created_at,
        profiles ( email )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
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

  // オーナー自身をメンバーとして追加
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
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)

  if (error) throw error
}

// ============================================================
// メールアドレスでユーザーを検索してメンバーに追加
// ============================================================
export async function addMemberByEmail(groupId, email) {
  // profilesテーブルからメールアドレスでユーザーIDを検索
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
// ============================================================
export async function fetchSharedRecipes(groupId) {
  const { data, error } = await supabase
    .from('shared_recipes')
    .select(`
      id,
      shared_by,
      created_at,
      profiles ( email ),
      recipes ( * )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
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
