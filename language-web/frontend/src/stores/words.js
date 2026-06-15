import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useWordsStore = defineStore('words', () => {
  const wordList = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 0, pageSize: 20, total: 0 })

  async function fetchWords(params = {}) {
    loading.value = true
    try {
      const res = await api.get('/words', { params })
      const d = res.data.data || res.data
      wordList.value = d.list || []
      pagination.value = { page: d.page, pageSize: d.size, total: d.total }
    } finally {
      loading.value = false
    }
  }

  async function addWord(wordData) {
    const res = await api.post('/words', wordData)
    const d = res.data.data || res.data
    wordList.value.unshift(d)
    return d
  }

  async function toggleFavorite(id) {
    const res = await api.post(`/words/${id}/favorite`)
    const d = res.data.data || res.data
    const idx = wordList.value.findIndex(w => w.id === id)
    if (idx !== -1) {
      wordList.value[idx].favorite = d.favorite
    }
    return d
  }

  async function searchWords(query, params = {}) {
    loading.value = true
    try {
      const res = await api.get('/words/search', { params: { keyword: query, ...params } })
      const d = res.data.data || res.data
      wordList.value = d.list || []
      pagination.value = { page: d.page, pageSize: d.size, total: d.total }
      return d
    } finally {
      loading.value = false
    }
  }

  async function generateKnowledge(id) {
    const res = await api.post(`/words/${id}/knowledge`)
    const d = res.data.data || res.data
    const idx = wordList.value.findIndex(w => w.id === id)
    if (idx !== -1) {
      wordList.value[idx].aiKnowledge = d.aiKnowledge
    }
    return d
  }

  return { wordList, loading, pagination, fetchWords, addWord, toggleFavorite, searchWords, generateKnowledge }
})
