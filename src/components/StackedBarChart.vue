<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script>
import { defineComponent } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default defineComponent({
  name: 'StackedBarChart',
  components: {
    Bar
  },
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartOptions: {
      type: Object,
      default: () => ({
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true, // Mengaktifkan efek stacked di sumbu X
          },
          y: {
            stacked: true // Mengaktifkan efek stacked di sumbu Y
          }
        }
      })
    }
  }
})
</script>