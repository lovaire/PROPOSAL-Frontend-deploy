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
            <th>Address</th>
            <th>PIC</th>
            <th>Contact</th>
            <th>Status</th>
            <th class="action-col">Action</th>
          </tr>
        </thead>

        <tbody>
          <!-- State: Loading -->
          <tr v-if="loading">
            <td colspan="6" class="state-text">Loading data from server...</td>
          </tr>

          <!-- State: Data Ready -->
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
              <button class="delete-btn" @click="openDeleteModal(supplier)">
                Delete
              </button>
            </td>
          </tr>

          <!-- State: Empty (Sudah diperbaiki dari filteredInvoices ke filteredSuppliers) -->
          <tr v-if="!loading && filteredSuppliers.length === 0">
            <td colspan="6" class="state-text">No suppliers found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL INPUT / UPDATE -->
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

        <!-- ERROR BANNER DALAM MODAL -->
        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="done-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? "Processing..." : (isEdit ? "Update Supplier" : "Save Supplier") }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL KONFIRMASI HAPUS -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-box delete-confirm">
        <h2 style="color: #d91f11;">Confirm Delete</h2>
        <p>
          You’re about to delete this supplier. Are you sure you want to delete
          <strong>{{ supplierToDelete?.nama }}</strong>?
        </p>

        <div class="modal-actions delete-actions">
          <button class="cancel-btn" :disabled="submitting" @click="closeDeleteModal">
            Cancel
          </button>
          <button class="confirm-delete-btn" :disabled="submitting" @click="confirmDelete">
            {{ submitting ? "Deleting..." : "Delete" }}
          </button>
        </div>
      </div>
    </div>

    <!-- TOAST NOTIFICATION -->
    <transition name="fade">
      <div v-if="toast && toast.show" :class="['toast-notification', toast.type]">
        <span v-if="toast.type === 'success'">✅</span>
        <span v-else>⚠️</span>
        {{ toast.message }}
      </div>
    </transition>
  </MainLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import { getAllSuppliers, createSupplier, updateSupplierApi, deleteSupplierApi } from "../api/apiSupplier";

// States
const items = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const selectedId = ref(null);
const errorMessage = ref("");

// Notification States
const toast = ref({ show: false, message: "", type: "success" });
const showDeleteModal = ref(false);
const supplierToDelete = ref(null);

const currentSupplier = ref({
  nama: "", alamat: "", pic: "", kontak: "", awalKontrak: "", akhirKontrak: ""
});

// Helper: Show Toast
const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => { toast.value.show = false; }, 3000);
};

// Actions
const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const res = await getAllSuppliers();
    items.value = res.data || [];
  } catch (err) {
    showToast("Gagal memuat data dari server", "error");
  } finally {
    loading.value = false;
  }
};

const getStatus = (akhirKontrak) => {
  if (!akhirKontrak) return "Unknown";
  const today = new Date();
  const expiryDate = new Date(akhirKontrak);
  return today <= expiryDate ? "Active" : "Inactive";
};

const filteredSuppliers = computed(() => {
  // Pastikan items.value adalah array sebelum filter
  const data = Array.isArray(items.value) ? items.value : [];
  return data.filter(s => 
    s.nama?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const openModal = (supplier = null) => {
  errorMessage.value = "";
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
  errorMessage.value = "";
};

const openDeleteModal = (supplier) => {
  supplierToDelete.value = supplier;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  if (submitting.value) return;
  showDeleteModal.value = false;
  supplierToDelete.value = null;
};

const confirmDelete = async () => {
  submitting.value = true;
  try {
    await deleteSupplierApi(supplierToDelete.value.id);
    showToast("Supplier berhasil dihapus!", "success");
    showDeleteModal.value = false;
    await fetchSuppliers();
  } catch (err) {
    showToast("Gagal menghapus data.", "error");
  } finally {
    submitting.value = false;
    supplierToDelete.value = null;
  }
};

const handleSubmit = async () => {
  errorMessage.value = "";
  
  if (!currentSupplier.value.nama || !currentSupplier.value.awalKontrak || !currentSupplier.value.akhirKontrak) {
    errorMessage.value = "Nama dan tanggal kontrak wajib diisi!";
    return;
  }

  if (new Date(currentSupplier.value.akhirKontrak) < new Date(currentSupplier.value.awalKontrak)) {
    errorMessage.value = "Tanggal akhir kontrak tidak boleh lebih kecil dari tanggal awal!";
    return;
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateSupplierApi(selectedId.value, currentSupplier.value);
      showToast("Supplier berhasil diperbarui!", "success");
    } else {
      await createSupplier(currentSupplier.value);
      showToast("Supplier berhasil disimpan!", "success");
    }
    closeModal();
    await fetchSuppliers();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Terjadi kesalahan server";
    showToast(errorMessage.value, "error");
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchSuppliers);
</script>

<style scoped>
/* --- Layout --- */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-weight: 600; cursor: pointer; }

/* --- Table --- */
.table-card { background: #fff; border-radius: 20px; border: 1px solid #f0deda; overflow-x: auto; }
.search-input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; outline: none; }
table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3e5e1; }

/* --- Badges --- */
.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.status-badge.active { background-color: #e6f4ea; color: #1e7e34; border: 1px solid #b7e1cd; }
.status-badge.inactive { background-color: #fce8e6; color: #d93025; border: 1px solid #f98b7f; }
.status-badge.unknown { background-color: #f8f9fa; color: #5f6368; }

/* --- Actions --- */
.action-buttons { display: flex; gap: 10px; }
.update-btn { background: #158f67; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.delete-btn { background: #d91f11; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

/* --- Modals --- */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { width: 420px; background: white; border-radius: 32px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.form-group input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
.done-btn { background: #2e7d32; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.cancel-btn { background: #f5f5f5; color: #666; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; }

/* --- Alerts & Toasts --- */
.error-banner {
  background-color: #fce8e6;
  color: #d93025;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #f98b7f;
  margin-top: 20px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
}

.modal-box.delete-confirm { text-align: left; }
.confirm-delete-btn { 
  background: white; color: #d91f11; border: 2px solid #d91f11; 
  padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 700; 
}
.confirm-delete-btn:hover { background: #fce8e6; }

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
.toast-notification.success { background-color: #158f67; border-left: 5px solid #0d5f44; }
.toast-notification.error { background-color: #d91f11; border-left: 5px solid #a1170d; }

/* --- Transitions --- */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s, transform 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-20px); }

.state-text { text-align: center; padding: 30px; color: #888; }

/* --- Responsive --- */
@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: stretch; gap: 12px; }
  .modal-box { width: calc(100% - 40px); padding: 24px; }
  .action-buttons { flex-direction: column; }
}
</style>