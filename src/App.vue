<template>
  <div id="app">
    <h1>Users List</h1>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.username }}
      </li>
    </ul>
  </div>
  <RouterView />
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      users: []  // Menyimpan data pengguna yang diterima dari backend
    };
  },
  mounted() {
    // Lakukan request GET ke backend
    axios.get('http://localhost:8080/api/users')  // URL backend kamu
      .then(response => {
        this.users = response.data;  // Menyimpan data pengguna
      })
      .catch(error => {
        console.log('Error fetching data:', error);
      });
  }
};
</script>

<style scoped>
h1 {
  color: #42b983;
}
</style>
