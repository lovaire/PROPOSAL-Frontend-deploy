<template>
  <aside class="sidebar">
    <div class="logo-section">
      <img src="/src/assets/logo.png" alt="Logo" class="logo" />
      <h2>Cansebu</h2>
    </div>

    <nav class="menu">
      <router-link to="/users" class="menu-item" active-class="active">
        User Management
      </router-link>
    </nav>

    <div class="bottom-menu">
      <div class="menu-item">Account</div>
      <div class="menu-item logout">Logout</div>
    </div>
  </aside>
</template>

<script setup>
</script>

<style scoped>
.sidebar {
  width: 220px;
  min-height: 100vh;
  background-color: #ffffff;
  border-right: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 16px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
}

.logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.logo-section h2 {
  margin: 0;
  color: #d83b2d;
  font-size: 28px;
  font-weight: 700;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-item {
  text-decoration: none;
  color: #333;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
}

.menu-item:hover {
  background-color: #f2f2f2;
}

.active {
  background-color: #eef7f2;
  color: #2d7d5f;
  font-weight: 600;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.logout {
  color: #444;
}
</style>