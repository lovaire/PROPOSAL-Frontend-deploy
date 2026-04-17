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
        path: '/distributions',
        name: 'distributions',
        component: () => import('@/views/DistributionView.vue'),
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
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes // gunakan variabel routes
});

// Navigation guard dengan return value
router.beforeEach((to) => {
    const authStore = useAuthStore();
    const isLoggedIn = !!authStore.token;

    if (to.meta.requiresGuest) {
        if (isLoggedIn) {
            return '/users';
        }
        return true;
    }

    if (to.meta.requiresAuth) {
        if (!isLoggedIn) {
            return '/login';
        }
        // TODO: tambahkan pengecekan role jika perlu
    }

    return true;
});

export default router;