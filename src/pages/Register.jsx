import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

// Supabaseのエラーメッセージを日本語に変換する
function toJapaneseError(message) {
  if (!message) return '登録に失敗しました。'
  const m = message.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('user already exists')) {
    return 'このメールアドレスはすでに登録されています。ログインしてください。'
  }
  if (m.includes('rate limit') || m.includes('email rate')) {
    return 'メール送信の上限に達しました。しばらく時間をおいて再試行してください。'
  }
  if (m.includes('invalid email') || m.includes('unable to validate email')) {
    return 'メールアドレスの形式が正しくありません。'
  }
  if (m.includes('password') && m.includes('6')) {
    return 'パスワードは6文字以上で入力してください。'
  }
  if (m.includes('signup') && m.includes('disabled')) {
    return '現在、新規登録を受け付けていません。'
  }
  // 上記以外は原文もあわせて表示して原因を特定しやすくする
  return `登録に失敗しました。（${message}）`
}

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください。')
      return
    }

    setLoading(true)
    const { data, error } = await signUp(email, password)
    if (error) {
      setError(toJapaneseError(error.message))
    } else if (!data.user) {
      // メール確認が必要な設定かつ未確認ユーザーが再登録した場合、
      // Supabaseはエラーなし・user=nullを返すことがある
      setMessage('確認メールを送信しました。メールボックスをご確認ください。')
      setTimeout(() => navigate('/login'), 3000)
    } else {
      setMessage('登録が完了しました！確認メールをご確認ください。')
      setTimeout(() => navigate('/login'), 3000)
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 料理を連想させるアイコン */}
        <div className={styles.icon}>🥘</div>
        <h1 className={styles.title}>会員登録</h1>
        <p className={styles.subtitle}>レシピを保存・管理しよう</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="password">パスワード（6文字以上）</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
              required
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? '登録中...' : '会員登録'}
          </button>
        </form>

        <p className={styles.link}>
          すでにアカウントをお持ちの方は{' '}
          <Link to="/login">ログイン</Link>
        </p>
      </div>
    </div>
  )
}
