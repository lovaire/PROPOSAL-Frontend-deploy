<template>
  <MainLayout>
    <div class="page-header">
      <div></div>
      <div class="button-group">
        <button class="create-btn" @click="$router.push('/menu')">List Menu</button>
        <button class="create-btn" @click="openAddModal">+ Tambah Penjualan</button>
      </div>
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
              <button class="update-btn" @click="openDetailModal(sale)">Detail</button>
              <button class="update-btn" @click="openEditModal(sale)">Edit</button>
              <button class="delete-btn" @click="openInvoiceModal(sale)">Buat Invoice</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="chart-wrapper">
      <RevenueChart :fetch-fn="chartFetcher" />
    </div>

    <!-- Modal Detail -->
    <div v-if="showDetailModal" class="modal-overlay">
      <div class="modal-box">
        <h2>Detail Penjualan</h2>
        <p><strong>ID:</strong> {{ selectedSale.id }}</p>
        <p><strong>Tanggal:</strong> {{ formatDate(selectedSale.tanggal) }}</p>
        <p><strong>Customer:</strong> {{ selectedSale.customer }}</p>
        <p><strong>Catatan:</strong> {{ selectedSale.catatan }}</p>
        <p><strong>Metode Bayar:</strong> {{ selectedSale.paymentMethod }}</p>
        <p><strong>Status:</strong> {{ selectedSale.status }}</p>
        <p><strong>Total:</strong> {{ formatRupiah(selectedSale.totalAmount) }}</p>
        <h3>Item Penjualan</h3>
        <table class="mini-table">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Qty</th>
              <th>Harga</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedSale.items" :key="item.id">
              <td>{{ item.product?.name || item.productName }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ formatRupiah(item.price) }}</td>
              <td>{{ formatRupiah(item.subtotal) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="modal-actions single">
          <button class="done-btn" @click="closeDetailModal">Tutup</button>
        </div>
      </div>
    </div>

    <!-- Modal Add / Edit -->
    <div v-if="showFormModal" class="modal-overlay">
      <form @submit.prevent="submitForm" class="modal-box">
        <h2>{{ isEdit ? 'Edit Penjualan' : 'Tambah Penjualan' }}</h2>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

        <label>Tanggal</label>
        <input type="datetime-local" v-model="form.tanggal" required />

        <label>Customer</label>
        <input type="text" v-model="form.customer" required />

        <label>Catatan</label>
        <textarea v-model="form.catatan"></textarea>

        <label>Metode Pembayaran</label>
        <select v-model="form.paymentMethod" required>
          <option value="" disabled>Pilih Metode</option>
          <option value="CASH">Cash</option>
          <option value="DEBIT">Debit</option>
          <option value="CREDIT">Credit</option>
          <option value="QRIS">QRIS</option>
          <option value="TRANSFER">Transfer</option>
        </select>

        <label>Item Penjualan</label>
        <div v-for="(item, idx) in form.items" :key="idx" class="item-row">
          <select v-model="item.productId" required>
            <option value="" disabled>Pilih Produk</option>
            <option v-for="prod in products" :key="prod.id" :value="prod.id">
              {{ prod.name }}
            </option>
          </select>
          <input type="number" v-model="item.quantity" placeholder="Qty" min="1" required />
          <button type="button" @click="removeItem(idx)" class="delete-btn">Hapus</button>
        </div>

        <button type="button" @click="addItem" class="update-btn">+ Tambah Item</button>

        <div class="modal-actions">
          <button type="button" class="cancel-btn" @click="closeFormModal">Batal</button>
          <button type="submit" class="confirm-delete-btn">Simpan</button>
        </div>
      </form>
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
import axios from 'axios';
import { ref, onMounted } from 'vue';
import {getAllSales, createSales, updateSales, createInvoice, getAllActiveProducts, getPerfSales} from '@/api/sales';
import MainLayout from '@/layouts/MainLayout.vue';
import RevenueChart from '@/components/RevenueChart.vue';                      // [ADDED]

const sales = ref([]);
const products = ref([]);
const loading = ref(true);

const errorMessage = ref('');

const showDetailModal = ref(false);
const showFormModal = ref(false);
const showInvoiceModal = ref(false);
const isEdit = ref(false);
const selectedSale = ref(null);
const form = ref({
  tanggal: new Date().toISOString().slice(0, 16),
  customer: '',
  catatan: '',
  paymentMethod: 'CASH',
  items: [{ productId: null, quantity: 1 }]
});
const invoiceData = ref({
  salesId: '',
  invoiceDate: new Date().toISOString().slice(0, 16),
  paymentMethod: 'CASH'
});

const chartFetcher = async (firstDate, lastDate) => {
  const toLocalDateTime = (date) => {
    const yyyy = date.getFullYear()
    const mm   = String(date.getMonth() + 1).padStart(2, '0')
    const dd   = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}T00:00:00`
  }
  const res = await getPerfSales(toLocalDateTime(firstDate), toLocalDateTime(lastDate))
  return res.data.data
}

const fetchData = async () => {
  loading.value = true;
  try {
    // Gunakan Promise.allSettled agar tidak terhenti jika salah satu gagal
    const [salesResult, productsResult] = await Promise.allSettled([
      getAllSales(),
      getAllActiveProducts()
    ]);

    // Proses sales (tampilkan array kosong jika gagal)
    if (salesResult.status === 'fulfilled') {
      sales.value = salesResult.value.data.data;
    } else {
      console.error('Gagal memuat data sales:', salesResult.reason);
      sales.value = [];
    }

    // Proses produk
    if (productsResult.status === 'fulfilled') {
      products.value = productsResult.value.data.data;
      console.log('Produk berhasil dimuat:', products.value);
    } else {
      console.error('Gagal memuat data produk:', productsResult.reason);
      products.value = [];
    }
  } catch (error) {
    console.error('Error tak terduga:', error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString();
const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const openDetailModal = (sale) => {
  selectedSale.value = sale;
  showDetailModal.value = true;
};
const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedSale.value = null;
};

const openAddModal = () => {
  isEdit.value = false;
  form.value = {
    tanggal: new Date().toISOString().slice(0, 16),
    customer: '',
    catatan: '',
    paymentMethod: 'CASH',
    items: [{ productId: null, quantity: 1 }]
  };
  showFormModal.value = true;
};
const openEditModal = (sale) => {
  isEdit.value = true;
  form.value = {
    id: sale.id,
    tanggal: sale.tanggal.slice(0, 16),
    customer: sale.customer,
    catatan: sale.catatan || '',
    paymentMethod: sale.paymentMethod,
    items: sale.items.map(item => ({
      id: item.id,
      productId: item.product?.id || null,
      quantity: item.quantity
    }))
  };
  showFormModal.value = true;
};
const closeFormModal = () => {
  showFormModal.value = false;
};
const addItem = () => {
  form.value.items.push({ productId: null, quantity: 1 });
};
const removeItem = (idx) => {
  form.value.items.splice(idx, 1);
};
const submitForm = async () => {
  try {
    // Pastikan paymentMethod uppercase
    const payload = { ...form.value };
    if (payload.paymentMethod) {
      payload.paymentMethod = payload.paymentMethod.toUpperCase();
    }
    // Juga pastikan items tidak bermasalah
    if (payload.items) {
      payload.items = payload.items.map(item => ({
        ...item,
        productId: Number(item.productId) // pastikan integer
      }));
    }
    if (isEdit.value) {
      await updateSales(form.value.id, payload);
      alert('Penjualan berhasil diupdate');
    } else {
      await createSales(payload);
      alert('Penjualan berhasil ditambahkan');
    }
    closeFormModal();
    await fetchData();
  } catch (error) {
    console.error(error);
    errorMessage.value = error.message;
    alert('Gagal menyimpan penjualan');
  }
};

const openInvoiceModal = async (sale) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda belum login. Silakan login kembali.');
      return;
    }

    const payload = {
      salesId: sale.id,
      invoiceDate: new Date().toISOString().slice(0, 16),
      paymentMethod: (sale.paymentMethod || 'CASH').toUpperCase()
    };

    const response = await axios.post(`/api/sales/${sale.id}/invoice-pdf`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob'
    });


    // Buat link download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${sale.id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    alert('Invoice berhasil dibuat dan diunduh');
  } catch (error) {
    console.error(error);
    const errorMsg = error.response?.data?.message || error.message;
    alert('Gagal membuat invoice: ' + errorMsg);
  }
};
const closeInvoiceModal = () => {
  showInvoiceModal.value = false;
  invoiceData.value = {
    salesId: '',
    invoiceDate: new Date().toISOString().slice(0, 16),
    paymentMethod: 'CASH'
  };
};
const submitInvoice = async () => {
  try {
    await createInvoice(invoiceData.value);
    alert('Invoice berhasil dibuat');
    closeInvoiceModal();
    await fetchData();
  } catch (error) {
    console.error(error);
    alert('Gagal membuat invoice: ' + (error.response?.data?.message || error.message));
  }
};

onMounted(fetchData);
</script>

<style scoped>
.button-group {
  display: flex;
  gap: 12px;
}
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
th, td {
  text-align: left;
  padding: 18px 20px;
  font-size: 14px;
  color: #333;
}
td {
  border-top: 1px solid #f3e5e1;
  color: #444;
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
/* [ADDED] spacing between table and chart */
.chart-wrapper {
  margin-top: 32px;
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
  width: 600px;
  max-width: 90%;
  background: white;
  border-radius: 32px;
  padding: 36px 42px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}
.modal-box h2 {
  margin: 0 0 24px;
  font-size: 22px;
}
.modal-box label {
  display: block;
  margin: 14px 0 8px;
  font-weight: 600;
}
.modal-box input, .modal-box select, .modal-box textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
}
.item-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
.item-row select, .item-row input {
  flex: 1;
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
}
.confirm-delete-btn {
  background: white;
  border: 2px solid #3aa17e;
  color: #2c8a6a;
  border-radius: 10px;
  padding: 12px 28px;
  cursor: pointer;
}
.done-btn {
  background: #2e7d32;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 26px;
  cursor: pointer;
}
.mini-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.mini-table th, .mini-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
</style>