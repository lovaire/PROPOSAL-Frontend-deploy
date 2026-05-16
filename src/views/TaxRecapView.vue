<template>
  <MainLayout>
    <section class="tax-recap-page">
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="header-section">
        <h2 class="page-title">Rekapitulasi Pajak</h2>
        <p class="page-subtitle">Pantau arus pajak pemasukan (Pelanggan) dan pengeluaran (Supplier & Operasional).</p>
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
           <button 
            class="export-btn" 
            type="button" 
            :disabled="loading || !combinedRecords.length" 
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
        <div class="recap-card card-income">
          <div class="card-label">Total Pajak Pemasukan</div>
          <div class="card-value">{{ formatCurrency(recapData.totalPajakPemasukan) }}</div>
        </div>

        <div class="recap-card card-expense">
          <div class="card-label">Total Pajak Pengeluaran</div>
          <div class="card-value">{{ formatCurrency(recapData.totalPajakPengeluaran) }}</div>
        </div>

        <div class="recap-card card-net">
          <div class="card-label">Selisih Pajak (Net)</div>
          <div class="card-value highlight">{{ formatCurrency(recapData.netPajak) }}</div>
          <div class="card-sub">{{ recapData.jumlahTransaksi }} Data Terhitung</div>
        </div>
      </div>

      <div class="table-section">
        <h3 class="section-title">Rincian Semua Arus Pajak</h3>
        
        <div class="table-shell">
          <div v-if="loading" class="table-state">Mengambil data...</div>
          <div v-else-if="!combinedRecords.length" class="table-state">Tidak ada data ditemukan pada periode ini.</div>

          <table v-else class="tax-table">
            <thead>
              <tr>
                <th style="width: 50px;">No</th>
                <th>Tanggal</th>
                <th>Sumber / Nama Order</th>
                <th>Tipe</th>
                <th>Kategori</th>
                <th>Total Pajak</th>
                <th>Total Akhir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in combinedRecords" :key="item.uid">
                <td>{{ index + 1 }}</td>
                <td>{{ item.displayDate }}</td>
                <td>{{ item.displayTitle }}</td>
                <td>
                  <span class="source-tag" :class="item.sourceType.toLowerCase()">
                    {{ item.sourceType }}
                  </span>
                </td>
                <td>
                  <span :class="['cat-badge', item.displayCategory.toLowerCase()]">
                    {{ item.displayCategory }}
                  </span>
                </td>
                <td class="tax-col">{{ formatCurrency(item.displayTax) }}</td>
                <td class="total-col">{{ formatCurrency(item.displayTotal) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { getTaxRecap, getAllTransactions } from '../api/transactionApi'
import { getAllInvoices } from '../api/invoiceSupplierApi'

const loading = ref(false)
const combinedRecords = ref([])
const recapData = ref(null)
const errorMessage = ref('') // TAMBAHAN: State error

const startDate = ref('')
const endDate = ref('')

async function fetchData() {
  // TAMBAHAN: Logika Validasi Tanggal
  errorMessage.value = ''
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    errorMessage.value = 'Start Date tidak boleh lebih besar dari End Date.'
    return
  }

  loading.value = true
  try {
    const params = {
      startDate: startDate.value || undefined,
      endDate: endDate.value || undefined
    }
    
    const [recapRes, transRes, vendorRes] = await Promise.all([
      getTaxRecap(params),
      getAllTransactions(params),
      getAllInvoices(params)
    ])
    
    recapData.value = recapRes.data
    
    const normalizedTrans = (transRes.data.transactions || []).map(t => ({
      uid: `tx-${t.id}`,
      displayDate: t.tanggal,
      displayTitle: t.nama,
      displayCategory: t.kategori,
      displayTax: (t.ppnAmount || 0) + (t.serviceChargeAmount || 0),
      displayTotal: t.total,
      sourceType: 'KASIR',
      rawDate: new Date(t.tanggal)
    }))

    const normalizedVendor = (vendorRes.data || []).map(v => ({
      uid: `vd-${v.id}`,
      displayDate: v.orderDate,
      displayTitle: v.orderName,
      displayCategory: 'PENGELUARAN',
      displayTax: v.taxAmount || 0,
      displayTotal: v.amount,
      sourceType: 'VENDOR',
      rawDate: new Date(v.orderDate)
    }))

    combinedRecords.value = [...normalizedTrans, ...normalizedVendor].sort((a, b) => b.rawDate - a.rawDate)

  } catch (error) {
    errorMessage.value = 'Gagal mengambil data pajak dari server.'
    console.error(error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  startDate.value = ''
  endDate.value = ''
  errorMessage.value = ''
  fetchData()
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount || 0)
}

function csvEscape(v) {
  const s = String(v || '').replace(/"/g, '""')
  return `"${s}"`
}

function exportTaxCsv() {
  const header = ['No', 'Tanggal', 'Sumber/Nama', 'Tipe', 'Kategori', 'Total Pajak', 'Total Akhir']
  const rows = combinedRecords.value.map((item, i) => [
    i + 1,
    item.displayDate,
    item.displayTitle,
    item.sourceType,
    item.displayCategory,
    item.displayTax,
    item.displayTotal
  ])
  
  const content = [header, ...rows].map(r => r.map(csvEscape).join(',')).join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `full_tax_recap_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(fetchData)
</script>

<style scoped>
.tax-recap-page { display: flex; flex-direction: column; gap: 24px; }

/* TAMBAHAN: Style untuk Error Banner */
.error-banner {
  background: #fff1f1;
  border: 1px solid #f3d3d3;
  color: #b42318;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
}

.header-section { margin-bottom: 8px; }
.page-title { font-size: 24px; font-weight: 800; color: #171717; margin-bottom: 4px; }
.page-subtitle { font-size: 14px; color: #6f6b68; }

.recap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.recap-card {
  background: #ffffff; border: 1px solid #eedfd8; border-radius: 20px;
  padding: 24px; display: flex; flex-direction: column; gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.card-income { border-left: 6px solid #3f7d5c; }
.card-expense { border-left: 6px solid #b42318; background-color: #fff8f8; }
.card-net { background: #3f7d5c; color: #ffffff; border: none; }
.card-net .card-label, .card-net .card-sub { color: #e4efe8; }
.card-net .highlight { color: #ffffff; }

.card-label { font-size: 13px; font-weight: 700; color: #6f6b68; text-transform: uppercase; letter-spacing: 0.5px; }
.card-value { font-size: 24px; font-weight: 800; color: #262626; }
.card-sub { font-size: 12px; font-weight: 600; }

.section-title { font-size: 18px; font-weight: 800; color: #171717; margin-bottom: 16px; }

.table-shell { background: #ffffff; border: 1px solid #eedfd8; border-radius: 20px; overflow: hidden; }
.tax-table { width: 100%; border-collapse: collapse; min-width: 800px; }
.tax-table thead tr { background: #f3e6e1; }
.tax-table th, .tax-table td { padding: 16px; text-align: left; font-size: 14px; color: #262626; border-bottom: 1px solid #f1e4df; }

.source-tag {
  font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;
  border: 1px solid transparent;
}
.source-tag.kasir { background: #f0f0f0; color: #555; border-color: #ddd; }
.source-tag.vendor { background: #e3f2fd; color: #1565c0; border-color: #bbdefb; }

.cat-badge { padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.cat-badge.pemasukan { background: #e4efe8; color: #3f7d5c; }
.cat-badge.pengeluaran { background: #fff1f1; color: #b42318; }

.tax-col { color: #b42318; font-weight: 600; }
.total-col { font-weight: 700; }

.toolbar { display: flex; justify-content: space-between; align-items: flex-end; }
.toolbar-right { display: flex; gap: 12px; align-items: flex-end; }
.toolbar-field { display: flex; flex-direction: column; gap: 6px; }
.toolbar-label { font-size: 12px; font-weight: 700; color: #6f6b68; }
.toolbar-input { height: 44px; border: 1px solid #ece6e1; border-radius: 14px; padding: 0 16px; font-size: 14px; outline: none; }
.toolbar-btn { height: 44px; border-radius: 14px; padding: 0 20px; font-size: 14px; font-weight: 700; cursor: pointer; }
.toolbar-btn.secondary { background: #3f7d4f; color: #fff; border: none; }
.toolbar-btn.ghost { background: #ffffff; border: 1px solid #ece6e1; color: #6f6b68; }
.export-btn { height: 44px; background: white; border: 1px solid #ece6e1; border-radius: 14px; padding: 0 20px; color: #3f7d5c; font-weight: 700; cursor: pointer; }

@media (max-width: 1024px) {
  .recap-grid { grid-template-columns: 1fr; }
  .toolbar { flex-direction: column; align-items: stretch; gap: 16px; }
}
</style>