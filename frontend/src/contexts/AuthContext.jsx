import React, { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, isLoggedIn, saveAuth, logout as logoutUtil } from '../utils/utils'
import { authApi } from '../utils/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      if (isLoggedIn()) {
        try {
          const res = await authApi.getUserInfo()
          setUser(res.data)
          saveAuth(localStorage.getItem('token'), res.data)
        } catch (error) {
          console.error('获取用户信息失败:', error)
          logoutUtil()
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (username, password) => {
    const res = await authApi.login({ username, password })
    const userData = {
      user_id: res.data.user_id,
      username: res.data.username,
      nickname: res.data.nickname,
      role: res.data.role,
      avatar: res.data.avatar,
    }
    saveAuth(res.data.token, userData)
    setUser(userData)
    return userData
  }

  const register = async (data) => {
    const res = await authApi.register(data)
    return res
  }

  const logout = () => {
    logoutUtil()
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    saveAuth(localStorage.getItem('token'), userData)
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
