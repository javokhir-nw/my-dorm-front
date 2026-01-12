<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.currentUser)

const userFullName = computed(() => {
  if (!user.value) return ''
  return `${user.value.firstName} ${user.value.lastName}`
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard-container">
    <SideMenu />

    <div class="dashboard-header">
      <div class="header-content">
        <h1 class="project-title">
          <span class="icon">🏠</span>
          Mening yotoqxonam
        </h1>
        <button @click="handleLogout" class="btn-logout">
          <span class="logout-icon">🚪</span>
          Chiqish
        </button>
      </div>
    </div>

    <div class="dashboard-content">
      <!-- Welcome Card -->
      <div class="welcome-card">
        <div class="welcome-header">
          <h2>Xush kelibsiz! 👋</h2>
          <p class="user-name">{{ userFullName }}</p>
        </div>

        <div class="user-details">
          <div class="detail-item">
            <span class="detail-icon">👤</span>
            <div class="detail-info">
              <span class="detail-label">Username</span>
              <span class="detail-value">{{ user?.username }}</span>
            </div>
          </div>

          <div v-if="user?.middleName" class="detail-item">
            <span class="detail-icon">👨</span>
            <div class="detail-info">
              <span class="detail-label">Otasining ismi</span>
              <span class="detail-value">{{ user.middleName }}</span>
            </div>
          </div>

          <div v-if="user?.phone" class="detail-item">
            <span class="detail-icon">📱</span>
            <div class="detail-info">
              <span class="detail-label">Telefon</span>
              <span class="detail-value">{{ user.phone }}</span>
            </div>
          </div>

          <div v-if="user?.telegramUsername" class="detail-item">
            <span class="detail-icon">✈️</span>
            <div class="detail-info">
              <span class="detail-label">Telegram</span>
              <span class="detail-value">@{{ user.telegramUsername }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Success Message -->
      <div class="success-banner">
        <div class="success-icon">✅</div>
        <div class="success-text">
          <strong>Muvaffaqiyatli!</strong>
          <p>Tizimga kirish amalga oshirildi</p>
        </div>
      </div>

      <!-- Quick Stats (Optional Enhancement) -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <h3>Dashboard</h3>
            <p>Bosh sahifa</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <h3>Davomat</h3>
            <p>Hisobotlar</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <h3>Sozlamalar</h3>
            <p>Profilni boshqarish</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.dashboard-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
}

.dashboard-header {
  max-width: 1200px;
  margin: 0 auto 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.project-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon {
  font-size: 2.25rem;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.logout-icon {
  font-size: 1.2rem;
}

.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Welcome Card */
.welcome-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.welcome-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2.5rem;
  color: white;
}

.welcome-header h2 {
  margin: 0 0 0.75rem 0;
  font-size: 2rem;
  font-weight: 700;
}

.user-name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  opacity: 0.95;
}

.user-details {
  padding: 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s;
}

.detail-item:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.detail-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
}

/* Success Banner */
.success-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  padding: 1.5rem 2rem;
  border-radius: 16px;
  border: 2px solid #b7dfbd;
  box-shadow: 0 4px 15px rgba(21, 87, 36, 0.15);
}

.success-icon {
  font-size: 3rem;
  flex-shrink: 0;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.success-text {
  flex: 1;
}

.success-text strong {
  display: block;
  font-size: 1.25rem;
  color: #155724;
  margin-bottom: 0.25rem;
}

.success-text p {
  margin: 0;
  color: #1e7e34;
  font-size: 1rem;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.2);
}

.stat-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.stat-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  color: #2d3748;
  font-weight: 700;
}

.stat-content p {
  margin: 0;
  color: #718096;
  font-size: 0.95rem;
}

/* Responsive */
@media (max-width: 968px) {
  .dashboard-container {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .project-title {
    font-size: 1.5rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .welcome-header {
    padding: 2rem 1.5rem;
  }

  .welcome-header h2 {
    font-size: 1.5rem;
  }

  .user-name {
    font-size: 1.25rem;
  }

  .user-details {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .success-banner {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .project-title {
    font-size: 1.25rem;
  }

  .icon {
    font-size: 1.75rem;
  }

  .btn-logout {
    width: 100%;
    justify-content: center;
  }
}
</style>