import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchRecipes, createRecipe, updateRecipe, deleteRecipe } from '../lib/recipeApi'
import { fetchMyGroups, shareRecipe } from '../lib/groupApi'
import RecipeForm from '../components/RecipeForm'
import styles from './Recipes.module.css'

export default function Recipes() {
  const { user, signOut } = useAuth()

  // レシピ一覧
  const [recipes, setRecipes] = useState([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // アコーディオンで展開中のカードID
  const [expandedId, setExpandedId] = useState(null)

  // フォームの表示制御
  // mode: null | 'create' | 'edit'
  const [formMode, setFormMode] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // 削除処理中のレシピID
  const [deletingId, setDeletingId] = useState(null)

  // グループ共有モーダルの状態
  const [shareTarget, setShareTarget] = useState(null) // 共有するレシピ
  const [myGroups, setMyGroups] = useState([])
  const [shareLoadingId, setShareLoadingId] = useState(null)
  const [shareError, setShareError] = useState('')
  const [shareSuccess, setShareSuccess] = useState('')

  // ============================================================
  // レシピ一覧をSupabaseから取得
  // ============================================================
  const loadRecipes = useCallback(async () => {
    setFetchLoading(true)
    setFetchError('')
    try {
      const data = await fetchRecipes()
      setRecipes(data)
    } catch (e) {
      console.error('レシピ取得エラー:', e)
      setFetchError(`レシピの取得に失敗しました。（${e.message}）`)
    } finally {
      setFetchLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRecipes()
  }, [loadRecipes])

  // ============================================================
  // 新規登録
  // ============================================================
  const handleCreate = async ({ name, genre, ingredients, steps }) => {
    setFormLoading(true)
    setFormError('')
    try {
      const newRecipe = await createRecipe({
        userId: user.id,
        name,
        genre,
        ingredients,
        steps,
      })
      // 先頭に追加してAPIを再呼び出しせず即時反映
      setRecipes((prev) => [newRecipe, ...prev])
      setFormMode(null)
    } catch (e) {
      console.error('レシピ登録エラー:', e)
      setFormError(`登録に失敗しました。（${e.message}）`)
    } finally {
      setFormLoading(false)
    }
  }

  // ============================================================
  // 編集
  // ============================================================
  const handleUpdate = async ({ name, genre, ingredients, steps }) => {
    setFormLoading(true)
    setFormError('')
    try {
      const updated = await updateRecipe(editTarget.id, { name, genre, ingredients, steps })
      setRecipes((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
      setFormMode(null)
      setEditTarget(null)
    } catch (e) {
      console.error('レシピ更新エラー:', e)
      setFormError(`更新に失敗しました。（${e.message}）`)
    } finally {
      setFormLoading(false)
    }
  }

  const openEditForm = (recipe) => {
    setEditTarget(recipe)
    setFormMode('edit')
    setFormError('')
  }

  // ============================================================
  // 削除
  // ============================================================
  const handleDelete = async (id) => {
    if (!window.confirm('このレシピを削除しますか？')) return
    setDeletingId(id)
    try {
      await deleteRecipe(id)
      setRecipes((prev) => prev.filter((r) => r.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (e) {
      alert('削除に失敗しました。')
    } finally {
      setDeletingId(null)
    }
  }

  // ============================================================
  // フォームを閉じる
  // ============================================================
  const closeForm = () => {
    setFormMode(null)
    setEditTarget(null)
    setFormError('')
  }

  // ============================================================
  // グループ共有モーダルを開く
  // ============================================================
  const openShareModal = async (recipe) => {
    setShareTarget(recipe)
    setShareError('')
    setShareSuccess('')
    try {
      setMyGroups(await fetchMyGroups())
    } catch (e) {
      setShareError('グループの取得に失敗しました。')
    }
  }

  // ============================================================
  // レシピをグループに共有
  // ============================================================
  const handleShare = async (groupId) => {
    setShareLoadingId(groupId)
    setShareError('')
    setShareSuccess('')
    try {
      await shareRecipe(groupId, shareTarget.id, user.id)
      setShareSuccess('共有しました！')
    } catch (e) {
      setShareError(e.message)
    } finally {
      setShareLoadingId(null)
    }
  }

  const toggleCard = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  // 改行区切りのテキストをリスト表示用に変換
  const toLines = (text) => text.split('\n').filter((l) => l.trim() !== '')

  return (
    <div className={styles.page}>
      {/* ヘッダー */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span>🍽️</span>
            <h1>レシピ管理</h1>
          </div>
          {/* ページナビゲーション */}
          <nav className={styles.nav}>
            <NavLink to="/recipes" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink}>
              📋 マイレシピ
            </NavLink>
            <NavLink to="/groups" className={({ isActive }) => isActive ? `${styles.navLink} ${styles.navActive}` : styles.navLink}>
              👥 グループ
            </NavLink>
          </nav>
          <div className={styles.userArea}>
            <span className={styles.email}>{user?.email}</span>
            <button onClick={signOut} className={styles.signOutBtn}>
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* セクションタイトル＋新規登録ボタン */}
        <div className={styles.toolbar}>
          <div>
            <h2 className={styles.sectionTitle}>レシピ一覧</h2>
            {!fetchLoading && (
              <p className={styles.sectionSub}>{recipes.length}件のレシピ</p>
            )}
          </div>
          <button
            className={styles.addBtn}
            onClick={() => { setFormMode('create'); setFormError('') }}
          >
            ＋ レシピを追加
          </button>
        </div>

        {/* 取得中 */}
        {fetchLoading && (
          <p className={styles.stateMsg}>読み込み中...</p>
        )}

        {/* 取得エラー */}
        {fetchError && (
          <p className={styles.errorMsg}>{fetchError}</p>
        )}

        {/* レシピが0件 */}
        {!fetchLoading && !fetchError && recipes.length === 0 && (
          <div className={styles.empty}>
            <p>🍳 まだレシピが登録されていません。</p>
            <p>「レシピを追加」ボタンから最初のレシピを登録しましょう！</p>
          </div>
        )}

        {/* レシピカード一覧 */}
        <div className={styles.grid}>
          {recipes.map((recipe) => (
            <div key={recipe.id} className={styles.card}>
              {/* カードヘッダー（クリックでアコーディオン開閉） */}
              <button
                className={styles.cardHeader}
                onClick={() => toggleCard(recipe.id)}
                aria-expanded={expandedId === recipe.id}
              >
                <div className={styles.cardTitle}>
                  <h3>{recipe.name}</h3>
                  <span className={styles.category}>{recipe.genre}</span>
                </div>
                <div className={styles.cardActions} onClick={(e) => e.stopPropagation()}>
                  {/* グループ共有ボタン（自分のレシピのみ） */}
                  {recipe.user_id === user.id && (
                    <button
                      className={styles.shareBtn}
                      onClick={() => openShareModal(recipe)}
                      title="グループに共有"
                    >
                      👥
                    </button>
                  )}
                  {/* 編集ボタン（自分のレシピのみ） */}
                  {recipe.user_id === user.id && (
                    <button
                      className={styles.editBtn}
                      onClick={() => openEditForm(recipe)}
                      title="編集"
                    >
                      ✏️
                    </button>
                  )}
                  {/* 削除ボタン（自分のレシピのみ） */}
                  {recipe.user_id === user.id && (
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(recipe.id)}
                      disabled={deletingId === recipe.id}
                      title="削除"
                    >
                      {deletingId === recipe.id ? '...' : '🗑️'}
                    </button>
                  )}
                </div>
                <span className={styles.chevron}>
                  {expandedId === recipe.id ? '▲' : '▼'}
                </span>
              </button>

              {/* カード展開部分 */}
              {expandedId === recipe.id && (
                <div className={styles.cardBody}>
                  {/* 材料 */}
                  <section className={styles.section}>
                    <h4>🧺 材料</h4>
                    <ul className={styles.ingredientList}>
                      {toLines(recipe.ingredients).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  {/* 作り方 */}
                  <section className={styles.section}>
                    <h4>👨‍🍳 作り方</h4>
                    <ol className={styles.stepList}>
                      {toLines(recipe.steps).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </section>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>

      {/* グループ共有モーダル */}
      {shareTarget && (
        <div className={styles.overlay}>
          <div className={styles.shareModal}>
            <h2 className={styles.shareModalTitle}>👥 グループに共有</h2>
            <p className={styles.shareModalRecipe}>「{shareTarget.name}」を共有するグループを選んでください</p>

            {shareError && <p className={styles.shareError}>{shareError}</p>}
            {shareSuccess && <p className={styles.shareSuccess}>{shareSuccess}</p>}

            {myGroups.length === 0 ? (
              <p className={styles.noGroups}>グループがありません。先にグループを作成してください。</p>
            ) : (
              <ul className={styles.groupSelectList}>
                {myGroups.map((g) => (
                  <li key={g.id}>
                    <button
                      className={styles.groupSelectBtn}
                      onClick={() => handleShare(g.id)}
                      disabled={shareLoadingId === g.id}
                    >
                      <span>👥 {g.name}</span>
                      <span className={styles.groupSelectMeta}>{g.group_members?.length}人</span>
                      {shareLoadingId === g.id && <span className={styles.sharing}>共有中...</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button className={styles.shareCloseBtn} onClick={() => setShareTarget(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 新規登録・編集フォーム（モーダル） */}
      {formMode && (
        <RecipeForm
          onSubmit={formMode === 'edit' ? handleUpdate : handleCreate}
          onCancel={closeForm}
          editRecipe={formMode === 'edit' ? editTarget : null}
          loading={formLoading}
          error={formError}
        />
      )}
    </div>
  )
}
