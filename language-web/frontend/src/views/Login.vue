<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-header">
        <span class="login-icon">📚</span>
        <h1 class="pixel-title">LangLearn</h1>
        <p class="login-subtitle">Language Learning Platform</p>
      </div>
      <div class="login-tabs">
        <button
          class="login-tab"
          :class="{ 'login-tab--active': mode === 'login' }"
          @click="mode = 'login'"
        >Login</button>
        <button
          class="login-tab"
          :class="{ 'login-tab--active': mode === 'register' }"
          @click="mode = 'register'"
        >Register</button>
      </div>
      <form class="login-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label class="form-label">Username</label>
          <input v-model="form.username" type="text" placeholder="Enter username" required />
        </div>
        <div class="form-group" v-if="mode === 'register'">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" placeholder="Enter email" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input v-model="form.password" type="password" placeholder="Enter password" required />
        </div>
        <div class="form-group" v-if="mode === 'register'">
          <label class="form-label">Confirm Password</label>
          <input v-model="form.confirmPassword" type="password" placeholder="Confirm password" required />
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
        <PixelButton :type="mode === 'login' ? 'primary' : 'success'" :loading="loading" style="width: 100%">
          {{ mode === 'login' ? '⚔️ Login' : '🎮 Register' }}
        </PixelButton>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PixelButton from '../components/PixelButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function handleSubmit() {
  error.value = ''
  if (mode.value === 'register' && form.password !== form.confirmPassword) {
    error.value = 'Passwords do not match!'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.login(form.username, form.password)
    } else {
      await authStore.register(form.username, form.email, form.password)
    }
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Something went wrong!'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f0e3;
  padding: 20px;
}

.login-box {
  background: #fff;
  border: 3px solid #4a4a4a;
  border-radius: 0;
  width: 100%;
  max-width: 420px;
  box-shadow: 4px 4px 0 #4a4a4a;
}

.login-header {
  text-align: center;
  padding: 24px 20px 16px;
  background: #e0d8c0;
  border-bottom: 3px solid #4a4a4a;
}

.login-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.pixel-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 18px;
  color: #2d2d2d;
  margin-bottom: 4px;
}

.login-subtitle {
  font-size: 12px;
  color: #666;
}

.login-tabs {
  display: flex;
  border-bottom: 3px solid #4a4a4a;
}

.login-tab {
  flex: 1;
  padding: 10px;
  background: #f5f0e3;
  border: none;
  border-right: 3px solid #4a4a4a;
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  cursor: pointer;
  color: #2d2d2d;
}

.login-tab:last-child {
  border-right: none;
}

.login-tab--active {
  background: #fff;
  color: #2980b9;
  box-shadow: inset 0 -3px 0 #2980b9;
}

.login-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #2d2d2d;
  margin-bottom: 6px;
}

.form-error {
  color: #c0392b;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  margin-bottom: 12px;
  padding: 8px;
  background: #fde8e8;
  border: 2px solid #c0392b;
}
</style>
