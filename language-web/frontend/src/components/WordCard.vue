<template>
  <div class="word-card" :class="`word-card--mastery-${word.masteryLevel || 0}`">
    <div class="word-card-header" @click="expanded = !expanded">
      <div class="word-card-main">
        <span class="word-text">{{ word.word }}</span>
        <span v-if="word.phonetic" class="word-phonetic">{{ word.phonetic }}</span>
        <span v-if="word.lang" class="pixel-badge pixel-badge--blue">{{ word.lang }}</span>
      </div>
      <div class="word-card-actions">
        <MasteryBar :level="word.masteryLevel || 0" />
        <button class="fav-btn" :class="{ 'fav-btn--active': word.favorite }" @click.stop="$emit('toggle-fav', word.id)">
          {{ word.favorite ? '❤️' : '🤍' }}
        </button>
        <span class="expand-icon">{{ expanded ? '▲' : '▼' }}</span>
      </div>
    </div>
    <div class="word-card-body" v-if="expanded">
      <hr class="pixel-divider" />
      <div v-if="word.definition" class="word-section">
        <span class="word-label">Definition:</span>
        <p>{{ word.definition }}</p>
      </div>
      <div v-if="word.examples" class="word-section">
        <span class="word-label">Examples:</span>
        <p>{{ word.examples }}</p>
      </div>
      <div v-if="word.notes" class="word-section">
        <span class="word-label">Notes:</span>
        <p>{{ word.notes }}</p>
      </div>
      <div v-if="word.aiKnowledge" class="word-section word-knowledge">
        <span class="word-label">🧠 AI Knowledge:</span>
        <p>{{ word.aiKnowledge }}</p>
      </div>
      <div class="word-card-footer">
        <PixelButton
          type="warning"
          :loading="generating"
          @click="handleGenerate"
        >
          {{ word.aiKnowledge ? 'Regenerate' : 'Generate' }} Knowledge
        </PixelButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MasteryBar from './MasteryBar.vue'
import PixelButton from './PixelButton.vue'

const props = defineProps({
  word: { type: Object, required: true }
})

const emit = defineEmits(['toggle-fav', 'generate'])

const expanded = ref(false)
const generating = ref(false)

async function handleGenerate() {
  generating.value = true
  try {
    await emit('generate', props.word.id)
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.word-card {
  background: #fff;
  border: 3px solid #4a4a4a;
  border-radius: 0;
  margin-bottom: 8px;
  border-left: 6px solid #4a4a4a;
  transition: none;
}

.word-card--mastery-0 { border-left-color: #4a4a4a; }
.word-card--mastery-1 { border-left-color: #c0392b; }
.word-card--mastery-2 { border-left-color: #f39c12; }
.word-card--mastery-3 { border-left-color: #2980b9; }
.word-card--mastery-4 { border-left-color: #27ae60; }
.word-card--mastery-5 { border-left-color: #27ae60; }

.word-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;
}

.word-card-header:hover {
  background: #f5f0e3;
}

.word-card-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.word-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 12px;
  color: #2d2d2d;
}

.word-phonetic {
  font-size: 12px;
  color: #888;
  font-style: italic;
}

.word-card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.fav-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 2px;
}

.expand-icon {
  font-size: 10px;
  color: #888;
}

.word-card-body {
  padding: 0 16px 16px;
}

.word-section {
  margin-bottom: 10px;
}

.word-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.word-section p, .word-section li {
  font-size: 13px;
  line-height: 1.6;
}

.word-section ul {
  padding-left: 20px;
}

.word-knowledge {
  background: #fdf6e3;
  border: 2px dashed #f39c12;
  padding: 10px;
}

.word-card-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
