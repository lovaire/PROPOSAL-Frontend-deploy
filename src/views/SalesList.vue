<template>
  <MainLayout>
    <div class="page-header">
      <div></div>
      <button class="create-btn" @click="$router.push('/sales/add')" v-if="isAdmin">+ Tambah Penjualan</button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Tanggal</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Status</th>
            <th class="action-col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="state-text">Loading...</td>
          </tr>
          <tr v-else-if="sales.length === 0">
            <td colspan="6" class="state-text">Belum ada penjualan.</td>
           </tr>
          <tr v-else v-for="sale in sales" :key="sale.id">
            <td>{{ sale.id }}</td>
            <td>{{ formatDate(sale.tanggal) }}</td>
            <td>{{ sale.customer }}</td>
            <td>{{ formatRupiah(sale.totalAmount) }}</td>
            <td>{{ sale.status }}</td>
            <td class="action-buttons">
              <router-link :to="`/sales/${sale.id}`" class="update-btn">Detail</router-link>
              <router-link :to="`/sales/${sale.id}/edit`" class="update-btn">Edit</router-link>
              <button @click="openInvoiceModal(sale)" class="delete-btn">Buat Invoice</button>
            </td>
           </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Invoice -->
    <div v-if="showInvoiceModal" class="modal-overlay">
      <div class="modal-box">
        <h2>Buat Invoice</h2>
        <label>Tanggal Invoice</label>
        <input type="datetime-local" v-model="invoiceData.invoiceDate" />
        <label>Metode Pembayaran</label>
        <select v-model="invoiceData.paymentMethod">
          <option value="CASH">Cash</option>
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
          <option value="QRIS">QRIS</option>
          <option value="TRANSFER">Transfer</option>
        </select>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeInvoiceModal">Batal</button>
          <button class="confirm-delete-btn" @click="submitInvoice">Simpan</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getAllSales, createInvoice } from '@/api/sales';
import MainLayout from '@/layouts/MainLayout.vue';
import { useAuthStore } from '@/stores/profile';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'admin');

const sales = ref([]);
const loading = ref(true);
const showInvoiceModal = ref(false);
const invoiceData = ref({
  salesId: '',
  invoiceDate: new Date().toISOString().slice(0, 16),
  paymentMethod: 'cash'
});

const fetchSales = async () => {
  try {
    const response = await getAllSales();
    sales.value = response.data.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString();
const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const openInvoiceModal = (sale) => {
  invoiceData.value.salesId = sale.id;
  showInvoiceModal.value = true;
};

const closeInvoiceModal = () => {
  showInvoiceModal.value = false;
  invoiceData.value = {
    salesId: '',
    invoiceDate: new Date().toISOString().slice(0, 16),
    paymentMethod: 'cash'
  };
};

const submitInvoice = async () => {
  try {
    await createInvoice(invoiceData.value);
    alert('Invoice berhasil dibuat');
    closeInvoiceModal();
    await fetchSales();
  } catch (error) {
    console.error(error);
    alert('Gagal membuat invoice');
  }
};

onMounted(fetchSales);
</script>

<style scoped>
/* Style dari UserManagementView */
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
  overflow: hidden;
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
  text-decoration: none;
  display: inline-block;
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
.confirm-delete-btn {
  background: white;
  border: 2px solid #3aa17e;
  color: #2c8a6a;
  border-radius: 10px;
  padding: 12px 28px;
  font-weight: 600;
  cursor: pointer;
}
</style>