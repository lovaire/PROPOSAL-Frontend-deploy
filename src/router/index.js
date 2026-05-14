import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/profile'

const routes = [
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
        meta: { requiresAuth: true }
    },
    {
        path: '/items',
        name: 'ItemMaster',
        component: () => import('@/views/ItemMaster.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/tax-recap',
        name: 'tax-recap',
        component: () => import('@/views/TaxRecapView.vue'),
        meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAJERIAL'] }    },
    {
        path: '/tax-report',
        name: 'tax-report',
        component: () => import('@/views/TaxReportView.vue'),
        meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'MANAJERIAL', 'KEUANGAN'] }
    },
    {
        path: '/sales',
        name: 'Sales',
        component: () => import('@/views/SalesView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/revenue-summary',
        name: 'RevenueSummary',
        component: () => import('@/views/RevenueSummary.vue'),
        meta: { requiresAuth: true}
    },
    {
        path: '/income-summary',
        name: 'IncomeSummary',
        component: () => import('@/views/IncomeSummary.vue'),
        meta: { requiresAuth: true}
    },
    {
        path: '/menu',
        name: 'Menu',
        component: () => import('@/views/MenuView.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/invoice-supplier',
        name: 'InvoiceSupplier',
        component: () => import('../views/InvoiceSupplier.vue')
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
    const rawRole = authStore.user?.role || localStorage.getItem('role') || '';
    const normalizedRole = rawRole.toLowerCase().startsWith('role_')
        ? rawRole.toLowerCase().slice(5)
        : rawRole.toLowerCase();
    const userRoleUpper = rawRole.toUpperCase();

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

        // --- SISTEM KEAMANAN ROLE (dev baseline) ---
        const allowedRoles = to.meta.allowedRoles;
        if (allowedRoles && allowedRoles.length > 0) {
            const candidates = [userRoleUpper, rawRole, `ROLE_${userRoleUpper}`].filter(Boolean);
            const isAllowed = candidates.some((candidate) => allowedRoles.includes(candidate));
            if (!isAllowed) {
                alert("Akses Ditolak: Anda tidak memiliki izin untuk membuka halaman ini.");
                return '/transactions';
            }
        }
    }

    // Legacy meta-based checks used in Sprint 1 routes
    if (to.meta.requiresAdmin && normalizedRole !== 'admin') {
        return '/users';
    }

    if (to.meta.requiresInv && normalizedRole !== 'inventori') {
        return '/users';
    }

    return true;
});

export default router;