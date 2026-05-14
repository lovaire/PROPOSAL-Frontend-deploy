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
  // Response dari /api/sales/perf: [{ date: "2026-05-14", total: 50000 }]
  return response.data.data.map(item => ({
    tanggal: item.date,   // asumsinya item.date
    total: item.total
  }));
};
</script>

<style scoped>
.revenue-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #f0deda;
}
</style>