<template>
  <aside class="sidebar">
    <div class="sidebar-top">
      <div class="logo-section">
        <img :src="logoUrl" alt="Logo" class="logo" />
        <h2>Cansebu</h2>
      </div>

      <nav class="menu-group">
        <router-link to="/transactions" class="menu-item" active-class="active">
          <span class="menu-icon">📋</span>
          <span>Transaction</span>
        </router-link>
      </nav>
    </div>

    <div class="sidebar-bottom">
      <div class="bottom-divider"></div>

      <div class="bottom-menu">
        <div class="menu-item bottom-item">
          <span class="menu-icon">👤</span>
          <span>Account</span>
        </div>

        <div class="menu-item bottom-item logout">
          <span class="menu-icon">↪</span>
          <span>Logout</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import logoUrl from '../assets/logo.svg'
</script>

<style scoped>
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: #ffffff;
  border-right: 1px solid #ece8e4;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px 14px 20px;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 0;
}

.logo {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.logo-section h2 {
  margin: 0;
  color: #b63124;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.menu-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  text-decoration: none;
  color: #353535;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.menu-item:hover {
  background: #f6f3f1;
}

.menu-icon {
  width: 16px;
  display: inline-flex;
  justify-content: center;
  font-size: 13px;
}

.active {
  background: #f9efed;
  color: #b63124;
  font-weight: 700;
}

.sidebar-bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bottom-divider {
  height: 1px;
  background: #ebe7e3;
  margin: 0 4px;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bottom-item,
.logout {
  color: #2f2f2f;
}

@media (max-width: 960px) {
  .sidebar {
    width: 210px;
    padding: 16px 12px 18px;
  }

  .logo-section h2 {
    font-size: 18px;
  }
}
</style>