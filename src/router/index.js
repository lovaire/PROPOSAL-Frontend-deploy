import { createRouter, createWebHistory } from 'vue-router'
import UserManagementView from '../views/UserManagementView.vue'

const routes = [
  {
    path: '/',
    redirect: '/users'
  },
  {
    path: '/users',
    name: 'users',
    component: UserManagementView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router