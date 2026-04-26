import { useState, useEffect } from 'react'
import styles from './RecipeForm.module.css'

// ジャンルの選択肢
const GENRE_OPTIONS = ['和食', '洋食', 'イタリアン', '中華', 'タイ料理', '韓国料理', 'その他']

// 新規登録・編集で共用するフォームコンポーネント
// editRecipe が渡されている場合は編集モードで動作する
export default function RecipeForm({ onSubmit, onCancel, editRecipe, loading }) {
  const [name, setName] = useState('')
  const [genre, setGenre] = useState(GENRE_OPTIONS[0])
  const [ingredients, setIngredients] = useState('')
  const [steps, setSteps] = useState('')

  // 編集モード時に既存データをフォームにセット
  useEffect(() => {
    if (editRecipe) {
      setName(editRecipe.name)
      setGenre(editRecipe.genre)
      setIngredients(editRecipe.ingredients)
      setSteps(editRecipe.steps)
    }
  }, [editRecipe])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ name, genre, ingredients, steps })
  }

  const isEdit = Boolean(editRecipe)

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>
          {isEdit ? '✏️ レシピを編集' : '➕ レシピを新規登録'}
        </h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* 料理名 */}
          <div className={styles.field}>
            <label htmlFor="name">料理名</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 肉じゃが"
              required
            />
          </div>

          {/* ジャンル */}
          <div className={styles.field}>
            <label htmlFor="genre">ジャンル</label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* 材料（1行1材料） */}
          <div className={styles.field}>
            <label htmlFor="ingredients">
              材料
              <span className={styles.hint}>（1行に1つ入力）</span>
            </label>
            <textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder={'じゃがいも 3個\n玉ねぎ 1個\n牛肉 200g'}
              rows={5}
              required
            />
          </div>

          {/* 作り方（1行1手順） */}
          <div className={styles.field}>
            <label htmlFor="steps">
              作り方
              <span className={styles.hint}>（1行に1手順入力）</span>
            </label>
            <textarea
              id="steps"
              value={steps}
              onChange={(e) => setSteps(e.target.value)}
              placeholder={'野菜を一口大に切る\n鍋で炒める\n煮込んで完成'}
              rows={5}
              required
            />
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelBtn}
              disabled={loading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
