<template>
  <MainLayout>
  

    <div class="filters-card">
      <div class="filter-group">
        <label>Start Date</label>
        <input type="date" v-model="startDate" @change="fetchData" />
      </div>
      <div class="filter-group">
        <label>End Date</label>
        <input type="date" v-model="endDate" @change="fetchData" />
      </div>
      <div class="filter-group">
        <label>Menu Filter</label>
        <select v-model="selectedMenuId" @change="fetchData">
          <option value="">All Menu</option>
          <option v-for="menu in allMenus" :key="menu.id" :value="menu.id">
            {{ menu.name }}
          </option>
        </select>
      </div>
      <button class="reset-btn" @click="resetFilters">Reset</button>
    </div>

    <div class="chart-card">
      <canvas ref="canvasRef"></canvas>
      <div v-if="loading" class="loading-overlay">Loading...</div>
      <div v-else-if="chartData.length === 0" class="loading-overlay">No data for the selected date</div>
    </div>

    <div class="stats-row" v-if="chartData.length">
      <div class="stat-card">
        <span class="stat-label">Best Selling Menu</span>
        <span class="stat-value">{{ topMenuName }}</span>
        <span class="stat-meta">{{ topMenuQuantity }} pcs</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Total Sales</span>
        <span class="stat-value">{{ totalQuantity }} pcs</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Least Popular Menu</span>
        <span class="stat-value">{{ bottomMenuName || '-' }}</span>
        <span class="stat-meta">{{ bottomMenuQuantity }} pcs</span>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import MainLayout from '@/layouts/MainLayout.vue';
import { Chart, registerables } from 'chart.js';
import { getAllProducts, getMenuPerformance } from '@/api/sales';

Chart.register(...registerables);

// Data
const allMenus = ref([]);
const startDate = ref('');
const endDate = ref('');
const selectedMenuId = ref('');
const loading = ref(false);
const chartData = ref([]);
const canvasRef = ref(null);
let chartInstance = null;

// Computed
const totalQuantity = computed(() => chartData.value.reduce((sum, d) => sum + d.totalQuantity, 0));
const sortedData = computed(() => [...chartData.value].sort((a, b) => b.totalQuantity - a.totalQuantity));
const topMenuItem = computed(() => sortedData.value[0] || { menuName: '-', totalQuantity: 0 });
const bottomMenuItem = computed(() => sortedData.value[sortedData.value.length - 1] || { menuName: '-', totalQuantity: 0 });
const topMenuName = computed(() => topMenuItem.value.menuName);
const topMenuQuantity = computed(() => topMenuItem.value.totalQuantity);
const bottomMenuName = computed(() => bottomMenuItem.value.menuName);
const bottomMenuQuantity = computed(() => bottomMenuItem.value.totalQuantity);

// Methods
const fetchMenus = async () => {
  try {
    const res = await getAllProducts();
    allMenus.value = res.data.data || [];
  } catch (err) {
    console.error(err);
  }
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (startDate.value) params.startDate = startDate.value;
    if (endDate.value) params.endDate = endDate.value;
    if (selectedMenuId.value) params.menuId = selectedMenuId.value;
    const res = await getMenuPerformance(params);
    chartData.value = res.data.data || [];
    await nextTick();
    renderChart();
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const renderChart = () => {
  if (!canvasRef.value) return;
  if (chartInstance) chartInstance.destroy();
  const ctx = canvasRef.value.getContext('2d');
  const labels = chartData.value.map(d => d.menuName);
  const quantities = chartData.value.map(d => d.totalQuantity);
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Jumlah Terjual (pcs)',
        data: quantities,
        backgroundColor: '#c9726a',
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, title: { display: true, text: 'Quantity' } },
        x: { title: { display: true, text: 'Menu' }, ticks: { autoSkip: true, maxRotation: 45 } }
      }
    }
  });
};

const resetFilters = () => {
  startDate.value = '';
  endDate.value = '';
  selectedMenuId.value = '';
  fetchData();
};

onMounted(() => {
  fetchMenus();
  fetchData();
});
</script>

<style scoped>
/* style yang sama seperti sebelumnya */
.page-header { margin-bottom: 24px; }
.filters-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 24px;
  border: 1px solid #f0deda;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-group label {
  font-size: 13px;
  font-weight: 600;
}
.filter-group input, .filter-group select {
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e8e8e8;
}
.reset-btn {
  background-color: #dff0e7;
  color: #3a6f5c;
  border: none;
  border-radius: 12px;
  padding: 10px 18px;
  cursor: pointer;
}
.chart-card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  border: 1px solid #f0deda;
  position: relative;
  height: 400px;
}
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  z-index: 10;
}
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 24px;
}
.stat-card {
  background: #fff5f3;
  border: 1px solid #ffd5cc;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.stat-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #a05550;
  font-weight: 600;
}
.stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #3a2220;
}
.stat-meta {
  font-size: 10px;
  color: #a05550;
}
</style>