<!-- <template>
  <div class="layout">
    <AppSidebar />
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue'
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background-color: #f7f7f7;
}

.content {
  flex: 1;
  padding: 32px;
}
</style> -->
<template>
  <div class="layout">
    <header class="navbar">
      <div class="logo">SiCansebu</div>
      <div class="user-menu" v-if="authStore.user">
        <span>{{ authStore.user.username }} ({{ authStore.user.role }})</span>
        <button @click="logout" class="logout-btn">Logout</button>
      </div>
    </header>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/profile";

const authStore = useAuthStore();

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.navbar {
  background: #7d3322;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logo {
  font-size: 1.5rem;
  font-weight: bold;
}
.user-menu {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.logout-btn {
  background: transparent;
  border: 1px solid white;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}
.logout-btn:hover {
  background: white;
  color: #7d3322;
}
.content {
  flex: 1;
  padding: 2rem;
  background: #f5f5f5;
}
</style>