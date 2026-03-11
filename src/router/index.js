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
        },
        {
            path: '/supplier',
            name: 'supplier',
            component: () => import('@/views/ListSupplier.vue'), 
            meta: { requiresAuth: true, requiresInv: true }
        },
    ]
});

// Navigation guard
// Navigation guard
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore();
    const isLoggedIn = !!authStore.token;
    // const userRole = authStore.user?.role?.toLowerCase(); 

    if (to.meta.requiresGuest && !isLoggedIn) {
        next('/login');
    // } else if (to.meta.requiresGuest && isLoggedIn) {
    //     next('/users');
    // } else if (to.meta.requiresAdmin && (!isLoggedIn || userRole !== 'admin')) {
    //     next('/users'); 
    // } 
    // else if (to.path === '/supplier' && !(userRole === 'admin' || userRole === 'inventori')) {
    //     alert("Akses Ditolak: Hanya Admin atau Inventori!");
    //     next('/supplier'); 
    } 
    else {
        next();
    }
});

export default router;