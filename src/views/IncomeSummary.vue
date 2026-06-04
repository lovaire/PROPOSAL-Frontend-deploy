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
          <button type="button" class="toolbar-btn ghost" @click="openExportModal">
            Export
          </button>
        </div>
      </div>

      <!-- 🔥 TOOLBAR (FIX SESUAI PERMINTAAN) -->
      <div class="toolbar">
        <div class="toolbar-left">
          <span v-if="isFilterActive" class="status-indicator">
            ⚡ Filter Periode Aktif
          </span>
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

          <button class="toolbar-btn secondary" @click="applyFilter">
            Apply
          </button>

          <button class="toolbar-btn ghost" @click="resetFilter">
            Reset
          </button>
        </div>
      </div>

      <!-- CHART -->
      <IncomeChart
        :fetch-fn="fetchIncomeData"
        :key="chartKey"
      />

    </div>

    <!-- MODAL EXPORT -->
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
          <button class="cancel-btn" :disabled="isExporting" @click="closeExportModal">
            Close
          </button>
          <button class="submit-btn" :disabled="isExporting" @click="handleExport">
            {{ isExporting ? 'Downloading...' : exportSuccess ? 'Download Again' : 'Download Now' }}
          </button>
        </div>
      </div>
    </div>

  </MainLayout>
</template>

<script setup>
import { ref, computed } from 'vue';
import MainLayout from '@/layouts/MainLayout.vue';
import IncomeChart from '@/components/IncomeChart.vue';
import { exportSalesCsv, exportSalesPdf, getIncomeSummary } from '@/api/sales';

// FILTER
const startDate = ref('');
const endDate = ref('');
const chartKey = ref(0);

const isFilterActive = computed(() => startDate.value && endDate.value);

const applyFilter = () => {
  chartKey.value++;
};

const resetFilter = () => {
  startDate.value = '';
  endDate.value = '';
  chartKey.value++;
};

// EXPORT
const showExportModal = ref(false);
const selectedExportFormat = ref('pdf');
const isExporting = ref(false);
const exportError = ref('');
const exportSuccess = ref(false);

// FETCH DATA
const fetchIncomeData = async () => {
  let response;

  if (!startDate.value || !endDate.value) {
    response = await getIncomeSummary();
  } else {
    response = await getIncomeSummary(startDate.value, endDate.value);
  }

  const raw = response.data.data;

  // NORMALISASI
  if (!startDate.value || !endDate.value) {
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
    const start = new Date(startDate.value);
    const end = new Date(endDate.value);

    const days = [];
    let current = new Date(start);

    while (current <= end) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, '0');
      const dd = String(current.getDate()).padStart(2, '0');

      const dateStr = `${yyyy}-${mm}-${dd}`;
      const found = raw.find(r => r.period === dateStr);

      days.push({
        tanggal: dateStr,
        total: found ? found.totalRevenue : 0
      });

      current.setDate(current.getDate() + 1);
    }

    return days;
  }
};

// EXPORT HANDLER
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
    const start = startDate.value;
    const end = endDate.value;

    let response;
    let filename;

    if (selectedExportFormat.value === 'pdf') {
      response = await exportSalesPdf(start, end);
      filename = start && end
        ? `laporan-pendapatan-fnb-${start}-sd-${end}.pdf`
        : 'laporan-pendapatan-fnb.pdf';
    } else {
      response = await exportSalesCsv(start, end);
      filename = start && end
        ? `laporan-pendapatan-fnb-${start}-sd-${end}.csv`
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

/* HEADER */
.income-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.income-header-actions {
  display: flex;
  gap: 12px;
}

/* TEXT */
.eyebrow {
  font-size: 10px;
  letter-spacing: 2px;
  color: #16a34a;
  font-weight: 600;
}

h2 {
  margin: 4px 0;
  font-size: 22px;
}

p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

/* 🔥 TOOLBAR */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  background: white;
  padding: 16px 20px;
  border-radius: 16px;
  border: 1px solid #eedfd8;
  margin-bottom: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.status-indicator {
  background: #fff8e1;
  border: 1px solid #ffe082;
  color: #b78103;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 20px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 700;
}

.toolbar-input {
  height: 42px;
  border: 1px solid #ece6e1;
  border-radius: 12px;
  padding: 0 14px;
  font-size: 13px;
  background: #faf8f7;
}

/* BUTTON */
.toolbar-btn {
  height: 42px;
  border-radius: 12px;
  padding: 0 18px;
  font-size: 13px;
  font-weight: 700;
}

.toolbar-btn.secondary {
  background: #3f7d5c;
  color: white;
}

.toolbar-btn.ghost {
  background: white;
  border: 1px solid #e8e2dd;
}
</style>