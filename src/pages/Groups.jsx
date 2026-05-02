import { useState, useEffect, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchMyGroups, createGroup, deleteGroup,
  addMemberByEmail, removeMember,
  fetchSharedRecipes, unshareRecipe,
} from '../lib/groupApi'
import styles from './Groups.module.css'

export default function Groups() {
  const { user, signOut } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // 展開中のグループID
  const [expandedId, setExpandedId] = useState(null)
  // グループごとの共有レシピキャッシュ
  const [sharedRecipesMap, setSharedRecipesMap] = useState({})

  // グループ作成モーダル
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // メンバー追加フォームの状態（グループIDをキーに管理）
  const [addEmailMap, setAddEmailMap] = useState({})
  const [addErrorMap, setAddErrorMap] = useState({})
  const [addLoadingMap, setAddLoadingMap] = useState({})

  // ============================================================
  // グループ一覧取得
  // ============================================================
  const loadGroups = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      setGroups(await fetchMyGroups())
    } catch (e) {
      console.error('グループ取得エラー:', e)
      setFetchError(`グループの取得に失敗しました。（${e.message}）`)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  // ============================================================
  // グループ展開時に共有レシピを取得
  // ============================================================
  const toggleGroup = async (groupId) => {
    if (expandedId === groupId) {
      setExpandedId(null)
      return
    }
    setExpandedId(groupId)
    if (sharedRecipesMap[groupId]) return // キャッシュ済みならスキップ
    try {
      const data = await fetchSharedRecipes(groupId)
      setSharedRecipesMap((prev) => ({ ...prev, [groupId]: data }))
    } catch (e) {
      console.error('共有レシピ取得エラー:', e)
    }
  }

  // ============================================================
  // グループ作成
  // ============================================================
  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      await createGroup(user.id, newGroupName)
      setNewGroupName('')
      setShowCreateModal(false)
      await loadGroups()
    } catch (e) {
      setCreateError(`作成に失敗しました。（${e.message}）`)
    } finally {
      setCreateLoading(false)
    }
  }

  // ============================================================
  // グループ削除
  // ============================================================
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('グループを削除しますか？共有レシピもすべて解除されます。')) return
    try {
      await deleteGroup(groupId)
      setGroups((prev) => prev.filter((g) => g.id !== groupId))
    } catch (e) {
      alert(`削除に失敗しました。（${e.message}）`)
    }
  }

  // ============================================================
  // メンバー追加
  // ============================================================
  const handleAddMember = async (groupId) => {
    const email = (addEmailMap[groupId] || '').trim()
    if (!email) return
    setAddErrorMap((prev) => ({ ...prev, [groupId]: '' }))
    setAddLoadingMap((prev) => ({ ...prev, [groupId]: true }))
    try {
      await addMemberByEmail(groupId, email)
      setAddEmailMap((prev) => ({ ...prev, [groupId]: '' }))
      await loadGroups()
    } catch (e) {
      setAddErrorMap((prev) => ({ ...prev, [groupId]: e.message }))
    } finally {
      setAddLoadingMap((prev) => ({ ...prev, [groupId]: false }))
    }
  }

  // ============================================================
  // メンバー削除
  // ============================================================
  const handleRemoveMember = async (groupId, memberId, memberEmail) => {
    if (!window.confirm(`${memberEmail} をグループから削除しますか？`)) return
    try {
      await removeMember(groupId, memberId)
      await loadGroups()
    } catch (e) {
      alert(`削除に失敗しました。（${e.message}）`)
    }
  }

  // ============================================================
  // 共有解除
  // ============================================================
  const handleUnshare = async (groupId, sharedRecipeId) => {
    if (!window.confirm('このレシピの共有を解除しますか？')) return
    try {
      await unshareRecipe(sharedRecipeId)
      setSharedRecipesMap((prev) => ({
        ...prev,
        [groupId]: prev[groupId].filter((r) => r.id !== sharedRecipeId),
      }))
    } catch (e) {
      alert(`共有解除に失敗しました。（${e.message}）`)
    }
  }

  const toLines = (text) => (text || '').split('\n').filter((l) => l.trim())

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
            <button onClick={signOut} className={styles.signOutBtn}>ログアウト</button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.toolbar}>
          <div>
            <h2 className={styles.sectionTitle}>グループ</h2>
            {!loading && <p className={styles.sectionSub}>{groups.length}件のグループ</p>}
          </div>
          <button className={styles.addBtn} onClick={() => { setShowCreateModal(true); setCreateError('') }}>
            ＋ グループを作成
          </button>
        </div>

        {loading && <p className={styles.stateMsg}>読み込み中...</p>}
        {fetchError && <p className={styles.errorMsg}>{fetchError}</p>}

        {!loading && !fetchError && groups.length === 0 && (
          <div className={styles.empty}>
            <p>👥 まだグループがありません。</p>
            <p>「グループを作成」ボタンからグループを作り、レシピを共有しましょう！</p>
          </div>
        )}

        <div className={styles.groupList}>
          {groups.map((group) => {
            const isOwner = group.owner_id === user.id
            const memberCount = group.group_members?.length ?? 0
            const sharedRecipes = sharedRecipesMap[group.id] ?? []
            const isExpanded = expandedId === group.id

            return (
              <div key={group.id} className={styles.groupCard}>
                {/* グループヘッダー */}
                <button
                  className={styles.groupHeader}
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isExpanded}
                >
                  <span className={styles.groupIcon}>👥</span>
                  <div className={styles.groupTitle}>
                    <h3>{group.name}</h3>
                    <div className={styles.groupMeta}>
                      <span className={isOwner ? styles.ownerBadge : styles.memberBadge}>
                        {isOwner ? 'オーナー' : 'メンバー'}
                      </span>
                      <span className={styles.memberCount}>メンバー {memberCount}人</span>
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      className={styles.deleteGroupBtn}
                      onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id) }}
                      title="グループを削除"
                    >
                      🗑️
                    </button>
                  )}
                  <span className={styles.chevron}>{isExpanded ? '▲' : '▼'}</span>
                </button>

                {/* グループ詳細（展開時） */}
                {isExpanded && (
                  <div className={styles.groupBody}>
                    {/* メンバー一覧 */}
                    <section className={styles.section}>
                      <h4>👤 メンバー</h4>
                      <ul className={styles.memberList}>
                        {group.group_members?.map((m) => (
                          <li key={m.id} className={styles.memberItem}>
                            <span className={styles.memberEmail}>{m.profiles?.email}</span>
                            {m.user_id === group.owner_id && (
                              <span className={styles.ownerTag}>オーナー</span>
                            )}
                            {/* オーナーが自分以外のメンバーを削除できる */}
                            {isOwner && m.user_id !== user.id && (
                              <button
                                className={styles.removeMemberBtn}
                                onClick={() => handleRemoveMember(group.id, m.user_id, m.profiles?.email)}
                                title="メンバーを削除"
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>

                      {/* メンバー追加フォーム（オーナーのみ） */}
                      {isOwner && (
                        <div className={styles.addMemberForm}>
                          <input
                            type="email"
                            placeholder="追加するメールアドレスを入力"
                            value={addEmailMap[group.id] || ''}
                            onChange={(e) => setAddEmailMap((prev) => ({ ...prev, [group.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddMember(group.id)}
                          />
                          <button
                            onClick={() => handleAddMember(group.id)}
                            disabled={addLoadingMap[group.id]}
                          >
                            {addLoadingMap[group.id] ? '追加中...' : '追加'}
                          </button>
                          {addErrorMap[group.id] && (
                            <p className={styles.addError}>{addErrorMap[group.id]}</p>
                          )}
                        </div>
                      )}
                    </section>

                    {/* 共有レシピ一覧 */}
                    <section className={styles.section}>
                      <h4>🍳 共有レシピ（{sharedRecipes.length}件）</h4>
                      {sharedRecipes.length === 0 ? (
                        <p className={styles.noShared}>まだ共有されたレシピはありません。マイレシピから共有してください。</p>
                      ) : (
                        <div className={styles.sharedRecipeList}>
                          {sharedRecipes.map((sr) => (
                            <div key={sr.id} className={styles.sharedRecipeCard}>
                              <div className={styles.sharedRecipeHeader}>
                                <div>
                                  <span className={styles.sharedRecipeName}>{sr.recipes?.name}</span>
                                  <span className={styles.sharedGenre}>{sr.recipes?.genre}</span>
                                </div>
                                <div className={styles.sharedRecipeActions}>
                                  <span className={styles.sharedBy}>by {sr.profiles?.email}</span>
                                  {(sr.shared_by === user.id || isOwner) && (
                                    <button
                                      className={styles.unshareBtn}
                                      onClick={() => handleUnshare(group.id, sr.id)}
                                      title="共有を解除"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className={styles.sharedRecipeDetail}>
                                <div>
                                  <p className={styles.detailLabel}>🧺 材料</p>
                                  <ul>
                                    {toLines(sr.recipes?.ingredients).map((item, i) => <li key={i}>{item}</li>)}
                                  </ul>
                                </div>
                                <div>
                                  <p className={styles.detailLabel}>👨‍🍳 作り方</p>
                                  <ol>
                                    {toLines(sr.recipes?.steps).map((step, i) => <li key={i}>{step}</li>)}
                                  </ol>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* グループ作成モーダル */}
      {showCreateModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>👥 グループを作成</h2>
            <form onSubmit={handleCreateGroup}>
              <div className={styles.field}>
                <label>グループ名</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="例: 家族レシピ"
                  required
                  autoFocus
                />
              </div>
              {createError && <p className={styles.errorMsg}>{createError}</p>}
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} className={styles.cancelBtn} disabled={createLoading}>
                  キャンセル
                </button>
                <button type="submit" className={styles.submitBtn} disabled={createLoading}>
                  {createLoading ? '作成中...' : '作成する'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
