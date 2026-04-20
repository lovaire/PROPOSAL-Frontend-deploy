<!--&lt;!&ndash; eslint-disable-next-line vue/multi-word-component-names &ndash;&gt;-->
<!--<script setup>-->
<!--import { ref } from "vue";-->
<!--import { useAuthStore } from "@/stores/profile";-->
<!--import { useRouter } from "vue-router";-->
<!--import MainLayout from "@/layouts/MainLayout.vue";-->

<!--const authStore = useAuthStore();-->
<!--const router = useRouter();-->

<!--const formData = ref({-->
<!--  email: '',-->
<!--  username: '',-->
<!--  password: '',-->
<!--  role: ''-->
<!--});-->

<!--const errorMessage = ref('');-->

<!--const handleRegister = async () => {-->
<!--  try {-->
<!--    await authStore.register(formData.value);-->
<!--    alert('User berhasil dibuat');-->
<!--    router.push('/users');-->
<!--  } catch (e) {-->
<!--    errorMessage.value = e.message;-->
<!--    console.error(e);-->
<!--  }-->
<!--};-->
<!--</script>-->

<!--<template>-->
<!--  <MainLayout>-->
<!--    <div class="modal-overlay">-->
<!--      <div class="modal-card form-modal">-->
<!--        <h3 class="modal-title">Create User</h3>-->
<!--        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>-->

<!--        <form @submit.prevent="handleRegister" class="modal-form">-->
<!--          <div class="form-grid">-->
<!--            <div class="modal-field">-->
<!--              <label for="email" class="modal-label">Email</label>-->
<!--              <input type="text" v-model="formData.email" class="modal-input" required/>-->
<!--            </div>-->

<!--            <div class="modal-field">-->
<!--              <label for="username" class="modal-label">Username</label>-->
<!--              <input type="text" v-model="formData.username" class="modal-input" required/>-->
<!--            </div>-->

<!--            <div class="modal-field">-->
<!--              <label for="password" class="modal-label">Password</label>-->
<!--              <input type="password" v-model="formData.password" class="modal-input" required/>-->
<!--            </div>-->

<!--            <div class="modal-field">-->
<!--              <label for="role" class="modal-label">Role</label>-->
<!--              <select v-model="formData.role" class="modal-input" required>-->
<!--                <option value="" disabled selected>Select a Role</option>-->

<!--                <option value="ADMIN">Admin</option>-->
<!--                <option value="MANAGER">Manager</option>-->
<!--                <option value="FINANCE">Finance</option>-->
<!--                <option value="INVENTORY">Inventory</option>-->
<!--              </select>-->
<!--            </div>-->

<!--            <div class="modal-actions single-action">-->
<!--              <button class="submit-btn" type="submit">Add</button>-->
<!--            </div>-->
<!--          </div>-->
<!--        </form>-->
<!--      </div>-->
<!--    </div>-->
<!--  </MainLayout>-->
<!--</template>-->

<!--<style>-->
<!--.error {-->
<!--  color: red;-->
<!--  margin-bottom: 10px;-->
<!--}-->

<!--.modal-overlay {-->
<!--  position: fixed;-->
<!--  inset: 0;-->
<!--  background: rgba(27, 27, 27, 0.48);-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--  padding: 20px;-->
<!--  z-index: 1000;-->
<!--}-->

<!--.modal-card {-->
<!--  background: #ffffff;-->
<!--  border-radius: 36px;-->
<!--  width: 40%;-->
<!--  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.14);-->
<!--}-->

<!--.form-modal {-->
<!--  max-width: 760px;-->
<!--  padding: 42px 44px 30px;-->
<!--}-->

<!--.modal-form {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 18px;-->
<!--}-->

<!--.form-grid {-->
<!--  display: flex;-->
<!--  flex-flow: column;-->
<!--  gap: 20px 20px;-->
<!--}-->

<!--.modal-title {-->
<!--  margin: 0 0 28px;-->
<!--  font-size: 30px;-->
<!--  font-weight: 600;-->
<!--  color: #171717;-->
<!--}-->

<!--.modal-field {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 8px;-->
<!--  min-width: 0;-->
<!--}-->

<!--.modal-label {-->
<!--  font-size: 12px;-->
<!--  font-weight: 700;-->
<!--  color: #2f2f2f;-->
<!--}-->

<!--.modal-input{-->
<!--  width: 100%;-->
<!--  box-sizing: border-box;-->
<!--  border: 1px solid #ece6e1;-->
<!--  border-radius: 10px;-->
<!--  background: #ffffff;-->
<!--  font-size: 14px;-->
<!--  color: #2a2a2a;-->
<!--  outline: none;-->
<!--  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);-->
<!--}-->

<!--.modal-input {-->
<!--  height: 44px;-->
<!--  padding: 0 16px;-->
<!--}-->

<!--.modal-actions {-->
<!--  display: flex;-->
<!--  justify-content: flex-end;-->
<!--  gap: 12px;-->
<!--  margin-top: 6px;-->
<!--}-->

<!--.single-action {-->
<!--  margin-top: 2px;-->
<!--}-->

<!--.submit-btn {-->
<!--  min-width: 100px;-->
<!--  height: 42px;-->
<!--  border: none;-->
<!--  border-radius: 8px;-->
<!--  background: #4b7f44;-->
<!--  color: #ffffff;-->
<!--  font-size: 13px;-->
<!--  font-weight: 700;-->
<!--  cursor: pointer;-->
<!--  padding: 0 18px;-->
<!--}-->

<!--</style>-->