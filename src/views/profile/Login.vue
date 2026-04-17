<!-- eslint-disable-next-line vue/multi-word-component-names -->
<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/profile";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const formData = ref({
  email: '',
  password: ''
});

const errorMessage = ref('');

const handleLogin = async () => {
  try {
    const role = await authStore.login(formData.value);
    console.log(role);

    if (role === 'admin') {
      router.push('/users');
    } else if (role === 'inventory') {
      router.push('/items');
    } else {
      // Semua role lain (finance, financial, manager, dll) ke halaman transaksi
      router.push('/transactions');
    }
  } catch (e) {
    errorMessage.value = e.message;
    console.error(e);
  }
};
</script>

<template>
  <div class="main-container">
    <div class="left-section">
      <div class="logo-box">
        <div class="logo-placeholder">
          <img src="https://via.placeholder.com/130x130?text=Logo" alt="Logo" style="width:100%; height:100%; object-fit:cover;">
        </div>
      </div>
      <p class="welcome-text">Selamat Datang di</p>
      <h1 class="brand-name">SiCansebu</h1>
    </div>

    <div class="right-section">
      <div class="login-box">
        <h2>Login</h2>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="text" id="email" placeholder="Enter Email" v-model="formData.email" required>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter Password" v-model="formData.password" required>
          </div>

          <button type="submit" class="login-btn">Login</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Container Utama */
.main-container {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #fff;
  overflow: hidden;
}

.left-section {
  flex: 1;
  background: linear-gradient(to bottom, #7d3322, #c3512f);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding-left: 100px;
  color: white;
  text-align: center;
}

.logo-box {
  background-color: #fff;
  padding: 10px;
  border: 2px solid #4caf50;
  margin-bottom: 20px;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Placeholder untuk icon bunga */
.logo-placeholder {
  width: 100%;
  height: 100%;
  background-color: #a8e063;
  position: relative;
}

.welcome-text {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 5px;
}

.brand-name {
  font-size: 56px;
  font-weight: bold;
  color: #eeb058; /* Warna kuning emas */
  letter-spacing: 1px;
}

/* Bagian Kanan (Form) */
.right-section {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
}

.login-box {
  width: 100%;
  max-width: 600px;
}

.login-box h2 {
  font-size: 32px;
  margin-bottom: 30px;
  font-weight: bold;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
}

.form-group input {
  width: 100%;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  outline: none;
  transition: border 0.3s;
}

.form-group input:focus {
  border-color: #d32f2f;
}

.login-btn {
  width: 100px;
  padding: 12px;
  background-color: #d32f2f; /* Warna merah tombol */
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  float: right;
  margin-top: 10px;
  transition: background 0.3s;
}

.login-btn:hover {
  background-color: #b71c1c;
}

/* Responsif untuk HP */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
  }
  .left-section {
    flex: 0.4;
  }
}
</style>