import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { User, AuthState } from '../types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('pms:token'),
    isAuthenticated: false,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (state.token) {
      api
        .get<{ user: User }>('/api/v1/auth/me')
        .then(({ user }) => {
          setState((s) => ({ ...s, user, isAuthenticated: true }))
        })
        .catch(() => {
          localStorage.removeItem('pms:token')
          setState({ user: null, token: null, isAuthenticated: false })
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  async function login(email: string, password: string) {
    const { token, user } = await api.post<{ token: string; user: User }>(
      '/api/v1/auth/login',
      { email, password },
    )
    localStorage.setItem('pms:token', token)
    setState({ user, token, isAuthenticated: true })
  }

  async function register(name: string, email: string, password: string) {
    await api.post('/api/v1/auth/register', { name, email, password })
    await login(email, password)
  }

  function logout() {
    localStorage.removeItem('pms:token')
    setState({ user: null, token: null, isAuthenticated: false })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
