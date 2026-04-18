<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Edit Penjualan</h1>
    <div v-if="loading">Loading...</div>
    <div v-else>
      <form @submit.prevent="updateSales">
        <div class="mb-2">
          <label>Tanggal</label>
          <input type="datetime-local" v-model="form.tanggal" class="border w-full p-2">
        </div>
        <div class="mb-2">
          <label>Customer</label>
          <input type="text" v-model="form.customer" class="border w-full p-2">
        </div>
        <div class="mb-2">
          <label>Catatan</label>
          <textarea v-model="form.catatan" class="border w-full p-2"></textarea>
        </div>
        <div class="mb-2">
          <label>Metode Pembayaran</label>
          <select v-model="form.paymentMethod" class="border w-full p-2">
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        <h2 class="text-xl font-semibold mt-4 mb-2">Item Penjualan</h2>
        <div v-for="(item, index) in form.items" :key="index" class="border p-2 mb-2">
          <div class="flex gap-2">
            <input type="text" v-model="item.productName" placeholder="Nama Produk" class="border p-2 flex-1">
            <input type="number" v-model="item.quantity" placeholder="Qty" class="border p-2 w-24">
            <input type="number" v-model="item.price" placeholder="Harga" class="border p-2 w-32">
            <button type="button" @click="removeItem(index)" class="bg-red-500 text-white px-2 rounded">Hapus</button>
          </div>
        </div>
        <button type="button" @click="addItem" class="bg-blue-500 text-white px-4 py-2 rounded mt-2">Tambah Item</button>

        <div class="mt-4">
          <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded">Simpan</button>
          <router-link :to="`/sales/${route.params.id}`" class="ml-2 bg-gray-500 text-white px-4 py-2 rounded">Batal</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const form = ref({
  tanggal: '',
  customer: '',
  catatan: '',
  paymentMethod: '',
  items: []
});
const loading = ref(true);

const fetchDetail = async () => {
  try {
    const response = await axios.get(`/api/sales/${route.params.id}`);
    const data = response.data.data;
    form.value = {
      tanggal: data.tanggal.slice(0, 16),
      customer: data.customer,
      catatan: data.catatan,
      paymentMethod: data.paymentMethod,
      items: data.items.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price
      }))
    };
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const addItem = () => {
  form.value.items.push({ id: null, productName: '', quantity: 1, price: 0 });
};

const removeItem = (index) => {
  form.value.items.splice(index, 1);
};

const updateSales = async () => {
  try {
    await axios.put(`/api/sales/${route.params.id}`, form.value);
    alert('Penjualan berhasil diupdate');
    router.push(`/sales/${route.params.id}`);
  } catch (error) {
    console.error(error);
    alert('Gagal update');
  }
};

onMounted(fetchDetail);
</script>