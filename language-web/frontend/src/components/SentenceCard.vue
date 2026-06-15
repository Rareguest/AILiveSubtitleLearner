<template>
  <div class="sentence-card" :class="`sentence-card--mastery-${sentence.masteryLevel || 0}`">
    <div class="sentence-card-header" @click="expanded = !expanded">
      <div class="sentence-card-main">
        <span class="sentence-text">{{ sentence.sourceText }}</span>
        <span v-if="sentence.sourceLang" class="pixel-badge pixel-badge--green">{{ sentence.sourceLang }}→{{ sentence.targetLang || '?' }}</span>
      </div>
      <div class="sentence-card-actions">
        <MasteryBar :level="sentence.masteryLevel || 0" />
        <button class="fav-btn" :class="{ 'fav-btn--active': sentence.favorite }" @click.stop="$emit('toggle-fav', sentence.id)">
          {{ sentence.favorite ? '❤️' : '🤍' }}
        </button>
        <span class="expand-icon">{{ expanded ? '▲' : '▼' }}</span>
      </div>
    </div>
    <div class="sentence-card-body" v-if="expanded">
      <hr class="pixel-divider" />
      <div v-if="sentence.translatedText" class="sentence-section">
        <span class="sentence-label">Translation:</span>
        <p>{{ sentence.translatedText }}</p>
      </div>
      <div v-if="sentence.context" class="sentence-section">
        <span class="sentence-label">Context / Video:</span>
        <p>{{ sentence.context }}</p>
      </div>
      <div v-if="sentence.aiKnowledge" class="sentence-section sentence-knowledge">
        <span class="sentence-label">🧠 AI Knowledge:</span>
        <p>{{ sentence.aiKnowledge }}</p>
      </div>
      <div class="sentence-card-footer">
        <PixelButton
          type="warning"
          :loading="generating"
          @click="handleGenerate"
        >
          {{ sentence.aiKnowledge ? 'Regenerate' : 'Generate' }} Knowledge
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
  sentence: { type: Object, required: true }
})

const emit = defineEmits(['toggle-fav', 'generate'])

const expanded = ref(false)
const generating = ref(false)

async function handleGenerate() {
  generating.value = true
  try {
    await emit('generate', props.sentence.id)
  } finally {
    generating.value = false
  }
}
</script>

<style scoped>
.sentence-card {
  background: #fff;
  border: 3px solid #4a4a4a;
  border-radius: 0;
  margin-bottom: 8px;
  border-left: 6px solid #4a4a4a;
  transition: none;
}

.sentence-card--mastery-0 { border-left-color: #4a4a4a; }
.sentence-card--mastery-1 { border-left-color: #c0392b; }
.sentence-card--mastery-2 { border-left-color: #f39c12; }
.sentence-card--mastery-3 { border-left-color: #2980b9; }
.sentence-card--mastery-4 { border-left-color: #27ae60; }
.sentence-card--mastery-5 { border-left-color: #27ae60; }

.sentence-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  gap: 12px;
}

.sentence-card-header:hover {
  background: #f5f0e3;
}

.sentence-card-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: 1;
}

.sentence-text {
  font-size: 13px;
  color: #2d2d2d;
  font-weight: bold;
}

.sentence-card-actions {
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

.sentence-card-body {
  padding: 0 16px 16px;
}

.sentence-section {
  margin-bottom: 10px;
}

.sentence-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}

.sentence-section p {
  font-size: 13px;
  line-height: 1.6;
}

.sentence-knowledge {
  background: #fdf6e3;
  border: 2px dashed #f39c12;
  padding: 10px;
}

.sentence-card-footer {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}
</style>
