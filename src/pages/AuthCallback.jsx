import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import styles from './AuthCallback.module.css'

// メール確認リンクからのコールバックを処理するページ
export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // 'loading' | 'success' | 'error'

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // PKCE フロー: URLにcodeパラメータがある場合はセッションと交換する
        const code = new URLSearchParams(window.location.search).get('code')
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }
        setStatus('success')
      } catch (e) {
        console.error('メール確認エラー:', e)
        setStatus('error')
      }
    }
    handleCallback()
  }, [])

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p className={styles.loadingText}>⏳ 確認中...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.icon}>😢</div>
          <h1 className={styles.title}>確認に失敗しました</h1>
          <p className={styles.subtitle}>リンクの有効期限が切れているか、すでに使用済みです。</p>
          <button className={styles.button} onClick={() => navigate('/register')}>
            もう一度登録する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 背景の浮かぶ食材アイコン */}
      <div className={styles.floatingIcons} aria-hidden="true">
        <span style={{ '--i': 0 }}>🍅</span>
        <span style={{ '--i': 1 }}>🥕</span>
        <span style={{ '--i': 2 }}>🧅</span>
        <span style={{ '--i': 3 }}>🫑</span>
        <span style={{ '--i': 4 }}>🍋</span>
        <span style={{ '--i': 5 }}>🥦</span>
        <span style={{ '--i': 6 }}>🌽</span>
        <span style={{ '--i': 7 }}>🍄</span>
      </div>

      <div className={styles.card}>
        {/* メインアイコン */}
        <div className={styles.plateWrapper}>
          <div className={styles.plate}>🍽️</div>
          <div className={styles.checkBadge}>✓</div>
        </div>

        <h1 className={styles.title}>登録完了！</h1>
        <p className={styles.subtitle}>
          ようこそ、レシピ管理アプリへ！<br />
          さあ、お気に入りのレシピを登録しましょう🍳
        </p>

        {/* 料理を連想させるメッセージ */}
        <div className={styles.messageBox}>
          <p>🥄 今日は何を作りますか？</p>
          <p>📝 レシピを登録して、毎日の料理を楽しく！</p>
        </div>

        <button className={styles.button} onClick={() => navigate('/recipes')}>
          レシピ一覧へ進む →
        </button>
      </div>
    </div>
  )
}
