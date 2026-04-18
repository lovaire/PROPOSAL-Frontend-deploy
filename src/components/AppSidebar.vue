<template>
  <aside class="sidebar">
    <div class="logo-section">
      <img :src="logoUrl" alt="Logo" class="logo" />
      <h2>Cansebu</h2>
    </div>

    <nav class="menu">
      <router-link to="/users" class="menu-item" active-class="active">
        User Management
      </router-link>

      <router-link to="/items" class="menu-item" active-class="active">
        Master Barang
      </router-link>

      <router-link to="/supplier" class="menu-item" active-class="active">
        List Supplier
      </router-link>

      <router-link to="/transactions" class="menu-item" active-class="active">
        Transactions
      </router-link>
      <router-link to="/invoice-supplier" class="menu-item" active-class="active">
        Invoice Supplier
      </router-link>
    </nav>

    <div class="bottom-menu">
      <div class="menu-item">Account</div>
      <div class="menu-item logout">Logout</div>
    </div>
  </aside>
</template>

<script setup>
import logoUrl from '../assets/logo.svg'
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
  color: #d83b2d; /* Warna merah khas Cansebu */
  font-size: 28px;
  font-weight: 700;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-grow: 1; /* Agar menu fitur mengambil ruang sisa */
}

.menu-item {
  text-decoration: none;
  color: #333;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background-color: #f2f2f2;
}

/* Style saat menu dipilih (Active) */
.active {
  background-color: #eef7f2;
  color: #2d7d5f;
  font-weight: 600;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #eee; /* Pembatas antara fitur dan menu bawah */
  padding-top: 20px;
}

.logout {
  color: #d83b2d; /* Memberi warna merah pada logout sebagai peringatan */
}
</style>