<template>
  <div class="bg-white border-2 border-brand-peach p-4 rounded-xl">
    <!-- Header -->
    <div class="flex items-start justify-between mb-5">
      <div class="block my-1 font-semibold text-amber-900">
        <span class="text-xs">REVENUE TRACKER</span>
        <h2 class="text-xl font-bold my-1 text-amber-900">Daily Revenue</h2>
        <p class="text-xs text-amber-900">
          {{ formatDate(chartConfig.firstDate) }} — {{ formatDate(chartConfig.lastDate) }}
        </p>
      </div>
      <div class="">
        <div class="text-right">
          <span class="text-xs space-x-0.5 text-amber-900 block my-4 font-bold">TOTAL</span>
          <span class="text-xl font-bold text-amber-900">{{ formatCurrency(grandTotal) }}</span>
        </div>
      </div>
    </div>

    <!-- Controls — changes instantly re-fetch -->
    <div class="flex flex-wrap items-center gap-4 bg-brand-peach p-3 rounded-xl mb-5">
      <div class="flex items-center gap-2">
        <label class="text-xs space-x-0.5 text-amber-900 whitespace-nowrap font-semibold">RANGE</label>
        <div class="flex gap-1">
          <button
              v-for="preset in presets"
              :key="preset.days"
              class="border border-brand-peach text-xs px-2 py-1 rounded-xl text-amber-900 cursor-pointer font-medium hover:border-amber-900"
              :class="{ 'bg-white': chartConfig.days === preset.days }"
              @click="applyPreset(preset.days)"
          >{{ preset.label }}</button>
        </div>
      </div>

      <div class="w-0.5 h-6 bg-pink-200" />

      <div class="flex items-center gap-2">
        <label class="text-xs space-x-0.5 text-amber-900 whitespace-nowrap font-semibold">FROM</label>
        <input
            type="date"
            class="text-xs border border-brand-peach bg-white rounded-lg text-amber-900 p-1 outline-none cursor-pointer focus:border-amber-900"
            :value="toInputDate(chartConfig.firstDate)"
            @change="onDateChange('firstDate', $event.target.value)"
        />
      </div>

      <div class="flex items-center gap-2">
        <label class="text-xs space-x-0.5 text-amber-900 whitespace-nowrap font-semibold">TO</label>
        <input
            type="date"
            class="text-xs border border-brand-peach bg-white rounded-lg text-amber-900 p-1 outline-none cursor-pointer focus:border-amber-900"
            :value="toInputDate(chartConfig.lastDate)"
            @change="onDateChange('lastDate', $event.target.value)"
        />
      </div>

      <div class="w-0.5 h-6 bg-pink-200" />

      <div class="flex items-center gap-2">
        <label class="text-xs space-x-0.5 text-amber-900 whitespace-nowrap font-semibold">Y-STEP</label>
        <select class="text-xs border border-brand-peach bg-white rounded-lg text-amber-900 p-1 outline-none cursor-pointer focus:border-amber-900" v-model="chartConfig.yStep" @change="rebuildChart">
          <option :value="10000">10,000</option>
          <option :value="25000">25,000</option>
          <option :value="50000">50,000</option>
          <option :value="100000">100,000</option>
          <option :value="250000">250,000</option>
          <option :value="500000">500,000</option>
        </select>
      </div>

      <div class="w-2 h-2 rounded ml-auto bg-brand-peach flex-shrink-0 active:border-amber-900 animate-pulse" />
    </div>

    <!-- Chart -->
    <div class="relative h-80 my-5">
      <div v-if="loading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-peach rounded text-xs text-amber-900 z-10">
        <div class="w-7 h-7 border-2 animate-spin rounded-2xl border-brand-peach border-t-amber-900" />
        <span>Fetching data…</span>
      </div>
      <div v-else-if="error" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-brand-peach rounded text-xs text-amber-900 z-10">
        <span>⚠ {{ error }}</span>
      </div>
      <canvas ref="canvasRef" />
    </div>

    <!-- Footer stats -->
    <div class="grid grid-cols-4 gap-3" v-if="chartData.length">
      <div class="flex flex-col  gap-1 p-3 bg-brand-peach rounded-xl">
        <span class="text-xs space-x-0.5 text-amber-900 font-semibold">PEAK DAY</span>
        <span class="text-sm font-semibold">{{ formatCurrency(peakValue) }}</span>
        <span class="text-xs text-amber-900">{{ peakDate }}</span>
      </div>
      <div class="flex flex-col  gap-1 p-3 bg-brand-peach rounded-xl">
        <span class="text-xs space-x-0.5 text-amber-900 font-semibold">AVERAGE / DAY</span>
        <span class="text-sm font-semibold">{{ formatCurrency(avgValue) }}</span>
      </div>
      <div class="flex flex-col  gap-1 p-3 bg-brand-peach rounded-xl">
        <span class="text-xs space-x-0.5 text-amber-900 font-semibold">LOWEST DAY</span>
        <span class="text-sm font-semibold">{{ formatCurrency(minValue) }}</span>
        <span class="text-xs text-amber-900">{{ minDate }}</span>
      </div>
      <div class="flex flex-col  gap-1 p-3 bg-brand-peach rounded-xl">
        <span class="text-xs space-x-0.5 text-amber-900 font-semibold">DAYS TRACKED</span>
        <span class="text-sm font-semibold">{{ chartData.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import {getPerfSales} from "@/api/sales";

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

function formatDate(date) {
  return date.toLocaleDateString('en-US', {month: '2-digit', day: '2-digit', year: 'numeric'})
}

function formatAxisDate(isoStr) {
  // "2026-04-21" → "04/21/2026"
  const [y, m, d] = isoStr.split('-')
  return `${m}/${d}/${y}`
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

function toLocalDateTime(date, isLast = false) {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  return isLast
      ? `${yyyy}-${mm}-${dd}T23:59:59`
      : `${yyyy}-${mm}-${dd}T00:00:00`
}

async function defaultFetch(firstDate, lastDate) {
  const res = await getPerfSales(
      toLocalDateTime(firstDate, false),
      toLocalDateTime(lastDate, true)
  )
  return res.data.data  // axios: res.data, bukan res.json()
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