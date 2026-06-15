import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    const d = res.data.data || res.data
    token.value = d.token
    user.value = { username: d.username, nickname: d.nickname }
    localStorage.setItem('token', d.token)
    localStorage.setItem('user', JSON.stringify({ username: d.username, nickname: d.nickname }))
  }

  async function register(username, email, password) {
    const res = await api.post('/auth/register', { username, email, password })
    const d = res.data.data || res.data
    token.value = d.token
    user.value = { username: d.username, nickname: d.nickname }
    localStorage.setItem('token', d.token)
    localStorage.setItem('user', JSON.stringify({ username: d.username, nickname: d.nickname }))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function checkAuth() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken) {
      token.value = savedToken
      user.value = JSON.parse(savedUser || 'null')
    }
  }

  return { token, user, isLoggedIn, login, register, logout, checkAuth }
})
