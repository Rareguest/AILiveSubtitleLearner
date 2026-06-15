<template>
  <div class="app-layout" v-if="authStore.token">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">LangLearn</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Dashboard</span>
        </router-link>
        <router-link to="/words" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">📖</span>
          <span class="nav-label">WordBook</span>
        </router-link>
        <router-link to="/sentences" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">💬</span>
          <span class="nav-label">SentenceBook</span>
        </router-link>
        <router-link to="/review" class="nav-item" active-class="nav-item--active">
          <span class="nav-icon">🔄</span>
          <span class="nav-label">Review</span>
        </router-link>
      </nav>
      <div class="sidebar-bottom">
        <button class="nav-item nav-item--logout" @click="handleLogout">
          <span class="nav-icon">🚪</span>
          <span class="nav-label">Logout</span>
        </button>
      </div>
    </aside>
    <div class="main-area">
      <header class="top-bar">
        <div class="top-bar-left">
          <button class="mobile-menu-btn" @click="mobileMenuOpen = !mobileMenuOpen">☰</button>
        </div>
        <div class="top-bar-right">
          <span class="user-name">{{ authStore.user?.username || 'Player' }}</span>
          <PixelButton type="primary" @click="openExtensionLink">🔗 Extension</PixelButton>
        </div>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
    <div class="mobile-overlay" v-if="mobileMenuOpen" @click="mobileMenuOpen = false"></div>
    <aside class="sidebar sidebar--mobile" :class="{ 'sidebar--open': mobileMenuOpen }">
      <div class="sidebar-logo">
        <span class="logo-icon">📚</span>
        <span class="logo-text">LangLearn</span>
      </div>
      <nav class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item" @click="mobileMenuOpen = false">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Dashboard</span>
        </router-link>
        <router-link to="/words" class="nav-item" @click="mobileMenuOpen = false">
          <span class="nav-icon">📖</span>
          <span class="nav-label">WordBook</span>
        </router-link>
        <router-link to="/sentences" class="nav-item" @click="mobileMenuOpen = false">
          <span class="nav-icon">💬</span>
          <span class="nav-label">SentenceBook</span>
        </router-link>
        <router-link to="/review" class="nav-item" @click="mobileMenuOpen = false">
          <span class="nav-icon">🔄</span>
          <span class="nav-label">Review</span>
        </router-link>
      </nav>
      <div class="sidebar-bottom">
        <button class="nav-item nav-item--logout" @click="handleLogout">
          <span class="nav-icon">🚪</span>
          <span class="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  </div>
  <router-view v-else />
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import PixelButton from './components/PixelButton.vue'

const router = useRouter()
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

authStore.checkAuth()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function openExtensionLink() {
  window.open('https://chromewebstore.google.com/', '_blank')
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f0e3;
}

.sidebar {
  width: 220px;
  background: #e0d8c0;
  border-right: 3px solid #4a4a4a;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar--mobile {
  display: none;
}

.sidebar-logo {
  padding: 20px 16px;
  border-bottom: 3px solid #4a4a4a;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  font-size: 24px;
}

.logo-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #2d2d2d;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #2d2d2d;
  text-decoration: none;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  cursor: pointer;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  transition: background 0.1s;
}

.nav-item:hover {
  background: #d4cbb0;
}

.nav-item--active {
  background: #f5f0e3;
  border-left: 4px solid #c0392b;
  font-weight: bold;
}

.nav-item--logout {
  color: #c0392b;
}

.nav-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.sidebar-bottom {
  padding: 8px 0;
  border-top: 3px solid #4a4a4a;
}

.main-area {
  flex: 1;
  margin-left: 220px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  height: 56px;
  background: #e0d8c0;
  border-bottom: 3px solid #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #2d2d2d;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #2d2d2d;
}

.content {
  flex: 1;
  padding: 24px;
}

.mobile-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    display: none;
  }

  .sidebar--mobile {
    display: flex;
    transform: translateX(-100%);
    transition: transform 0.2s;
  }

  .sidebar--mobile.sidebar--open {
    transform: translateX(0);
  }

  .main-area {
    margin-left: 0;
  }

  .mobile-menu-btn {
    display: block;
  }

  .mobile-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 99;
  }
}
</style>
