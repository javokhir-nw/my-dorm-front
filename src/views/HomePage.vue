<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from './SideMenu.vue'

// ==================== Composables ====================
const router = useRouter()
const authStore = useAuthStore()

// ==================== State ====================
const isMenuOpen = ref(false)

// ==================== Computed Properties ====================
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.currentUser)
const userName = computed(() => {
  if (!currentUser.value) return 'Foydalanuvchi'
  return currentUser.value.firstName || currentUser.value.username || 'Foydalanuvchi'
})

// ==================== Menu Management ====================
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

// ==================== Navigation ====================
function navigateTo(path) {
  router.push(path)
  closeMenu()
}

function goToLogin() {
  navigateTo('/login')
}

function goToRegister() {
  navigateTo('/register')
}

function goToDashboard() {
  navigateTo('/dashboard')
}

// ==================== Authentication ====================
function handleLogout() {
  authStore.logout()
  closeMenu()
}
</script>

<template>
  <div class="home-container">
    <!-- Hamburger Menu Button -->
    <button
        class="menu-button"
        @click="toggleMenu"
        aria-label="Menu"
        aria-expanded="isMenuOpen"
    >
      <span class="hamburger-icon" :class="{ open: isMenuOpen }">
        <span></span>
        <span></span>
        <span></span>
      </span>
    </button>

    <!-- Side Menu Component -->
    <SideMenu />

    <!-- Overlay -->
    <Transition name="fade">
      <div
          v-if="isMenuOpen"
          class="overlay"
          @click="closeMenu"
          aria-hidden="true"
      ></div>
    </Transition>

    <!-- Main Content -->
    <main class="hero">
      <div class="hero-content">
        <h1 class="project-name">
          <span class="project-icon">🏠</span>
          Mening yotoqxonam
        </h1>
        <p class="tagline">Yotoqxona boshqaruv tizimi</p>

        <!-- Authenticated User Section -->
        <Transition name="slide-up" mode="out-in">
          <div v-if="isAuthenticated" key="authenticated" class="user-section">
            <div class="logged-in">
              <p class="welcome-text">
                Salom, <strong>{{ userName }}</strong>! 👋
              </p>
              <button
                  @click="goToDashboard"
                  class="btn btn-primary"
                  aria-label="Dashboard ga o'tish"
              >
                <span class="btn-icon">📊</span>
                Dashboard ga o'tish
              </button>
            </div>
          </div>

          <!-- Guest User Section -->
          <div v-else key="guest" class="user-section">
            <div class="action-buttons">
              <button
                  @click="goToLogin"
                  class="btn btn-primary"
                  aria-label="Tizimga kirish"
              >
                <span class="btn-icon">🔑</span>
                Kirish
              </button>
              <button
                  @click="goToRegister"
                  class="btn btn-secondary"
                  aria-label="Ro'yxatdan o'tish"
              >
                <span class="btn-icon">📝</span>
                Ro'yxatdan o'tish
              </button>
            </div>
          </div>
        </Transition>

        <!-- Features Preview (Optional) -->
        <div class="features-hint">
          <p>✨ Yotoqxonani samarali boshqaring</p>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ==================== Container ==================== */
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow-x: hidden;
}

/* ==================== Menu Button ==================== */
.menu-button {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1001;
  background: white;
  border: none;
  padding: 0.75rem;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.menu-button:active {
  transform: scale(0.98);
}

.menu-button:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* Hamburger Icon */
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hamburger-icon.open span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger-icon.open span:nth-child(2) {
  opacity: 0;
  transform: translateX(-10px);
}

.hamburger-icon.open span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* ==================== Overlay ==================== */
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  cursor: pointer;
}

/* ==================== Hero Section ==================== */
.hero {
  text-align: center;
  padding: 3rem 2rem;
  color: white;
  z-index: 1;
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.hero-content {
  animation: fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-name {
  font-size: clamp(2rem, 5vw, 3.5rem);
  margin: 0 0 1rem 0;
  font-weight: 700;
  line-height: 1.2;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.project-icon {
  display: inline-block;
  animation: bounce 2s infinite;
}

.tagline {
  font-size: clamp(1rem, 2.5vw, 1.3rem);
  margin: 0 0 3rem 0;
  opacity: 0.95;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
  font-weight: 500;
}

/* ==================== User Section ==================== */
.user-section {
  margin-bottom: 2rem;
}

/* Logged In Section */
.logged-in {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 16px;
  max-width: 450px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.welcome-text {
  font-size: clamp(1rem, 2vw, 1.2rem);
  margin: 0 0 1.5rem 0;
  font-weight: 400;
  line-height: 1.5;
}

.welcome-text strong {
  font-weight: 700;
  color: #fff;
}

/* ==================== Action Buttons ==================== */
.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 500px;
  margin: 0 auto;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  font-size: clamp(0.95rem, 1.5vw, 1.1rem);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 160px;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.btn-icon {
  font-size: 1.2em;
  display: inline-block;
}

.btn:active {
  transform: translateY(-1px);
}

.btn:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.btn-primary {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
}

.btn-secondary {
  background: transparent;
  color: white;
  border: 2px solid white;
}

.btn-secondary:hover {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

/* ==================== Features Hint ==================== */
.features-hint {
  margin-top: 3rem;
  opacity: 0.8;
}

.features-hint p {
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  margin: 0;
  font-weight: 500;
}

/* ==================== Animations ==================== */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide Up Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ==================== Responsive Design ==================== */
@media (max-width: 768px) {
  .hero {
    padding: 2rem 1rem;
  }

  .logged-in {
    padding: 1.5rem;
  }

  .action-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .btn {
    width: 100%;
    max-width: 100%;
  }

  .features-hint {
    margin-top: 2rem;
  }
}

@media (max-width: 480px) {
  .menu-button {
    top: 1rem;
    left: 1rem;
    padding: 0.625rem;
  }

  .hamburger-icon {
    width: 20px;
    height: 16px;
    gap: 3px;
  }

  .hamburger-icon span {
    height: 2.5px;
  }

  .hero {
    padding: 1.5rem 1rem;
  }

  .logged-in {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .btn {
    padding: 0.875rem 1.5rem;
    min-width: 140px;
  }

  .btn-icon {
    font-size: 1.1em;
  }
}

@media (max-width: 360px) {
  .project-name {
    flex-direction: column;
    gap: 0.25rem;
  }

  .btn {
    padding: 0.75rem 1.25rem;
    font-size: 0.95rem;
  }
}

/* ==================== Accessibility ==================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ==================== Dark Mode Support (Future) ==================== */
@media (prefers-color-scheme: dark) {
  .menu-button {
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
  }

  .logged-in {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
  }
}

/* ==================== Print Styles ==================== */
@media print {
  .menu-button,
  .overlay,
  .features-hint {
    display: none;
  }

  .home-container {
    background: white;
    color: black;
  }

  .hero {
    color: black;
  }
}
</style>