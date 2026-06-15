import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import WordBook from '../views/WordBook.vue'
import SentenceBook from '../views/SentenceBook.vue'
import Review from '../views/Review.vue'

const routes = [
  { path: '/login', name: 'Login', component: Login, meta: { guest: true } },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { auth: true } },
  { path: '/words', name: 'WordBook', component: WordBook, meta: { auth: true } },
  { path: '/sentences', name: 'SentenceBook', component: SentenceBook, meta: { auth: true } },
  { path: '/review', name: 'Review', component: Review, meta: { auth: true } },
  { path: '/review/session', name: 'ReviewSession', component: Review, meta: { auth: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.auth && !token) {
    next('/login')
  } else if (to.meta.guest && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
