<template>
  <MainLayout>
    <div class="dashboard-container">
      <div id="roi-dashboard-report" class="chart-card">
        <div class="filter-header">
          <div class="title-group">
            <h2>Analisis Performa ROI</h2>
            <!-- Indikator filter agar muncul di PDF sebagai identitas laporan -->
            <p class="filter-subtitle">
              Annual Report: {{ filters.year }} | Scale: {{ filters.type === 'quarter' ? 'Kuartal' : 'Bulanan' }}
            </p>
          </div>
          
          <div class="filter-controls">
            <!-- Tombol Export PDF -->
            <button 
              @click="exportToPDF" 
              class="export-btn" 
              :disabled="!loaded || exporting"
              data-html2canvas-ignore
            >
              <span v-if="exporting">Generating...</span>
              <span v-else>Export PDF</span>
            </button>

            <!-- Filter Tahun -->
            <select v-model="filters.year" @change="fetchAndProcess" class="select-input" data-html2canvas-ignore>
              <option v-for="y in [2024, 2025, 2026, 2027, 2028, 2029, 2030]" :key="y" :value="y">{{ y }}</option>
            </select>

            <!-- Filter Skala -->
            <select v-model="filters.type" @change="processData" class="select-input" data-html2canvas-ignore>
              <option value="quarter">Per Kuartal (Q1-Q4)</option>
              <option value="month">Per Bulan (Jan-Des)</option>
            </select>
          </div>
        </div>

        <div class="chart-wrapper">
          <Line v-if="loaded" :data="chartData" :options="chartOptions" />
          <div v-else class="loading-state">
            <div class="spinner"></div>
            <span>Menghitung data...</span>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { Line } from 'vue-chartjs';
import { getDashboardRoi } from '@/api/dashboardROI';
import MainLayout from '@/layouts/MainLayout.vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS, Title, Tooltip, Legend, LineElement, 
  LinearScale, PointElement, CategoryScale, Filler
} from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, Filler);

const loaded = ref(false);
const exporting = ref(false);
const chartData = ref(null);
const rawBackendData = ref(null);

const filters = ref({
  year: 2026,
  type: 'quarter'
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' }
  },
  scales: {
    y: { 
      type: 'linear', 
      position: 'left', 
      ticks: { callback: (v) => 'Rp ' + v.toLocaleString('id-ID') } 
    },
    y1: { 
      type: 'linear', 
      position: 'right', 
      ticks: { callback: (v) => v + '%' }, 
      grid: { drawOnChartArea: false } 
    }
  }
};


const exportToPDF = async () => {
  exporting.value = true;
  try {
    const element = document.getElementById('roi-dashboard-report');
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
    pdf.save(`ROI-Report-${filters.value.year}-${filters.value.type}.pdf`);
  } catch (err) {
    console.error("Gagal export PDF:", err);
  } finally {
    exporting.value = false;
  }
};

const fetchAndProcess = async () => {
  loaded.value = false;
  try {
    const start = `${filters.value.year}-01-01`;
    const end = `${filters.value.year}-12-31`;
    const res = await getDashboardRoi(start, end);
    
    rawBackendData.value = res.data;
    processData();
  } catch (err) {
    console.error("Gagal fetch data:", err);
  }
};

const processData = () => {
  if (!rawBackendData.value) return;

  const data = rawBackendData.value;
  let finalLabels = [];
  let finalRevenue = [];
  let finalCosts = [];
  let finalRoi = [];

  if (filters.value.type === 'quarter') {
    finalLabels = ['Q1', 'Q2', 'Q3', 'Q4'];
    const qValues = {
      Q1: { rev: 0, cost: 0 }, Q2: { rev: 0, cost: 0 },
      Q3: { rev: 0, cost: 0 }, Q4: { rev: 0, cost: 0 }
    };

    data.labels.forEach((dateStr, index) => {
      const month = new Date(dateStr).getMonth() + 1;
      let qKey = 'Q1';
      if (month >= 4 && month <= 6) qKey = 'Q2';
      else if (month >= 7 && month <= 9) qKey = 'Q3';
      else if (month >= 10 && month <= 12) qKey = 'Q4';

      qValues[qKey].rev += data.revenue[index] || 0;
      qValues[qKey].cost += data.costs[index] || 0;
    });

    finalLabels.forEach(q => {
      finalRevenue.push(qValues[q].rev);
      finalCosts.push(qValues[q].cost);
      const roi = qValues[q].cost > 0 ? ((qValues[q].rev - qValues[q].cost) / qValues[q].cost) * 100 : 0;
      finalRoi.push(roi);
    });

  } else {
    finalLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const mValues = Array(12).fill(0).map(() => ({ rev: 0, cost: 0 }));

    data.labels.forEach((dateStr, index) => {
      const monthIndex = new Date(dateStr).getMonth();
      mValues[monthIndex].rev += data.revenue[index] || 0;
      mValues[monthIndex].cost += data.costs[index] || 0;
    });

    mValues.forEach(m => {
      finalRevenue.push(m.rev);
      finalCosts.push(m.cost);
      const roi = m.cost > 0 ? ((m.rev - m.cost) / m.cost) * 100 : 0;
      finalRoi.push(roi);
    });
  }

  chartData.value = {
    labels: finalLabels,
    datasets: [
      { label: 'Revenue', data: finalRevenue, borderColor: '#158f67', backgroundColor: 'rgba(21, 143, 103, 0.1)', fill: true, yAxisID: 'y', tension: 0.3 },
      { label: 'Total Cost', data: finalCosts, borderColor: '#d91f11', backgroundColor: 'transparent', yAxisID: 'y', tension: 0.3 },
      { label: 'ROI (%)', data: finalRoi, borderColor: '#3aa17e', borderDash: [5, 5], yAxisID: 'y1', tension: 0.3 }
    ]
  };
  loaded.value = true;
};

onMounted(fetchAndProcess);
</script>

<style scoped>
.dashboard-container { padding: 24px; }
.chart-card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
.filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.title-group h2 { margin: 0; color: #333; }
.filter-subtitle { margin: 4px 0 0; font-size: 14px; color: #666; }

.filter-controls { display: flex; gap: 12px; align-items: center; }
.select-input { padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer; background: white; }

.export-btn { 
  background-color: #158f67; 
  color: white; 
  border: none; 
  padding: 10px 18px; 
  border-radius: 8px; 
  font-weight: 600; 
  cursor: pointer;
  transition: all 0.3s ease;
}
.export-btn:hover:not(:disabled) { background-color: #0d5f44; transform: translateY(-1px); }
.export-btn:disabled { background-color: #ccc; cursor: not-allowed; }

.chart-wrapper { height: 450px; position: relative; margin-top: 10px; }
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #158f67; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px; }

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Responsivitas */
@media (max-width: 768px) {
  .filter-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .filter-controls { width: 100%; flex-wrap: wrap; }
  .export-btn, .select-input { flex: 1; min-width: 120px; }
}
</style>