import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/transactions' },
  {
    path: '/transactions',
    name: 'Transactions',
    component: () => import('../views/TransactionView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

