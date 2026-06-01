<template>
  <div class="flex h-screen w-screen bg-gray-50">
    <AppSidebar v-if="showAside" v-model:show="showAside"/>
    <main class="flex flex-col flex-1 overflow-y-scroll m-2 gap-2">
      <header class="flex justify-between items-center border border-brand-peach rounded-xl h-[7%] px-4 bg-white">
        <div class="flex gap-2">
          <div class="rounded-xl cursor-pointer bg-white opacity-25 bg-opacity-0 hover:opacity-100" @click="openAside" v-if="!showAside">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5" />
            </svg>
          </div>
          <div>
            <div class="text-lg font-extrabold text-red-700">SiCansebu</div>
          </div>
        </div>
        <div v-if="authStore.user">
          <span class="text-sm font-semibold text-gray-700">{{ authStore.user.username }} ({{ authStore.user.role }})</span>
        </div>
      </header>
      <slot />
    </main>
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue'
import { useAuthStore } from '@/stores/profile'
import {ref} from "vue";

const authStore = useAuthStore()

// Aside
const showAside = ref(true)

const openAside = () => {
  showAside.value = true
}

  // const closeAside = () => {
  //   showAside.value = false;
  // }
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