<template>
  <aside class="sidebar">
    <div class="logo-section">
      <img :src="logoUrl" alt="Logo" class="logo" />
      <h2>SiCansebu</h2>
    </div>

    <nav class="menu">
      <!-- Admin only -->
      <router-link v-if="isAdmin" to="/users" class="menu-item" active-class="active">
        User Management
      </router-link>

      <!-- Manager & Inventory & Admin -->
      <router-link v-if="showMasterBarang" to="/items" class="menu-item" active-class="active">
        Master Barang
      </router-link>

      <router-link v-if="showListSupplier" to="/supplier" class="menu-item" active-class="active">
        List Supplier
      </router-link>

      <router-link v-if="showTransactions" to="/transactions" class="menu-item" active-class="active">
        Transactions
      </router-link>

      <router-link v-if="showDistribusi" to="/distributions" class="menu-item" active-class="active">
        Distribusi Barang
      </router-link>

      <router-link
          v-if="showDistribusi && ['/distributions', '/distributions/summary' ].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/distributions/summary"
          active-class="active"
      >
        Graph
      </router-link>

      <router-link v-if="showTaxRecap" to="/tax-recap" class="menu-item">
        <span class="icon"></span>
        <span class="text">Tax Recap</span>
      </router-link>

      <router-link v-if="showTaxReport" to="/tax-report" class="menu-item">
        <span class="icon"></span>
        <span class="text">Tax Report</span>
      </router-link>

      <router-link v-if="showSales" to="/sales" class="menu-item" active-class="active">
        Sales
      </router-link>

      <router-link
        v-if="showSales && ['/sales', '/menu'].some((path) => route.path.includes(path))"
        class="submenu-item"
        to="/menu"
        active-class="active"
      >
        Menu
      </router-link>

      <router-link
          v-if="showSales && ['/sales', '/menu'].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/sales/chart"
          active-class="active"
      >Revenue Chart
      </router-link>

      <router-link v-if="showInvoiceSupplier" to="/invoice-supplier" class="menu-item" active-class="active">
        Invoice Supplier
      </router-link>
    </nav>

    <div class="bottom-menu">
      <!-- Menu Account untuk membuka modal update profil sendiri (semua role) -->
      <div class="menu-item" @click="openAccountModal">Account</div>
      <div class="menu-item logout" @click="logout">Logout</div>
    </div>

    <!-- Modal Update Akun Sendiri (sama seperti sebelumnya) -->
    <div v-if="showAccountModal" class="modal-overlay" @click.self="closeAccountModal">
      <div class="modal-box">
        <h2>Account Detail</h2>
        <label>Username</label>
        <input v-model="accountForm.username" type="text" />
        <label>Password</label>
        <input
          v-model="accountForm.password"
          type="password"
          placeholder="Kosongkan jika tidak ingin diubah"
        />
        <label>Role</label>
        <p class="role-text">{{ capitalizeRole(authStore.user?.role) }}</p>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeAccountModal">Cancel</button>
          <button class="done-btn" @click="handleAccountUpdate" :disabled="submitting">
            {{ submitting ? "Saving..." : "Done" }}
          </button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/profile';
import { useRoute } from 'vue-router';
import { updateUser } from '@/api/userApi';
import logoUrl from '@/assets/logo.png';

const authStore = useAuthStore();
const route = useRoute();

// Normalisasi role (hilangkan prefix ROLE_ jika ada)
const userRole = computed(() => {
  let role = authStore.user?.role || '';
  if (role.startsWith('ROLE_')) {
    role = role.substring(5);
  }
  return role.toLowerCase();
});

// Helper untuk mengecek apakah role termasuk dalam daftar
const hasRole = (roles) => roles.includes(userRole.value);

// Mapping role ke menu
const isAdmin = computed(() => userRole.value === 'admin');
const showMasterBarang = computed(() => hasRole(['admin', 'manager', 'inventory']));
const showListSupplier = computed(() => hasRole(['admin', 'manager', 'inventory']));
const showTransactions = computed(() => hasRole(['admin', 'manager', 'financial']));
const showDistribusi = computed(() => hasRole(['admin', 'manager', 'inventory']));
const showTaxRecap = computed(() => hasRole(['admin', 'manager']));
const showTaxReport = computed(() => hasRole(['admin', 'manager', 'financial']));
const showSales = computed(() => hasRole(['admin', 'manager', 'financial']));
const showInvoiceSupplier = computed(() => hasRole(['admin', 'financial'])); 

// Account Modal
const showAccountModal = ref(false);
const submitting = ref(false);
const accountForm = ref({
  username: '',
  password: ''
});

const openAccountModal = () => {
  accountForm.value = {
    username: authStore.user?.username || '',
    password: ''
  };
  showAccountModal.value = true;
};

const closeAccountModal = () => {
  showAccountModal.value = false;
  accountForm.value = { username: '', password: '' };
};

const capitalizeRole = (role) => {
  if (!role) return '-';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const handleAccountUpdate = async () => {
  if (!authStore.user) return;
  submitting.value = true;
  try {
    const payload = {
      username: accountForm.value.username
    };
    if (accountForm.value.password) {
      payload.password = accountForm.value.password;
    }
    await updateUser(authStore.user.id, payload);
    alert('Profil berhasil diupdate');
    authStore.user.username = accountForm.value.username;
    closeAccountModal();
  } catch (error) {
    console.error(error);
    alert(error?.response?.data?.message || 'Gagal update profil');
  } finally {
    submitting.value = false;
  }
};

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
/* ===== STYLE SIDEBAR ===== (sama seperti sebelumnya, tidak ada perubahan) */
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
  flex-grow: 1;
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

.active {
  background-color: #eef7f2;
  color: #2d7d5f;
  font-weight: 600;
}

.submenu-item {
  text-decoration: none;
  color: #333;
  padding: 12px 14px;
  margin-left: 20px;
  border-radius: 10px;
  font-size: 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.submenu-item:hover {
  background-color: #f2f2f2;
}

.bottom-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.logout {
  color: #d83b2d;
}

/* ===== STYLE MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  width: 420px;
  background: white;
  border-radius: 32px;
  padding: 36px 42px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.modal-box h2 {
  margin: 0 0 24px 0;
  font-size: 22px;
  font-weight: 700;
  color: #1d1d1d;
}

.modal-box label {
  display: block;
  margin-bottom: 8px;
  margin-top: 14px;
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.modal-box input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  outline: none;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}

.cancel-btn {
  background: white;
  border: 1px solid #e5e5e5;
  color: #3a6f5c;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  cursor: pointer;
}

.done-btn {
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 26px;
  font-weight: 600;
  cursor: pointer;
}

.role-text {
  margin-top: 8px;
  padding: 14px 16px;
  background-color: #f5f5f5;
  border-radius: 10px;
  font-size: 14px;
  color: #333;
}
</style>