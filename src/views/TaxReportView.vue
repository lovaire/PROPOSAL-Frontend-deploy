<template>
  <MainLayout>
    <section class="tax-report-page">
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="header-section">
        <h2 class="page-title">Dokumen Laporan Pajak</h2>
        <p class="page-subtitle">Buku besar rekapitulasi Dasar Pengenaan Pajak (DPP) untuk Pemasukan & Pengeluaran.</p>
      </div>

      <div class="toolbar">
        <div class="toolbar-left action-buttons">
          <button 
            class="toolbar-btn primary-export" 
            type="button" 
            :disabled="loading || !combinedRecords.length" 
            @click="showExportModal = true"
          >
            📥 Generate Official Report
          </button>
          <a href="https://djponline.pajak.go.id/account/login" target="_blank" rel="noopener noreferrer" class="toolbar-btn djp-btn">
            🌐 Portal DJP Online
          </a>
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
          <button class="toolbar-btn secondary" type="button" :disabled="loading" @click="fetchReport">
            {{ loading ? 'Memuat...' : 'Apply' }}
          </button>
          <button class="toolbar-btn ghost" type="button" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>

      <div class="table-shell">
        <div v-if="loading" class="table-state">Menyiapkan buku besar pajak...</div>
        <table v-else class="transaction-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Keterangan / Sumber Data</th>
              <th>Kategori</th>
              <th class="right-align dpp-col">DPP (Subtotal)</th>
              <th class="right-align ppn-col">Total PPN</th>
              <th class="right-align sc-col">Total Service Charge</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(tx, index) in combinedRecords" :key="tx.uid">
              <td>{{ index + 1 }}</td>
              <td>{{ tx.tanggal }}</td>
              <td>{{ tx.nama }} <span v-if="tx.kategori === 'VENDOR'" class="vendor-tag">(Invoice Supplier)</span></td>
              <td>
                <span :class="tx.kategori === 'PEMASUKAN' ? 'badge-in' : 'badge-out'">
                  {{ tx.kategori === 'PEMASUKAN' ? 'Pendapatan' : 'Beban/Pengeluaran' }}
                </span>
              </td>
              <td class="right-align dpp-col">{{ formatCurrency(tx.subtotal) }}</td>
              <td class="right-align ppn-col">{{ formatCurrency(tx.ppnAmount) }}</td>
              <td class="right-align sc-col">{{ formatCurrency(tx.serviceChargeAmount) }}</td>
            </tr>
            
            <tr class="summary-divider" v-if="combinedRecords.length > 0">
              <td colspan="7"></td>
            </tr>
            <tr class="total-row income-total" v-if="combinedRecords.length > 0">
              <td colspan="4" class="right-align"><strong>TOTAL PAJAK KELUARAN (Dipungut dari Pendapatan):</strong></td>
              <td class="right-align dpp-col"><strong>{{ formatCurrency(summary.incomeDPP) }}</strong></td>
              <td class="right-align ppn-col"><strong>{{ formatCurrency(summary.incomePPN) }}</strong></td>
              <td class="right-align sc-col"><strong>{{ formatCurrency(summary.incomeSC) }}</strong></td>
            </tr>
            <tr class="total-row expense-total" v-if="combinedRecords.length > 0">
              <td colspan="4" class="right-align"><strong>TOTAL PAJAK MASUKAN (Dibayar dari Pengeluaran):</strong></td>
              <td class="right-align dpp-col"><strong>{{ formatCurrency(summary.expenseDPP) }}</strong></td>
              <td class="right-align ppn-col"><strong>{{ formatCurrency(summary.expensePPN) }}</strong></td>
              <td class="right-align sc-col"><strong>{{ formatCurrency(summary.expenseSC) }}</strong></td>
            </tr>

            <tr v-if="combinedRecords.length === 0">
              <td colspan="7" class="empty-state">Tidak ada data transaksi pada rentang waktu ini.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showExportModal" class="modal-overlay" @click.self="showExportModal = false">
      <div class="modal-card export-modal">
        <h3 class="modal-title">Konfigurasi Ekspor Laporan</h3>
        
        <div class="export-options">
          <div class="modal-field">
            <label class="modal-label">Pilih Format Dokumen:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input type="radio" v-model="exportConfig.format" value="csv"> 
                CSV (Data Excel)
              </label>
              <label class="radio-label">
                <input type="radio" v-model="exportConfig.format" value="pdf"> 
                PDF (Cetak Resmi)
              </label>
            </div>
          </div>

          <div class="modal-field mt-18">
            <label class="modal-label">Tingkat Detail Laporan:</label>
            <select v-model="exportConfig.type" class="modal-input" :disabled="exportConfig.format === 'pdf'">
              <option value="detail">Rincian Detail (Buku Besar)</option>
              <option value="summary">Ringkasan Total Saja</option>
            </select>
            <small v-if="exportConfig.format === 'pdf'" class="help-text">*Format PDF otomatis menggunakan rincian detail berstandar SPT.</small>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showExportModal = false">Batal</button>
          <button class="submit-btn" @click="handleExportProcess">Unduh Sekarang</button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { getAllTransactions } from '@/api/transactionApi'
import { getAllInvoices } from '@/api/invoiceSupplierApi'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const combinedRecords = ref([])
const loading = ref(false)
const errorMessage = ref('')
const startDate = ref('')
const endDate = ref('')

const showExportModal = ref(false)
const exportConfig = ref({
  format: 'pdf',
  type: 'detail'
})

const summary = computed(() => {
  let incomeDPP = 0, incomePPN = 0, incomeSC = 0;
  let expenseDPP = 0, expensePPN = 0, expenseSC = 0;

  combinedRecords.value.forEach(tx => {
    if (tx.kategori === 'PEMASUKAN') {
      incomeDPP += (tx.subtotal || 0);
      incomePPN += (tx.ppnAmount || 0);
      incomeSC += (tx.serviceChargeAmount || 0);
    } else { // PENGELUARAN atau VENDOR
      expenseDPP += (tx.subtotal || 0);
      expensePPN += (tx.ppnAmount || 0);
      expenseSC += (tx.serviceChargeAmount || 0);
    }
  });

  return { incomeDPP, incomePPN, incomeSC, expenseDPP, expensePPN, expenseSC };
})

async function fetchReport() {
  errorMessage.value = ''
  
  // LOGIKA VALIDASI TANGGAL
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
    
    // FETCH DATA KASIR & VENDOR SEKALIGUS
    const [transRes, vendorRes] = await Promise.all([
      getAllTransactions(params),
      getAllInvoices(params)
    ])

    // Normalisasi Transaksi Kasir
    const normalizedTrans = (transRes.data?.transactions || []).map(t => ({
      uid: `tx-${t.id}`,
      tanggal: t.tanggal,
      nama: t.nama,
      kategori: t.kategori,
      subtotal: t.subtotal || 0,
      ppnAmount: t.ppnAmount || 0,
      serviceChargeAmount: t.serviceChargeAmount || 0,
      rawDate: new Date(t.tanggal)
    }))

    // Normalisasi Invoice Vendor
    const normalizedVendor = (vendorRes.data || []).map(v => ({
      uid: `vd-${v.id}`,
      tanggal: v.orderDate,
      nama: v.orderName,
      kategori: 'VENDOR', 
      subtotal: v.subtotal || 0,
      ppnAmount: v.taxAmount || 0,
      serviceChargeAmount: 0, // Vendor tidak ada service charge
      rawDate: new Date(v.orderDate)
    }))

    // Gabungkan dan urutkan dari tanggal paling lama ke terbaru (Format Buku Besar)
    combinedRecords.value = [...normalizedTrans, ...normalizedVendor].sort((a, b) => a.rawDate - b.rawDate)

  } catch (err) {
    errorMessage.value = 'Gagal mengambil laporan. Pastikan Anda memiliki hak akses.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// FUNGSI RESET FILTER BARU
function resetFilters() {
  startDate.value = ''
  endDate.value = ''
  errorMessage.value = ''
  fetchReport()
}

function handleExportProcess() {
  if (exportConfig.value.format === 'csv') {
    if (exportConfig.value.type === 'detail') {
      exportToExcelDetail()
    } else {
      exportToExcelSummary()
    }
  } else if (exportConfig.value.format === 'pdf') {
    generateRealPDF()
  }
  showExportModal.value = false
}

// ==========================================
// FUNGSI GENERATOR PDF 
// ==========================================
function generateRealPDF() {
  const doc = new jsPDF('p', 'pt', 'a4');

  // --- 1. KOP SURAT (HEADER) ---
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('CANSEBU ADVENTURE & RESORT', 40, 50);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('NPWP: 01.234.567.8-901.000 | Jl. Bhayangkara No.1, Ciomas, Banten', 40, 65);
  doc.text('Email: finance@cansebu.com | Telp: (021) 1234-5678', 40, 78);
  
  doc.setLineWidth(1.5);
  doc.line(40, 88, 555, 88);
  doc.setLineWidth(0.5);
  doc.line(40, 91, 555, 91);

  // --- 2. JUDUL DOKUMEN ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('LAMPIRAN SPT MASA - BUKU BESAR PAJAK', 40, 125);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periode Laporan : ${startDate.value || 'Semua Data'} s.d ${endDate.value || 'Sekarang'}`, 40, 140);
  doc.text(`Tanggal Cetak   : ${new Date().toLocaleDateString('id-ID')}`, 40, 152);

  // --- 3. TABEL RINCIAN TRANSAKSI ---
  const tableColumn = ["No", "Tanggal", "Keterangan", "Tipe", "DPP (Subtotal)", "PPN", "Svc. Charge"];
  const tableRows = [];

  combinedRecords.value.forEach((tx, i) => {
    tableRows.push([
      i + 1,
      tx.tanggal,
      tx.nama,
      tx.kategori === 'PEMASUKAN' ? 'Pendapatan' : 'Pengeluaran',
      formatCurrency(tx.subtotal || 0),
      formatCurrency(tx.ppnAmount || 0),
      formatCurrency(tx.serviceChargeAmount || 0)
    ]);
  });

  autoTable(doc, {
    startY: 170,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [45, 106, 79], textColor: 255 }, 
    styles: { fontSize: 8, cellPadding: 4 },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    }
  });

  // --- 4. TABEL REKAPITULASI TOTAL ---
  let finalY = doc.lastAutoTable.finalY + 20;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REKAPITULASI AKHIR:', 40, finalY);

  const summaryRows = [
    ['Pajak Keluaran (Dari Pendapatan)', formatCurrency(summary.value.incomeDPP), formatCurrency(summary.value.incomePPN), formatCurrency(summary.value.incomeSC)],
    ['Pajak Masukan (Dari Pengeluaran)', formatCurrency(summary.value.expenseDPP), formatCurrency(summary.value.expensePPN), formatCurrency(summary.value.expenseSC)]
  ];

  autoTable(doc, {
    startY: finalY + 10,
    head: [['Keterangan', 'Total DPP', 'Total PPN', 'Total Svc. Charge']],
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 9, fontStyle: 'bold', cellPadding: 3 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  finalY = doc.lastAutoTable.finalY + 40;

  // --- 5. KOLOM TANDA TANGAN (FOOTER) ---
  if (finalY > 700) {
    doc.addPage();
    finalY = 50;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Tangerang Selatan, ..........................', 380, finalY);
  doc.text('Mengetahui / Menyetujui,', 380, finalY + 15);
  doc.text('(_________________________)', 380, finalY + 80);
  doc.text('Manajer Keuangan / Direktur', 380, finalY + 95);

  // --- 6. SIMPAN FILE ---
  doc.save(`Buku_Besar_Pajak_Cansebu_${startDate.value || 'All'}.pdf`);
}

function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value)
  const safe = v.replace(/"/g, '""')
  return `"${safe}"`
}

function exportToExcelDetail() {
  const header = ['No', 'Tanggal', 'Keterangan', 'Kategori', 'DPP (Subtotal)', 'Total PPN', 'Total Service Charge']
  const rows = combinedRecords.value.map((tx, index) => [
    index + 1, tx.tanggal, tx.nama, tx.kategori === 'PEMASUKAN' ? 'Pendapatan' : 'Beban/Pengeluaran',
    tx.subtotal || 0, tx.ppnAmount || 0, tx.serviceChargeAmount || 0
  ])
  rows.push(['', '', '', '', '', '', '']);
  rows.push(['', '', 'TOTAL PAJAK KELUARAN (PENDAPATAN)', '', summary.value.incomeDPP, summary.value.incomePPN, summary.value.incomeSC]);
  rows.push(['', '', 'TOTAL PAJAK MASUKAN (PENGELUARAN)', '', summary.value.expenseDPP, summary.value.expensePPN, summary.value.expenseSC]);
  downloadCSV(header, rows, `Buku_Besar_Pajak_Detail_${startDate.value || 'All'}.csv`)
}

function exportToExcelSummary() {
  const header = ['Kategori Pajak', 'Total Dasar Pengenaan Pajak (DPP)', 'Total PPN', 'Total Service Charge']
  const rows = [
    ['Pajak Keluaran (Pendapatan)', summary.value.incomeDPP, summary.value.incomePPN, summary.value.incomeSC],
    ['Pajak Masukan (Pengeluaran)', summary.value.expenseDPP, summary.value.expensePPN, summary.value.expenseSC]
  ]
  downloadCSV(header, rows, `Ringkasan_Laporan_Pajak_${startDate.value || 'All'}.csv`)
}

function downloadCSV(header, rows, filename) {
  const csvContent = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  link.click()
  URL.revokeObjectURL(url)
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount || 0)
}

onMounted(() => {
  fetchReport()
})
</script>

<style scoped>
.tax-report-page { display: flex; flex-direction: column; gap: 20px; }
.header-section { margin-bottom: 0px; }
.page-title { font-size: 24px; font-weight: 800; color: #171717; margin: 0; }
.page-subtitle { color: #6f6b68; font-size: 14px; margin-top: 4px; }

/* Styling untuk Error Banner (disamakan dengan halaman lain) */
.error-banner { 
  background: #fff1f1; 
  color: #b42318; 
  border: 1px solid #f3d3d3;
  padding: 12px 14px; 
  border-radius: 12px; 
  font-size: 14px;
  font-weight: 600; 
  margin-bottom: 5px;
}

.table-shell {
  background: #ffffff; border: 1px solid #eedfd8; border-radius: 16px;
  overflow: hidden; margin-top: 10px;
}
.transaction-table { width: 100%; border-collapse: collapse; text-align: left; }
.transaction-table th { padding: 14px 20px; font-size: 13px; font-weight: 800; color: #5d5a57; background: #faf8f7; border-bottom: 2px solid #eedfd8;}
.transaction-table td { padding: 14px 20px; font-size: 13px; color: #262626; border-bottom: 1px solid #f1e4df; }

.vendor-tag { font-size: 10px; font-weight: 700; color: #1565c0; background: #e3f2fd; padding: 2px 6px; border-radius: 4px; margin-left: 6px;}
.badge-in { background: #e4efe8; color: #2d6a4f; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px; }
.badge-out { background: #fff1f1; color: #b42318; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 11px; }

.right-align { text-align: right; }
.dpp-col { color: #2b4c38; }
.ppn-col { color: #b42318; }
.sc-col { color: #6f6b68; }

.summary-divider td { padding: 0; border-top: 2px dashed #eedfd8; }
.total-row td { background: #fdfdfd; font-size: 13px; padding: 12px 20px; border-bottom: none; }
.income-total td { color: #2d6a4f; }
.expense-total td { color: #b42318; }

.empty-state { text-align: center; color: #8e8a86; padding: 40px !important; }
.table-state { padding: 24px; color: #6f6b68; text-align: center; }

.toolbar { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;}
.action-buttons { display: flex; gap: 12px; }
.toolbar-right { display: flex; gap: 12px; align-items: flex-end; }
.toolbar-field { display: flex; flex-direction: column; gap: 6px; }
.toolbar-label { font-size: 12px; font-weight: 700; color: #6f6b68; }
.toolbar-input { height: 40px; border: 1px solid #ece6e1; border-radius: 10px; padding: 0 16px; font-size: 13px; outline: none; }
.toolbar-btn {
  height: 40px; border-radius: 10px; padding: 0 20px;
  font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: 0.2s;
}
.toolbar-btn.secondary { background: #3f7d4f; color: #fff; border: none; }
.toolbar-btn.ghost { background: #ffffff; border: 1px solid #ece6e1; color: #6f6b68; } /* Style untuk tombol reset */
.primary-export { background: #e4efe8; color: #2d2d2d; border: 1px solid #c8d8ce;}
.primary-export:hover:not(:disabled) { background: #c8d8ce; }
.primary-export:disabled { opacity: 0.6; cursor: not-allowed; }
.djp-btn { background: #fdf2cd; color: #8a6a1c; border: 1px solid #fae69e;}
.djp-btn:hover { background: #fae69e; transform: translateY(-1px); }

/* Modal Styles */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(27, 27, 27, 0.48);
  display: flex; justify-content: center; align-items: center; padding: 20px; z-index: 1000;
}
.modal-card {
  background: #ffffff; border-radius: 26px; width: 100%; box-shadow: 0 18px 60px rgba(0, 0, 0, 0.14);
}
.export-modal { max-width: 520px; padding: 36px 40px 30px; }
.modal-title { margin: 0 0 24px; font-size: 22px; font-weight: 800; color: #171717; }
.export-options { display: flex; flex-direction: column; gap: 16px; }
.modal-field { display: flex; flex-direction: column; gap: 10px; }
.modal-label { font-size: 13px; font-weight: 700; color: #2f2f2f; }
.radio-group { display: flex; gap: 20px; }
.radio-label { font-size: 14px; color: #2a2a2a; display: flex; align-items: center; gap: 8px; cursor: pointer; }
.modal-input {
  width: 100%; height: 44px; border: 1px solid #ece6e1; border-radius: 10px;
  background: #ffffff; padding: 0 16px; font-size: 14px; color: #2a2a2a; outline: none;
}
.modal-input:disabled { background: #f5f5f5; cursor: not-allowed; opacity: 0.7;}
.help-text { font-size: 11px; color: #6f6b68; margin-top: 4px;}
.mt-18 { margin-top: 18px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
.cancel-btn, .submit-btn {
  height: 42px; min-width: 100px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
}
.cancel-btn { border: 1px solid #ece6e1; background: #ffffff; color: #4e8a67; }
.submit-btn { border: none; background: #4b7f44; color: #ffffff; }
</style>