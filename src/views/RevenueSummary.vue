<template>
  <MainLayout>
    <div class="revenue-page">
      <RevenueChart :fetch-fn="fetchRevenueData" />
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue';
import RevenueChart from '@/components/RevenueChart.vue';
import { getPerfSales } from '@/api/sales';

const fetchRevenueData = async (firstDate, lastDate) => {
  const toLocalDateTime = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T00:00:00`;
  };
  const response = await getPerfSales(toLocalDateTime(firstDate), toLocalDateTime(lastDate));
  return response.data.data.map(item => ({
    tanggal: item.tanggal,
    total: item.total
  }));
};
</script>