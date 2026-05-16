<template>
  <MainLayout>
    <StackedBarChart
        :subcategories="subcategories"
        :series="series"
        :is-loading="isLoading"
        :is-error="isError"
        :departments="departments"
        @filter-change="({ bulanIn, bulanOut, filter, filterValue }) =>
        fetchData(toLocalDate(bulanIn), toLocalDate(bulanOut, true), filter, filterValue)"
    />
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import StackedBarChart from '@/components/StackedBarChart.vue'
import { getGrafik, getDepartements } from '@/api/distributionApi'

const subcategories = ref([])
const series = ref([])
const isLoading = ref(false)
const isError = ref(false)
const departments = ref([])

const toLocalDate = (yearMonth, isEnd = false) => {
  const [year, month] = yearMonth.split('-').map(Number)
  if (isEnd) {
    const lastDay = new Date(year, month, 0).getDate()
    return `${yearMonth}-${String(lastDay).padStart(2, '0')}`
  }
  return `${yearMonth}-01`
}

const fetchData = async (bulanIn, bulanOut, filter, filterValue) => {
  isLoading.value = true
  isError.value = false
  try {
    const result = await getGrafik(bulanIn, bulanOut, filter, filterValue)
    subcategories.value = result.data.subcategories
    series.value = result.data.series.map(item => ({
      category: item.category,
      ...item.data
    }))
  } catch (e) {
    console.error('Gagal fetch chart data:', e)
    isError.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const currentMonth = `${year}-${month}`

  await Promise.all([
    fetchData(
        toLocalDate(currentMonth),
        toLocalDate(currentMonth, true),
        'none',
        ''
    ),
    getDepartements().then(res => departments.value = res.data)
  ])
})
</script>