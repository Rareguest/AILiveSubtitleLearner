<template>
  <div class="review-page">
    <template v-if="!inSession">
      <h1 class="pixel-title">🔄 Review</h1>

      <div class="pixel-card review-status">
        <div class="review-icon">⏰</div>
        <div class="review-info">
          <span class="review-count">{{ dueCount }}</span>
          <span class="review-label">Items Due for Review</span>
        </div>
      </div>

      <div class="review-actions" v-if="dueCount > 0">
        <PixelButton type="success" @click="startSession">▶ Start Review Session</PixelButton>
      </div>
      <div v-else class="pixel-empty">
        🎉 No items due for review! Come back later.
      </div>
    </template>

    <template v-else>
      <div class="review-session">
        <div class="session-header">
          <h2 class="pixel-subtitle">Review Session</h2>
          <div class="session-progress">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
            </div>
            <span class="progress-text">{{ currentIndex + 1 }} / {{ sessionItems.length }}</span>
          </div>
          <PixelButton type="danger" @click="endSession">✕ Quit</PixelButton>
        </div>

        <div v-if="currentItem" class="review-card pixel-card">
          <div class="review-type-badge">
            <span class="pixel-badge" :class="currentItem.type === 'word' ? 'pixel-badge--blue' : 'pixel-badge--green'">
              {{ currentItem.type === 'word' ? '📖 Word' : '💬 Sentence' }}
            </span>
          </div>

          <div class="review-question">
            <div v-if="currentItem.type === 'word'" class="review-word">
              <span class="review-word-text">{{ currentItem.word }}</span>
              <span v-if="currentItem.phonetic" class="review-phonetic">{{ currentItem.phonetic }}</span>
            </div>
            <div v-else class="review-sentence">
              <span class="review-sentence-text">{{ currentItem.sourceText }}</span>
            </div>
          </div>

          <div v-if="showAnswer" class="review-answer">
            <hr class="pixel-divider" />
            <div v-if="currentItem.type === 'word'">
              <p class="answer-definition">{{ currentItem.definition }}</p>
              <div v-if="currentItem.examples && currentItem.examples.length">
                <span class="answer-label">Examples:</span>
                <ul>
                  <li v-for="(ex, i) in currentItem.examples" :key="i">{{ ex }}</li>
                </ul>
              </div>
            </div>
            <div v-else>
              <p class="answer-definition">{{ currentItem.translation }}</p>
            </div>
          </div>

          <div class="review-controls">
            <PixelButton v-if="!showAnswer" type="primary" @click="showAnswer = true">👁 Show Answer</PixelButton>
            <div v-else class="rating-buttons">
              <span class="rating-label">How well did you remember?</span>
              <div class="rating-grid">
                <button
                  v-for="r in ratings"
                  :key="r.value"
                  class="rating-btn"
                  :class="`rating-btn--${r.cls}`"
                  @click="submitRating(r.value)"
                >
                  <span class="rating-num">{{ r.value }}</span>
                  <span class="rating-text">{{ r.label }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="pixel-empty">
          🎉 Session complete! Great job!
          <div class="session-done-actions">
            <PixelButton type="success" @click="endSession">🏠 Back to Review</PixelButton>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'
import PixelButton from '../components/PixelButton.vue'

const dueCount = ref(0)
const inSession = ref(false)
const sessionItems = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)

const currentItem = computed(() => {
  if (currentIndex.value < sessionItems.value.length) {
    return sessionItems.value[currentIndex.value]
  }
  return null
})

const progressPct = computed(() => {
  if (!sessionItems.value.length) return 0
  return Math.round(((currentIndex.value) / sessionItems.value.length) * 100)
})

const ratings = [
  { value: 0, label: 'Forgot', cls: 'black' },
  { value: 1, label: 'Hard', cls: 'red' },
  { value: 2, label: 'Difficult', cls: 'orange' },
  { value: 3, label: 'OK', cls: 'yellow' },
  { value: 4, label: 'Good', cls: 'blue' },
  { value: 5, label: 'Easy', cls: 'green' }
]

onMounted(async () => {
  try {
    const res = await api.get('/review/count')
    const d = res.data.data || res.data
    dueCount.value = d || 0
  } catch {
    // default 0
  }
})

async function startSession() {
  try {
    const res = await api.get('/review/due')
    const d = res.data.data || res.data
    const items = (d || []).map(r => ({
      id: r.itemId,
      type: r.itemType?.toLowerCase() || 'word',
      word: r.itemType === 'WORD' ? 'Word #' + r.itemId : undefined,
      source_text: r.itemType === 'SENTENCE' ? 'Sentence #' + r.itemId : undefined,
      definition: '',
      translation: ''
    }))
    sessionItems.value = items
    currentIndex.value = 0
    showAnswer.value = false
    inSession.value = true
  } catch {
    // handle error
  }
}

async function submitRating(quality) {
  if (!currentItem.value) return
  try {
    await api.post('/review/submit', {
      itemId: currentItem.value.id,
      itemType: currentItem.value.type === 'word' ? 'WORD' : 'SENTENCE',
      quality
    })
  } catch {
    // continue anyway
  }
  currentIndex.value++
  showAnswer.value = false
}

async function endSession() {
  inSession.value = false
  sessionItems.value = []
  currentIndex.value = 0
  showAnswer.value = false
  try {
    const res = await api.get('/review/count')
    const d = res.data.data || res.data
    dueCount.value = d || 0
  } catch {}
}
</script>

<style scoped>
.review-page {
  max-width: 800px;
}

.review-status {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px;
  margin-bottom: 20px;
}

.review-icon {
  font-size: 48px;
}

.review-count {
  font-family: 'Press Start 2P', monospace;
  font-size: 36px;
  color: #c0392b;
  display: block;
}

.review-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #666;
  display: block;
  margin-top: 4px;
}

.review-actions {
  text-align: center;
  margin-top: 20px;
}

.session-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.session-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar-bg {
  flex: 1;
  height: 16px;
  background: #e0d8c0;
  border: 2px solid #4a4a4a;
}

.progress-bar-fill {
  height: 100%;
  background: #27ae60;
  transition: width 0.3s;
}

.progress-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #2d2d2d;
  white-space: nowrap;
}

.review-card {
  text-align: center;
  padding: 30px;
}

.review-type-badge {
  margin-bottom: 16px;
}

.review-question {
  margin-bottom: 20px;
}

.review-word-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  color: #2d2d2d;
  display: block;
  margin-bottom: 8px;
}

.review-phonetic {
  font-size: 14px;
  color: #888;
  font-style: italic;
}

.review-sentence-text {
  font-size: 16px;
  color: #2d2d2d;
  line-height: 1.6;
}

.review-answer {
  text-align: left;
  margin-bottom: 20px;
}

.answer-definition {
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.6;
}

.answer-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #666;
}

.answer-definition ul {
  padding-left: 20px;
  margin-top: 4px;
}

.review-controls {
  margin-top: 16px;
}

.rating-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #666;
  display: block;
  margin-bottom: 10px;
}

.rating-grid {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.rating-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: #fff;
  border: 3px solid #4a4a4a;
  cursor: pointer;
  box-shadow: 2px 2px 0 #4a4a4a;
  min-width: 70px;
}

.rating-btn:active {
  box-shadow: none;
  transform: translate(2px, 2px);
}

.rating-num {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
}

.rating-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 7px;
}

.rating-btn--black { background: #333; color: #fff; }
.rating-btn--red { background: #c0392b; color: #fff; }
.rating-btn--orange { background: #e67e22; color: #fff; }
.rating-btn--yellow { background: #f39c12; color: #fff; }
.rating-btn--blue { background: #2980b9; color: #fff; }
.rating-btn--green { background: #27ae60; color: #fff; }

.session-done-actions {
  margin-top: 16px;
}
</style>
