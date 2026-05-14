<template>
  <MainLayout>
    <section class="tax-recap-page">
      <div class="header-section">
        <h2 class="page-title">Rekapitulasi Pajak</h2>
        <p class="page-subtitle">Pantau total PPN dan Service Charge yang terkumpul.</p>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
           <button 
            class="export-btn" 
            type="button" 
            :disabled="loading || !transactions.length" 
            @click="exportTaxCsv"
          >
            Export to CSV
          </button>
        </div>

        <div class="toolbar-right">
          <div class="toolbar-field date-field">
            <label class="toolbar-label">Start Date</label>
            <input v-model="startDate" class="toolbar-input date-input" type="date" />
          </div>

          <div class="toolbar-field date-field">
            <label class="toolbar-label">End Date</label>
            <input v-model="endDate" class="toolbar-input date-input" type="date" />
          </div>

          <button class="toolbar-btn secondary" type="button" :disabled="loading" @click="fetchData">
            {{ loading ? 'Loading...' : 'Apply Filter' }}
          </button>
          
          <button class="toolbar-btn ghost" type="button" @click="resetFilters">Reset</button>
        </div>
      </div>

      <div class="recap-grid" v-if="recapData">
        <div class="recap-card">
          <div class="card-label">Total PPN (10%)</div>
          <div class="card-value">{{ formatCurrency(recapData.totalPpn) }}</div>
        </div>

        <div class="recap-card">
          <div class="card-label">Total Service Charge (5%)</div>
          <div class="card-value">{{ formatCurrency(recapData.totalServiceCharge) }}</div>
        </div>

        <div class="recap-card highlight">
          <div class="card-label">Total Pajak Terkumpul</div>
          <div class="card-value total">{{ formatCurrency(recapData.totalPajakKeseluruhan) }}</div>
          <div class="card-subtext">Dari {{ recapData.jumlahTransaksi }} Transaksi</div>
        </div>
      </div>

      <div class="table-shell" v-if="recapData">
        <div class="table-header">
          <h3 class="table-title">Rincian Transaksi Pendapatan Pajak</h3>
        </div>
        
        <div v-if="loadingTable" class="table-state">Loading data...</div>
        <table v-else class="transaction-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Sumber Pendapatan</th>
              <th>Kategori</th>
              <th>Total Pajak (PPN + SC)</th>
              <th>Total Akhir</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tx, index) in transactions" :key="tx.id">
              <td>{{ index + 1 }}</td>
              <td>{{ tx.tanggal }}</td>
              <td>{{ tx.nama }}</td>
              <td>{{ tx.kategori === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran' }}</td>
              <td class="tax-col">{{ formatCurrency((tx.ppnAmount || 0) + (tx.serviceChargeAmount || 0)) }}</td>
              <td class="total-col">{{ formatCurrency(tx.total) }}</td>
            </tr>
            <tr v-if="transactions.length === 0">
              <td colspan="6" class="empty-state">Tidak ada transaksi pada periode ini.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
    </section>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getTaxRecap, getAllTransactions } from '@/api/transactionApi'

const recapData = ref(null)
const transactions = ref([])
const loading = ref(false)
const loadingTable = ref(false)
const errorMessage = ref('')
const startDate = ref('')
const endDate = ref('')

async function fetchData() {
  loading.value = true
  loadingTable.value = true
  errorMessage.value = ''
  
  try {
    const params = {
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }
    
    const [recapRes, listRes] = await Promise.all([
      getTaxRecap(params),
      getAllTransactions(params)
    ])
    
    recapData.value = recapRes.data
    transactions.value = listRes.data?.transactions || []
    
  } catch (err) {
    errorMessage.value = 'Gagal mengambil data. Pastikan Anda memiliki akses Admin/Manajerial.'
    console.error(err)
  } finally {
    loading.value = false
    loadingTable.value = false
  }
}

function resetFilters() {
  startDate.value = ''
  endDate.value = ''
  fetchData()
}

// Fungsi Helper untuk Escape Karakter CSV
function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value)
  const safe = v.replace(/"/g, '""')
  return `"${safe}"`
}

// Fungsi Ekspor CSV
function exportTaxCsv() {
  const header = ['No', 'Tanggal', 'Sumber Pendapatan', 'Kategori', 'Total Pajak (PPN+SC)', 'Total Akhir']
  
  const rows = transactions.value.map((tx, index) => [
    index + 1,
    tx.tanggal,
    tx.nama,
    tx.kategori === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran',
    (tx.ppnAmount || 0) + (tx.serviceChargeAmount || 0),
    tx.total
  ])

  const csvContent = [header, ...rows]
    .map((r) => r.map(csvEscape).join(','))
    .join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  const fileName = `rekap_pajak_${startDate.value || 'all'}_to_${endDate.value || 'now'}.csv`
  
  link.href = url
  link.setAttribute('download', fileName)
  link.click()
  URL.revokeObjectURL(url)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount || 0)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.tax-recap-page { display: flex; flex-direction: column; gap: 24px; }
.header-section { margin-bottom: 8px; }
.page-title { font-size: 24px; font-weight: 800; color: #171717; margin: 0; }
.page-subtitle { color: #6f6b68; font-size: 14px; margin-top: 4px; }

.recap-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;
}
.recap-card {
  background: #ffffff; border: 1px solid #eedfd8; border-radius: 22px;
  padding: 28px; display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.recap-card.highlight { background: #f3f8f5; border-color: #c8d8ce; }
.card-label { font-size: 14px; font-weight: 700; color: #5d5a57; }
.card-value { font-size: 28px; font-weight: 800; color: #232323; }
.card-value.total { color: #3f7d4f; }
.card-subtext { font-size: 12px; color: #8e8a86; font-weight: 600; }

.table-shell {
  background: #ffffff; border: 1px solid #eedfd8; border-radius: 22px;
  overflow: hidden; margin-top: 10px;
}
.table-header { padding: 20px 24px; border-bottom: 1px solid #f1e4df; background: #faf8f7; }
.table-title { margin: 0; font-size: 16px; font-weight: 700; color: #2d2d2d; }
.transaction-table { width: 100%; border-collapse: collapse; text-align: left; }
.transaction-table th { padding: 16px 24px; font-size: 13px; font-weight: 800; color: #5d5a57; background: #f3e6e1;}
.transaction-table td { padding: 16px 24px; font-size: 14px; color: #262626; border-bottom: 1px solid #f1e4df; }
.tax-col { color: #b42318; font-weight: 600; }
.total-col { font-weight: 700; }
.empty-state { text-align: center; color: #8e8a86; padding: 30px !important; }
.table-state { padding: 24px; color: #6f6b68; text-align: center; }

.toolbar { display: flex; justify-content: space-between; align-items: flex-end; }
.toolbar-left { display: flex; align-items: flex-end; }
.toolbar-right { display: flex; gap: 12px; align-items: flex-end; }
.toolbar-field { display: flex; flex-direction: column; gap: 6px; }
.toolbar-label { font-size: 12px; font-weight: 700; color: #6f6b68; }
.toolbar-input {
  height: 44px; border: 1px solid #ece6e1; border-radius: 14px;
  padding: 0 16px; font-size: 14px; outline: none;
}
.toolbar-btn {
  height: 44px; border-radius: 14px; padding: 0 20px;
  font-size: 14px; font-weight: 700; cursor: pointer;
}
.toolbar-btn.secondary { background: #3f7d4f; color: #fff; border: none; }
.toolbar-btn.ghost { background: #fff; border: 1px solid #e8e2dd; color: #5d5a57; }

.export-btn {
  height: 44px; border-radius: 14px; padding: 0 20px;
  background: #ffffff; color: #3f7d4f; border: 1.5px solid #3f7d4f;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: all 0.2s ease;
}
.export-btn:hover:not(:disabled) { background: #f3f8f5; }
.export-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.error-banner { background: #fff1f1; color: #b42318; padding: 12px; border-radius: 12px; font-weight: 600; }
</style>