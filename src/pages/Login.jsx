import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません。')
    } else {
      // ログイン成功後にレシピ一覧へ遷移
      navigate('/recipes')
    }
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* 料理を連想させるアイコン */}
        <div className={styles.icon}>🍳</div>
        <h1 className={styles.title}>ログイン</h1>
        <p className={styles.subtitle}>レシピ管理アプリへようこそ</p>

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
            <label htmlFor="password">パスワード</label>
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

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <p className={styles.link}>
          アカウントをお持ちでない方は{' '}
          <Link to="/register">会員登録</Link>
        </p>
      </div>
    </div>
  )
}
