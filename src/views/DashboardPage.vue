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
      <div class="header-left">
        <div class="logo-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="3"></rect>
            <path d="M9 2v4"></path>
            <path d="M15 2v4"></path>
            <path d="M3 10h18"></path>
          </svg>
        </div>
        <h1 class="project-name">Mening yotoqxonam</h1>
      </div>
      <button @click="handleLogout" class="btn-logout">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
        Chiqish
      </button>
    </div>

    <div class="dashboard-content">
      <div class="welcome-card">
        <div class="welcome-header">
          <div class="welcome-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h2>Xush kelibsiz!</h2>
        </div>

        <div class="user-name">
          {{ authStore.currentUser?.firstName }} {{ authStore.currentUser?.lastName }}
        </div>

        <div class="user-info">
          <div class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <div class="info-content">
              <span class="info-label">Username</span>
              <span class="info-value">{{ authStore.currentUser?.username }}</span>
            </div>
          </div>

          <div v-if="authStore.currentUser?.middleName" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <div class="info-content">
              <span class="info-label">Otasining ismi</span>
              <span class="info-value">{{ authStore.currentUser?.middleName }}</span>
            </div>
          </div>

          <div v-if="authStore.currentUser?.phone" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <div class="info-content">
              <span class="info-label">Telefon</span>
              <span class="info-value">{{ authStore.currentUser?.phone }}</span>
            </div>
          </div>

          <div v-if="authStore.currentUser?.telegramUsername" class="info-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9z"></path>
            </svg>
            <div class="info-content">
              <span class="info-label">Telegram</span>
              <span class="info-value">{{ authStore.currentUser?.telegramUsername }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="success-message">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>Siz muvaffaqiyatli tizimga kirdingiz!</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
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
  padding: 0.75rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.dashboard-header:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-container {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.logo-container svg {
  width: 26px;
  height: 26px;
}

.project-name {
  color: #333;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.btn-logout {
  padding: 0.65rem 1.5rem;
  background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.3s;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3);
}

.btn-logout svg {
  width: 18px;
  height: 18px;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.4);
}

.dashboard-content {
  max-width: 900px;
  margin: 0 auto;
}

.welcome-card {
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.welcome-card:hover {
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.welcome-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.welcome-icon svg {
  width: 28px;
  height: 28px;
}

.welcome-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
  font-weight: 700;
}

.user-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 1.5rem;
  padding: 0.5rem 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  transition: all 0.3s;
}

.info-item:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  transform: translateX(5px);
}

.info-item svg {
  width: 24px;
  height: 24px;
  color: #667eea;
  flex-shrink: 0;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.success-message {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  color: #155724;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #b1dfbb;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
}

.success-message svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    margin-left: 0;
  }

  .header-left {
    width: 100%;
    justify-content: center;
  }

  .logo-container {
    width: 40px;
    height: 40px;
  }

  .logo-container svg {
    width: 22px;
    height: 22px;
  }

  .project-name {
    font-size: 1.1rem;
  }

  .btn-logout {
    width: 100%;
    justify-content: center;
    font-size: 0.9rem;
    padding: 0.6rem 1.25rem;
  }

  .welcome-card {
    padding: 1.5rem;
  }

  .welcome-header {
    flex-direction: column;
    text-align: center;
  }

  .welcome-header h2 {
    font-size: 1.4rem;
  }

  .user-name {
    font-size: 1.2rem;
    text-align: center;
  }

  .info-item {
    padding: 0.85rem;
  }

  .info-item svg {
    width: 20px;
    height: 20px;
  }

  .info-label {
    font-size: 0.8rem;
  }

  .info-value {
    font-size: 0.95rem;
  }

  .success-message {
    flex-direction: column;
    padding: 1rem;
    font-size: 0.95rem;
  }
}
</style>