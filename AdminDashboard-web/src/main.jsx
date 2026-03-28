import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './AdminDashboard.css'
import AdminDashboard from './AdminDashboard.jsx'
import LoginPage from './LoginPage.jsx'
import { AuthProvider, useAuth } from './AuthContext.jsx'

/* ── APP GATE ────────────────────────────────
   Reads the logged-in user from AuthContext.
   Shows LoginPage when no user is present,
   AdminDashboard when one is.
─────────────────────────────────────────── */
function AppGate() {
  const { user } = useAuth()
  return user ? <AdminDashboard /> : <LoginPage />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  </StrictMode>,
)
