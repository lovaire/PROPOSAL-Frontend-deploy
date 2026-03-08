<template>
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
</style>