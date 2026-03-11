<template>
  <MainLayout>
    <div class="page-header">
      <h2>Master Barang</h2>
      <button class="create-btn" @click="openAddModal()">+ Tambah Barang</button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th>Unit</th>
            <th>Safety Stock</th>
            <th>Status</th>
            <th class="action-col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="state-text">Memuat data dari server...</td>
          </tr>

          <tr v-else v-for="item in items" :key="item.idItem">
            <td>{{ item.idItem.substring(0, 8) }}...</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.unit }}</td>
            <td>{{ item.safetyStock }}</td>
            <td>
              <span :class="['status-badge', item.isActive ? 'active' : 'inactive']">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="update-btn" @click="openEditModal(item)">Update</button>
              <button class="delete-btn" @click="handleDelete(item.idItem, item.name)">
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!loading && items.length === 0">
            <td colspan="7" class="state-text">Tidak ada data barang ditemukan.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <h2>{{ isEdit ? 'Update Data Barang' : 'Tambah Barang Baru' }}</h2>
        
        <div class="form-group">
          <label>Nama Produk</label>
          <input v-model="currentItem.name" type="text" placeholder="Masukkan nama barang" />
        </div>

        <div class="form-group">
          <label>Kategori</label>
          <select v-model="currentItem.category">
            <option value="" disabled>Pilih Kategori</option>
            <option value="Amenities">Amenities</option>
            <option value="Konsumsi">Konsumsi</option>
            <option value="Peralatan">Peralatan</option>
          </select>
        </div>

        <div class="form-group">
          <label>Safety Stock</label>
          <input v-model="currentItem.safetyStock" type="number" />
        </div>

        <div class="form-group">
          <label>Unit</label>
          <select v-model="currentItem.unit">
            <option value="" disabled>Pilih Unit</option>
            <option value="Pcs">Pcs</option>
            <option value="Box">Box</option>
            <option value="Galon">Galon</option>
          </select>
        </div>

        <div class="form-group" v-if="isEdit">
          <label>Status</label>
          <select v-model="currentItem.isActive">
            <option :value="true">Active</option>
            <option :value="false">Inactive</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="done-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? "Processing..." : (isEdit ? "Update Barang" : "Simpan Barang") }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import MainLayout from "../layouts/MainLayout.vue"; // Penting: Sidebar dipanggil di sini 
import { getAllItems, addItem, updateItem, deleteItem } from "@/api/itemApi";

// State Management: Mengikuti pola ref milik tim 
const items = ref([]);
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const selectedId = ref(null);

const currentItem = ref({
  name: "",
  category: "",
  safetyStock: 0,
  unit: "",
  isActive: true
});

// Fungsi Fetch Data
const fetchItems = async () => {
  loading.value = true;
  try {
    const res = await getAllItems();
    // Menyesuaikan jika backend membungkus data dalam field 'data'
    items.value = res.data.data || res.data || [];
  } catch (err) {
    console.error("Gagal mengambil data barang:", err);
  } finally {
    loading.value = false;
  }
};

// Logika Modal
const openAddModal = () => {
  isEdit.value = false;
  currentItem.value = { name: "", category: "", safetyStock: 0, unit: "", isActive: true };
  showModal.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  selectedId.value = item.idItem;
  currentItem.value = { ...item };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

// CRUD Handler
const handleSubmit = async () => {
  if (!currentItem.value.name || !currentItem.value.category) {
    return alert("Nama dan Kategori wajib diisi!");
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateItem(currentItem.value);
      alert("Barang berhasil diperbarui!");
    } else {
      await addItem(currentItem.value);
      alert("Barang berhasil disimpan!");
    }
    closeModal();
    await fetchItems();
  } catch (err) {
    alert("Terjadi kesalahan pada server");
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (id, nama) => {
  if (confirm(`Apakah Anda yakin ingin menghapus ${nama}?`)) {
    try {
      await deleteItem(id);
      alert("Barang berhasil dihapus!");
      await fetchItems();
    } catch (err) {
      alert("Gagal menghapus data.");
    }
  }
};

onMounted(fetchItems);
</script>

<style scoped>
/* Style disamakan persis dengan ListSupplier.vue  [cite: 321-330] */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-weight: 600; cursor: pointer; }

.table-card { background: #fff; border-radius: 20px; border: 1px solid #f0deda; overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3e5e1; }

.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.status-badge.active { background-color: #e6f4ea; color: #1e7e34; border: 1px solid #b7e1cd; }
.status-badge.inactive { background-color: #fce8e6; color: #d93025; border: 1px solid #f98b7f; }

.action-buttons { display: flex; gap: 10px; }
.update-btn { background: #158f67; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.delete-btn { background: #d91f11; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.state-text { text-align: center; padding: 30px; color: #888; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { width: 420px; background: white; border-radius: 32px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.form-group input, .form-group select { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
.done-btn { background: #2e7d32; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.cancel-btn { background: #f5f5f5; color: #666; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; }
</style>