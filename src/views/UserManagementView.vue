<template>
  <MainLayout>
    <div class="page-header">
      <div></div>
      <button class="create-btn" @click="openRegisterModal()" v-if="isAdmin">
        <span>+</span>
        <span class="hidden sm:inline"> Create Account</span>
      </button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="hidden sm:inline">ID</th>
            <th>Username</th>
            <th>Role</th>
            <th class="action-col">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="state-text">Loading...</td>
          </tr>

          <tr v-else-if="users.length === 0">
            <td colspan="4" class="state-text">Belum ada user.</td>
          </tr>

          <tr v-else v-for="user in users" :key="user.id">
            <td class="hidden sm:inline">{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ capitalizeRole(user.role) }}</td>
            <td class="action-buttons">
              <button
                v-if="isAdmin || user.id === currentUserId"
                class="update-btn"
                @click="openUpdateModal(user)"
              >
                Update
              </button>
              <button
                v-if="isAdmin"
                class="delete-btn"
                @click="openDeleteModal(user)"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Update -->
    <div v-if="showUpdateModal" class="modal-overlay">
      <div class="modal-box">
        <h2>User Detail</h2>

        <label>Username</label>
        <input v-model="editForm.username" type="text" />

        <label>Password</label>
        <input
          v-model="editForm.password"
          type="password"
          placeholder="Kosongkan jika tidak ingin diubah"
        />

        <label>Role</label>
        <select v-if="isAdmin" v-model="editForm.role">
          <option value="ADMIN">Admin</option>
          <option value="MANAJERIAL">Manajerial</option>
          <option value="KEUANGAN">Keuangan</option>
          <option value="INVENTORI">Inventori</option>
        </select>
        <p v-else class="role-text">{{ capitalizeRole(editForm.role) }}</p>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeUpdateModal">Cancel</button>
          <button class="done-btn" @click="handleUpdate" :disabled="submitting">
            {{ submitting ? "Saving..." : "Done" }}
          </button>
        </div>
      </div>
    </div>

    <!--Modal Register-->
    <div v-if="showRegisterModal" class="modal-overlay">
      <div class="modal-box">
        <h2>Create User</h2>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <form @submit.prevent="handleRegister" class="modal-form">
          <p v-if="formData.email && !isEmailValid" class="error-text">
            Format email tidak valid (contoh: user@mail.com)
          </p>
          <label for="email" class="modal-label">Email</label>
          <input type="email" v-model="formData.email" class="modal-input" :class="{ 'modal-error': formData.email && !isEmailValid }" required/>

          <label for="username" class="modal-label">Username</label>
          <input type="text" v-model="formData.username" class="modal-input" required/>

          <label for="password" class="modal-label">Password</label>
          <input type="password" v-model="formData.password" class="modal-input" required/>

          <label for="role" class="modal-label">Role</label>
          <select v-model="formData.role" class="modal-input" required>
            <option value="" disabled selected>Select a Role</option>

            <option value="ADMIN">Admin</option>
            <option value="MANAJERIAL">Manajerial</option>
            <option value="KEUANGAN">Keuangan</option>
            <option value="INVENTORI">Inventori</option>
          </select>

          <div class="modal-actions single-action">
            <button class="cancel-btn" @click="closeRegisterModal">Cancel</button>
            <button :class="isEmailValid ? 'done-btn' : 'nonactive-btn'" :disabled="!isEmailValid" type="submit">Add</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Delete -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-box delete-box">
        <h2>Confirm Delete</h2>
        <p>
          You're about to delete the item. Are you sure you want to delete
          <strong>{{ selectedUser?.username }}</strong
          >?
        </p>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeDeleteModal">Cancel</button>
          <button class="confirm-delete-btn" @click="handleDelete" :disabled="submitting">
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>
    <!-- Toast Notification -->
    <Transition name="fade">
      <div v-if="toast.show" :class="['toast-notification', toast.type]">
        <span>{{ toast.type === 'success' ? '✅' : '⚠️' }}</span>
        {{ toast.message }}
      </div>
    </Transition>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useAuthStore } from "@/stores/profile";
import MainLayout from "../layouts/MainLayout.vue";
import { getAllUsers, updateUser, deleteUser } from "@/api/userApi";

const authStore = useAuthStore();

const users = ref([]);
const loading = ref(false);
const submitting = ref(false);

const showUpdateModal = ref(false);
const showDeleteModal = ref(false);
const showRegisterModal = ref(false);
const selectedUser = ref(null);

const currentUserId = computed(() => authStore.user?.id || '');
const currentUserRole = computed(() => authStore.user?.role || '');
const isAdmin = computed(() => currentUserRole.value === 'ADMIN');

const editForm = ref({
  username: "",
  password: "",
  role: "ADMIN",
});

// Toast notification state
const toast = ref({
  show: false,
  message: '',
  type: 'success'
});

const showToast = (message, type = 'success') => {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
};

const fetchUsers = async () => {
  loading.value = true;
  try {
    const response = await getAllUsers();
    console.log('Response users:', response);
    users.value = response.data.data || [];
  } catch (error) {
    console.error("Gagal mengambil data user:", error);
    showToast("Gagal mengambil data user", "error");
  } finally {
    loading.value = false;
  }
};

const capitalizeRole = (role) => {
  if (!role) return "-";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

const openUpdateModal = (user) => {
  selectedUser.value = user;
  editForm.value = {
    username: user.username || "",
    password: "",
    role: user.role || "ADMIN",
  };
  showUpdateModal.value = true;
};

const closeUpdateModal = () => {
  showUpdateModal.value = false;
  selectedUser.value = null;
  editForm.value = {
    username: "",
    password: "",
    role: "ADMIN",
  };
};

const handleUpdate = async () => {
  if (!selectedUser.value) return;

  submitting.value = true;
  try {
    const payload = {
      username: editForm.value.username,
    };
    if (editForm.value.password) {
      payload.password = editForm.value.password;
    }
    if (isAdmin.value && editForm.value.role && editForm.value.role.trim() !== '') {
      payload.role = editForm.value.role;
    }

    await updateUser(selectedUser.value.id, payload);
    closeUpdateModal();
    await fetchUsers();
    showToast("User berhasil diupdate", "success");
  } catch (error) {
    console.error("Gagal update user:", error);
    showToast(error?.response?.data?.message || "Gagal update user", "error");
  } finally {
    submitting.value = false;
  }
};

const openDeleteModal = (user) => {
  selectedUser.value = user;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedUser.value = null;
};

const handleDelete = async () => {
  if (!selectedUser.value) return;

  submitting.value = true;
  try {
    await deleteUser(selectedUser.value.id);
    closeDeleteModal();
    await fetchUsers();
    showToast("User berhasil dihapus", "success");
  } catch (error) {
    console.error("Gagal delete user:", error);
    showToast(error?.response?.data?.message || "Gagal delete user", "error");
  } finally {
    submitting.value = false;
  }
};

const openRegisterModal = () => {
  showRegisterModal.value = true;
}

const closeRegisterModal = () => {
  showRegisterModal.value = false;
}

const formData = ref({
  email: '',
  username: '',
  password: '',
  role: ''
});

const errorMessage = ref('');

const handleRegister = async () => {
  try {
    await authStore.register(formData.value);
    showToast('User berhasil dibuat', 'success');
    await fetchUsers();
  } catch (e) {
    errorMessage.value = e.message;
    console.error(e);
  }
};

const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(formData.value.email);
});

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
/* Masukkan semua style dari file sebelumnya */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.create-btn {
  background-color: #dff0e7;
  color: #3a6f5c;
  border: none;
  border-radius: 12px;
  padding: 14px 22px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}
.table-card {
  background: #fff;
  border-radius: 20px;
  overflow: auto;
  border: 1px solid #f0deda;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead {
  background-color: #f4dfda;
}
th {
  text-align: left;
  padding: 18px 20px;
  font-size: 15px;
  color: #333;
}
td {
  padding: 18px 20px;
  border-top: 1px solid #f3e5e1;
  color: #444;
  font-size: 14px;
}
.action-col {
  width: 220px;
}
.action-buttons {
  display: flex;
  gap: 12px;
}
.update-btn {
  background-color: #158f67;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.delete-btn {
  background-color: #d91f11;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.state-text {
  text-align: center;
  color: #777;
  padding: 30px;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
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
.modal-box input,
.modal-box select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  outline: none;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.modal-error {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  outline: 1px red;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
}
.modal-actions.single {
  justify-content: flex-end;
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
.nonactive-btn {
  background: lightgrey;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 26px;
  font-weight: 600;
  cursor: pointer;
}
.delete-box {
  width: 460px;
}
.delete-box p {
  color: #333;
  font-size: 15px;
  line-height: 1.5;
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
.confirm-delete-btn {
  background: white;
  border: 2px solid #3aa17e;
  color: #2c8a6a;
  border-radius: 10px;
  padding: 12px 28px;
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

.error-text {
  color: red;
  font-size: 12px;
}

.toast-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 16px 24px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.toast-notification.success {
  background-color: #158f67;
  border-left: 5px solid #0d5f44;
}
.toast-notification.error {
  background-color: #d91f11;
  border-left: 5px solid #a1170d;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s, transform 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>