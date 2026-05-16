<template>
  <MainLayout>
    <div class="income-page">

      <!-- HEADER -->
      <div class="income-header">
        <div>
          <span class="eyebrow">INCOME DASHBOARD</span>
          <h2>Income Summary</h2>
          <p>Monitor net income performance over time</p>
        </div>

        <div class="income-header-actions">
          <select v-model="selectedMonth" class="month-select">
            <option :value="null">All (Yearly)</option>
            <option value="2026-01">Jan 2026</option>
            <option value="2026-02">Feb 2026</option>
            <option value="2026-03">Mar 2026</option>
            <option value="2026-04">Apr 2026</option>
            <option value="2026-05">May 2026</option>
          </select>
          <button type="button" class="toolbar-btn ghost" @click="openExportModal">Export</button>
        </div>
      </div>

      <!-- CHART -->
      <IncomeChart
        :fetch-fn="fetchIncomeData"
        :key="selectedMonth"
      />

    </div>

    <div v-if="showExportModal" class="modal-overlay" @click.self="closeExportModal">
      <div class="modal-card delete-modal">
        <h3 class="modal-title delete-title">Export F&B Income Report</h3>

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
          <button type="button" class="cancel-btn" :disabled="isExporting" @click="closeExportModal">
            Close
          </button>
          <button type="button" class="submit-btn" :disabled="isExporting" @click="handleExport">
            {{ isExporting ? 'Downloading...' : exportSuccess ? 'Download Again' : 'Download Now' }}
          </button>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref } from 'vue';
import MainLayout from '@/layouts/MainLayout.vue';
import IncomeChart from '@/components/IncomeChart.vue';
import { exportSalesCsv, exportSalesPdf, getIncomeSummary } from '@/api/sales';

const selectedMonth = ref(null);

const showExportModal = ref(false);
const selectedExportFormat = ref('pdf');
const isExporting = ref(false);
const exportError = ref('');
const exportSuccess = ref(false);

const getEndOfMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const resolveIncomeDateRange = () => {
  if (!selectedMonth.value) {
    return { startDate: null, endDate: null };
  }

  const startDate = `${selectedMonth.value}-01`;
  const endDay = String(getEndOfMonth(selectedMonth.value)).padStart(2, '0');
  const endDate = `${selectedMonth.value}-${endDay}`;

  return { startDate, endDate };
};

const fetchIncomeData = async () => {
  let response;

  if (!selectedMonth.value) {
    response = await getIncomeSummary(); // BULANAN
  } else {
    const start = `${selectedMonth.value}-01`;
    const endDay = String(getEndOfMonth(selectedMonth.value)).padStart(2, '0');
    const end = `${selectedMonth.value}-${endDay}`;

    response = await getIncomeSummary(start, end); // HARIAN
  }

  const raw = response.data.data;

  // 🔥 NORMALISASI DATA BIAR GAK BOLONG

  if (!selectedMonth.value) {
    // 👉 YEARLY (Jan–Dec)
    const months = Array.from({ length: 12 }, (_, i) =>
      `2026-${String(i + 1).padStart(2, '0')}-01`
    );

    return months.map(m => {
      const found = raw.find(r => r.period === m.slice(0, 7));
      return {
        tanggal: m,
        total: found ? found.totalRevenue : 0
      };
    });
  } else {
    // 👉 DAILY (1–end)
    const days = getEndOfMonth(selectedMonth.value);

    return Array.from({ length: days }, (_, i) => {
      const date = `${selectedMonth.value}-${String(i + 1).padStart(2, '0')}`;
      const found = raw.find(r => r.period === date);

      return {
        tanggal: date,
        total: found ? found.totalRevenue : 0
      };
    });
  }
};

const openExportModal = () => {
  selectedExportFormat.value = 'pdf';
  exportError.value = '';
  showExportModal.value = true;
};

const closeExportModal = () => {
  showExportModal.value = false;
  exportError.value = '';
  exportSuccess.value = false;
};

const handleExport = async () => {
  isExporting.value = true;
  exportError.value = '';
  try {
    const { startDate, endDate } = resolveIncomeDateRange();

    let response;
    let filename;

    if (selectedExportFormat.value === 'pdf') {
      response = await exportSalesPdf(startDate, endDate);
      filename = startDate && endDate
        ? `laporan-pendapatan-fnb-${startDate}-sd-${endDate}.pdf`
        : 'laporan-pendapatan-fnb.pdf';
    } else {
      response = await exportSalesCsv(startDate, endDate);
      filename = startDate && endDate
        ? `laporan-pendapatan-fnb-${startDate}-sd-${endDate}.csv`
        : 'laporan-pendapatan-fnb.csv';
    }

    const blob = new Blob([response.data], {
      type: selectedExportFormat.value === 'pdf'
        ? 'application/pdf'
        : 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    exportSuccess.value = true;
  } catch {
    exportError.value = 'Failed to download report. Please try again.';
  } finally {
    isExporting.value = false;
  }
};
</script>

<style scoped>
.income-page {
  background: #f9fafb;
  padding: 24px;
}

.income-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.income-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #16a34a;
  font-weight: 600;
}

h2 {
  margin: 4px 0;
  font-size: 22px;
  color: #111827;
}

p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.month-select {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 12px;
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

.toolbar-btn.ghost {
  background: #ffffff;
  color: #5d5a57;
  border: 1px solid #e8e2dd;
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

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
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

.modal-error {
  background: #fff1f1;
  border: 1px solid #f0d2d2;
  color: #b42318;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
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

.delete-actions {
  margin-top: 28px;
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

.cancel-btn {
  height: 42px;
  min-width: 98px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid #ece6e1;
  background: #ffffff;
  color: #4e8a67;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
