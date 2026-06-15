<template>
  <div class="dashboard">
    <h1 class="pixel-title">🏠 Dashboard</h1>

    <div class="pixel-grid pixel-grid--5 stats-grid">
      <div class="pixel-card stat-card">
        <span class="stat-icon">📖</span>
        <span class="stat-value">{{ stats.totalWords }}</span>
        <span class="stat-label">Total Words</span>
      </div>
      <div class="pixel-card stat-card">
        <span class="stat-icon">💬</span>
        <span class="stat-value">{{ stats.totalSentences }}</span>
        <span class="stat-label">Sentences</span>
      </div>
      <div class="pixel-card stat-card">
        <span class="stat-icon">⏰</span>
        <span class="stat-value">{{ stats.dueReviews }}</span>
        <span class="stat-label">Due Review</span>
      </div>
      <div class="pixel-card stat-card">
        <span class="stat-icon">📝</span>
        <span class="stat-value">{{ stats.todayStudy }}</span>
        <span class="stat-label">Today</span>
      </div>
      <div class="pixel-card stat-card">
        <span class="stat-icon">🔥</span>
        <span class="stat-value">{{ stats.streak }}</span>
        <span class="stat-label">Streak</span>
      </div>
    </div>

    <div class="pixel-grid pixel-grid--2 actions-grid">
      <div class="pixel-card">
        <h2 class="pixel-subtitle">⚡ Quick Actions</h2>
        <div class="quick-actions">
          <PixelButton type="primary" @click="$router.push('/words')">➕ Add Word</PixelButton>
          <PixelButton type="success" @click="$router.push('/review')">🔄 Start Review</PixelButton>
        </div>
      </div>
      <div class="pixel-card">
        <h2 class="pixel-subtitle">📊 Study Progress</h2>
        <div class="progress-section">
          <div class="progress-item">
            <span class="progress-label">Words Mastered</span>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill progress-bar--green" :style="{ width: wordProgress + '%' }"></div>
            </div>
            <span class="progress-pct">{{ wordProgress }}%</span>
          </div>
          <div class="progress-item">
            <span class="progress-label">Sentences Mastered</span>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill progress-bar--blue" :style="{ width: sentenceProgress + '%' }"></div>
            </div>
            <span class="progress-pct">{{ sentenceProgress }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pixel-card">
      <h2 class="pixel-subtitle">📜 Recent Activity</h2>
      <div v-if="recentActivity.length" class="activity-list">
        <div v-for="item in recentActivity" :key="item.id" class="activity-item">
          <span class="activity-icon">{{ item.icon }}</span>
          <span class="activity-text">{{ item.text }}</span>
          <span class="activity-time">{{ item.time }}</span>
        </div>
      </div>
      <div v-else class="pixel-empty">No recent activity yet. Start learning!</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import PixelButton from '../components/PixelButton.vue'

const stats = ref({
  totalWords: 0,
  totalSentences: 0,
  dueReviews: 0,
  todayStudy: 0,
  streak: 0
})

const recentActivity = ref([])

const wordProgress = computed(() => 0)
const sentenceProgress = computed(() => 0)

onMounted(async () => {
  try {
    const res = await api.get('/stats/dashboard')
    const d = res.data.data || res.data
    stats.value = {
      totalWords: d.totalWords || 0,
      totalSentences: d.totalSentences || 0,
      dueReviews: (d.wordsDueReview || 0) + (d.sentencesDueReview || 0),
      todayStudy: d.todayStudied || 0,
      streak: d.streak || 0
    }
  } catch {
    // Use default empty state
  }
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.stats-grid {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
  padding: 20px 12px;
}

.stat-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 8px;
}

.stat-value {
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  color: #2d2d2d;
  display: block;
  margin-bottom: 6px;
}

.stat-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #888;
  display: block;
}

.actions-grid {
  margin-bottom: 24px;
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.progress-section {
  margin-top: 12px;
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.progress-label {
  font-size: 11px;
  min-width: 140px;
  color: #2d2d2d;
}

.progress-bar-bg {
  flex: 1;
  height: 16px;
  background: #e0d8c0;
  border: 2px solid #4a4a4a;
}

.progress-bar-fill {
  height: 100%;
  transition: width 0.3s;
}

.progress-bar--green { background: #27ae60; }
.progress-bar--blue { background: #2980b9; }

.progress-pct {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  min-width: 40px;
  text-align: right;
}

.activity-list {
  margin-top: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 2px dashed #e0d8c0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 16px;
}

.activity-text {
  flex: 1;
  font-size: 13px;
}

.activity-time {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
  color: #888;
}
</style>
