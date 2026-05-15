<template>
  <MainLayout>
    <div class="income-page">
      <RevenueChart :fetch-fn="fetchIncomeData" />
    </div>
  </MainLayout>
</template>

<script setup>
import MainLayout from '@/layouts/MainLayout.vue';
import RevenueChart from '@/components/RevenueChart.vue';
import { getIncomeSummary } from '@/api/sales';

const fetchIncomeData = async (firstDate, lastDate) => {
  const toDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  let response;

  if (!firstDate && !lastDate) {
    response = await getIncomeSummary();
  } else {
    response = await getIncomeSummary(
      toDateString(firstDate),
      toDateString(lastDate)
    );
  }

  return response.data.data.map(item => ({
    tanggal: item.period && item.period.length === 7 
      ? item.period + '-01'
      : item.period,
    total: item.totalRevenue
  }));
};
</script>