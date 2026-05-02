import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import AuthCallback from './pages/AuthCallback'
import Recipes from './pages/Recipes'
import Groups from './pages/Groups'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ルートへのアクセスはレシピ一覧にリダイレクト */}
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* メール確認リンクのコールバック */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* 認証が必要なページ */}
          <Route path="/recipes" element={<PrivateRoute><Recipes /></PrivateRoute>} />
          <Route path="/groups"  element={<PrivateRoute><Groups /></PrivateRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
