<template>
  <MainLayout>
    <div class="flex flex-col flex-1 border border-brand-peach rounded-xl p-3 bg-white gap-2">

      <div class="p-2">
        <div class="text-2xl font-sans font-semibold">
          Distribution Summary
        </div>
        <div class="text-sm font-sans">
          Monitor Distribution of Goods across multiple departments
        </div>
      </div>

      <div class="flex w-full border border-brand-peach rounded-2xl p-3 bg-brand-peach gap-2 max-sm:flex-col">
        <div class="flex justify-between gap-2">
          <div class="flex items-center gap-1">
            <label for="" class="text-xs text-amber-900 font-semibold max-sm:hidden">FROM</label>
            <input type="month" v-model="activeMonthIn" @change="applyFilter" class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900">
          </div>
          <div class="h-0.5 w-2 my-auto bg-amber-900" />
          <div class="flex items-center gap-1">
            <label for="" class="text-xs text-amber-900 font-semibold max-sm:hidden">TO</label>
            <input type="month" v-model="activeMonthOut" @change="applyFilter" class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900">
          </div>
        </div>

        <div class="bg-pink-200 w-full h-0.5 sm:w-0.5 sm:h-6" />

        <div class="flex justify-around gap-2">
          <div class="flex items-center gap-1">
            <label class="text-xs text-amber-900 font-semibold">Filter By</label>
            <select
                class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
                v-model="currentFilter"
                @change="filterChange"
            >
              <option value="none">None</option>
              <option value="departemen">Departemen</option>
              <option value="kategori">Kategori</option>
            </select>
          </div>
          <div v-if="currentFilter === 'departemen'" class="flex items-center gap-1">
            <label class="text-xs text-amber-900 font-semibold">Pilih Departemen</label>
            <select class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
                    v-model="selectedDepartemen"
                    @change="applyFilter"
            >
              <option value="">-- Pilih --</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>
          <div v-if="currentFilter === 'kategori'" class="flex items-center gap-1">
            <label class="text-xs text-amber-900 font-semibold">Pilih Kategori</label>
            <select class="text-xs border border-brand-peach rounded-xl p-1 bg-white outline-none focus:border-amber-900"
                    v-model="selectedKategori"
                    @change="applyFilter"
            >
              <option value="">-- Pilih --</option>
              <option value="Amenities">Amenities</option>
              <option value="Konsumsi">Konsumsi</option>
              <option value="Peralatan">Peralatan</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>
        </div>
      </div>

      <div class="flex flex-1">
        <StackedBarChart2 :chartData="dataChart" :chartOptions="opsiChart" />
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import MainLayout from "@/layouts/MainLayout.vue"
import StackedBarChart2 from "@/components/StackedBarChart.vue"
import { getDepartements, getGrafik } from "@/api/distributionApi"

const currentFilter = ref('none')
const selectedDepartemen = ref('')
const selectedKategori = ref('')
const isLoading = ref(false)
const isError = ref(false)
const labels = ref([])
const datasets = ref([])
const departments = ref([])

const activeMonthIn = ref('')
const activeMonthOut = ref('')

const tailwindBases = {
  red:     'rgb(239, 68, 68)',
  orange:  'rgb(249, 115, 22)',
  amber:   'rgb(245, 158, 11)',
  yellow:  'rgb(234, 179, 8)',
  lime:    'rgb(132, 204, 22)',
  green:   'rgb(34, 197, 94)',
  emerald: 'rgb(16, 185, 129)',
  teal:    'rgb(20, 184, 166)',
  cyan:    'rgb(6, 182, 212)',
  sky:     'rgb(14, 165, 233)',
  blue:    'rgb(59, 130, 246)',
  indigo:  'rgb(99, 102, 241)',
  violet:  'rgb(139, 92, 246)',
  purple:  'rgb(168, 85, 247)',
  fuchsia: 'rgb(217, 70, 239)',
  pink:    'rgb(236, 72, 153)',
  rose:    'rgb(244, 63, 94)'
}

const colorKeys = Object.keys(tailwindBases)
const getColorByIndex = (index) => tailwindBases[colorKeys[index % colorKeys.length]]

const dataChart = computed(() => ({
  labels: labels.value,
  datasets: datasets.value.map((ds, index) => ({
    label: ds.label,
    data: ds.data,
    backgroundColor: getColorByIndex(index)
  }))
}))

const opsiChart = ref({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Grafik Distribusi' }
  },
  scales: {
    x: { stacked: true },
    y: { stacked: true }
  }
})

const toLocalDate = (yearMonth, endOfMonth = false) => {
  const str = typeof yearMonth === 'string' ? yearMonth : String(yearMonth)
  const [year, month] = str.split('-')
  if (endOfMonth) {
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    return `${year}-${month}-${lastDay}`
  }
  return `${year}-${month}-01`
}

const fetchData = async (monthIn, monthOut, filter, filterValue) => {
  isLoading.value = true
  isError.value = false
  try {
    const result = await getGrafik(monthIn, monthOut, filter, filterValue)
    labels.value = result.data.labels
    datasets.value = result.data.datasets
  } catch (e) {
    console.error('Gagal fetch chart data:', e)
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

const filterChange = () => {
  selectedDepartemen.value = ''
  selectedKategori.value = ''
  applyFilter()
}

const applyFilter = () => {
  let filterValue = ''

  if (currentFilter.value === 'departemen' && selectedDepartemen.value) {
    filterValue = selectedDepartemen.value
  } else if (currentFilter.value === 'kategori' && selectedKategori.value) {
    filterValue = selectedKategori.value
  }

  fetchData(toLocalDate(activeMonthIn.value), toLocalDate(activeMonthOut.value, true), currentFilter.value, filterValue)
}

onMounted(async () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${month}`

  activeMonthIn.value = currentMonth
  activeMonthOut.value = currentMonth

  await Promise.all([
    fetchData(toLocalDate(activeMonthIn.value), toLocalDate(activeMonthOut.value, true), 'none', ''),
    getDepartements().then(res => departments.value = res.data)
  ])
})
</script>