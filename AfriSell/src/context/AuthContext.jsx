import { createContext, useState, useEffect } from 'react'
import { authService } from '../services/auth'

const AuthContext = createContext(null)

// Normalise le user backend vers le format attendu par le frontend.
// Backend : { id, email, username, role: 'admin'|'tenant', has_active_subscription, ... }
// Frontend : { ...backend, name: username, isFreeAccount: !has_active_subscription }
function normalizeUser(backendUser) {
  if (!backendUser) return null
  return {
    ...backendUser,
    name: backendUser.username || backendUser.email,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null)
  const [loading, setLoading]             = useState(true)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  // Restaure la session au montage si un token existe
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    authService.getMe()
      .then((data) => setUser(normalizeUser(data)))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  // user.role === 'tenant' → vendeur  |  'admin' → admin
  // isFree : pas d'abonnement actif
  const isFree = !user?.has_active_subscription

  const login = async (email, password) => {
    const { token, user: raw } = await authService.login(email, password)
    localStorage.setItem('token', token)
    const normalized = normalizeUser(raw)
    setUser(normalized)
    return normalized
  }

  const register = async (data) => {
    const { token, user: raw } = await authService.register(data)
    localStorage.setItem('token', token)
    const normalized = normalizeUser(raw)
    setUser(normalized)
    return normalized
  }

  const logout = async () => {
    try { await authService.logout() } catch { /* token déjà invalide */ }
    localStorage.removeItem('token')
    setUser(null)
  }

  const socialLogin = async (provider, token) => {
    const res = await authService.socialLogin(provider, token)
    if (!res?.token) throw new Error('Réponse invalide du serveur.')
    localStorage.setItem('token', res.token)
    const normalized = normalizeUser(res.user)
    setUser(normalized)
    return normalized
  }

  // ── Auth par téléphone (WhatsApp OTP) ──────────────────────────────────────
  const phoneSendOTP = (phone) => authService.phoneSendOTP(phone)

  const phoneVerifyOTP = async (phone, otp, username) => {
    const res = await authService.phoneVerifyOTP(phone, otp, username)
    if (!res?.token) throw new Error('Réponse invalide du serveur.')
    localStorage.setItem('token', res.token)
    const normalized = normalizeUser(res.user)
    setUser(normalized)
    return { user: normalized, created: res.created }
  }

  const updateUser = (data) => setUser((prev) => ({ ...prev, ...normalizeUser(data) }))

  const openUpgradeModal  = () => setUpgradeModalOpen(true)
  const closeUpgradeModal = () => setUpgradeModalOpen(false)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isFree,
        login,
        register,
        socialLogin,
        phoneSendOTP,
        phoneVerifyOTP,
        logout,
        updateUser,
        openUpgradeModal,
        closeUpgradeModal,
        upgradeModalOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
