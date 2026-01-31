<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <SideMenu />

    <div class="dashboard-header">
      <div class="page-title">
        <span class="page-title__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="2"></rect>
            <rect x="14" y="3" width="7" height="7" rx="2"></rect>
            <rect x="14" y="14" width="7" height="7" rx="2"></rect>
            <rect x="3" y="14" width="7" height="7" rx="2"></rect>
          </svg>
        </span>
        <h1 class="project-name">Mening yotoqxonam</h1>
      </div>
      <button @click="handleLogout" class="btn-logout">
        Chiqish
      </button>
    </div>

    <div class="dashboard-content">
      <div class="welcome-card">
        <h2>Xush kelibsiz, {{ authStore.currentUser?.firstName }} {{ authStore.currentUser?.lastName }}!</h2>
        <div class="user-info">
          <p><strong>Username:</strong> {{ authStore.currentUser?.username }}</p>
          <p v-if="authStore.currentUser?.middleName"><strong>Otasining ismi:</strong> {{ authStore.currentUser?.middleName }}</p>
          <p v-if="authStore.currentUser?.phone"><strong>Telefon:</strong> {{ authStore.currentUser?.phone }}</p>
          <p v-if="authStore.currentUser?.telegramUsername"><strong>Telegram:</strong> {{ authStore.currentUser?.telegramUsername }}</p>
        </div>
      </div>

      <div class="success-message">
        Siz muvaffaqiyatli login qildingiz!
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

.dashboard-header {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  margin-left: 5%;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.project-name {
  color: #667eea;
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
}

.btn-logout {
  padding: 0.75rem 1.5rem;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: #ff3838;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 71, 87, 0.3);
}

.dashboard-content {
  max-width: 800px;
  margin: 0 auto;
}

.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);
}

.welcome-card h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
}

.user-info {
  background: rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
  border-radius: 8px;
}

.user-info p {
  margin: 0.5rem 0;
  font-size: 1rem;
  opacity: 0.95;
}

.user-info strong {
  opacity: 1;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #c3e6cb;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
  }

  .project-name {
    font-size: 1.4rem;
  }

  .welcome-card {
    padding: 1.5rem;
  }

  .welcome-card h2 {
    font-size: 1.4rem;
  }
}
</style>
