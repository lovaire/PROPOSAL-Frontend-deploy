import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/profile/Register.vue'),
            meta: { requireGuest: true }
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/profile/Login.vue'),
            meta: { requireGuest: true }
        }
    ]
})

export default router