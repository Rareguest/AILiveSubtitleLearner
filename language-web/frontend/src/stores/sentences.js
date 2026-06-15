import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useSentencesStore = defineStore('sentences', () => {
  const sentenceList = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 0, pageSize: 20, total: 0 })

  async function fetchSentences(params = {}) {
    loading.value = true
    try {
      const res = await api.get('/sentences', { params })
      const d = res.data.data || res.data
      sentenceList.value = d.list || []
      pagination.value = { page: d.page, pageSize: d.size, total: d.total }
    } finally {
      loading.value = false
    }
  }

  async function addSentence(sentenceData) {
    const res = await api.post('/sentences', sentenceData)
    const d = res.data.data || res.data
    sentenceList.value.unshift(d)
    return d
  }

  async function toggleFavorite(id) {
    const res = await api.post(`/sentences/${id}/favorite`)
    const d = res.data.data || res.data
    const idx = sentenceList.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      sentenceList.value[idx].favorite = d.favorite
    }
    return d
  }

  async function searchSentences(query, params = {}) {
    loading.value = true
    try {
      const res = await api.get('/sentences/search', { params: { keyword: query, ...params } })
      const d = res.data.data || res.data
      sentenceList.value = d.list || []
      pagination.value = { page: d.page, pageSize: d.size, total: d.total }
      return d
    } finally {
      loading.value = false
    }
  }

  async function generateKnowledge(id) {
    const res = await api.post(`/sentences/${id}/knowledge`)
    const d = res.data.data || res.data
    const idx = sentenceList.value.findIndex(s => s.id === id)
    if (idx !== -1) {
      sentenceList.value[idx].aiKnowledge = d.aiKnowledge
    }
    return d
  }

  return { sentenceList, loading, pagination, fetchSentences, addSentence, toggleFavorite, searchSentences, generateKnowledge }
})
