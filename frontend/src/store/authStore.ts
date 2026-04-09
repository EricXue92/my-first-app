import { create } from 'zustand'
import type { User } from '../types'
import api from '../api/axios'

interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  sendCode: (email: string) => Promise<void>
  register: (username: string, email: string, password: string, code: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),

  login: async (username, password) => {
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const { data } = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    localStorage.setItem('token', data.access_token)
    set({ token: data.access_token })
    const me = await api.get('/auth/me')
    set({ user: me.data })
  },

  sendCode: async (email) => {
    await api.post('/auth/send-code', { email })
  },

  register: async (username, email, password, code) => {
    await api.post('/auth/register', { username, email, password, code })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me')
      set({ user: data })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    }
  },
}))
