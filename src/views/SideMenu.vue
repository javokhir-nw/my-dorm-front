<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isMenuOpen = ref(false)
const isMalumotnomaDrop = ref(false)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function toggleMalumotnoma() {
  isMalumotnomaDrop.value = !isMalumotnomaDrop.value
}

function goToDashboard() {
  router.push('/dashboard')
  isMenuOpen.value = false
}

function goToSettings() {
  router.push('/settings')
  isMenuOpen.value = false
}

function goToDormitories() {
  router.push('/dormitories')
  isMenuOpen.value = false
  isMalumotnomaDrop.value = false
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div>
    <!-- Hamburger Menu Button -->
    <button class="menu-button" @click="toggleMenu">
      <span class="hamburger-icon" :class="{ open: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <!-- Side Menu -->
    <div class="side-menu" :class="{ open: isMenuOpen }">
      <div class="menu-header">
        <h3>🏠 Menu</h3>
        <button class="close-button" @click="toggleMenu">✕</button>
      </div>

      <nav class="menu-nav">
        <div class="user-info-menu">
          <p class="user-name">{{ authStore.currentUser?.firstName }} {{ authStore.currentUser?.lastName }}</p>
          <p class="user-username">@{{ authStore.currentUser?.username }}</p>
        </div>

        <button @click="goToDashboard" class="menu-item">
          📊 Dashboard
        </button>

        <!-- Ma'lumotnoma Dropdown -->
        <div class="dropdown-wrapper">
          <button @click="toggleMalumotnoma" class="menu-item dropdown-btn">
            <span>📚 Ma'lumotnoma</span>
            <span class="arrow" :class="{ rotated: isMalumotnomaDrop }">▼</span>
          </button>

          <div v-show="isMalumotnomaDrop" class="dropdown-menu">
            <button @click="goToDormitories" class="dropdown-item">
              🏢 Yotoqxonalar
            </button>
          </div>
        </div>

        <button @click="goToSettings" class="menu-item">
          ⚙️ Sozlamalar
        </button>

        <button @click="handleLogout" class="menu-item logout">
          🚪 Chiqish
        </button>
      </nav>
    </div>

    <!-- Overlay -->
    <div
        class="overlay"
        :class="{ show: isMenuOpen }"
        @click="toggleMenu"
    ></div>
  </div>
</template>

<style scoped>
/* Hamburger Menu Button */
.menu-button {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1001;
  background: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.menu-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 24px;
  height: 20px;
}

.hamburger-icon span {
  display: block;
  width: 100%;
  height: 3px;
  background: #667eea;
  border-radius: 2px;
  transition: all 0.3s;
}

.hamburger-icon.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
}

.hamburger-icon.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* Side Menu */
.side-menu {
  position: fixed;
  top: 0;
  left: -320px;
  width: 320px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  transition: left 0.3s ease;
  overflow-y: auto;
}

.side-menu.open {
  left: 0;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.menu-header h3 {
  margin: 0;
  font-size: 1.5rem;
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 1.5rem;
  width: 35px;
  height: 35px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

.menu-nav {
  padding: 1rem;
}

.user-info-menu {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.user-username {
  color: #667eea;
  font-size: 0.9rem;
  margin: 0;
}

.menu-item {
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  text-align: left;
  color: #333;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.menu-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateX(5px);
}

.menu-item.logout {
  background: #fff5f5;
  border-color: #ff4757;
  color: #ff4757;
}

.menu-item.logout:hover {
  background: #ff4757;
  color: white;
}

/* Dropdown */
.dropdown-wrapper {
  margin-bottom: 0.5rem;
}

.dropdown-btn {
  justify-content: space-between;
}

.dropdown-btn .arrow {
  transition: transform 0.3s;
  color: #667eea;
  font-size: 0.85rem;
}

.dropdown-btn .arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  background: #f8f9fa;
  border: 2px solid #f0f0f0;
  border-top: none;
  border-radius: 0 0 8px 8px;
  margin-top: -0.5rem;
  padding: 0.5rem 0;
}

.dropdown-item {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  text-align: left;
  color: #555;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dropdown-item:hover {
  background: white;
  color: #667eea;
  padding-left: 3rem;
}

/* Overlay */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
}

.overlay.show {
  opacity: 1;
  visibility: visible;
}

@media (max-width: 768px) {
  .side-menu {
    width: 280px;
    left: -280px;
  }
}
</style>