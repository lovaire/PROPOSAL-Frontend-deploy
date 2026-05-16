<template>
  <MainLayout>
    <RevenueChart :fetch-fn="chartFetcher" />
  </MainLayout>
</template>

<script setup>
import RevenueChart from "@/components/RevenueChart.vue"
import MainLayout from "@/layouts/MainLayout.vue"
import { getPerfSales } from '@/api/sales'

const toLocalDateTime = (date, isLast = false) => {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  return isLast
      ? `${yyyy}-${mm}-${dd}T23:59:59`
      : `${yyyy}-${mm}-${dd}T00:00:00`
}

const chartFetcher = async (firstDate, lastDate) => {
  const res = await getPerfSales(
      toLocalDateTime(firstDate, false),
      toLocalDateTime(lastDate, true)
  )
  return res.data.data
}
</script>