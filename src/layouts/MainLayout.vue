<template>
  <div class="layout">
    <AppSidebar />
    <main class="content">
      <header class="topbar">
        <div class="topbar-left">
          <div class="app-title">SiCansebu</div>
        </div>
        <div class="user-menu" v-if="authStore.user">
          <span class="user-text">{{ authStore.user.username }} ({{ authStore.user.role }})</span>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue'
import { useAuthStore } from '@/stores/profile'

const authStore = useAuthStore()
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background-color: #f7f7f7;
}

.layout :deep(.sidebar) {        /* replace .sidebar with whatever class AppSidebar's root div has */
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 100;
  overflow-y: auto;
}

.content {
  margin-left: 240px;
  margin-right: 20px;
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
}

.topbar {
  height: 54px;
  background: #ffffff;
  border: 1px solid #e9e9e9;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  margin-bottom: 18px;
}

.app-title {
  font-size: 16px;
  font-weight: 800;
  color: #7d3322;
}

.user-menu {
  display: flex;
  gap: 12px;
  align-items: center;
}

.user-text {
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.logout-btn {
  background: transparent;
  border: 1px solid #7d3322;
  color: #7d3322;
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}
.logout-btn:hover {
  background: #7d3322;
  color: #fff;
}
</style>