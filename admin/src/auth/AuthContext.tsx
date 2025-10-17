import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'

type AuthContextValue = {
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_KEY = 'admin_auth_token'

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_KEY))
  const navigate = useNavigate()

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_KEY, token)
    } else {
      localStorage.removeItem(AUTH_KEY)
    }
  }, [token])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password)
    const { token, user } = res.data
    if (user?.role !== 'admin') {
      throw new Error('Not authorized')
    }
    setToken(token)
    navigate('/')
  }, [navigate])

  const logout = useCallback(() => {
    setToken(null)
    navigate('/login')
  }, [navigate])

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(token),
    login,
    logout,
  }), [token, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


