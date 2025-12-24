<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function goBack() {
  router.push('/dashboard')
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>⚙️ Sozlamalar</h1>
      </div>
      <button @click="handleLogout" class="btn-logout">
        Chiqish
      </button>
    </div>

    <div class="settings-content">
      <div class="settings-section">
        <h2>Profil ma'lumotlari</h2>
        <div class="settings-card">
          <div class="info-row">
            <span class="info-label">Ism:</span>
            <span class="info-value">{{ authStore.currentUser?.firstName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Familiya:</span>
            <span class="info-value">{{ authStore.currentUser?.lastName }}</span>
          </div>
          <div class="info-row" v-if="authStore.currentUser?.middleName">
            <span class="info-label">Otasining ismi:</span>
            <span class="info-value">{{ authStore.currentUser?.middleName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Username:</span>
            <span class="info-value">@{{ authStore.currentUser?.username }}</span>
          </div>
          <div class="info-row" v-if="authStore.currentUser?.phone">
            <span class="info-label">Telefon:</span>
            <span class="info-value">{{ authStore.currentUser?.phone }}</span>
          </div>
          <div class="info-row" v-if="authStore.currentUser?.telegramUsername">
            <span class="info-label">Telegram:</span>
            <span class="info-value">{{ authStore.currentUser?.telegramUsername }}</span>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2>Hisob sozlamalari</h2>
        <div class="settings-card">
          <button class="settings-button">
            <span>🔑 Parolni o'zgartirish</span>
            <span class="arrow">→</span>
          </button>
          <button class="settings-button">
            <span>✏️ Profilni tahrirlash</span>
            <span class="arrow">→</span>
          </button>
          <button class="settings-button">
            <span>🔔 Bildirishnomalar</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>Xavfsizlik</h2>
        <div class="settings-card">
          <button class="settings-button">
            <span>🛡️ Ikki bosqichli autentifikatsiya</span>
            <span class="arrow">→</span>
          </button>
          <button class="settings-button">
            <span>📱 Faol sessiyalar</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>

      <div class="settings-section">
        <h2>Umumiy</h2>
        <div class="settings-card">
          <button class="settings-button">
            <span>🌐 Til sozlamalari</span>
            <span class="arrow">→</span>
          </button>
          <button class="settings-button">
            <span>🎨 Mavzu (Theme)</span>
            <span class="arrow">→</span>
          </button>
          <button class="settings-button">
            <span>ℹ️ Yordam</span>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  padding: 0.5rem 1rem;
  background: #f0f0f0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  color: #667eea;
  transition: all 0.3s;
}

.back-button:hover {
  background: #667eea;
  color: white;
}

.settings-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
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

.settings-content {
  max-width: 800px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 2rem;
}

.settings-section h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.3rem;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #666;
}

.info-value {
  color: #333;
}

.settings-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: all 0.3s;
  text-align: left;
}

.settings-button:last-child {
  border-bottom: none;
}

.settings-button:hover {
  background: #f8f9fa;
  padding-left: 1.5rem;
}

.arrow {
  color: #667eea;
  font-size: 1.2rem;
}

@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .settings-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .settings-header h1 {
    font-size: 1.4rem;
  }
}
</style>