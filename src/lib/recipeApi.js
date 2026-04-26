import { supabase } from './supabase'

// ============================================================
// レシピ一覧を取得（ログイン中ユーザーの分のみ RLS で絞られる）
// ============================================================
export async function fetchRecipes() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// ============================================================
// レシピを新規登録
// user_id はサーバー側 RLS ポリシーと照合するため明示的にセット
// ============================================================
export async function createRecipe({ userId, name, genre, ingredients, steps }) {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: userId,
      name,
      genre,
      ingredients,
      steps,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================
// レシピを更新（RLS により自分のレシピのみ更新可）
// ============================================================
export async function updateRecipe(id, { name, genre, ingredients, steps }) {
  const { data, error } = await supabase
    .from('recipes')
    .update({ name, genre, ingredients, steps })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================
// レシピを削除（RLS により自分のレシピのみ削除可）
// ============================================================
export async function deleteRecipe(id) {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) throw error
}
