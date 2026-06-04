<template>
  <div class="flex flex-col justify-between h-screen min-w-64 p-5 w-1/6 gap-3 bg-white border border-r-gray-100 max-sm:fixed shadow-xl">
    <div class="flex justify-between">
      <div class="flex items-center gap-2.5">
        <img :src="logoUrl" alt="Logo" class="w-10 h-9 object-contain" />
        <h2 class="font-bold text-red-700 text-2xl">SiCansebu</h2>
      </div>
      <div class="flex items-center p-1 rounded-xl cursor-pointer opacity-25 bg-opacity-0 hover:opacity-100" @click="closeSidebar">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="m18.75 19.5-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
        </svg>
      </div>
    </div>

    <div class="w-full h-0.5 bg-gray-100"/>

    <nav class="flex flex-col gap-3 flex-1 overflow-y-scroll">
      <!-- Admin only -->
      <router-link v-if="isAdmin" to="/users" class="menu-item" active-class="active">
        User Management
      </router-link>

      <router-link v-if="isAdmin || isManajerial" to="/dashboard-roi" class="menu-item" active-class="active">
        Dashboard ROI
      </router-link>

      <!-- Manager & Inventory & Admin -->
      <router-link v-if="isAdmin || isManajerial || isInventori" to="/items" class="menu-item" active-class="active">
        Item Master
      </router-link>

      <router-link v-if="isAdmin || isManajerial || isInventori" to="/supplier" class="menu-item" active-class="active">
        List Supplier
      </router-link>

      <router-link v-if="isAdmin || isManajerial || isKeuangan" to="/transactions" class="menu-item" active-class="active">
        Transactions
      </router-link>

      <router-link v-if="isAdmin || isManajerial || isInventori" to="/distributions" class="menu-item" active-class="active">
        Distribution
      </router-link>

      <router-link
          v-if="isAdmin || isManajerial && ['/distributions', '/distributions/summary' ].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/distributions/summary"
          active-class="active"
      >
        Summary
      </router-link>

      <router-link v-if="isAdmin || isManajerial" to="/tax-recap" class="menu-item">
        <span class="icon"></span>
        <span class="text">Tax Recap</span>
      </router-link>

      <router-link v-if="isAdmin || isManajerial || isKeuangan" to="/tax-report" class="menu-item">
        <span class="icon"></span>
        <span class="text">Tax Report</span>
      </router-link>

      <router-link v-if="isAdmin || isManajerial || isKeuangan" to="/sales" class="menu-item" active-class="active">
        Sales
      </router-link>

      <router-link
          v-if="(isAdmin || isManajerial || isKeuangan) && ['/sales', '/menu', '/income-summary', '/revenue-summary'].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/menu"
          active-class="active"
      >
        Menu
      </router-link>
      <router-link
          v-if="(isAdmin || isManajerial || isKeuangan) && ['/sales', '/menu', '/income-summary', '/revenue-summary'].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/revenue-summary"
          active-class="active"
      >
        Revenue Summary
      </router-link>

      <router-link
          v-if="isAdmin || isManajerial && ['/sales', '/menu', '/income-summary', '/revenue-summary'].some((path) => route.path.includes(path))"
          class="submenu-item"
          to="/income-summary"
          active-class="active"
      >
        Income Summary
      </router-link>
      <router-link to="/menu-performance" class="submenu-item">Menu Performance</router-link>

      <router-link v-if="isAdmin || isKeuangan" to="/invoice-supplier" class="menu-item" active-class="active">
        Invoice Supplier
      </router-link>

      <router-link v-if="isAdmin || isManajerial" to="/financial-performance" class="menu-item" active-class="active">
        <span class="icon"></span>
        <span class="text">Financial Performance</span>
      </router-link>
    </nav>

    <div class="w-full h-0.5 bg-gray-100"/>

    <div class="flex flex-col gap-3 pt-5">
      <!-- Menu Account untuk membuka modal update profil sendiri (semua role) -->
      <div class="menu-item" @click="openAccountModal">Account</div>
      <div class="menu-item logout" @click="logout">Logout</div>
    </div>

    <!-- Modal Update Akun Sendiri (sama seperti sebelumnya) -->
    <div v-if="showAccountModal" class="flex items-center justify-center z-10 fixed inset-0 bg-opacity-45" @click.self="closeAccountModal">
      <div class="flex flex-col p-10 border border-gray-50 bg-white rounded-3xl shadow-xl min-w-96">
        <h2 class="text-xl font-bold text-black">Account Detail</h2>
        <label class="text-sm font-semibold my-2.5">Username</label>
        <input v-model="accountForm.username" type="text" class="w-full p-2.5 border border-gray-100 rounded-xl outline-none"/>
        <label class="text-sm font-semibold my-2.5">Password</label>
        <input
            v-model="accountForm.password"
            type="password"
            placeholder="Kosongkan jika tidak ingin diubah"
            class="w-full p-2.5 border border-gray-100 rounded-xl outline-none"
        />
        <label class="text-sm font-semibold my-2.5">Role</label>
        <p class="w-full p-2.5 border border-gray-100 bg-gray-100 rounded-xl outline-none">{{ capitalizeRole(authStore.user?.role) }}</p>

        <div class="flex justify-end gap-3 mt-6">
          <button class="flex bg-white border border-gray-100 rounded-xl px-6 py-3 font-semibold cursor-pointer" @click="closeAccountModal">Cancel</button>
          <button class="bg-green-500 text-white border border-green-500 rounded-xl px-6 py-3 font-semibold cursor-pointer" @click="handleAccountUpdate" :disabled="submitting">
            {{ submitting ? "Saving..." : "Done" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue';
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
  return role.toUpperCase();
});

// Mapping role ke menu
const isAdmin = computed(() => userRole.value === 'ADMIN');
const isManajerial = computed(() => userRole.value === 'MANAJERIAL');
const isInventori = computed(() => userRole.value === 'INVENTORI');
const isKeuangan = computed(() => userRole.value === 'KEUANGAN');

// Account Modal
const showAccountModal = ref(false);
const submitting = ref(false);
const accountForm = ref({
  username: '',
  password: ''
});
// Aside Close
defineProps({
  show: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['update:show'])

const closeSidebar = () => {
  emit('update:show', false)
}

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
.menu-item {
  @apply text-gray-700 p-3 border border-white rounded-xl text-[15px] cursor-pointer transition-colors
}

.menu-item:hover {
  @apply hover:bg-gray-100
}

.menu-item:active {
  @apply active:text-green-500
}

.active {
  @apply bg-green-50 text-green-500 font-semibold
}

.submenu-item {
  @apply text-gray-700 p-3 ml-5 border border-white rounded-xl text-[15px] cursor-pointer transition-colors
}

.submenu-item:hover {
  @apply hover:bg-gray-100
}

.logout {
  @apply text-red-500
}
</style>