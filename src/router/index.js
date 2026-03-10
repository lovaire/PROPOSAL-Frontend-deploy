import { createRouter, createWebHistory } from 'vue-router';
import ListSupplier from '../components/ListSupplier.vue';

const routes = [
  {
    path: '/suppliers',
    name: 'ListSupplier',
    component: ListSupplier
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;