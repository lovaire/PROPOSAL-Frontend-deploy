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
  background: #fcfbfa;
}

.content {
  flex: 1;
  padding: 26px 36px 30px;
  overflow-x: auto;
}

@media (max-width: 960px) {
  .content {
    padding: 20px;
  }
}
</style>