<template>
  <div class="layout">
    <aside class="sidebar">
      <h2 class="brand">Cansebu</h2>
      <ul class="menu">
        <li class="active">Master</li>
        <li>Distribution</li>
        <li>List Vendor</li>
        <li>Invoice</li>
        <li>Account</li>
      </ul>
      <div class="logout">Logout</div>
    </aside>

    <main class="content">
      <div class="header">
        <h1>Master</h1>
        <button class="btn-add" @click="showAddModal = true">+ Button</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Units</th>
              <th>Safety Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.idItem">
              <td>{{ item.idItem.substring(0, 8) }}...</td>
              <td>{{ item.name }}</td>
              <td>{{ item.category }}</td>
              <td>{{ item.unit }}</td>
              <td>{{ item.safetyStock }}</td>
              <td>
                <span :class="item.isActive ? 'badge-active' : 'badge-inactive'">
                  {{ item.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td>
                <button class="btn-edit" @click="openEditModal(item)">Edit</button>
                <button class="btn-delete" @click="openDeleteModal(item.idItem)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showAddModal" class="modal-overlay">
        <div class="modal-card">
          <h2>Add Item</h2>
          <form @submit.prevent="submitAddItem">
            <div class="form-group">
              <label>Product ID</label>
              <input type="text" value="XXXXXX" disabled />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Product Name</label>
                <input type="text" v-model="newItem.name" required />
              </div>
              <div class="form-group">
                <label>Category</label>
                <input type="text" v-model="newItem.category" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Safety Stock</label>
                <input type="number" v-model="newItem.safetyStock" required />
              </div>
              <div class="form-group">
                <label>Units</label>
                <input type="text" v-model="newItem.unit" required />
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" @click="showAddModal = false" class="btn-cancel">Cancel</button>
              <button type="submit" class="btn-add-submit">Add</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-card">
          <h2>Update Item</h2>
          <form @submit.prevent="submitEditItem">
            <div class="form-group">
              <label>Product ID</label>
              <input type="text" :value="editItem.idItem" disabled />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Product Name</label>
                <input type="text" v-model="editItem.name" required />
              </div>
              <div class="form-group">
                <label>Category</label>
                <input type="text" v-model="editItem.category" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Safety Stock</label>
                <input type="number" v-model="editItem.safetyStock" required />
              </div>
              <div class="form-group">
                <label>Units</label>
                <input type="text" v-model="editItem.unit" required />
              </div>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="editItem.isActive" required style="padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" @click="showEditModal = false" class="btn-cancel">Cancel</button>
              <button type="submit" class="btn-edit-submit">Update</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-card" style="width: 400px; text-align: center;">
          <h2>Confirm Delete</h2>
          <p>You're about to delete the item. Are you sure you want to delete?</p>
          <div class="modal-actions" style="justify-content: center; margin-top: 30px;">
            <button type="button" @click="showDeleteModal = false" class="btn-cancel">Cancel</button>
            <button type="button" @click="confirmDelete" class="btn-delete">Delete</button>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ItemMaster',
  data() {
    return {
      items: [],
      // Variabel Add
      showAddModal: false, 
      newItem: { name: '', category: '', safetyStock: '', unit: '' },
      
      // Variabel Edit
      showEditModal: false,
      editItem: {},

      // Variabel Delete
      showDeleteModal: false,
      itemToDelete: null
    };
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    // 1. Ambil Data
    async fetchItems() {
      try {
        const response = await axios.get('http://localhost:8080/api/item/getAll');
        this.items = response.data;
      } catch (error) {
        console.error("Gagal mengambil data dari backend:", error);
      }
    },
    
    // 2. Tambah Data
    async submitAddItem() {
      try {
        await axios.post('http://localhost:8080/api/item/add', this.newItem);
        this.showAddModal = false;
        this.newItem = { name: '', category: '', safetyStock: '', unit: '' };
        this.fetchItems();
        alert("Barang berhasil ditambahkan!");
      } catch (error) {
        console.error("Error adding item:", error);
        alert("Gagal menambahkan barang.");
      }
    },

    // 3. Edit Data (Buka Modal & Simpan)
    openEditModal(item) {
      this.editItem = { ...item }; // Copy data agar aman sebelum di-save
      this.showEditModal = true;
    },
    async submitEditItem() {
      try {
        await axios.put('http://localhost:8080/api/item/update', this.editItem);
        this.showEditModal = false;
        this.fetchItems();
        alert("Barang berhasil diperbarui!");
      } catch (error) {
        console.error("Error updating item:", error);
        alert("Gagal memperbarui barang.");
      }
    },

    // 4. Hapus Data (Buka Modal Konfirmasi & Eksekusi)
    openDeleteModal(idItem) {
      this.itemToDelete = idItem;
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      try {
        await axios.delete(`http://localhost:8080/api/item/delete/${this.itemToDelete}`);
        this.showDeleteModal = false;
        this.fetchItems();
        alert("Barang berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Gagal menghapus barang.");
      }
    }
  }
};
</script>

<style scoped>
/* CSS Meniru Desain Cansebu */
.layout { display: flex; height: 100vh; font-family: sans-serif; background-color: #f4f4f9; }
.sidebar { width: 250px; background: #e0e0e0; padding: 20px; display: flex; flex-direction: column; }
.brand { color: #d32f2f; margin-bottom: 30px; }
.menu { list-style: none; padding: 0; flex-grow: 1; }
.menu li { padding: 15px 10px; margin-bottom: 5px; cursor: pointer; color: #333; }
.menu li.active { background: white; border-radius: 8px; font-weight: bold; }
.logout { padding: 10px; cursor: pointer; color: #666; }

.content { flex-grow: 1; padding: 40px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-add { background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }

.table-container { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
table { width: 100%; border-collapse: collapse; text-align: left; }
th, td { padding: 12px; border-bottom: 1px solid #ddd; }
th { background-color: #f9f9f9; color: #555; }
.badge-active { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 12px; font-size: 0.85em; }
.badge-inactive { background: #ffebee; color: #c62828; padding: 4px 8px; border-radius: 12px; font-size: 0.85em; }
.btn-edit { background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 5px; cursor: pointer; }
.btn-delete { background: #c62828; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }

/* CSS Modal/Pop-up */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex; justify-content: center; align-items: center;
}
.modal-card {
  background: white; padding: 30px; border-radius: 10px; width: 500px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.modal-card h2 { margin-top: 0; margin-bottom: 20px; color: #d32f2f; }
.form-row { display: flex; gap: 15px; }
.form-group { flex: 1; margin-bottom: 15px; display: flex; flex-direction: column; text-align: left; }
.form-group label { margin-bottom: 5px; font-weight: bold; font-size: 0.9em; color: #555; }
.form-group input { padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
.form-group input:disabled { background-color: #f5f5f5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn-cancel { padding: 10px 20px; border: 1px solid #ccc; background: white; border-radius: 5px; cursor: pointer; }
.btn-add-submit { padding: 10px 20px; background: #d32f2f; color: white; border: none; border-radius: 5px; cursor: pointer; }
.btn-edit-submit { padding: 10px 20px; background: #2e7d32; color: white; border: none; border-radius: 5px; cursor: pointer; }
</style>