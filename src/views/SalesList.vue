<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Daftar Penjualan</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <table class="min-w-full bg-white border">
        <thead>
          <tr>
            <th class="border px-4 py-2">ID</th>
            <th class="border px-4 py-2">Tanggal</th>
            <th class="border px-4 py-2">Customer</th>
            <th class="border px-4 py-2">Total</th>
            <th class="border px-4 py-2">Status</th>
            <th class="border px-4 py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in sales" :key="sale.id">
            <td class="border px-4 py-2">{{ sale.id }}</td>
            <td class="border px-4 py-2">{{ formatDate(sale.tanggal) }}</td>
            <td class="border px-4 py-2">{{ sale.customer }}</td>
            <td class="border px-4 py-2">{{ formatRupiah(sale.totalAmount) }}</td>
            <td class="border px-4 py-2">{{ sale.status }}</td>
            <td class="border px-4 py-2">
              <router-link :to="`/sales/${sale.id}`" class="text-blue-500">Detail</router-link>
            </td>
          </tr>
        </tbody>
       </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const sales = ref([]);
const loading = ref(true);

const fetchSales = async () => {
  try {
    const response = await axios.get('/api/sales');
    sales.value = response.data.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => new Date(date).toLocaleDateString();
const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);

onMounted(fetchSales);
</script>