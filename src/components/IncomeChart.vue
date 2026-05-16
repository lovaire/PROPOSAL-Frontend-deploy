<script setup>
/* eslint-disable no-undef */

import { ref, computed, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  fetchFn: Function
})

const canvasRef = ref(null)
const chartData = ref([])
let chartInstance = null

// ─── COMPUTED ─────────────────────────────────────────────
const grandTotal = computed(() =>
  chartData.value.reduce((s, d) => s + d.total, 0)
)

const peak = computed(() =>
  chartData.value.reduce((a, b) => b.total > a.total ? b : a, chartData.value[0] || {})
)

const min = computed(() =>
  chartData.value.reduce((a, b) => b.total < a.total ? b : a, chartData.value[0] || {})
)

const avg = computed(() =>
  chartData.value.length
    ? Math.round(grandTotal.value / chartData.value.length)
    : 0
)

// ─── FORMAT ───────────────────────────────────────────────
function formatCurrency(v) {
  return v?.toLocaleString('id-ID') || 0
}

function formatLabel(dateStr) {
  const d = new Date(dateStr)

  // kalau tanggal 1 → tampilkan bulan
  if (d.getDate() === 1) {
    return d.toLocaleDateString('en-US', { month: 'short' })
  }

  return d.getDate()
}

// ─── FETCH DATA ───────────────────────────────────────────
async function load() {
  if (!props.fetchFn) return

  const data = await props.fetchFn()
  chartData.value = data

  await nextTick()
  renderChart()
}

// ─── RENDER CHART ─────────────────────────────────────────
function renderChart() {
  const ctx = canvasRef.value.getContext('2d')

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.value.map(d => formatLabel(d.tanggal)),
      datasets: [{
        label: 'Income',
        data: chartData.value.map(d => d.total),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.2)',
        fill: true,
        tension: 0.35,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => formatCurrency(val)
          }
        }
      }
    }
  })
}

// ─── INIT ─────────────────────────────────────────────────
onMounted(load)
</script>

<template>
  <div class="income-card">

    <!-- HEADER -->
    <div class="card-header">
      <div>
        <h3>Income Trend</h3>
        <p>Net income performance</p>
      </div>

      <div class="total-box">
        <span>Total</span>
        <strong>{{ formatCurrency(grandTotal) }}</strong>
      </div>
    </div>

    <!-- CHART -->
    <div class="chart-container">
      <canvas ref="canvasRef"></canvas>
    </div>

    <!-- STATS -->
    <div class="stats">
      <div class="stat">
        <span>HIGHEST INCOME</span>
        <strong>{{ formatCurrency(peak.total) }}</strong>
      </div>

      <div class="stat">
        <span>AVERAGE INCOME</span>
        <strong>{{ formatCurrency(avg) }}</strong>
      </div>

      <div class="stat">
        <span>LOWEST INCOME</span>
        <strong>{{ formatCurrency(min.total) }}</strong>
      </div>

      <div class="stat">
        <span>ACTIVE DAYS</span>
        <strong>{{ chartData.length }}</strong>
      </div>
    </div>

  </div>
</template>

<style scoped>
.income-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
}

/* HEADER */
.card-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
}

.card-header p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.total-box {
  text-align: right;
}

.total-box span {
  font-size: 10px;
  color: #6b7280;
}

.total-box strong {
  font-size: 18px;
  color: #16a34a;
}

/* CHART */
.chart-container {
  height: 300px;
}

/* STATS */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 16px;
  gap: 10px;
}

.stat {
  background: #f9fafb;
  padding: 10px;
  border-radius: 10px;
}

.stat span {
  font-size: 10px;
  color: #6b7280;
}

.stat strong {
  display: block;
  font-size: 14px;
  margin-top: 4px;
}
</style>