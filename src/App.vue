<template>
  <div id="app">
    <ItemMaster />
  </div>
</template>

<script>
// Mengambil file ItemMaster.vue dari folder components
import ItemMaster from './components/ItemMaster.vue';

export default {
  name: 'App',
  components: {
    ItemMaster
  }
};
</script>

<style>
/* Reset margin bawaan browser agar layout penuh ke ujung layar */
body, html { 
  margin: 0; 
  padding: 0; 
  height: 100%;
  background-color: #f4f4f9;
}

#app {
  height: 100%;
}
</style>