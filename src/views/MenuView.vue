<template>
  <MainLayout>
    <div class="page-header">
      <div></div>
      <button class="create-btn" @click="openAddModal">+ Tambah Menu</button>
    </div>

    <div class="table-card">
      <table class="min-w-full bg-white border">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama</th>
            <th>Harga</th>
            <th>Kategori</th>
            <th>Status</th>
            <th class="action-col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="state-text">Loading...</td>
          </tr>
          <tr v-else-if="products.length === 0">
            <td colspan="6" class="state-text">Belum ada menu.</td>
          </tr>
          <tr v-else v-for="prod in products" :key="prod.id">
            <td>{{ prod.id }}</td>
            <td>{{ prod.name }}</td>
            <td>{{ formatRupiah(prod.price) }}</td>
            <td>{{ prod.category }}</td>
            <td>
              <span :class="prod.isActive ? 'status-active' : 'status-inactive'">
                {{ prod.isActive ? 'Aktif' : 'Nonaktif' }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="update-btn" @click="openEditModal(prod)">Edit</button>
              <button class="delete-btn" @click="toggleStatus(prod)">{{ prod.isActive ? 'Nonaktifkan' : 'Aktifkan' }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Tambah/Edit -->
    <div v-if="showModal" class="modal-overlay">
      <form @submit.prevent="submitForm" class="modal-box">
        <h2>{{ isEdit ? 'Edit Menu' : 'Tambah Menu' }}</h2>

        <label>Nama</label>
        <input
            type="text"
            v-model="form.name"
            placeholder="Masukkan nama menu"
            required
        />

        <label>Harga</label>
        <input
            type="number"
            v-model="form.price"
            placeholder="0"
            min="1"
            required
        />

        <label>Kategori</label>
        <select v-model="form.category" required>
          <option value="" disabled>Pilih Kategori</option>
          <option value="MAIN_COURSE">MAIN_COURSE</option>
          <option value="APPETIZER">APPETIZER</option>
          <option value="DESSERT">DESSERT</option>
          <option value="BEVERAGE">BEVERAGE</option>
          <option value="SNACK">SNACK</option>
        </select>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeModal">Batal</button>
          <button type="submit" class="confirm-delete-btn">Simpan</button>
        </div>
      </form>
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
import { ref, onMounted } from 'vue';
import { getAllProducts, createProduct, updateProduct, updateProductStatus } from '@/api/sales';
import MainLayout from '@/layouts/MainLayout.vue';

const products = ref([]);
const loading = ref(true);
const showModal = ref(false);
const isEdit = ref(false);
const form = ref({ name: '', price: 0, category: 'MAIN_COURSE' });
const editingId = ref(null);

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

const fetchProducts = async () => {
  loading.value = true;
  try {
    const res = await getAllProducts();
    products.value = res.data.data;
  } catch (error) {
    console.error(error);
    showToast('Gagal memuat data menu', 'error');
  } finally {
    loading.value = false;
  }
};

const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const openAddModal = () => {
  isEdit.value = false;
  form.value = { name: '', price: 0, category: 'MAIN_COURSE' };
  showModal.value = true;
};

const openEditModal = (prod) => {
  isEdit.value = true;
  editingId.value = prod.id;
  form.value = {
    name: prod.name,
    price: prod.price,
    category: prod.category
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const submitForm = async () => {
  try {
    if (isEdit.value) {
      await updateProduct({ id: editingId.value, ...form.value });
      showToast('Menu berhasil diupdate', 'success');
    } else {
      await createProduct(form.value);
      showToast('Menu berhasil ditambahkan', 'success');
    }
    closeModal();
    await fetchProducts();
  } catch (error) {
    console.error(error);
    showToast(error.response?.data?.message || 'Gagal menyimpan menu', 'error');
  }
};

const toggleStatus = async (prod) => {
  try {
    await updateProductStatus(prod.id);
    showToast(`Menu berhasil ${prod.isActive ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
    await fetchProducts();
  } catch (error) {
    console.error(error);
    showToast('Gagal mengubah status menu', 'error');
  }
};

onMounted(fetchProducts);
</script>

<style scoped>
/* style yang sudah ada, termasuk toast style */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-size: 16px; font-weight: 600; cursor: pointer; }
.table-card { background: #fff; border-radius: 20px; overflow: auto; border: 1px solid #f0deda; }
table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { text-align: left; padding: 18px 20px; font-size: 14px; color: #333; }
td { border-top: 1px solid #f3e5e1; color: #444; }
.action-col { width: 220px; }
.action-buttons { display: flex; gap: 12px; }
.update-btn { background-color: #158f67; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.delete-btn { background-color: #d91f11; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; }
.state-text { text-align: center; color: #777; padding: 30px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { width: 420px; background: white; border-radius: 32px; padding: 36px 42px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
.modal-box h2 { margin: 0 0 24px; font-size: 22px; }
.modal-box label { display: block; margin: 14px 0 8px; font-weight: 600; }
.modal-box input, .modal-box select { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 28px; }
.cancel-btn { background: white; border: 1px solid #e5e5e5; color: #3a6f5c; border-radius: 10px; padding: 12px 28px; }
.confirm-delete-btn { background: white; border: 2px solid #3aa17e; color: #2c8a6a; border-radius: 10px; padding: 12px 28px; cursor: pointer; }
.status-active { color: #2e7d32; font-weight: bold; }
.status-inactive { color: #d32f2f; font-weight: bold; }

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