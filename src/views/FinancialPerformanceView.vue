<template>
  <MainLayout>
    <section class="performance-page">
      <div v-if="errorMessage" class="error-banner">⚠️ {{ errorMessage }}</div>

      <div class="header-section">
        <h2 class="page-title">Financial Performance</h2>
        <p class="page-subtitle">Pantau kesehatan finansial melalui perbandingan pemasukan, pengeluaran, dan profit bulanan.</p>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <span class="status-indicator" v-if="isFilterActive">⚡ Filter Periode Aktif</span>
        </div>
        <div class="toolbar-right">
          <div class="toolbar-field">
            <label class="toolbar-label">Start Date</label>
            <input v-model="startDate" class="toolbar-input" type="date" />
          </div>
          <div class="toolbar-field">
            <label class="toolbar-label">End Date</label>
            <input v-model="endDate" class="toolbar-input" type="date" />
          </div>
          <button class="toolbar-btn secondary" :disabled="loading" @click="fetchData">
            {{ loading ? 'Memuat...' : 'Terapkan' }}
          </button>
          <button class="toolbar-btn ghost" @click="resetFilters">Reset</button>
        </div>
      </div>

      <div class="summary-grid" v-if="summaryData">
        <div class="summary-card card-revenue">
          <div class="card-icon">📈</div>
          <div>
            <div class="card-label">Total Pemasukan</div>
            <div class="card-value">{{ formatCurrency(summaryData.totalPemasukan) }}</div>
          </div>
        </div>
        <div class="summary-card card-expense">
          <div class="card-icon">📉</div>
          <div>
            <div class="card-label">Total Pengeluaran</div>
            <div class="card-value">{{ formatCurrency(summaryData.totalPengeluaran) }}</div>
          </div>
        </div>
        <div class="summary-card card-profit" :class="{ 'negative': summaryData.totalKeuntungan < 0 }">
          <div class="card-icon">💰</div>
          <div>
            <div class="card-label">Net Profit (Keuntungan)</div>
            <div class="card-value">{{ formatCurrency(summaryData.totalKeuntungan) }}</div>
          </div>
        </div>
      </div>

      <div class="chart-section">
        <h3 class="chart-title">Grafik Performa Bulanan</h3>
        
        <div class="chart-wrapper">
          <div v-if="loading" class="chart-state">Sedang menarik data dari server...</div>
          <div v-else-if="!chartRecords.length" class="chart-state">Tidak ada data keuangan pada periode terpilih.</div>
          
          <div v-else class="bar-chart-container">
            <div class="chart-bars">
              <div v-for="(item, index) in chartRecords" :key="index" class="chart-column">
                <div class="bar-group">
                  
                  <div class="bar bar-in" :style="{ height: getBarHeight(item.pemasukan) }">
                    <div class="tooltip">
                      <div class="tooltip-title">Total Pemasukan: {{ formatCurrency(item.pemasukan) }}</div>
                      <div class="tooltip-divider"></div>
                      <div class="tooltip-row"><span>• Kasir/Umum:</span> <span>{{ formatCurrency(item.pemasukanKasir) }}</span></div>
                      <div class="tooltip-row"><span>• Sales F&B:</span> <span>{{ formatCurrency(item.pemasukanFnb) }}</span></div>
                    </div>
                  </div>

                  <div class="bar bar-out" :style="{ height: getBarHeight(item.pengeluaran) }">
                    <div class="tooltip">
                      <div class="tooltip-title">Total Pengeluaran: {{ formatCurrency(item.pengeluaran) }}</div>
                      <div class="tooltip-divider"></div>
                      <div class="tooltip-row"><span>• Operasional Kasir:</span> <span>{{ formatCurrency(item.pengeluaranKasir) }}</span></div>
                      <div class="tooltip-row"><span>• Invoice Vendor:</span> <span>{{ formatCurrency(item.pengeluaranVendor) }}</span></div>
                    </div>
                  </div>

                  <div class="bar bar-prof" :class="{ 'bar-neg': item.keuntungan < 0 }" :style="{ height: getBarHeight(Math.abs(item.keuntungan)) }">
                    <div class="tooltip">
                      <div class="tooltip-title">{{ item.keuntungan >= 0 ? 'Net Profit (Untung):' : 'Net Loss (Rugi):' }}</div>
                      <div class="tooltip-divider"></div>
                      <div class="tooltip-row" style="font-size: 13px; font-weight: 800;">
                        <span>Hasil Bersih:</span> <span>{{ formatCurrency(item.keuntungan) }}</span>
                      </div>
                    </div>
                  </div>

                </div>
                <div class="column-label">{{ item.periode }}</div>
              </div>
            </div>

            <div class="chart-legend">
              <div class="legend-item"><span class="dot dot-in"></span> Pemasukan</div>
              <div class="legend-item"><span class="dot dot-out"></span> Pengeluaran</div>
              <div class="legend-item"><span class="dot dot-prof"></span> Net Profit (Untung)</div>
              <div class="legend-item"><span class="dot dot-neg"></span> Net Loss (Rugi)</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getFinancialPerformance } from '@/api/performanceApi'

const loading = ref(false)
const summaryData = ref(null)
const chartRecords = ref([])
const errorMessage = ref('')
const isFilterActive = ref(false)

const startDate = ref('')
const endDate = ref('')
const maxVal = ref(1)

async function fetchData() {
  errorMessage.value = ''
  // Validasi agar Start Date tidak boleh melompati End Date
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    errorMessage.value = 'Start Date tidak boleh lebih besar dari End Date.'
    return
  }

  loading.value = true
  isFilterActive.value = !!(startDate.value || endDate.value)

  try {
    const params = {
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }

    const res = await getFinancialPerformance(params)
    summaryData.value = res.data
    chartRecords.value = res.data.chartData || []

    // Cari batas atas tertinggi agar proporsi kalkulasi tinggi batang CSS akurat (tidak pecah layout)
    let highest = 0
    chartRecords.value.forEach(r => {
      const maxInRow = Math.max(Number(r.pemasukan), Number(r.pengeluaran), Math.abs(Number(r.keuntungan)))
      if (maxInRow > highest) highest = maxInRow
    })
    maxVal.value = highest > 0 ? highest : 1

  } catch (err) {
    errorMessage.value = 'Gagal memuat data performa keuangan dari server.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

function getBarHeight(value) {
  const pct = (Number(value) / maxVal.value) * 100
  return `${Math.max(pct, 2)}%` // Jaminan minimal tinggi 2% agar tetap tampak garis tipis jika nominal sangat kecil
}

function resetFilters() {
  startDate.value = ''
  endDate.value = ''
  errorMessage.value = ''
  isFilterActive.value = false
  fetchData()
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(amount || 0)
}

onMounted(fetchData)
</script>

<style scoped>
.performance-page { display: flex; flex-direction: column; gap: 24px; }
.header-section { margin-bottom: 4px; }
.page-title { font-size: 28px; font-weight: 800; color: #171717; }
.page-subtitle { font-size: 15px; color: #6f6b68; margin-top: 6px; }

.error-banner { background: #fff1f1; border: 1px solid #f3d3d3; color: #b42318; padding: 12px 14px; border-radius: 12px; font-size: 14px; font-weight: 600; }

.toolbar { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px; background: white; padding: 16px 20px; border-radius: 16px; border: 1px solid #eedfd8; }
.status-indicator { background: #fff8e1; border: 1px solid #ffe082; color: #b78103; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px; }
.toolbar-right { display: flex; gap: 12px; align-items: flex-end; }
.toolbar-field { display: flex; flex-direction: column; gap: 6px; }
.toolbar-label { font-size: 12px; font-weight: 700; color: #6f6b68; }
.toolbar-input { height: 42px; border: 1px solid #ece6e1; border-radius: 12px; padding: 0 14px; font-size: 13px; outline: none; background: #faf8f7; }
.toolbar-btn { height: 42px; border-radius: 12px; padding: 0 20px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.toolbar-btn.secondary { background: #3f7d5c; color: white; border: none; }
.toolbar-btn.ghost { background: white; border: 1px solid #e8e2dd; color: #5d5a57; }

.summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.summary-card { background: white; border: 1px solid #eedfd8; border-radius: 20px; padding: 24px; display: flex; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); }
.card-icon { font-size: 32px; background: #f5f5f5; width: 60px; height: 60px; display: flex; align-items: center; justify-content: center; border-radius: 16px; }
.card-revenue .card-icon { background: #e8f5e9; }
.card-expense .card-icon { background: #ffebee; }
.card-profit .card-icon { background: #e3f2fd; }

.card-label { font-size: 13px; font-weight: 700; color: #6f6b68; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;}
.card-value { font-size: 26px; font-weight: 800; color: #212121; }
.card-profit .card-value { color: #1565c0; }
.card-profit.negative .card-value { color: #d84315; }
.card-profit.negative .card-icon { background: #fff3e0; }

.chart-section { background: white; border: 1px solid #eedfd8; border-radius: 22px; padding: 32px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); }
.chart-title { font-size: 18px; font-weight: 800; color: #171717; margin-bottom: 30px; }
.chart-wrapper { min-height: 340px; display: flex; justify-content: center; align-items: center; }
.chart-state { color: #8e8a86; font-size: 15px; font-weight: 600; }

/* REVISI TOTAL CSS: Grafik Batang Polos & Rata Baseline */
.bar-chart-container { width: 100%; display: flex; flex-direction: column; gap: 24px; }
.chart-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 280px; border-bottom: 2px solid #e8e2dd; padding-bottom: 12px; }
.chart-column { display: flex; flex-direction: column; align-items: center; flex: 1; height: 100%; justify-content: flex-end; gap: 14px; position: relative;}
.bar-group { display: flex; align-items: flex-end; gap: 8px; height: 100%; width: 100%; justify-content: center; position: relative;}

.bar { width: 24px; border-radius: 6px 6px 0 0; transition: all 0.3s ease; cursor: pointer; position: relative; }
.bar:hover { filter: brightness(0.85); z-index: 10; }

/* STYLING TOOLTIP BOX DETIL ARUS PER MODUL */
.tooltip { 
  visibility: hidden; width: 230px; background-color: rgba(23, 23, 23, 0.96); color: #fff; 
  text-align: left; border-radius: 10px; padding: 12px 14px; position: absolute; 
  z-index: 30; bottom: 110%; left: 50%; transform: translateX(-50%); 
  font-size: 12px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25); opacity: 0; transition: opacity 0.25s; pointer-events: none;
}
.tooltip::after { content: ""; position: absolute; top: 100%; left: 50%; margin-left: -6px; border-width: 6px; border-style: solid; border-color: rgba(23, 23, 23, 0.96) transparent transparent transparent;}
.bar:hover .tooltip { visibility: visible; opacity: 1; }

.tooltip-title { font-weight: 800; font-size: 13px; margin-bottom: 4px; color: #ffffff; }
.tooltip-divider { height: 1px; background: rgba(255, 255, 255, 0.15); margin: 6px 0; }
.tooltip-row { display: flex; justify-content: space-between; color: #dcdcdc; font-weight: 500; margin-top: 3px;}

.bar-in { background-color: #4caf50; }
.bar-out { background-color: #ef5350; }
.bar-prof { background-color: #42a5f5; }
.bar-prof.bar-neg { background-color: #ff9800; } /* Tetap kokoh berdiri rata di baseline, tidak melayang lagi */

.column-label { font-size: 13px; font-weight: 700; color: #5d5a57; white-space: nowrap; }

.chart-legend { display: flex; justify-content: center; gap: 30px; margin-top: 15px; flex-wrap: wrap;}
.legend-item { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: #5d5a57; }
.dot { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
.dot-in { background: #4caf50; }
.dot-out { background: #ef5350; }
.dot-prof { background: #42a5f5; }
.dot-neg { background: #ff9800; }

@media (max-width: 960px) {
  .summary-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .toolbar-right { flex-direction: column; align-items: stretch; }
  .chart-bars { overflow-x: auto; justify-content: flex-start; gap: 30px; }
  .chart-column { min-width: 110px; }
}
</style>