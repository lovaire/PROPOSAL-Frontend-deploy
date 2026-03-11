import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/profile';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/register',
            name: 'register',
            component: () => import('@/views/profile/Register.vue'),
            meta: { requiresAuth: true, requiresAdmin: true } // hanya admin yang bisa akses
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/profile/Login.vue'),
            meta: { requiresGuest: true }
        },
        {
            path: '/users',
            name: 'users',
            component: () => import('@/views/UserManagementView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/',
            redirect: '/users'
        }
    ]
});

// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isLoggedIn = !!authStore.token;

    if (to.meta.requiresAuth && !isLoggedIn) {
        next('/login');
    } else if (to.meta.requiresGuest && isLoggedIn) {
        next('/users');
    } else if (to.meta.requiresAdmin && (!isLoggedIn || authStore.user?.role !== 'admin')) {
        next('/users'); // atau halaman forbidden
    } else {
        next();
    }
});

export default router;