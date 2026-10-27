import { createContext, useContext, useState, type ReactNode } from "react"

export type Role = "operator" | "crew"
type AuthState = {
  role: Role
  userName: string
} | null
type AuthContextValue = {
  auth: AuthState
  login: (role: Role, userName: string) => void
  logout: () => void
}
const AuthContext = createContext<AuthContextValue | null>(null)
const key = "roadsense-auth"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      return JSON.parse(sessionStorage.getItem(key) || "null") as AuthState
    } catch {
      return null
    }
  })
  const login = (role: Role, userName: string) => {
    const next = { role, userName }
    setAuth(next)
    sessionStorage.setItem(key, JSON.stringify(next))
  }
  const logout = () => {
    setAuth(null)
    sessionStorage.removeItem(key)
  }
  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const value = useContext(AuthContext)
  if (!value) throw Error("Auth context missing")
  return value
}
