<template>
  <MainLayout>
    <section class="transaction-page">
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-field search-field">
            <label class="toolbar-label toolbar-label-hidden">Search</label>
            <input
              v-model.trim="search"
              class="toolbar-input"
              type="text"
              placeholder="Search here"
              @keydown.enter.prevent="applyFilters"
            />
          </div>
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

          <button class="toolbar-btn secondary" type="button" :disabled="loading" @click="applyFilters">
            {{ loading ? 'Loading...' : 'Apply' }}
          </button>

          <button class="toolbar-btn ghost" type="button" :disabled="loading" @click="resetFilters">
            Reset
          </button>

          <button class="toolbar-btn primary" type="button" @click="openAddModal">+ Add</button>
        </div>
      </div>

      <div class="table-shell">
        <div v-if="loading" class="table-state">Loading transactions...</div>
        <div v-else-if="requestSucceeded && !transactions.length" class="table-state">No transactions found.</div>

        <table v-else class="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Category</th>
              <th>Total</th>
              <th>Notes</th>
              <th class="actions-col"></th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="tx in transactions" :key="tx.id">
              <td>{{ tx.tanggal }}</td>
              <td>{{ tx.nama }}</td>
              <td>{{ tx.kategori === 'PEMASUKAN' ? 'Pemasukan' : 'Pengeluaran' }}</td>
              <td>{{ formatTableCurrency(tx.total) }}</td>
              <td class="notes-cell">{{ tx.catatan || '-' }}</td>
              <td class="actions-col">
                <button class="row-btn update-btn" type="button" @click="openEditModal(tx)">Update</button>
                <button class="row-btn delete-row-btn" type="button" @click="openDeleteModal(tx)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bottom-bar">
        <button class="export-btn" type="button" :disabled="loading || !transactions.length" @click="exportCsv">
          Export to CSV
        </button>

        <div class="total-box">
          <div class="total-label">Total</div>
          <div class="total-value">{{ formatCurrency(totalNominal) }}</div>
        </div>
      </div>
    </section>

    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-card form-modal">
        <h3 class="modal-title">{{ formMode === 'add' ? 'Add Transaction' : 'Edit Transaction' }}</h3>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-grid">
            <div class="modal-field">
              <label class="modal-label">Date</label>
              <input v-model="form.tanggal" class="modal-input" type="date" />
              <div v-if="formErrors.tanggal" class="field-error">{{ formErrors.tanggal }}</div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Name</label>
              <input v-model.trim="form.nama" class="modal-input" type="text" placeholder="Nama Transaksi" />
              <div v-if="formErrors.nama" class="field-error">{{ formErrors.nama }}</div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Category</label>
              <select v-model="form.kategori" class="modal-input">
                <option value="" disabled>Select category</option>
                <option value="PEMASUKAN">Pemasukan</option>
                <option value="PENGELUARAN">Pengeluaran</option>
              </select>
              <div v-if="formErrors.kategori" class="field-error">{{ formErrors.kategori }}</div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Subtotal</label>
              <input v-model.number="form.subtotal" class="modal-input" type="number" min="1" placeholder="100000" />
              <div v-if="formErrors.subtotal" class="field-error">{{ formErrors.subtotal }}</div>
            </div>

            <div class="modal-field full-width">
              <label class="modal-label">Notes</label>
              <textarea
                v-model.trim="form.catatan"
                class="modal-textarea"
                rows="3"
                placeholder="Catatan"
              ></textarea>
            </div>
          </div>

          <div v-if="modalErrorMessage" class="modal-error">
            {{ modalErrorMessage }}
          </div>

          <div class="modal-actions single-action">
            <button class="submit-btn" type="submit" :disabled="submitting">
              {{ submitting ? 'Saving...' : formMode === 'add' ? 'Done' : 'Edit' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card delete-modal">
        <h3 class="modal-title delete-title">Confirm Delete</h3>

        <div class="delete-copy">
          You’re about to delete the item. Are you sure you want to delete
          <strong>{{ selectedTransaction?.nama }}</strong>?
        </div>

        <div v-if="modalErrorMessage" class="modal-error">
          {{ modalErrorMessage }}
        </div>

        <div class="modal-actions delete-actions">
          <button class="cancel-btn" type="button" :disabled="submitting" @click="closeDeleteModal">Cancel</button>
          <button class="delete-btn" type="button" :disabled="submitting" @click="confirmDelete">
            {{ submitting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  updateTransaction
} from '../api/transactionApi'

const transactions = ref([])
const totalNominal = ref(0)
const count = ref(0)
const loading = ref(false)
const requestSucceeded = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

const search = ref('')
const startDate = ref('')
const endDate = ref('')

const showFormModal = ref(false)
const showDeleteModal = ref(false)
const formMode = ref('add')
const selectedTransaction = ref(null)

const form = ref({
  tanggal: '',
  nama: '',
  kategori: '',
  subtotal: null,
  catatan: ''
})

const formErrors = ref({
  tanggal: '',
  nama: '',
  kategori: '',
  subtotal: ''
})

const modalErrorMessage = ref('')

const queryParams = computed(() => ({
  search: search.value || undefined,
  startDate: startDate.value || undefined,
  endDate: endDate.value || undefined
}))

function clearErrors() {
  errorMessage.value = ''
  modalErrorMessage.value = ''
}

function getFriendlyError(err) {
  const status = err?.response?.status
  const msg = err?.response?.data?.message
  if (msg) return msg
  if (status === 400) return 'Permintaan tidak valid. Mohon cek input.'
  if (status === 401 || status === 403) return 'Sesi login tidak valid atau akses ditolak. Silakan login ulang.'
  if (status === 404) return 'Data transaksi tidak ditemukan.'
  if (status >= 500) return 'Terjadi kesalahan server. Coba lagi nanti.'
  return 'Terjadi kesalahan. Coba lagi.'
}

async function fetchTransactions() {
  clearErrors()
  loading.value = true
  try {
    const res = await getAllTransactions(queryParams.value)
    const data = res?.data || {}
    transactions.value = data.transactions || []
    totalNominal.value = data.totalNominal || 0
    count.value = data.count || 0
    requestSucceeded.value = true
  } catch (err) {
    errorMessage.value = getFriendlyError(err)
    transactions.value = []
    totalNominal.value = 0
    count.value = 0
    requestSucceeded.value = false
  } finally {
    loading.value = false
  }
}

function applyFilters() {
  if (startDate.value && endDate.value && startDate.value > endDate.value) {
    errorMessage.value = 'Start Date tidak boleh lebih besar dari End Date.'
    return
  }
  fetchTransactions()
}

function resetFilters() {
  search.value = ''
  startDate.value = ''
  endDate.value = ''
  fetchTransactions()
}

function resetForm() {
  form.value = {
    tanggal: '',
    nama: '',
    kategori: '',
    subtotal: null,
    catatan: ''
  }
  formErrors.value = { tanggal: '', nama: '', kategori: '', subtotal: '' }
  modalErrorMessage.value = ''
}

function openAddModal() {
  formMode.value = 'add'
  selectedTransaction.value = null
  resetForm()
  showFormModal.value = true
}

function openEditModal(tx) {
  formMode.value = 'edit'
  selectedTransaction.value = tx
  form.value = {
    tanggal: tx.tanggal || '',
    nama: tx.nama || '',
    kategori: tx.kategori || '',
    subtotal: typeof tx.subtotal === 'number' ? tx.subtotal : Number(tx.subtotal || 0),
    catatan: tx.catatan || ''
  }
  formErrors.value = { tanggal: '', nama: '', kategori: '', subtotal: '' }
  modalErrorMessage.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  if (submitting.value) return
  showFormModal.value = false
  resetForm()
  selectedTransaction.value = null
}

function openDeleteModal(tx) {
  selectedTransaction.value = tx
  modalErrorMessage.value = ''
  showDeleteModal.value = true
}

function closeDeleteModal() {
  if (submitting.value) return
  showDeleteModal.value = false
}

function validateForm() {
  const errs = { tanggal: '', nama: '', kategori: '', subtotal: '' }
  if (!form.value.tanggal) errs.tanggal = 'Date wajib diisi.'
  if (!form.value.nama) errs.nama = 'Name wajib diisi.'
  if (!form.value.kategori) errs.kategori = 'Category wajib dipilih.'
  const subtotal = Number(form.value.subtotal)
  if (!subtotal || Number.isNaN(subtotal)) errs.subtotal = 'Subtotal wajib diisi.'
  else if (subtotal <= 0) errs.subtotal = 'Subtotal harus lebih dari 0.'
  formErrors.value = errs
  return !errs.tanggal && !errs.nama && !errs.kategori && !errs.subtotal
}

async function submitForm() {
  modalErrorMessage.value = ''
  if (!validateForm()) return

  submitting.value = true
  try {
    const payload = {
      tanggal: form.value.tanggal,
      nama: form.value.nama,
      kategori: form.value.kategori,
      subtotal: Number(form.value.subtotal),
      catatan: form.value.catatan || ''
    }

    if (formMode.value === 'add') {
      await createTransaction(payload)
    } else {
      await updateTransaction({ id: selectedTransaction.value?.id, ...payload })
    }

    showFormModal.value = false
    resetForm()
    await fetchTransactions()
  } catch (err) {
    modalErrorMessage.value = getFriendlyError(err)
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  modalErrorMessage.value = ''
  if (!selectedTransaction.value?.id) {
    modalErrorMessage.value = 'ID transaksi tidak ditemukan.'
    return
  }

  submitting.value = true
  try {
    await deleteTransaction(selectedTransaction.value.id)
    showDeleteModal.value = false
    selectedTransaction.value = null
    await fetchTransactions()
  } catch (err) {
    modalErrorMessage.value = getFriendlyError(err)
  } finally {
    submitting.value = false
  }
}

function csvEscape(value) {
  const v = value === null || value === undefined ? '' : String(value)
  const safe = v.replace(/"/g, '""')
  return `"${safe}"`
}

function exportCsv() {
  const header = ['Date', 'Name', 'Category', 'Total', 'Notes']
  const rows = transactions.value.map((tx) => [
    tx.tanggal,
    tx.nama,
    tx.kategori === 'PEMASUKAN'
      ? 'Pemasukan'
      : tx.kategori === 'PENGELUARAN'
        ? 'Pengeluaran'
        : tx.kategori,
    tx.total,
    tx.catatan || ''
  ])
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transactions.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function formatCurrency(amount) {
  const n = Number(amount || 0)
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n)
}

function formatTableCurrency(amount) {
  const n = Number(amount || 0)
  return new Intl.NumberFormat('id-ID').format(n)
}

onMounted(() => {
  fetchTransactions()
})
</script>

<style scoped>
.transaction-page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.error-banner {
  background: #fff1f1;
  border: 1px solid #f3d3d3;
  color: #b42318;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.toolbar-left {
  flex: 1;
  min-width: 320px;
}

.toolbar-right {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.search-field {
  max-width: 360px;
}

.date-field {
  min-width: 160px;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 700;
  color: #6f6b68;
  padding-left: 2px;
  min-height: 18px;
  display: flex;
  align-items: center;
}

.toolbar-label-hidden {
  visibility: hidden;
}

.toolbar-input {
  height: 44px;
  border: 1px solid #ece6e1;
  border-radius: 14px;
  background: #ffffff;
  padding: 0 16px;
  font-size: 14px;
  color: #2b2b2b;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.toolbar-input::placeholder {
  color: #b0aaa6;
}

.toolbar-input:focus {
  border-color: #c8d8ce;
  box-shadow: 0 0 0 3px rgba(56, 123, 87, 0.12);
}

.date-input {
  min-width: 150px;
}

.toolbar-btn {
  height: 44px;
  border-radius: 14px;
  padding: 0 18px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.toolbar-btn:hover {
  transform: translateY(-1px);
}

.toolbar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.toolbar-btn.primary {
  background: #e4efe8;
  color: #2d2d2d;
  border: 1px solid #e4efe8;
  min-width: 112px;
}

.toolbar-btn.secondary {
  background: #3f7d4f;
  color: #fff;
  border: 1px solid #3f7d4f;
}

.toolbar-btn.ghost {
  background: #ffffff;
  color: #5d5a57;
  border: 1px solid #e8e2dd;
}

.table-shell {
  background: #ffffff;
  border: 1px solid #eedfd8;
  border-radius: 22px;
  overflow: hidden;
  max-width: 100%;
}

.table-state {
  padding: 22px;
  color: #756f6b;
  font-size: 14px;
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}

.transaction-table thead tr {
  background: #f3e6e1;
}

.transaction-table th,
.transaction-table td {
  padding: 16px 14px;
  text-align: left;
  font-size: 14px;
  color: #262626;
  border-bottom: 1px solid #f1e4df;
}

.transaction-table th {
  font-weight: 800;
  font-size: 13px;
}

.notes-cell {
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-col {
  width: 190px;
  white-space: nowrap;
  text-align: right;
}

.row-btn {
  height: 30px;
  min-width: 72px;
  border: none;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: #ffffff;
}

.row-btn + .row-btn {
  margin-left: 8px;
}

.update-btn {
  background: #3f7d5c;
}

.delete-row-btn {
  background: #b63124;
}

.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.export-btn {
  min-width: 140px;
  height: 44px;
  border-radius: 10px;
  border: 1px solid #ece7e2;
  background: #ffffff;
  color: #4e8a67;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.export-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.total-box {
  display: flex;
  align-items: stretch;
  border: 1.5px solid #4e8a67;
  border-radius: 8px;
  overflow: hidden;
  min-width: 278px;
  height: 44px;
  background: #fff;
}

.total-label {
  min-width: 96px;
  background: #3f7d5c;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 18px;
}

.total-value {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  min-width: 182px;
  font-size: 13px;
  font-weight: 700;
  color: #232323;
  background: #ffffff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(27, 27, 27, 0.48);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  z-index: 1000;
}

.modal-card {
  background: #ffffff;
  border-radius: 36px;
  width: 100%;
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.14);
}

.form-modal {
  max-width: 760px;
  padding: 42px 44px 30px;
}

.delete-modal {
  max-width: 480px;
  padding: 42px 44px 36px;
}

.modal-title {
  margin: 0 0 28px;
  font-size: 24px;
  font-weight: 800;
  color: #171717;
}

.delete-title {
  margin-bottom: 14px;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 20px 20px;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.full-width {
  grid-column: 1 / -1;
}

.modal-label {
  font-size: 12px;
  font-weight: 700;
  color: #2f2f2f;
}

.modal-input,
.modal-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #ece6e1;
  border-radius: 10px;
  background: #ffffff;
  font-size: 14px;
  color: #2a2a2a;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.modal-input {
  height: 44px;
  padding: 0 16px;
}

.modal-input[type='date'] {
  min-width: 0;
}

.modal-textarea {
  padding: 12px 16px;
  resize: vertical;
  min-height: 68px;
}

.modal-input:focus,
.modal-textarea:focus {
  border-color: #c8d8ce;
  box-shadow: 0 0 0 3px rgba(56, 123, 87, 0.12);
}

.field-error {
  font-size: 12px;
  color: #b42318;
  font-weight: 600;
}

.modal-error {
  background: #fff1f1;
  border: 1px solid #f0d2d2;
  color: #b42318;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 6px;
}

.single-action {
  margin-top: 2px;
}

.submit-btn {
  min-width: 100px;
  height: 42px;
  border: none;
  border-radius: 8px;
  background: #4b7f44;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  padding: 0 18px;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-copy {
  font-size: 16px;
  color: #262626;
  line-height: 1.35;
  max-width: 360px;
}

.delete-actions {
  margin-top: 28px;
}

.cancel-btn,
.delete-btn {
  height: 42px;
  min-width: 98px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.cancel-btn {
  border: 1px solid #ece6e1;
  background: #ffffff;
  color: #4e8a67;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.delete-btn {
  border: 2px solid #4e8a67;
  background: #ffffff;
  color: #4e8a67;
}

.cancel-btn:disabled,
.delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 1180px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .toolbar-right {
    justify-content: flex-start;
  }
}

@media (max-width: 860px) {
  .form-modal,
  .delete-modal {
    padding: 28px 24px 24px;
    border-radius: 26px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-right {
    align-items: stretch;
  }

  .toolbar-btn,
  .date-field,
  .search-field {
    width: 100%;
    max-width: 100%;
  }

  .transaction-table {
    min-width: 700px;
  }

  .bottom-bar {
    align-items: stretch;
  }

  .total-box {
    margin-left: 0;
  }
}
</style>