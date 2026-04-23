import { createContext, useContext, useState, useEffect, useRef } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

// Use consistent key names everywhere
const KEYS = {
  token: 'cv_token',
  refresh: 'cv_refresh',
  user: 'cv_user'
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)

  useEffect(() => {
    // Check localStorage first (remember me), then sessionStorage
    const savedToken = localStorage.getItem(KEYS.token) ||
                       sessionStorage.getItem(KEYS.token)
    const savedRefresh = localStorage.getItem(KEYS.refresh) ||
                         sessionStorage.getItem(KEYS.refresh)
    const savedUser = localStorage.getItem(KEYS.user) ||
                      sessionStorage.getItem(KEYS.user)

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setToken(savedToken)
        setUser(parsedUser)
        scheduleRefresh(savedToken, savedRefresh)
      } catch {
        clearAll()
      }
    }
    setLoading(false)
  }, [])

  const clearAll = () => {
    Object.values(KEYS).forEach(key => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })
  }

  const getTokenExpiry = (tkn) => {
    try {
      const payload = JSON.parse(atob(tkn.split('.')[1]))
      return payload.exp * 1000
    } catch { return null }
  }

  const scheduleRefresh = (accessToken, refreshToken) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    if (!refreshToken) return
    const expiry = getTokenExpiry(accessToken)
    if (!expiry) return
    const refreshAt = expiry - Date.now() - 2 * 60 * 1000 // 2min before expiry
    if (refreshAt > 0) {
      refreshTimerRef.current = setTimeout(
        () => doRefresh(refreshToken),
        refreshAt
      )
    }
  }

  const doRefresh = async (refreshToken) => {
    try {
      const res = await api.post('/auth/refresh', {
        refresh_token: refreshToken
      })
      const { access_token, refresh_token: newRefresh } = res.data
      const inLocal = !!localStorage.getItem(KEYS.token)
      const storage = inLocal ? localStorage : sessionStorage
      storage.setItem(KEYS.token, access_token)
      if (newRefresh) storage.setItem(KEYS.refresh, newRefresh)
      setToken(access_token)
      scheduleRefresh(access_token, newRefresh || refreshToken)
    } catch {
      logout()
    }
  }

  const login = (accessToken, refreshToken, userData, remember = false) => {
    // ✅ Always save to BOTH storages initially to prevent race condition
    // Then clean up the one we don't want
    const primaryStorage = remember ? localStorage : sessionStorage
    const secondaryStorage = remember ? sessionStorage : localStorage

    primaryStorage.setItem(KEYS.token, accessToken)
    primaryStorage.setItem(KEYS.refresh, refreshToken)
    primaryStorage.setItem(KEYS.user, JSON.stringify(userData))

    // Remove from secondary storage
    Object.values(KEYS).forEach(key => secondaryStorage.removeItem(key))

    setToken(accessToken)
    setUser(userData)
    scheduleRefresh(accessToken, refreshToken)
  }

  const logout = async () => {
    try { await api.post('/auth/logout') } catch {}
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    setToken(null)
    setUser(null)
    clearAll()
  }

  const updateUser = (userData) => {
    setUser(userData)
    const inLocal = !!localStorage.getItem(KEYS.token)
    const storage = inLocal ? localStorage : sessionStorage
    storage.setItem(KEYS.user, JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{
      user, token, login, logout, loading, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}