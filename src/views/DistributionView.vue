<template>
  <MainLayout>
    <section class="distribution-page">
      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-field search-field">
            <label class="toolbar-label toolbar-label-hidden">Search</label>
            <input
              v-model.trim="searchQuery"
              class="toolbar-input"
              type="text"
              placeholder="Search item or department"
              @keydown.enter.prevent="applySearch"
            />
          </div>
        </div>

        <div class="toolbar-right">
          <button class="toolbar-btn secondary" type="button" :disabled="loading" @click="applySearch">
            {{ loading ? 'Loading...' : 'Search' }}
          </button>
          <button class="toolbar-btn ghost" type="button" :disabled="loading" @click="resetSearch">Reset</button>
          <button class="toolbar-btn ghost" type="button" @click="openExportModal">Export</button>
          <button class="toolbar-btn primary" type="button" @click="openAddModal">+ Add Distribusi</button>
        </div>
      </div>

      <div class="table-shell">
        <div v-if="loading" class="table-state">Loading distributions...</div>
        <div v-else-if="!distributions.length" class="table-state">No distributions found.</div>

        <table v-else class="distribution-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Item Name</th>
              <th>Units</th>
              <th>Category</th>
              <th>Department</th>
              <th class="actions-col"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="distribution in distributions" :key="distribution.id">
              <td>{{ distribution.id }}</td>
              <td>{{ formatDate(distribution.distributionDate) }}</td>
              <td>{{ distribution.itemName || '-' }}</td>
              <td>{{ distribution.units ?? '-' }}</td>
              <td>{{ distribution.category || '-' }}</td>
              <td>{{ distribution.department || '-' }}</td>
              <td class="actions-col">
                <button class="row-btn update-btn" type="button" @click="openEditModal(distribution)">Update</button>
                <button class="row-btn delete-row-btn" type="button" @click="openDeleteModal(distribution)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="showFormModal" class="modal-overlay" @click.self="closeFormModal">
      <div class="modal-card form-modal">
        <h3 class="modal-title">{{ formMode === 'add' ? 'Add Distribusi Barang' : 'Update Distribusi Barang' }}</h3>

        <form class="modal-form" @submit.prevent="submitForm">
          <div class="form-grid">
            <div class="modal-field full-width">
              <label class="modal-label">Item</label>
              <select v-model="form.itemId" class="modal-input" :disabled="submitting">
                <option value="" disabled>Select item</option>
                <option v-for="item in items" :key="getItemId(item)" :value="getItemId(item)">
                  {{ item.name }}
                </option>
              </select>
              <div v-if="formErrors.itemId" class="field-error">{{ formErrors.itemId }}</div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Item Name</label>
              <input class="modal-input readonly-input" type="text" :value="selectedItem?.name || '-'" readonly />
            </div>

            <div class="modal-field">
              <label class="modal-label">Category</label>
              <input class="modal-input readonly-input" type="text" :value="selectedItem?.category || '-'" readonly />
            </div>

            <div class="modal-field">
              <label class="modal-label">Department</label>
              <input
                v-model.trim="form.department"
                class="modal-input"
                type="text"
                placeholder="Masukkan department"
                :disabled="submitting"
              />
              <div v-if="formErrors.department" class="field-error">{{ formErrors.department }}</div>
            </div>

            <div class="modal-field">
              <label class="modal-label">Units</label>
              <input
                v-model.number="form.units"
                class="modal-input"
                type="number"
                min="1"
                placeholder="1"
                :disabled="submitting"
              />
              <div v-if="formErrors.units" class="field-error">{{ formErrors.units }}</div>
            </div>
          </div>

          <div v-if="modalErrorMessage" class="modal-error">
            {{ modalErrorMessage }}
          </div>

          <div class="modal-actions single-action">
            <button class="submit-btn" type="submit" :disabled="submitting">
              {{ submitting ? 'Saving...' : formMode === 'add' ? 'Done' : 'Update' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal-card delete-modal">
        <h3 class="modal-title delete-title">Confirm Delete</h3>

        <div class="delete-copy">
          You’re about to delete distribution data for
          <strong>{{ distributionToDelete?.itemName || `ID ${distributionToDelete?.id}` }}</strong
          >. Are you sure you want to continue?
        </div>

        <div v-if="deleteErrorMessage" class="modal-error">
          {{ deleteErrorMessage }}
        </div>

        <div class="modal-actions delete-actions">
          <button class="cancel-btn" type="button" :disabled="deleting" @click="closeDeleteModal">Cancel</button>
          <button class="delete-btn" type="button" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-card delete-modal">
        <h3 class="modal-title delete-title">Export Distribution Report</h3>

        <div v-if="exportSuccess" class="success-banner">
          Report successfully downloaded!
        </div>

        <div v-if="exportError" class="modal-error">
          Failed to download report. Please try again.
        </div>

        <div class="modal-field">
          <label class="modal-label">Report Format</label>
          <select v-model="selectedExportFormat" class="modal-input">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
          </select>
        </div>

        <div class="modal-actions delete-actions">
          <button class="cancel-btn" type="button" :disabled="isExporting" @click="closeExportModal">Close</button>
          <button class="submit-btn" type="button" :disabled="isExporting" @click="handleExport">
            {{ isExporting ? 'Downloading...' : exportSuccess ? 'Download Again' : 'Download Now' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import MainLayout from '../layouts/MainLayout.vue'
import { getAllItems } from '../api/itemApi'
import {
  createDistribution,
  deleteDistribution,
  exportDistributionCsv,
  exportDistributionPdf,
  getDistributions,
  updateDistribution
} from '../api/distributionApi'

const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const modalErrorMessage = ref('')

const distributions = ref([])
const items = ref([])
const searchQuery = ref('')

const showFormModal = ref(false)
const formMode = ref('add')
const editingDistributionId = ref(null)
const selectedItem = ref(null)
const showDeleteModal = ref(false)
const distributionToDelete = ref(null)
const deleting = ref(false)
const deleteErrorMessage = ref('')

// Export modal state
const showExportModal = ref(false)
const selectedExportFormat = ref('pdf')
const isExporting = ref(false)
const exportError = ref('')
const exportSuccess = ref(false)

const form = ref({
  itemId: '',
  department: '',
  units: null
})

const formErrors = ref({
  itemId: '',
  department: '',
  units: ''
})

const itemsById = computed(() => {
  const map = new Map()
  for (const item of items.value) {
    const id = getItemId(item)
    if (id) map.set(id, item)
  }
  return map
})

watch(
  () => form.value.itemId,
  (itemId) => {
    selectedItem.value = itemId ? itemsById.value.get(itemId) || null : null
  }
)

function getItemId(item) {
  return item?.idItem || item?.itemId || item?.id || ''
}

function getFriendlyError(err) {
  const status = err?.response?.status
  const msg = err?.response?.data?.message

  if (
    msg &&
    !msg.toLowerCase().includes('authentication') &&
    !msg.toLowerCase().includes('access is denied')
  ) {
    return msg
  }

  if (status === 401 || status === 403) {
    return 'Sesi login tidak valid atau akses ditolak. Silakan login ulang.'
  }

  if (status === 400) return 'Validasi gagal atau stok tidak mencukupi.'
  if (status === 404) return 'Data tidak ditemukan.'
  if (status >= 500) return 'Terjadi kesalahan server. Coba lagi nanti.'

  return 'Terjadi kesalahan. Coba lagi.'
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function clearPageError() {
  errorMessage.value = ''
}

function resetForm() {
  form.value = {
    itemId: '',
    department: '',
    units: null
  }
  formMode.value = 'add'
  editingDistributionId.value = null
  selectedItem.value = null
  formErrors.value = {
    itemId: '',
    department: '',
    units: ''
  }
  modalErrorMessage.value = ''
}

function getDeleteErrorMessage(err) {
  const status = err?.response?.status
  const msg = err?.response?.data?.message
  if (msg) return msg
  if (status === 404) return 'Data distribusi tidak ditemukan atau sudah dihapus.'
  if (status === 403) return 'Akses ditolak. Anda tidak memiliki izin untuk menghapus data ini.'
  if (status >= 500) return 'Terjadi kesalahan server saat menghapus data. Coba lagi nanti.'
  return 'Gagal menghapus data distribusi. Coba lagi.'
}

function validateForm() {
  const errs = {
    itemId: '',
    department: '',
    units: ''
  }

  if (!form.value.itemId) errs.itemId = 'Item wajib dipilih.'
  if (!form.value.department) errs.department = 'Department wajib diisi.'

  const units = Number(form.value.units)
  if (!units || Number.isNaN(units)) errs.units = 'Units wajib diisi.'
  else if (units <= 0) errs.units = 'Units harus lebih dari 0.'

  formErrors.value = errs
  return !errs.itemId && !errs.department && !errs.units
}

function openAddModal() {
  resetForm()
  formMode.value = 'add'
  showFormModal.value = true
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function resolveItemFromDistribution(distribution) {
  const rowName = normalizeText(distribution?.itemName)
  const rowCategory = normalizeText(distribution?.category)
  if (!rowName) return null

  const byName = items.value.filter((item) => normalizeText(item?.name) === rowName)
  if (!byName.length) return null
  if (byName.length === 1) return byName[0]

  if (rowCategory) {
    const byNameAndCategory = byName.find((item) => normalizeText(item?.category) === rowCategory)
    if (byNameAndCategory) return byNameAndCategory
  }

  return null
}

function openEditModal(distribution) {
  modalErrorMessage.value = ''
  clearPageError()

  const matchedItem = resolveItemFromDistribution(distribution)
  const resolvedItemId = getItemId(matchedItem)
  if (!matchedItem || !resolvedItemId) {
    errorMessage.value =
      'Data item untuk distribusi ini tidak dapat dipetakan. Pastikan item dengan nama dan kategori yang sesuai tersedia.'
    return
  }

  formMode.value = 'edit'
  editingDistributionId.value = distribution?.id ?? null
  selectedItem.value = matchedItem
  form.value = {
    itemId: resolvedItemId,
    department: distribution?.department || '',
    units: Number(distribution?.units || 0)
  }
  formErrors.value = {
    itemId: '',
    department: '',
    units: ''
  }
  showFormModal.value = true
}

function closeFormModal() {
  if (submitting.value) return
  showFormModal.value = false
  resetForm()
}

function openDeleteModal(distribution) {
  distributionToDelete.value = distribution
  deleteErrorMessage.value = ''
  showDeleteModal.value = true
}

function closeDeleteModal() {
  if (deleting.value) return
  showDeleteModal.value = false
  distributionToDelete.value = null
  deleteErrorMessage.value = ''
}

async function fetchItems() {
  try {
    const res = await getAllItems()
    items.value = res?.data?.data || res?.data || []
  } catch (err) {
    items.value = []
    errorMessage.value = getFriendlyError(err)
  }
}

async function fetchDistributions(search = searchQuery.value) {
  clearPageError()
  loading.value = true
  try {
    const res = await getDistributions(search)
    distributions.value = res?.data?.data || res?.data || []
  } catch (err) {
    distributions.value = []
    errorMessage.value = getFriendlyError(err)
  } finally {
    loading.value = false
  }
}

function applySearch() {
  fetchDistributions(searchQuery.value)
}

function resetSearch() {
  searchQuery.value = ''
  clearPageError()
  fetchDistributions('')
}

async function submitForm() {
  modalErrorMessage.value = ''
  if (!validateForm()) return

  submitting.value = true
  try {
    const payload = {
      itemId: form.value.itemId,
      department: form.value.department,
      units: Number(form.value.units)
    }

    if (formMode.value === 'add') {
      await createDistribution(payload)
    } else {
      if (!editingDistributionId.value) {
        modalErrorMessage.value = 'ID distribusi untuk update tidak ditemukan.'
        return
      }
      await updateDistribution(editingDistributionId.value, payload)
    }
    showFormModal.value = false
    resetForm()
    await fetchDistributions()
  } catch (err) {
    modalErrorMessage.value = getFriendlyError(err)
  } finally {
    submitting.value = false
  }
}

async function confirmDelete() {
  deleteErrorMessage.value = ''
  if (!distributionToDelete.value?.id) {
    deleteErrorMessage.value = 'ID distribusi tidak ditemukan.'
    return
  }

  deleting.value = true
  try {
    await deleteDistribution(distributionToDelete.value.id)
    closeDeleteModal()
    await fetchDistributions()
  } catch (err) {
    deleteErrorMessage.value = getDeleteErrorMessage(err)
  } finally {
    deleting.value = false
  }
}

const openExportModal = () => {
  selectedExportFormat.value = 'pdf'
  exportError.value = ''
  showExportModal.value = true
}

const closeExportModal = () => {
  showExportModal.value = false
  exportError.value = ''
  exportSuccess.value = false
}

const handleExport = async () => {
  isExporting.value = true
  exportError.value = ''
  try {
    const categoryFilter = ''

    let response
    let filename

    if (selectedExportFormat.value === 'pdf') {
      response = await exportDistributionPdf(categoryFilter)
      filename = categoryFilter
        ? `laporan-pemakaian-barang-${categoryFilter.toLowerCase().replace(/\s+/g, '-')}.pdf`
        : 'laporan-pemakaian-barang.pdf'
    } else {
      response = await exportDistributionCsv(categoryFilter)
      filename = categoryFilter
        ? `laporan-pemakaian-barang-${categoryFilter.toLowerCase().replace(/\s+/g, '-')}.csv`
        : 'laporan-pemakaian-barang.csv'
    }

    const blob = new Blob([response.data], {
      type: selectedExportFormat.value === 'pdf'
        ? 'application/pdf'
        : 'text/csv;charset=utf-8;'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    exportSuccess.value = true
  } catch {
    exportError.value = 'Failed to download report. Please try again.'
  } finally {
    isExporting.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchItems(), fetchDistributions()])
})
</script>

<style scoped>
.distribution-page {
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
  min-width: 280px;
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
  min-width: 140px;
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

.distribution-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
}

.distribution-table thead tr {
  background: #f3e6e1;
}

.distribution-table th,
.distribution-table td {
  padding: 16px 14px;
  text-align: left;
  font-size: 14px;
  color: #262626;
  border-bottom: 1px solid #f1e4df;
}

.distribution-table th {
  font-weight: 800;
  font-size: 13px;
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

.modal-input {
  width: 100%;
  height: 44px;
  padding: 0 16px;
  box-sizing: border-box;
  border: 1px solid #ece6e1;
  border-radius: 10px;
  background: #ffffff;
  font-size: 14px;
  color: #2a2a2a;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.modal-input:focus {
  border-color: #c8d8ce;
  box-shadow: 0 0 0 3px rgba(56, 123, 87, 0.12);
}

.readonly-input {
  background: #f7f7f7;
  color: #666;
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

.success-banner {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 14px;
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

@media (max-width: 860px) {
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
    align-items: stretch;
  }

  .toolbar-btn,
  .search-field {
    width: 100%;
    max-width: 100%;
  }

  .form-modal {
    padding: 28px 24px 24px;
    border-radius: 26px;
  }

  .delete-modal {
    padding: 28px 24px 24px;
    border-radius: 26px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .distribution-table {
    min-width: 760px;
  }
}
</style>
