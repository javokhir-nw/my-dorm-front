<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const goToLogin = () => router.push('/login')
const goToRegister = () => router.push('/register')
const goToDashboard = () => router.push('/dashboard')
</script>

<template>
  <div class="home-container">
    <div class="hero">
      <h1 class="project-name">Mening yotoqxonam</h1>
      <p class="tagline">Yotoqxona boshqaruv tizimi</p>

      <div v-if="authStore.isAuthenticated" class="logged-in">
        <p>Salom, {{ authStore.currentUser?.firstName }}!</p>
        <button class="btn btn-primary" @click="goToDashboard">
          Dashboard ga o‘tish
        </button>
      </div>

      <div v-else class="action-buttons">
        <button class="btn btn-primary" @click="goToLogin">
          Kirish
        </button>
        <button class="btn btn-secondary" @click="goToRegister">
          Ro‘yxatdan o‘tish
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =====================
   BACKGROUND
===================== */
.home-container {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  background:
      linear-gradient(
          rgba(102, 126, 234, 0.85),
          rgba(118, 75, 162, 0.85)
      ),
      url('src/images/bg.png') center / cover no-repeat;
}

/* =====================
   HERO
===================== */
.hero {
  text-align: center;
  padding: 3rem 2rem;
  color: #fff;
  max-width: 720px;
  width: 100%;

  backdrop-filter: blur(6px);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;

  animation: heroFadeUp 0.9s ease-out both;
}

/* =====================
   TITLE
===================== */
.project-name {
  font-size: 3.4rem;
  font-weight: 700;
  margin-bottom: 0.5rem;

  animation: fadeIn 0.8s ease-out both;
  animation-delay: 0.15s;

  text-shadow: 0 6px 30px rgba(0, 0, 0, 0.35);
}

/* =====================
   TAGLINE
===================== */
.tagline {
  font-size: 1.25rem;
  opacity: 0.95;
  margin-bottom: 2.5rem;

  animation: fadeIn 0.8s ease-out both;
  animation-delay: 0.3s;
}

/* =====================
   BUTTONS
===================== */
.action-buttons,
.logged-in {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;

  animation: fadeInUp 0.8s ease-out both;
  animation-delay: 0.45s;
}

.logged-in {
  flex-direction: column;
}

.logged-in p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

/* =====================
   BUTTON STYLE
===================== */
.btn {
  padding: 0.9rem 2rem;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.25s ease;
}

.btn-primary {
  background: #fff;
  color: #667eea;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(255, 255, 255, 0.35);
}

.btn-secondary {
  background: transparent;
  color: #fff;
  border: 2px solid #fff;
}

.btn-secondary:hover {
  background: #fff;
  color: #667eea;
}

/* =====================
   ANIMATIONS
===================== */
@keyframes heroFadeUp {
  from {
    opacity: 0;
    transform: translateY(28px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =====================
   MOBILE
===================== */
@media (max-width: 768px) {
  .project-name {
    font-size: 2.4rem;
  }

  .tagline {
    font-size: 1.1rem;
  }

  .hero {
    padding: 2.5rem 1.5rem;
  }
}

</style>