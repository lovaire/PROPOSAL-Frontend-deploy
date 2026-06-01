<template>
  <MainLayout>
    <div class="flex flex-col w-full h-5/6 items-stretch border border-amber-500 rounded-xl px-4 py-3 bg-white gap-1">
      <RevenueChart
          class="flex-1"
          :fetch-fn="fetchRevenueData"
      />
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