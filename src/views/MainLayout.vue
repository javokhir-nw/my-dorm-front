<script setup>
import SideMenu from '../views/SideMenu.vue'
</script>

<template>
  <div class="main-layout">
    <SideMenu />
    <div class="main-content">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  min-height: 100vh;
  position: relative;
}

.main-content {
  min-height: 100vh;
  padding-left: 5rem; /* Hamburger menu uchun joy */
}

@media (max-width: 768px) {
  .main-content {
    padding-left: 1rem;
  }
}
</style>