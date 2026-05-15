<template>
  <MainLayout>
    <div class="income-page">

      <!-- HEADER -->
      <div class="income-header">
        <div>
          <span class="eyebrow">INCOME DASHBOARD</span>
          <h2>Income Summary</h2>
          <p>Monitor net income performance over time</p>
        </div>

        <!-- DROPDOWN -->
        <select v-model="selectedMonth" class="month-select">
          <option :value="null">All (Yearly)</option>
          <option value="2026-01">Jan 2026</option>
          <option value="2026-02">Feb 2026</option>
          <option value="2026-03">Mar 2026</option>
          <option value="2026-04">Apr 2026</option>
          <option value="2026-05">May 2026</option>
        </select>
      </div>

      <!-- CHART -->
      <IncomeChart 
        :fetch-fn="fetchIncomeData"
        :key="selectedMonth"
      />

    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue';
import MainLayout from '@/layouts/MainLayout.vue';
import IncomeChart from '@/components/IncomeChart.vue';
import { getIncomeSummary } from '@/api/sales';

const selectedMonth = ref(null);

const getEndOfMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const fetchIncomeData = async () => {
  let response;

  if (!selectedMonth.value) {
    response = await getIncomeSummary(); // BULANAN
  } else {
    const start = `${selectedMonth.value}-01`;
    const endDay = String(getEndOfMonth(selectedMonth.value)).padStart(2, '0');
    const end = `${selectedMonth.value}-${endDay}`;

    response = await getIncomeSummary(start, end); // HARIAN
  }

  const raw = response.data.data;

  // 🔥 NORMALISASI DATA BIAR GAK BOLONG

  if (!selectedMonth.value) {
    // 👉 YEARLY (Jan–Dec)
    const months = Array.from({ length: 12 }, (_, i) =>
      `2026-${String(i + 1).padStart(2, '0')}-01`
    );

    return months.map(m => {
      const found = raw.find(r => r.period === m.slice(0, 7));
      return {
        tanggal: m,
        total: found ? found.totalRevenue : 0
      };
    });
  } else {
    // 👉 DAILY (1–end)
    const days = getEndOfMonth(selectedMonth.value);

    return Array.from({ length: days }, (_, i) => {
      const date = `${selectedMonth.value}-${String(i + 1).padStart(2, '0')}`;
      const found = raw.find(r => r.period === date);

      return {
        tanggal: date,
        total: found ? found.totalRevenue : 0
      };
    });
  }
};
</script>

<style scoped>
.income-page {
  background: #f9fafb;
  padding: 24px;
}

.income-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #16a34a;
  font-weight: 600;
}

h2 {
  margin: 4px 0;
  font-size: 22px;
  color: #111827;
}

p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.month-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 12px;
}
</style>