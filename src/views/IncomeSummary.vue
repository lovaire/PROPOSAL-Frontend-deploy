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
  // Format ke yyyy-MM-dd (tanpa waktu)
  const toDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const response = await getIncomeSummary(
    toDateString(firstDate),
    toDateString(lastDate)
  );
  
  // Response dari backend: [{ period: "2025-04", totalRevenue: 123456 }]
  // totalRevenue sudah merupakan income (60% dari penjualan) jika backend sudah mengalikan 0.6
  return response.data.data.map(item => ({
    tanggal: item.period + '-01', // format YYYY-MM-DD untuk sumbu X (chart.js)
    total: item.totalRevenue       // atau item.totalIncome tergantung field response
  }));
};
</script>

<style scoped>
.income-page {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #f0deda;
}
</style>