<template>
  <MainLayout>
    <div class="dashboard-container">
      <div id="roi-dashboard-report" class="chart-card">
        <div class="filter-header">
          <div class="title-group">
            <h2>Analisis Performa ROI</h2>
            <p class="filter-subtitle">
              Periode: {{ filters.startDate }} s/d {{ filters.endDate }} | Skala Sumbu X: {{ viewMode === 'weekly' ? 'Mingguan' : 'Bulanan (Dinamis)' }}
            </p>
          </div>
          
          <div class="filter-controls">
            <button 
              @click="exportToPDF" 
              class="export-btn" 
              :disabled="!loaded || exporting"
              data-html2canvas-ignore
            >
              <span v-if="exporting">Generating...</span>
              <span v-else>Export PDF</span>
            </button>

            <div class="date-input-group" data-html2canvas-ignore>
              <label>Dari:</label>
              <input 
                type="date" 
                v-model="filters.startDate" 
                @change="fetchAndProcess" 
                class="date-input"
              />
            </div>

            <div class="date-input-group" data-html2canvas-ignore>
              <label>Sampai:</label>
              <input 
                type="date" 
                v-model="filters.endDate" 
                @change="fetchAndProcess" 
                class="date-input"
              />
            </div>
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
const viewMode = ref('monthly'); 

const currentYear = new Date().getFullYear();
const filters = ref({
  startDate: `${currentYear}-01-01`,
  endDate: `${currentYear}-12-31`
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
    pdf.save(`ROI-Report-${filters.value.startDate}-to-${filters.value.endDate}.pdf`);
  } catch (err) {
    console.error("Gagal export PDF:", err);
  } finally {
    exporting.value = false;
  }
};

const fetchAndProcess = async () => {
  if (!filters.value.startDate || !filters.value.endDate) return;
  
  loaded.value = false;
  try {
    const res = await getDashboardRoi(filters.value.startDate, filters.value.endDate);
    rawBackendData.value = res.data;
    
    const start = new Date(filters.value.startDate);
    const end = new Date(filters.value.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 31) {
      viewMode.value = 'weekly';
    } else {
      viewMode.value = 'monthly';
    }

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

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  if (viewMode.value === 'weekly') {
    // 1. MODE MINGGUAN (Rentang <= 31 Hari)
    finalLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'];
    const wValues = Array(5).fill(0).map(() => ({ rev: 0, cost: 0 }));

    if (data.labels) {
      data.labels.forEach((dateStr, index) => {
        const dayOfMonth = new Date(dateStr).getDate();
        let weekIndex = Math.floor((dayOfMonth - 1) / 7);
        if (weekIndex > 4) weekIndex = 4;

        wValues[weekIndex].rev += data.revenue[index] || 0;
        wValues[weekIndex].cost += data.costs[index] || 0;
      });
    }

    wValues.forEach(w => {
      finalRevenue.push(w.rev);
      finalCosts.push(w.cost);
      const roi = w.cost > 0 ? ((w.rev - w.cost) / w.cost) * 100 : 0;
      finalRoi.push(roi);
    });

  } else {
    // 2. MODE BULANAN DINAMIS (Rentang > 31 Hari)
    const start = new Date(filters.value.startDate);
    const end = new Date(filters.value.endDate);
    
    // Bikin list key 'YYYY-MM' untuk bulan-bulan yang masuk rentang filter saja
    const current = new Date(start.getFullYear(), start.getMonth(), 1);
    const dynamicBulanMap = {}; // Format: { '2026-02': { rev: 0, cost: 0 }, '2026-03': {...} }

    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const key = `${yyyy}-${mm}`;
      
      // Simpan label teks-nya untuk sumbu X (misal: "Feb 2026" atau "Feb" saja jika tahunnya sama)
      const labelTeks = start.getFullYear() === end.getFullYear() 
        ? monthNames[current.getMonth()] 
        : `${monthNames[current.getMonth()]} ${yyyy}`;
        
      finalLabels.push(labelTeks);
      dynamicBulanMap[key] = { rev: 0, cost: 0 };
      
      // Pindah ke bulan berikutnya
      current.setMonth(current.getMonth() + 1);
    }

    // Kelompokkan data backend Neon ke map bulan dinamis yang sudah dibuat
    if (data.labels) {
      data.labels.forEach((dateStr, index) => {
        const d = new Date(dateStr);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        // Pastikan key-nya terdaftar (masuk dalam range filter)
        if (dynamicBulanMap[key]) {
          dynamicBulanMap[key].rev += data.revenue[index] || 0;
          dynamicBulanMap[key].cost += data.costs[index] || 0;
        }
      });
    }

    // Masukkan data hasil kelompok ke array Chart
    Object.keys(dynamicBulanMap).forEach(key => {
      const m = dynamicBulanMap[key];
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
      { label: 'ROI (%)', data: finalRoi, borderColor: '#eab308', borderDash: [5, 5], yAxisID: 'y1', tension: 0.3 }
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

.filter-controls { display: flex; gap: 16px; align-items: center; }
.date-input-group { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #555; }
.date-input { padding: 6px 10px; border-radius: 8px; border: 1px solid #ddd; outline: none; background: white; }

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
@media (max-width: 1024px) {
  .filter-header { flex-direction: column; align-items: flex-start; gap: 15px; }
  .filter-controls { width: 100%; flex-wrap: wrap; }
  .export-btn, .date-input-group { flex: 1; min-width: 140px; }
}
</style>