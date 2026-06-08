<template>
  <MainLayout>
    <div class="page-header">
      <h2>Master Items</h2>
      <button class="create-btn" @click="openAddModal()">
        <span>+</span>
        <span class="hidden sm:inline">Add Item</span>
      </button>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Units</th>
            <th>Safety Stock</th>
            <th>Status</th>
            <th class="action-col">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="state-text">Loading data from server...</td>
          </tr>

          <tr v-else v-for="item in items" :key="item.idItem">
            <td>{{ item.idItem.substring(0, 8) }}...</td>
            <td>{{ item.name }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.unit }}</td>
            <td>{{ item.safetyStock }}</td>
            <td>
              <span :class="['status-badge', item.isActive ? 'active' : 'inactive']">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="action-buttons">
              <button class="update-btn" @click="openEditModal(item)">Update</button>
              <button class="delete-btn" @click="handleDelete(item.idItem, item.name)">
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="!loading && items.length === 0">
            <td colspan="7" class="state-text">No items found in the database.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card">
        <h2>{{ isEdit ? 'Update Item' : 'Add New Item' }}</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Product ID</label>
            <input :value="isEdit ? currentItem.idItem : 'XXXXXX'" type="text" disabled />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Item Name</label>
              <input v-model="currentItem.name" type="text" placeholder="Enter item name" required />
            </div>
            <div class="form-group">
              <label>Category</label>
              <select v-model="currentItem.category" required>
                <option value="" disabled>Select Category</option>
                <option value="Amenities">Amenities</option>
                <option value="Konsumsi">Konsumsi</option>
                <option value="Peralatan">Peralatan</option>
                <option value="Lain-lain">Lain-lain</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Safety Stock</label>
              <input v-model="currentItem.safetyStock" type="number" required min="0" />
            </div>
            <div class="form-group">
              <label>Units</label>
              <select v-model="currentItem.unit" required>
                <option value="" disabled>Select Unit</option>
                <option value="Pcs">Pcs</option>
                <option value="Box">Box</option>
                <option value="Galon">Galon</option>
                <option value="Jerigen">Jerigen</option>
                <option value="Rim">Rim</option>
              </select>
            </div>
          </div>

          <div class="form-group" v-if="isEdit">
            <label>Status</label>
            <select v-model="currentItem.isActive">
              <option :value="true">Active</option>
              <option :value="false">Inactive</option>
            </select>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
            <button type="submit" class="done-btn" :disabled="submitting">
              {{ submitting ? "Processing..." : (isEdit ? "Update Item" : "Save Item") }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import MainLayout from "../layouts/MainLayout.vue";
import { getAllItems, addItem, updateItem, deleteItem } from "@/api/itemApi";

// State Management
const items = ref([]);
const loading = ref(false);
const submitting = ref(false);
const showModal = ref(false);
const isEdit = ref(false);
const selectedId = ref(null);

const currentItem = ref({
  name: "",
  category: "",
  safetyStock: 0,
  unit: "",
  isActive: true
});

const fetchItems = async () => {
  loading.value = true;
  try {
    const res = await getAllItems();
    items.value = res.data.data || res.data || [];
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  isEdit.value = false;
  currentItem.value = { name: "", category: "", safetyStock: 0, unit: "", isActive: true };
  showModal.value = true;
};

const openEditModal = (item) => {
  isEdit.value = true;
  selectedId.value = item.idItem;
  currentItem.value = { ...item };
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const handleSubmit = async () => {
  if (!currentItem.value.name || !currentItem.value.category) {
    return alert("Please fill in the Item Name and Category!");
  }

  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateItem(currentItem.value);
      alert("Item updated successfully!");
    } else {
      await addItem(currentItem.value);
      alert("Item saved successfully!");
    }
    closeModal();
    await fetchItems();
  } catch (err) {
    const errorMsg = err.response?.data?.message || "Something went wrong. Please check your connection.";
    alert(errorMsg);
  } finally {
    submitting.value = false;
  }
};

const handleDelete = async (id, nama) => {
  if (confirm(`Are you sure you want to delete ${nama}?`)) {
    try {
      await deleteItem(id);
      alert("Item deleted successfully!");
      await fetchItems();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete item.";
      alert(errorMsg);
    }
  }
};

onMounted(fetchItems);
</script>

<style scoped>
/* Style Layout Luar (List) */
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.create-btn { background-color: #dff0e7; color: #3a6f5c; border: none; border-radius: 12px; padding: 14px 22px; font-weight: 600; cursor: pointer; }

.table-card { background: #fff; border-radius: 20px; border: 1px solid #f0deda; overflow: auto; }
table { width: 100%; border-collapse: collapse; }
thead { background-color: #f4dfda; }
th, td { padding: 18px 20px; text-align: left; border-bottom: 1px solid #f3e5e1; }

.status-badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.status-badge.active { background-color: #e6f4ea; color: #1e7e34; border: 1px solid #b7e1cd; }
.status-badge.inactive { background-color: #fce8e6; color: #d93025; border: 1px solid #f98b7f; }

.action-buttons { display: flex; gap: 10px; }
.update-btn { background: #158f67; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.delete-btn { background: #d91f11; color: white; border: none; padding: 8px 15px; border-radius: 8px; cursor: pointer; }
.state-text { text-align: center; padding: 30px; color: #888; }

/* Style Modal (Pop-up) */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.45); display: flex; justify-content: center; align-items: center; z-index: 999; }
.modal-card { background: white; padding: 30px; border-radius: 10px; width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
.modal-card h2 { margin-top: 0; margin-bottom: 20px; color: #d32f2f; }
.form-row { display: flex; gap: 15px; }
.form-group { flex: 1; margin-bottom: 15px; display: flex; flex-direction: column; text-align: left; }
.form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #e8e8e8; border-radius: 10px; }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 25px; }
.done-btn { background: #2e7d32; color: white; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; font-weight: 600; }
.cancel-btn { background: #f5f5f5; color: #666; border: none; padding: 12px 25px; border-radius: 10px; cursor: pointer; }
</style>