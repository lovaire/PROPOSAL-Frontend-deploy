<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Detail Penjualan</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <div class="bg-white shadow rounded p-4 mb-4">
        <p><strong>ID:</strong> {{ salesData.id }}</p>
        <p><strong>Tanggal:</strong> {{ formatDate(salesData.tanggal) }}</p>
        <p><strong>Customer:</strong> {{ salesData.customer }}</p>
        <p><strong>Catatan:</strong> {{ salesData.catatan }}</p>
        <p><strong>Metode Bayar:</strong> {{ salesData.paymentMethod }}</p>
        <p><strong>Status:</strong> {{ salesData.status }}</p>
        <p><strong>Total:</strong> {{ formatRupiah(salesData.totalAmount) }}</p>
      </div>

      <h2 class="text-xl font-semibold mb-2">Item Penjualan</h2>
      <table class="min-w-full bg-white border mb-4">
        <thead>
          <tr>
            <th class="border px-4 py-2">Produk</th>
            <th class="border px-4 py-2">Qty</th>
            <th class="border px-4 py-2">Harga</th>
            <th class="border px-4 py-2">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in salesData.items" :key="item.id">
            <td class="border px-4 py-2">{{ item.productName }}</td>
            <td class="border px-4 py-2">{{ item.quantity }}</td>
            <td class="border px-4 py-2">{{ formatRupiah(item.price) }}</td>
            <td class="border px-4 py-2">{{ formatRupiah(item.subtotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="flex gap-2">
        <router-link :to="`/sales/${salesData.id}/edit`" class="bg-yellow-500 text-white px-4 py-2 rounded">Edit</router-link>
        <button @click="openInvoiceModal" class="bg-green-500 text-white px-4 py-2 rounded">Buat Invoice</button>
        <button @click="goBack" class="bg-gray-500 text-white px-4 py-2 rounded">Kembali</button>
      </div>
    </div>

    <!-- Modal Invoice -->
    <div v-if="showInvoiceModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div class="bg-white p-6 rounded w-96">
        <h2 class="text-xl font-bold mb-4">Buat Invoice</h2>
        <div class="mb-2">
          <label>Tanggal Invoice</label>
          <input type="datetime-local" v-model="invoiceData.invoiceDate" class="border w-full p-2">
        </div>
        <div class="mb-2">
          <label>Metode Pembayaran</label>
          <select v-model="invoiceData.paymentMethod" class="border w-full p-2">
            <option value="CASH">Cash</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="closeInvoiceModal" class="bg-gray-500 text-white px-4 py-2 rounded">Batal</button>
          <button @click="submitInvoice" class="bg-green-500 text-white px-4 py-2 rounded">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const salesData = ref({});
const loading = ref(true);
const showInvoiceModal = ref(false);
const invoiceData = ref({
  salesId: route.params.id,
  invoiceDate: new Date().toISOString().slice(0, 16),
  paymentMethod: 'cash'
});

const fetchDetail = async () => {
  try {
    const response = await axios.get(`/api/sales/${route.params.id}`);
    salesData.value = response.data.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString();
const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

const openInvoiceModal = () => {
  showInvoiceModal.value = true;
};

const closeInvoiceModal = () => {
  showInvoiceModal.value = false;
};

const submitInvoice = async () => {
  try {
    await axios.post('/api/invoices', invoiceData.value);
    alert('Invoice berhasil dibuat');
    closeInvoiceModal();
    // refresh detail atau redirect
  } catch (error) {
    console.error(error);
    alert('Gagal membuat invoice');
  }
};

const goBack = () => {
  router.push('/sales');
};

onMounted(fetchDetail);
</script>