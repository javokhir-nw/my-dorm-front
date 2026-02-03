<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

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
    <SideMenu />

    <!-- ✅ UPDATED HEADER -->
    <div class="settings-header">
      <div class="header-left">
        <button @click="goBack" class="back-button" title="Orqaga">
          <!-- ✅ Professional Back Icon -->
          <svg
              class="btn-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
            <path d="M9 12h12" />
          </svg>
          Orqaga
        </button>

        <div class="page-title">
          <span class="page-title__icon" aria-hidden="true">
            <!-- Settings icon (sizdagi svg qoladi) -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09c.7 0 1.31-.4 1.51-1a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06c.46.46 1.13.6 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .7.4 1.31 1 1.51.68.27 1.36.13 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.46-.6 1.13-.33 1.82V9c.2.6.81 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.7 0-1.31.4-1.51 1Z"></path>
            </svg>
          </span>
          <div class="page-title__text">
            <h1>Sozlamalar</h1>
            <p class="page-subtitle">Profil va hisob sozlamalari</p>
          </div>
        </div>
      </div>

      <button @click="handleLogout" class="btn-logout">
        <!-- ✅ Professional Logout Icon -->
        <svg
            class="btn-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        Chiqish
      </button>
    </div>

    <!-- CONTENT (o'zgarmagan) -->
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
/* ✅ container: SideMenu uchun chapdan joy */
.settings-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
  padding-left: 5.5rem;
}

/* ✅ NEW HEADER STYLE */
.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  background: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

/* Header title block */
.page-title {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}

.page-title__icon {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  flex-shrink: 0;
}

.page-title__icon svg {
  width: 24px;
  height: 24px;
}

.page-title__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.settings-header h1 {
  margin: 0;
  color: #1a202c;
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
}

.page-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ Icon standard (professional) */
.btn-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Back button — neutral gradient style */
.back-button {
  padding: 0.65rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  color: #4b5563;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.back-button:hover {
  background: #eef2ff;
  border-color: rgba(102, 126, 234, 0.35);
  color: #4f46e5;
  transform: translateY(-1px);
}

/* Logout — danger gradient style */
.btn-logout {
  padding: 0.65rem 1.1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-logout:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
}

/* ====== QOLGAN STYLE (o'zgarmagan) ====== */
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

/* ✅ Responsive */
@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
    padding-left: 1rem;
  }

  .settings-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
    padding: 1.1rem;
  }

  .header-left {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .page-subtitle {
    white-space: normal;
  }

  .back-button,
  .btn-logout {
    width: 100%;
    justify-content: center;
  }
}
</style>
