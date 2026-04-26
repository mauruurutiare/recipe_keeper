import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { dummyRecipes } from '../data/recipes'
import styles from './Recipes.module.css'

export default function Recipes() {
  const { user, signOut } = useAuth()
  const [expandedId, setExpandedId] = useState(null)

  const handleSignOut = async () => {
    await signOut()
  }

  // カードのアコーディオン開閉
  const toggleCard = (id) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span>🍽️</span>
            <h1>レシピ管理</h1>
          </div>
          <div className={styles.userArea}>
            <span className={styles.email}>{user?.email}</span>
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <h2 className={styles.sectionTitle}>レシピ一覧</h2>
        <p className={styles.sectionSub}>{dummyRecipes.length}件のレシピ</p>

        <div className={styles.grid}>
          {dummyRecipes.map((recipe) => (
            <div key={recipe.id} className={styles.card}>
              <button
                className={styles.cardHeader}
                onClick={() => toggleCard(recipe.id)}
                aria-expanded={expandedId === recipe.id}
              >
                <span className={styles.recipeEmoji}>{recipe.emoji}</span>
                <div className={styles.cardTitle}>
                  <h3>{recipe.name}</h3>
                  <span className={styles.category}>{recipe.category}</span>
                </div>
                <span className={styles.chevron}>
                  {expandedId === recipe.id ? '▲' : '▼'}
                </span>
              </button>

              {expandedId === recipe.id && (
                <div className={styles.cardBody}>
                  {/* 材料 */}
                  <section className={styles.section}>
                    <h4>🧺 材料</h4>
                    <ul className={styles.ingredientList}>
                      {recipe.ingredients.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </section>

                  {/* 作り方 */}
                  <section className={styles.section}>
                    <h4>👨‍🍳 作り方</h4>
                    <ol className={styles.stepList}>
                      {recipe.steps.map((step, i) => (
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
    </div>
  )
}
