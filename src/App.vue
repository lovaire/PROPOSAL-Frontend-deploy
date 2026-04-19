<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  font-family: Arial, Helvetica, sans-serif;
  background-color: #f7f7f7;
  color: #2a2a2a;
}

button,
input,
select,
textarea {
  font-family: inherit;
}
</style>
<script>
console.log("VITE_API_URL di Production:", import.meta.env.VITE_API_URL);
</script>