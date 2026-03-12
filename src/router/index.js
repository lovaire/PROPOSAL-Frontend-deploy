import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/profile'

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
            path: '/transactions',
            name: 'transactions',
            component: () => import('@/views/TransactionView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/',
            redirect: '/users'
        },
        {
            path: '/supplier',
            name: 'supplier',
            component: () => import('@/views/ListSupplier.vue'), 
            meta: { requiresAuth: true, requiresInv: true }
        },
        {
            path: '/items',
            name: 'ItemMaster',
            component: () => import('@/views/ItemMaster.vue'),
            meta: { requiresAuth: true }
        },
    ]
});

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isLoggedIn = !!authStore.token;

    if (to.meta.requiresAuth && !isLoggedIn) {
        // Jika halaman membutuhkan auth dan belum login, redirect ke login
        next('/login');
    } else if (to.meta.requiresGuest && isLoggedIn) {
        // Jika halaman untuk guest dan sudah login, redirect ke users
        next('/users');
    } else {
        next();
    }
});

export default router;