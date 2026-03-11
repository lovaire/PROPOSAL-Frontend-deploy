import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/profile'

const routes = [
    {
        path: '/register',
        name: 'register',
        component: () => import('@/views/profile/Register.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
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
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard dengan return value (tanpa parameter from)
router.beforeEach((to) => {
    const authStore = useAuthStore();
    const isLoggedIn = !!authStore.token;

    // Jika halaman membutuhkan guest (hanya untuk yang belum login)
    if (to.meta.requiresGuest) {
        if (isLoggedIn) {
            // Jika sudah login, redirect ke halaman users
            return '/users';
        }
        // Jika belum login, izinkan akses ke halaman guest
        return true;
    }

    // Jika halaman membutuhkan autentikasi
    if (to.meta.requiresAuth) {
        if (!isLoggedIn) {
            // Jika belum login, redirect ke login
            return '/login';
        }
        // (Opsional) bisa tambahkan pengecekan role di sini
    }

    // Untuk semua kasus lain, izinkan navigasi
    return true;
});

export default router;