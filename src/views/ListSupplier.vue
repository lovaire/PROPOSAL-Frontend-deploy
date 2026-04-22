<template>
  <MainLayout>
    <div class="page-header">
      <h2>Supplier Management</h2>
      <button class="create-btn" @click="openModal()">+ Create Supplier</button>
    </div>

    <div class="table-card">
      <div style="padding: 20px;">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search supplier by name..."
          class="search-input"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Supplier</th>
            <th>Alamat</th>
            <th>PIC</th>
            <th>Kontak</th>
            <th>Status</th>
            <th class="action-col">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="state-text">Loading data from server...</td>
          </tr>

          <tr v-else v-for="supplier in filteredSuppliers" :key="supplier.id">
            <td>{{ supplier.nama }}</td>
            <td>{{ supplier.alamat }}</td>
            <td>{{ supplier.pic }}</td>
            <td>{{ supplier.kontak }}</td>
            <td>
              <span :class="['status-badge', getStatus(supplier.akhirKontrak).toLowerCase()]">
                {{ getStatus(supplier.akhirKontrak) }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="update-btn" @click="openModal(supplier)">Update</button>
              <button class="delete-btn" @click="handleDelete(supplier.id, supplier.nama)">
                  Delete
              </button>
            </td>
          </tr>

          <tr v-if="!loading && filteredSuppliers.length === 0">
            <td colspan="5" class="state-text">No suppliers found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="showModal" class="modal-overlay">
      <div class="modal-box">
        <h2>{{ isEdit ? 'Update Supplier' : 'Add New Supplier' }}</h2>
        
        <div class="form-group">
          <label>Nama Supplier</label>
          <input v-model="currentSupplier.nama" type="text" placeholder="Masukkan nama PT/CV" />
        </div>

        <div class="form-group">
          <label>Alamat</label>
          <input v-model="currentSupplier.alamat" type="text" placeholder="Masukkan alamat lengkap" />
        </div>

        <div class="form-group">
          <label>PIC</label>
          <input v-model="currentSupplier.pic" type="text" placeholder="Nama penanggung jawab" />
        </div>

        <div class="form-group">
          <label>Call Centre / Kontak</label>
          <input v-model="currentSupplier.kontak" type="text" placeholder="Nomor telepon aktif" />
        </div>

        <div class="form-group">
          <label>Awal Kontrak</label>
          <input v-model="currentSupplier.awalKontrak" type="date" />
        </div>

        <div class="form-group">
          <label>Akhir Kontrak</label>
          <input v-model="currentSupplier.akhirKontrak" type="date" />
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="done-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? "Processing..." : (isEdit ? "Update Supplier" : "Save Supplier") }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import { getAllSuppliers, createSupplier, updateSupplierApi } from "../api/apiSupplier";
import { deleteSupplierApi } from "../api/apiSupplier";

const items = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const selectedId = ref(null);

const currentSupplier = ref({
  nama: "",
  alamat: "",
  pic: "",
  kontak: "",
  awalKontrak: "", 
  akhirKontrak: "" 
});

const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const res = await getAllSuppliers();
    items.value = res.data || [];
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    loading.value = false;
  }
};

const getStatus = (akhirKontrak) => {
  if (!akhirKontrak) return "Unknown";
  
  const today = new Date();
  const expiryDate = new Date(akhirKontrak);
  
  // Jika tanggal hari ini belum melewati tanggal berakhir
  return today <= expiryDate ? "Active" : "Inactive";
};

const filteredSuppliers = computed(() => {
  return items.value.filter(s => 
    s.nama?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const openModal = (supplier = null) => {
  if (supplier) {
    isEdit.value = true;
    selectedId.value = supplier.id;
    currentSupplier.value = { ...supplier };
  } else {
    isEdit.value = false;
    selectedId.value = null;
    currentSupplier.value = { nama: "", alamat: "", pic: "", kontak: "", awalKontrak: "", akhirKontrak: "" };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const handleSubmit = async () => {
  if (!currentSupplier.value.nama || !currentSupplier.value.awalKontrak || !currentSupplier.value.akhirKontrak) {
    return alert("Nama dan tanggal kontrak wajib diisi!");
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateSupplierApi(selectedId.value, currentSupplier.value);
      alert("Supplier berhasil diperbarui!");
    } else {
      await createSupplier(currentSupplier.value);
      alert("Supplier berhasil disimpan!");
    }
    closeModal();
    await fetchSuppliers();
  } catch (err) {
    alert(err.response?.data?.message || "Terjadi kesalahan server");
  } finally {
    submitting.value = false;
  }
};
const handleDelete = async (id, nama) => {
  if (confirm(`Apakah Anda yakin ingin menghapus ${nama}?`)) {
    try {
      await deleteSupplierApi(id);
      alert("Supplier berhasil dihapus!");
      await fetchSuppliers(); // Refresh tabel
    } catch (err) {
      alert("Gagal menghapus data.");
    }
  }
};

onMounted(fetchSuppliers);
</script>

<style scoped>

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.status-badge.active {
  background-color: #e6f4ea;
  color: #1e7e34;
  border: 1px solid #b7e1cd;
}

.status-badge.inactive {
  background-color: #fce8e6;
  color: #d93025;
  border: 1px solid #f98b7f;
}

.status-badge.unknown {
  background-color: #f8f9fa;
  color: #5f6368;
}

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-weight: 600; cursor: pointer; }

.table-card { background: #fff; border-radius: 20px; border: 1px solid #f0deda; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.search-input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; outline: none; }
table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3e5e1; }

.action-buttons { display: flex; gap: 10px; }
.update-btn { background: #158f67; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.delete-btn { background: #d91f11; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.state-text { text-align: center; padding: 30px; color: #888; }

.modal-overlay { 
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); 
  display: flex; justify-content: center; align-items: center; z-index: 999; 
}
.modal-box { 
  width: 420px; background: white; border-radius: 32px; padding: 36px; 
  box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
}
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.form-group input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
.done-btn { background: #2e7d32; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.cancel-btn { background: #f5f5f5; color: #666; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; }
/* Tambahan untuk responsifitas */
.table-card {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-box {
  max-width: 100%;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .create-btn {
    width: 100%;
    text-align: center;
  }
  th, td {
    padding: 12px 10px;
  }
  .action-buttons {
    flex-direction: column;
    gap: 8px;
  }
  .action-buttons button {
    width: 100%;
  }
  .modal-box {
    width: calc(100% - 40px);
    max-width: 400px;
    padding: 24px;
    margin: 20px;
  }
}
</style>