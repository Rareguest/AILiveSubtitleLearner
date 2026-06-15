<template>
  <div class="wordbook">
    <div class="wordbook-header">
      <h1 class="pixel-title">📖 WordBook</h1>
      <PixelButton type="primary" @click="showAddModal = true">➕ Add Word</PixelButton>
    </div>

    <div class="wordbook-toolbar">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="🔍 Search words..."
          @input="handleSearch"
        />
      </div>
      <div class="filter-group">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ 'filter-btn--active': activeFilter === f.value }"
          @click="activeFilter = f.value; loadWords()"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div v-if="wordsStore.loading" class="pixel-empty">⏳ Loading...</div>
    <div v-else-if="!wordsStore.wordList.length" class="pixel-empty">No words found. Add your first word!</div>
    <div v-else>
      <WordCard
        v-for="word in wordsStore.wordList"
        :key="word.id"
        :word="word"
        @toggle-fav="handleToggleFav"
        @generate="handleGenerate"
      />

      <div class="pagination" v-if="wordsStore.pagination.total > wordsStore.pagination.pageSize">
        <PixelButton
          type="primary"
          :disabled="currentPage <= 1"
          @click="currentPage--; loadWords()"
        >◀ Prev</PixelButton>
        <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
        <PixelButton
          type="primary"
          :disabled="currentPage >= totalPages"
          @click="currentPage++; loadWords()"
        >Next ▶</PixelButton>
      </div>
    </div>

    <Modal :visible="showAddModal" title="➕ Add New Word" @close="showAddModal = false">
      <form class="add-form" @submit.prevent="handleAddWord">
        <div class="form-group">
          <label class="form-label">Word *</label>
          <input v-model="addForm.word" type="text" placeholder="e.g. serendipity" required />
        </div>
        <div class="form-group">
          <label class="form-label">Phonetic</label>
          <input v-model="addForm.phonetic" type="text" placeholder="e.g. /ˌserənˈdɪpɪti/" />
        </div>
        <div class="form-group">
          <label class="form-label">Language</label>
          <input v-model="addForm.lang" type="text" placeholder="e.g. en" />
        </div>
        <div class="form-group">
          <label class="form-label">Definition</label>
          <textarea v-model="addForm.definition" placeholder="Word definition..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Examples (one per line)</label>
          <textarea v-model="addForm.examplesRaw" placeholder="Example sentence 1&#10;Example sentence 2"></textarea>
        </div>
        <p v-if="addError" class="form-error">{{ addError }}</p>
        <div class="add-form-footer">
          <PixelButton type="primary" :loading="adding" @click="handleAddWord">💾 Save Word</PixelButton>
          <PixelButton type="danger" @click="showAddModal = false">Cancel</PixelButton>
        </div>
      </form>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useWordsStore } from '../stores/words'
import WordCard from '../components/WordCard.vue'
import PixelButton from '../components/PixelButton.vue'
import Modal from '../components/Modal.vue'

const wordsStore = useWordsStore()

const searchQuery = ref('')
const activeFilter = ref('all')
const currentPage = ref(1)
const showAddModal = ref(false)
const adding = ref(false)
const addError = ref('')

const filters = [
  { label: 'All', value: 'all' },
  { label: '❤️ Favorite', value: 'favorite' },
  { label: '🇬🇧 English', value: 'en' },
  { label: '🇯🇵 Japanese', value: 'ja' },
  { label: '⭐ Mastery 0', value: 'mastery-0' },
  { label: '⭐⭐ Mastery 3+', value: 'mastery-3' }
]

const addForm = reactive({
  word: '',
  phonetic: '',
  language: 'en',
  definition: '',
  examplesRaw: ''
})

const totalPages = computed(() => {
  return Math.ceil(wordsStore.pagination.total / wordsStore.pagination.pageSize) || 1
})

let searchTimer = null
function handleSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadWords()
  }, 300)
}

function loadWords() {
  const params = { page: currentPage.value - 1, size: 20 }
  if (searchQuery.value) {
    wordsStore.searchWords(searchQuery.value, params)
  } else {
    if (activeFilter.value === 'favorite') params.favorite = true
    else if (activeFilter.value === 'mastery-0') params.mastery = 0
    else if (activeFilter.value === 'mastery-3') params.mastery_min = 3
    else if (activeFilter.value !== 'all') params.lang = activeFilter.value
    wordsStore.fetchWords(params)
  }
}

async function handleToggleFav(id) {
  await wordsStore.toggleFavorite(id)
}

async function handleGenerate(id) {
  await wordsStore.generateKnowledge(id)
}

async function handleAddWord() {
  addError.value = ''
  adding.value = true
  try {
    const data = {
      word: addForm.word,
      phonetic: addForm.phonetic || undefined,
      lang: addForm.lang || undefined,
      definition: addForm.definition || undefined,
      examples: addForm.examplesRaw || undefined
    }
    await wordsStore.addWord(data)
    showAddModal.value = false
    addForm.word = ''
    addForm.phonetic = ''
    addForm.lang = 'en'
    addForm.definition = ''
    addForm.examplesRaw = ''
  } catch (e) {
    addError.value = e.response?.data?.message || 'Failed to add word'
  } finally {
    adding.value = false
  }
}

onMounted(() => {
  loadWords()
})
</script>

<style scoped>
.wordbook {
  max-width: 1000px;
}

.wordbook-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.wordbook-toolbar {
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
  background: #2980b9;
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
