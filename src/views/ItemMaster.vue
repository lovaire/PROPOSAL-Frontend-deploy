<template>
  <div class="item-master-container">
    <main class="content">
      <div class="header">
        <h1>Master Barang</h1>
        <button class="btn-add" @click="showAddModal = true">+ Tambah Barang</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nama Barang</th>
              <th>Kategori</th>
              <th>Unit</th>
              <th>Safety Stock</th>
              <th>Status</th>
              <th>Aksi</th>
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
                <button class="btn-delete" @click="openDeleteModal(item.idItem)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showAddModal" class="modal-overlay">
        <div class="modal-card">
          <h2>Tambah Barang Baru</h2>
          <form @submit.prevent="submitAddItem">
            <div class="form-row">
              <div class="form-group">
                <label>Nama Produk</label>
                <input type="text" v-model="newItem.name" required placeholder="Contoh: Sabun Mandi" />
              </div>
              <div class="form-group">
                <label>Kategori</label>
                <select v-model="newItem.category" required>
                  <option value="" disabled>Pilih Kategori</option>
                  <option value="Amenities">Amenities</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Peralatan">Peralatan</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Safety Stock</label>
                <input type="number" v-model="newItem.safetyStock" required min="0" />
              </div>
              <div class="form-group">
                <label>Unit</label>
                <select v-model="newItem.unit" required>
                  <option value="" disabled>Pilih Unit</option>
                  <option value="Pcs">Pcs</option>
                  <option value="Box">Box</option>
                  <option value="Galon">Galon</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" @click="showAddModal = false" class="btn-cancel">Batal</button>
              <button type="submit" class="btn-add-submit">Simpan</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-card">
          <h2>Update Data Barang</h2>
          <form @submit.prevent="submitEditItem">
            <div class="form-group">
              <label>ID Produk</label>
              <input type="text" :value="editItem.idItem" disabled />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Nama Produk</label>
                <input type="text" v-model="editItem.name" required />
              </div>
              <div class="form-group">
                <label>Kategori</label>
                <select v-model="editItem.category" required>
                  <option value="Amenities">Amenities</option>
                  <option value="Konsumsi">Konsumsi</option>
                  <option value="Peralatan">Peralatan</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Safety Stock</label>
                <input type="number" v-model="editItem.safetyStock" required />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select v-model="editItem.isActive" required>
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" @click="showEditModal = false" class="btn-cancel">Batal</button>
              <button type="submit" class="btn-edit-submit">Update</button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showDeleteModal" class="modal-overlay">
        <div class="modal-card confirm-card">
          <h2>Hapus Barang?</h2>
          <p>Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?</p>
          <div class="modal-actions">
            <button type="button" @click="showDeleteModal = false" class="btn-cancel">Batal</button>
            <button type="button" @click="confirmDelete" class="btn-delete">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
// Menggunakan API terpusat yang sudah membawa Token JWT secara otomatis
import { getAllItems, addItem, updateItem, deleteItem } from "@/api/itemApi";

export default {
  name: 'ItemMaster',
  data() {
    return {
      items: [],
      showAddModal: false,
      newItem: { name: '', category: '', safetyStock: 0, unit: '' },
      showEditModal: false,
      editItem: {},
      showDeleteModal: false,
      itemToDelete: null
    };
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    async fetchItems() {
      try {
        const response = await getAllItems();
        // Menyesuaikan dengan format BaseResponseDTO { data: [...], message: "..." }
        this.items = response.data.data || response.data;
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    },
    async submitAddItem() {
      try {
        await addItem(this.newItem);
        this.showAddModal = false;
        this.newItem = { name: '', category: '', safetyStock: 0, unit: '' };
        await this.fetchItems();
        alert("Barang berhasil ditambahkan!");
      } catch (error) {
        alert("Gagal menambah barang. Pastikan data lengkap.");
      }
    },
    openEditModal(item) {
      this.editItem = { ...item };
      this.showEditModal = true;
    },
    async submitEditItem() {
      try {
        await updateItem(this.editItem);
        this.showEditModal = false;
        await this.fetchItems();
        alert("Barang berhasil diperbarui!");
      } catch (error) {
        alert("Gagal memperbarui data.");
      }
    },
    openDeleteModal(id) {
      this.itemToDelete = id;
      this.showDeleteModal = true;
    },
    async confirmDelete() {
      try {
        await deleteItem(this.itemToDelete);
        this.showDeleteModal = false;
        await this.fetchItems();
        alert("Barang telah dihapus.");
      } catch (error) {
        alert("Gagal menghapus barang.");
      }
    }
  }
};
</script>

<style scoped>
/* Scoped agar tidak merusak gaya halaman Login/Sidebar tim */
.content { padding: 20px; background-color: #f7f7f7; min-height: 100vh; }
.header { display: flex; justify-content: space-between; margin-bottom: 25px; }
.btn-add { background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }

.table-container { background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
th { background: #f9f9f9; color: #666; font-size: 0.9em; }

.badge-active { background: #e8f5e9; color: #2e7d32; padding: 5px 10px; border-radius: 20px; font-size: 0.8em; }
.badge-inactive { background: #ffebee; color: #c62828; padding: 5px 10px; border-radius: 20px; font-size: 0.8em; }

.btn-edit { background: #2e7d32; color: white; border: none; padding: 6px 12px; border-radius: 4px; margin-right: 8px; cursor: pointer; }
.btn-delete { background: #d32f2f; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; }

/* Modal Styles */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-card { background: white; padding: 30px; border-radius: 12px; width: 500px; }
.confirm-card { width: 350px; text-align: center; }
.form-row { display: flex; gap: 15px; }
.form-group { margin-bottom: 15px; flex: 1; }
.form-group label { display: block; margin-bottom: 5px; font-size: 0.9em; color: #444; }
.form-group input, .form-group select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; }
.modal-actions { margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: #eee; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.btn-add-submit { background: #d32f2f; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
.btn-edit-submit { background: #2e7d32; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
</style>