<template>
  <MainLayout>
    <div class="page-header">
      <h2>Invoice Supplier</h2>
      <button class="create-btn" @click="openModal()">+ Create Invoice</button>
    </div>

    <div class="table-card">
      <div style="padding: 20px;">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari berdasarkan supplier..."
          class="search-input"
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>Order Name</th>
            <th>Supplier</th>
            <th>Order Date</th>
            <th>Order Due</th>
            <th>Subtotal</th>
            <th>PPN Nominal</th>
            <th>Total Amount</th>
            <th>Status</th>
            <th class="action-col">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="9" class="state-text">Loading data from server...</td>
          </tr>

          <tr v-else v-for="invoice in filteredInvoices" :key="invoice.id">
            <td>{{ invoice.orderName }}</td>
            <td>{{ invoice.supplierName || '-' }}</td>
            <td>{{ formatDate(invoice.orderDate) }}</td>
            <td>{{ formatDate(invoice.dueDate) }}</td>
            <td>Rp {{ formatNumber(invoice.subtotal) }}</td>
            <td>Rp {{ formatNumber(invoice.taxAmount) }}</td>
            <td class="bold-text">Rp {{ formatNumber(invoice.amount) }}</td>
            <td>
              <span :class="['status-badge', invoice.status?.toLowerCase()]">
                {{ invoice.status }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="update-btn" @click="openModal(invoice)">Update</button>
              <button class="delete-btn" @click="openDeleteModal(invoice)">
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!loading && filteredInvoices.length === 0">
            <td colspan="9" class="state-text">No invoices found.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-show="showModal" class="modal-overlay">
      <div class="modal-box large">
        <h2>{{ isEdit ? 'Update Invoice' : 'Add New Invoice' }}</h2>
        
        <div class="form-grid">
          <div class="form-group full-width">
            <label>Order Name</label>
            <input v-model="currentInvoice.orderName" type="text" placeholder="Masukkan nama order" />
          </div>

          <div class="form-group full-width">
            <label>Supplier</label>
            <select v-model="currentInvoice.supplierId" class="select-input">
              <option value="" disabled>Pilih Supplier</option>
              <option v-for="s in activeSuppliers" :key="s.id" :value="s.id">
                {{ s.nama }}
              </option>
            </select>
          </div>

          <div class="form-group full-width">
            <label>Subtotal (Nominal sebelum Pajak)</label>
            <input v-model.number="currentInvoice.subtotal" type="number" placeholder="0" />
          </div>

          <div class="form-group">
            <label>Persentase PPN</label>
            <select v-model.number="currentInvoice.ppnPercentage" class="select-input">
              <option :value="0">0% (Tidak ada pajak)</option>
              <option :value="10">10%</option>
              <option :value="11">11%</option>
              <option :value="12">12%</option>
              <option :value="13">13%</option>
            </select>
          </div>

          <div class="form-group">
            <label>Nominal PPN (Otomatis)</label>
            <input 
              :value="'Rp ' + formatNumber(currentInvoice.taxAmount)" 
              type="text" 
              disabled 
              class="readonly-input"
            />
          </div>

          <div class="form-group full-width">
            <label>Total yang Harus Dibayar</label>
            <input 
              :value="'Rp ' + formatNumber(currentInvoice.amount)" 
              type="text" 
              disabled 
              class="readonly-input total-highlight"
            />
          </div>

          <div class="form-group">
            <label>Order Date</label>
            <input v-model="currentInvoice.orderDate" type="date" />
          </div>

          <div class="form-group">
            <label>Order Due (Due Date)</label>
            <input v-model="currentInvoice.dueDate" type="date" />
          </div>

          <div class="form-group full-width">
            <label>Status Pembayaran</label>
            <div class="radio-group">
              <label><input type="radio" v-model="currentInvoice.status" value="Unpaid"> Unpaid</label>
              <label><input type="radio" v-model="currentInvoice.status" value="Paid"> Paid</label>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="error-banner">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="closeModal">Cancel</button>
          <button class="done-btn" @click="handleSubmit" :disabled="submitting">
            {{ submitting ? "Processing..." : (isEdit ? "Update Invoice" : "Save Invoice") }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-box delete-confirm">
        <h2 style="color: #d91f11;">Confirm Delete</h2>
        <p>
          You’re about to delete this item. Are you sure you want to delete
          <strong>{{ invoiceToDelete?.orderName }}</strong>?
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
import { ref, computed, onMounted, watch } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import { getAllInvoices, createInvoice, updateInvoiceApi, deleteInvoiceApi } from "../api/invoiceSupplierApi";
import { getAllSuppliers } from "../api/apiSupplier";

const items = ref([]);
const suppliers = ref([]);
const searchQuery = ref("");
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const selectedId = ref(null);
const errorMessage = ref("");

const toast = ref({
  show: false,
  message: "",
  type: "success" 
});

const showDeleteModal = ref(false);
const invoiceToDelete = ref(null);

const currentInvoice = ref({
  orderName: "",
  supplierId: "",
  orderDate: "",
  dueDate: "",
  subtotal: 0,
  ppnPercentage: 0, // State baru untuk menyimpan pilihan Dropdown PPN
  taxAmount: 0,
  amount: 0,
  status: "Unpaid"
});

// LOGIKA KALKULASI PAJAK DINAMIS (Memantau perubahan Subtotal ATAU Dropdown PPN)
watch([() => currentInvoice.value.subtotal, () => currentInvoice.value.ppnPercentage], ([newSubtotal, newPpn]) => {
  const sub = parseFloat(newSubtotal) || 0;
  const ppn = parseFloat(newPpn) || 0;
  
  currentInvoice.value.taxAmount = sub * (ppn / 100); 
  currentInvoice.value.amount = sub + currentInvoice.value.taxAmount; 
});

const showToast = (msg, type = "success") => {
  toast.value = { show: true, message: msg, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000); 
};

const fetchData = async () => {
  loading.value = true;
  try {
    const [invRes, supRes] = await Promise.all([
      getAllInvoices(),
      getAllSuppliers()
    ]);
    items.value = invRes.data || [];
    suppliers.value = supRes.data || [];
  } catch (err) {
    console.error("Fetch error:", err);
    showToast("Gagal memuat data dari server", "error");
  } finally {
    loading.value = false;
  }
};

const filteredInvoices = computed(() => {
  return items.value.filter(inv => 
    inv.orderName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    inv.supplierName?.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const activeSuppliers = computed(() => {
  return suppliers.value.filter(s => {
    if (!s.akhirKontrak) return false;
    const today = new Date();
    const expiryDate = new Date(s.akhirKontrak);
    return today <= expiryDate; 
  });
});

const formatDate = (date) => date ? new Date(date).toLocaleDateString('id-ID') : '-';
const formatNumber = (num) => new Intl.NumberFormat('id-ID').format(num || 0);

const openModal = (invoice = null) => {
  errorMessage.value = ""; 
  if (invoice) {
    isEdit.value = true;
    selectedId.value = invoice.id;
    
    // Kalkulasi balik untuk mencari tahu PPN berapa persen yang dipakai dulu
    let prevPpn = 0;
    if (invoice.subtotal && invoice.subtotal > 0 && invoice.taxAmount) {
      prevPpn = Math.round((invoice.taxAmount / invoice.subtotal) * 100);
    }

    currentInvoice.value = { 
      ...invoice,
      supplierId: invoice.supplier?.id,
      ppnPercentage: prevPpn // Otomatis mengisi dropdown saat edit
    };
  } else {
    isEdit.value = false;
    selectedId.value = null;
    currentInvoice.value = { 
      orderName: "", 
      supplierId: "", 
      orderDate: "", 
      dueDate: "", 
      subtotal: 0, 
      ppnPercentage: 0, // Default 0% saat tambah baru
      taxAmount: 0, 
      amount: 0, 
      status: "Unpaid" 
    };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  errorMessage.value = "";
};

const openDeleteModal = (invoice) => {
  invoiceToDelete.value = invoice;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  if (submitting.value) return;
  showDeleteModal.value = false;
  invoiceToDelete.value = null;
};

const confirmDelete = async () => {
  if (!invoiceToDelete.value) return;
  
  submitting.value = true;
  try {
    await deleteInvoiceApi(invoiceToDelete.value.id);
    showToast("Invoice berhasil dihapus!", "success"); 
    showDeleteModal.value = false;
    await fetchData();
  } catch (err) {
    showToast("Gagal menghapus data.", "error");  
  } finally {
    submitting.value = false;
    invoiceToDelete.value = null;
  }
};

const handleSubmit = async () => {
  errorMessage.value = ""; 
  
  if (!currentInvoice.value.orderName || !currentInvoice.value.supplierId) {
    errorMessage.value = "Order name dan Supplier wajib diisi!";
    return;
  }

  if (!currentInvoice.value.subtotal || currentInvoice.value.subtotal <= 0) {
    errorMessage.value = "Subtotal harus lebih besar dari 0!";
    showToast("Nominal tidak boleh 0", "error");
    return; 
  }

  if (!currentInvoice.value.orderDate || !currentInvoice.value.dueDate) {
    showToast("Tanggal Order dan Tanggal Jatuh Tempo wajib diisi!", "error");
    return; 
  }

  if (currentInvoice.value.orderDate && currentInvoice.value.dueDate) {
    const start = new Date(currentInvoice.value.orderDate);
    const end = new Date(currentInvoice.value.dueDate);
    
    if (end < start) {
      errorMessage.value = "Order Due (Jatuh Tempo) tidak boleh lebih kecil dari Order Date!";
      return; 
    }
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateInvoiceApi(selectedId.value, currentInvoice.value);
      showToast("Invoice berhasil diperbarui!", "success");  
    } else {
      await createInvoice(currentInvoice.value);
      showToast("Invoice berhasil disimpan!", "success"); 
    }
    closeModal();
    await fetchData();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "Terjadi kesalahan server";
    showToast(errorMessage.value, "error"); 
  } finally {
    submitting.value = false;
  }
};

onMounted(fetchData);
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-weight: 600; cursor: pointer; }

.table-card { background: #fff; border-radius: 20px; border: 1px solid #f0deda; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.search-input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; outline: none; }

table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3e5e1; }

.bold-text { font-weight: 700; color: #333; }

.status-badge { 
  padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; 
  text-transform: uppercase; border: 1px solid transparent; 
}
.status-badge.paid { background-color: #e6f4ea; color: #1e7e34; border-color: #b7e1cd; }
.status-badge.unpaid { background-color: #fff4e5; color: #b76e00; border-color: #ffe1b3; }
.status-badge.overdue { background-color: #fce8e6; color: #d93025; border-color: #f98b7f; }

.action-buttons { display: flex; gap: 10px; }
.update-btn { background: #158f67; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.delete-btn { background: #d91f11; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-box { background: white; border-radius: 32px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
.modal-box.large { width: 550px; }
.modal-box.delete-confirm { width: 420px; text-align: left; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.full-width { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.form-group input, .select-input { width: 100%; padding: 12px; border: 1px solid #e8e8e8; border-radius: 10px; }

/* Styling untuk Input Readonly */
.readonly-input {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.total-highlight {
  font-weight: bold;
  color: #d83b2d;
  background-color: #fce8e6;
  border-color: #f98b7f;
}

.radio-group { display: flex; gap: 15px; margin-top: 5px; }
.radio-group label { font-weight: 400; display: flex; align-items: center; gap: 5px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
.done-btn { background: #2e7d32; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.cancel-btn { background: #f5f5f5; color: #666; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; }

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

.confirm-delete-btn { 
  background: white; color: #d91f11; border: 2px solid #d91f11; 
  padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 700; 
}
.confirm-delete-btn:hover { background: #fce8e6; }
.confirm-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.state-text { text-align: center; padding: 30px; color: #888; }

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

/* Responsive adjustments */
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
  .table-card {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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
  .modal-box.large,
  .modal-box.delete-confirm {
    width: calc(100% - 40px);
    padding: 24px;
    margin: 20px;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .full-width {
    grid-column: span 1;
  }
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  .modal-actions button {
    width: 100%;
  }
  .radio-group {
    flex-direction: column;
    gap: 8px;
  }
  .toast-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
  }
}
</style>