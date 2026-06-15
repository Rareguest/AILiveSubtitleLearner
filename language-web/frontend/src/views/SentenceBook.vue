<template>
  <div class="sentencebook">
    <div class="sentencebook-header">
      <h1 class="pixel-title">💬 SentenceBook</h1>
      <PixelButton type="primary" @click="showAddModal = true">➕ Add Sentence</PixelButton>
    </div>

    <div class="sentencebook-toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Search sentences..."
          @input="handleSearch"
        />
      </div>
      <div class="filter-group">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ 'filter-btn--active': activeFilter === f.value }"
          @click="activeFilter = f.value; loadSentences()"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div v-if="sentencesStore.loading" class="pixel-empty">⏳ Loading...</div>
    <div v-else-if="!sentencesStore.sentenceList.length" class="pixel-empty">No sentences found. Add your first sentence!</div>
    <div v-else>
      <SentenceCard
        v-for="sentence in sentencesStore.sentenceList"
        :key="sentence.id"
        :sentence="sentence"
        @toggle-fav="handleToggleFav"
        @generate="handleGenerate"
      />

      <div class="pagination" v-if="sentencesStore.pagination.total > sentencesStore.pagination.pageSize">
        <PixelButton
          type="primary"
          :disabled="currentPage <= 1"
          @click="currentPage--; loadSentences()"
        >◀ Prev</PixelButton>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <PixelButton
          type="primary"
          :disabled="currentPage >= totalPages"
          @click="currentPage++; loadSentences()"
        >Next ▶</PixelButton>
      </div>
    </div>

    <Modal :visible="showAddModal" title="➕ Add New Sentence" @close="showAddModal = false">
      <form class="add-form" @submit.prevent="handleAddSentence">
        <div class="form-group">
          <label class="form-label">Source Text *</label>
          <textarea v-model="addForm.sourceText" placeholder="The original sentence..." required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Translation</label>
          <textarea v-model="addForm.translatedText" placeholder="Translation of the sentence..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Source Language</label>
          <input v-model="addForm.sourceLang" type="text" placeholder="e.g. en" />
        </div>
        <div class="form-group">
          <label class="form-label">Target Language</label>
          <input v-model="addForm.targetLang" type="text" placeholder="e.g. zh" />
        </div>
        <div class="form-group">
          <label class="form-label">Context / Video URL</label>
          <input v-model="addForm.context" type="text" placeholder="e.g. YouTube URL or description" />
        </div>
        <p v-if="addError" class="form-error">{{ addError }}</p>
        <div class="add-form-footer">
          <PixelButton type="primary" :loading="adding" @click="handleAddSentence">💾 Save</PixelButton>
          <PixelButton type="danger" @click="showAddModal = false">Cancel</PixelButton>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useSentencesStore } from '../stores/sentences'
import SentenceCard from '../components/SentenceCard.vue'
import PixelButton from '../components/PixelButton.vue'
import Modal from '../components/Modal.vue'

const sentencesStore = useSentencesStore()

const searchQuery = ref('')
const activeFilter = ref('all')
const currentPage = ref(1)
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref('')

const filters = [
  { label: 'All', value: 'all' },
  { label: '❤️ Favorite', value: 'favorite' },
  { label: 'en→zh', value: 'en-zh' },
  { label: 'ja→zh', value: 'ja-zh' },
  { label: '⭐ New', value: 'mastery-0' }
]

const addForm = reactive({
  source_text: '',
  translation: '',
  language_pair: 'en-zh',
  context: ''
})

const totalPages = computed(() => {
  return Math.ceil(sentencesStore.pagination.total / sentencesStore.pagination.pageSize) || 1
})

let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadSentences()
  }, 300)
}

function loadSentences() {
  const params = { page: currentPage.value - 1, size: 20 }
  if (searchQuery.value) {
    sentencesStore.searchSentences(searchQuery.value, params)
  } else {
    if (activeFilter.value === 'favorite') params.favorite = true
    else if (activeFilter.value === 'mastery-0') params.mastery = 0
    else if (activeFilter.value !== 'all') params.sourceLang = activeFilter.value
    sentencesStore.fetchSentences(params)
  }
}

async function handleToggleFav(id) {
  await sentencesStore.toggleFavorite(id)
}

async function handleGenerate(id) {
  await sentencesStore.generateKnowledge(id)
}

async function handleAddSentence() {
  addError.value = ''
  adding.value = true
  try {
    await sentencesStore.addSentence({ ...addForm })
    showAddModal.value = false
    addForm.sourceText = ''
    addForm.sourceLang = 'en'
    addForm.translatedText = ''
    addForm.targetLang = 'zh'
    addForm.context = ''
  } catch (e) {
    addError.value = e.response?.data?.message || 'Failed to add sentence'
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadSentences()
})
</script>

<style scoped>
.sentencebook {
  max-width: 1000px;
}

.sentencebook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.sentencebook-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
}

.filter-group {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.filter-btn {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  padding: 6px 10px;
  background: #fff;
  border: 2px solid #4a4a4a;
  cursor: pointer;
  color: #2d2d2d;
}

.filter-btn--active {
  background: #27ae60;
  color: #fff;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
  padding: 16px 0;
}

.page-info {
  font-family: 'Press Start 2P', monospace;
  font-size: 10px;
  color: #2d2d2d;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #2d2d2d;
}

.form-error {
  color: #c0392b;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  padding: 8px;
  background: #fde8e8;
  border: 2px solid #c0392b;
}

.add-form-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
