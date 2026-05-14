<template>
  <div class="revenue-wrapper">
    <!-- Header -->
    <div class="chart-header">
      <div class="header-left">
        <span class="chart-eyebrow">REVENUE TRACKER</span>
        <h2 class="chart-title">Daily Revenue</h2>
        <p class="chart-subtitle">
          {{ formatDate(chartConfig.firstDate) }} — {{ formatDate(chartConfig.lastDate) }}
        </p>
      </div>
      <div class="header-right">
        <div class="total-badge">
          <span class="total-label">TOTAL</span>
          <span class="total-value">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>
    </div>

    <!-- Controls — changes instantly re-fetch -->
    <div class="controls-bar">
      <div class="control-group">
        <label class="control-label">RANGE</label>
        <div class="range-pills">
          <button
              v-for="preset in presets"
              :key="preset.days"
              class="pill"
              :class="{ active: chartConfig.days === preset.days }"
              @click="applyPreset(preset.days)"
          >{{ preset.label }}</button>
        </div>
      </div>

      <div class="control-divider" />

      <div class="control-group">
        <label class="control-label">FROM</label>
        <input
            type="date"
            class="date-input"
            :value="toInputDate(chartConfig.firstDate)"
            @change="onDateChange('firstDate', $event.target.value)"
        />
      </div>

      <div class="control-group">
        <label class="control-label">TO</label>
        <input
            type="date"
            class="date-input"
            :value="toInputDate(chartConfig.lastDate)"
            @change="onDateChange('lastDate', $event.target.value)"
        />
      </div>

      <div class="control-divider" />

      <div class="control-group">
        <label class="control-label">Y-STEP</label>
        <select class="select-input" v-model="chartConfig.yStep" @change="rebuildChart">
          <option :value="10000">10,000</option>
          <option :value="25000">25,000</option>
          <option :value="50000">50,000</option>
          <option :value="100000">100,000</option>
          <option :value="250000">250,000</option>
          <option :value="500000">500,000</option>
        </select>
      </div>

      <div class="loader-dot" :class="{ active: loading }" />
    </div>

    <!-- Chart -->
    <div class="chart-area">
      <div v-if="loading" class="chart-overlay">
        <div class="spinner" />
        <span>Fetching data…</span>
      </div>
      <div v-else-if="error" class="chart-overlay error">
        <span>⚠ {{ error }}</span>
      </div>
      <canvas ref="canvasRef" />
    </div>

    <!-- Footer stats -->
    <div class="stats-row" v-if="chartData.length">
      <div class="stat-card">
        <span class="stat-label">PEAK DAY</span>
        <span class="stat-value">{{ formatCurrency(peakValue) }}</span>
        <span class="stat-meta">{{ peakDate }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">AVERAGE / DAY</span>
        <span class="stat-value">{{ formatCurrency(avgValue) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">LOWEST DAY</span>
        <span class="stat-value">{{ formatCurrency(minValue) }}</span>
        <span class="stat-meta">{{ minDate }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">DAYS TRACKED</span>
        <span class="stat-value">{{ chartData.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

// eslint-disable-next-line no-undef
const props = defineProps({
  fetchFn: {
    type: Function,
    default: null,
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

// "YYYY-MM-DD" — for the <input type="date"> value
function toInputDate(date) {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// "YYYY-MM-DDTHH:mm:ss" — matches Spring's LocalDateTime @RequestParam format
function toLocalDateTime(date) {
  return `${toInputDate(date)}T00:00:00`
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'})
}

function formatAxisDate(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const parts = isoStr.split('-');
  if (parts.length < 3) return isoStr;
  const [y, m, d] = parts;
  return `${m}/${d}/${y}`;
}

function formatCurrency(val) {
  if (val == null) return '-'
  return val.toLocaleString('id-ID')
}

// ─── Chart Config ─────────────────────────────────────────────────────────────
const chartConfig = reactive({
  firstDate: daysAgo(4),
  lastDate: daysAgo(0),
  days: 5,
  yStep: 50000,
})

const presets = [
  {label: '5D', days: 5},
  {label: '7D', days: 7},
  {label: '14D', days: 14},
  {label: '30D', days: 30},
  {label: '90D', days: 90},
]

// ─── State ────────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const loading = ref(false)
const error = ref(null)
const chartData = ref([])
let chartInstance = null

// ─── Computed stats ───────────────────────────────────────────────────────────
const grandTotal = computed(() => chartData.value.reduce((s, d) => s + (d.total || 0), 0))
const peakEntry = computed(() => chartData.value.reduce((a, b) => (b.total > a.total ? b : a), chartData.value[0] || {}))
const minEntry = computed(() => chartData.value.reduce((a, b) => (b.total < a.total ? b : a), chartData.value[0] || {}))
const peakValue = computed(() => peakEntry.value?.total)
const minValue = computed(() => minEntry.value?.total)
const peakDate = computed(() => peakEntry.value?.tanggal ? formatAxisDate(peakEntry.value.tanggal) : '')
const minDate = computed(() => minEntry.value?.tanggal ? formatAxisDate(minEntry.value.tanggal) : '')
const avgValue = computed(() => chartData.value.length
    ? Math.round(grandTotal.value / chartData.value.length)
    : 0
)

// ─── Data fetching ────────────────────────────────────────────────────────────
// Params named "first" and "last" formatted as LocalDateTime to match @RequestParam
async function defaultFetch(firstDate, lastDate) {
  const params = new URLSearchParams({
    first: toLocalDateTime(firstDate),
    last: toLocalDateTime(lastDate),
  })
  const res = await fetch(`/api/sales/performance?${params}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const fetcher = props.fetchFn ?? defaultFetch
    const raw = await fetcher(chartConfig.firstDate, chartConfig.lastDate)
    chartData.value = [...raw].sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    await nextTick()
    rebuildChart()
  } catch (e) {
    error.value = e.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

// ─── Chart rendering ──────────────────────────────────────────────────────────
function computeYMax(data, step) {
  const max = Math.max(...data.map(d => d.total || 0), step)
  return Math.ceil(max / step) * step + step
}

function rebuildChart() {
  if (!canvasRef.value) return

  const labels = chartData.value.map(d => formatAxisDate(d.tanggal))
  const values = chartData.value.map(d => d.total || 0)
  const step = chartConfig.yStep
  const yMax = computeYMax(chartData.value, step)

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const ctx = canvasRef.value.getContext('2d')

  // Gradient: brand-peach warm rose → transparent
  const gradient = ctx.createLinearGradient(0, 0, 0, 340)
  gradient.addColorStop(0, 'rgba(201, 114, 106, 0.22)')
  gradient.addColorStop(1, 'rgba(255, 235, 230, 0.00)')

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        borderColor: '#c9726a',
        borderWidth: 2.5,
        pointBackgroundColor: '#c9726a',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {mode: 'index', intersect: false},
      plugins: {
        legend: {display: false},
        tooltip: {
          backgroundColor: '#3a2220',
          titleColor: '#ffb8ac',
          bodyColor: '#f5d5d0',
          borderColor: '#c9726a',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: ctx => `  Revenue: ${formatCurrency(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: {color: 'rgba(201,114,106,0.08)', drawTicks: false},
          ticks: {
            color: '#a05550',
            font: {family: 'inherit', size: 11},
            maxRotation: 35,
          },
          border: {color: 'rgba(201,114,106,0.2)'},
        },
        y: {
          min: 0,
          max: yMax,
          ticks: {
            stepSize: step,
            color: '#a05550',
            font: {family: 'inherit', size: 11},
            callback: val => formatCurrency(val),
          },
          grid: {color: 'rgba(201,114,106,0.08)', drawTicks: false},
          border: {color: 'rgba(201,114,106,0.2)', dash: [4, 4]},
        },
      },
    },
  })
}

// ─── Control handlers ─────────────────────────────────────────────────────────
function applyPreset(days) {
  chartConfig.days = days
  chartConfig.firstDate = daysAgo(days - 1)
  chartConfig.lastDate = daysAgo(0)
}

function onDateChange(field, value) {
  chartConfig[field] = new Date(value + 'T00:00:00')
  chartConfig.days = null
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(
    () => [chartConfig.firstDate, chartConfig.lastDate],
    fetchData,
    {deep: false}
)
watch(() => chartConfig.yStep, rebuildChart)

// ─── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(fetchData)
</script>

<style scoped>
/*
  Brand palette derived from #FFEBE6 (brand-peach):
  #FFEBE6  — peach bg tint        (controls bar bg)
  #ffd5cc  — peach border         (dividers, card borders)
  #c9726a  — peach accent         (line, active pill, accents)
  #a05550  — peach muted          (labels, axis text)
  #3a2220  — peach ink            (headings, values)
  #fff5f3  — peach surface        (stat cards)
*/

.revenue-wrapper {
  background: #ffffff;
  border: 1px solid #ffd5cc;
  border-radius: 20px;
  padding: 28px 28px 20px;
  font-family: inherit;
  color: #3a2220;
}

/* ── Header ── */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.chart-eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #c9726a;
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

.chart-title {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 700;
  color: #3a2220;
  letter-spacing: -0.3px;
}

.chart-subtitle {
  margin: 0;
  font-size: 11px;
  color: #a05550;
}

.total-badge {
  text-align: right;
}

.total-label {
  font-size: 9px;
  letter-spacing: 2px;
  color: #a05550;
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
}

.total-value {
  font-size: 20px;
  font-weight: 700;
  color: #c9726a;
}

/* ── Controls ── */
.controls-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  background: #ffebe6;
  border: 1px solid #ffd5cc;
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 20px;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-label {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: #a05550;
  white-space: nowrap;
  font-weight: 600;
}

.control-divider {
  width: 1px;
  height: 24px;
  background: #ffd5cc;
}

/* Preset pills */
.range-pills {
  display: flex;
  gap: 4px;
}

.pill {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid #ffd5cc;
  background: #ffffff;
  color: #a05550;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}

.pill:hover {
  border-color: #c9726a;
  color: #c9726a;
}

.pill.active {
  background: #c9726a;
  border-color: #c9726a;
  color: #ffffff;
  font-weight: 600;
}

/* Inputs */
.date-input,
.select-input {
  font-size: 11px;
  background: #ffffff;
  border: 1px solid #ffd5cc;
  border-radius: 8px;
  color: #3a2220;
  padding: 5px 9px;
  outline: none;
  transition: border-color 0.15s;
  cursor: pointer;
  font-family: inherit;
}

.date-input:focus,
.select-input:focus {
  border-color: #c9726a;
}

/* Loading dot */
.loader-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ffd5cc;
  margin-left: auto;
  flex-shrink: 0;
  transition: background 0.2s;
}

.loader-dot.active {
  background: #c9726a;
  box-shadow: 0 0 8px rgba(201, 114, 106, 0.5);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* ── Chart area ── */
.chart-area {
  position: relative;
  height: 340px;
  margin-bottom: 20px;
}

.chart-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(255, 245, 243, 0.9);
  border-radius: 8px;
  font-size: 13px;
  color: #a05550;
  z-index: 10;
}

.chart-overlay.error {
  color: #c9726a;
  font-weight: 600;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #ffd5cc;
  border-top-color: #c9726a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Stats row ── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
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

/* ── Responsive ── */
@media (max-width: 600px) {
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }

  .controls-bar {
    gap: 10px;
  }

  .chart-header {
    flex-direction: column;
    gap: 12px;
  }

  .total-badge {
    text-align: left;
  }
}
</style>