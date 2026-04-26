import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// 未ログイン時はログイン画面にリダイレクトするガードコンポーネント
export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#8a6a50', fontSize: '1.1rem' }}>読み込み中...</p>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" replace />
}
