<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

// ==================== Composables ====================
const router = useRouter()
const authStore = useAuthStore()

// ==================== Computed Properties ====================
const currentUser = computed(() => authStore.currentUser)

const userFullName = computed(() => {
  if (!currentUser.value) return 'Foydalanuvchi'

  const parts = [
    currentUser.value.firstName,
    currentUser.value.lastName,
    currentUser.value.middleName
  ].filter(Boolean)

  return parts.join(' ') || 'Foydalanuvchi'
})

const profileInfo = computed(() => [
  {
    label: 'Ism',
    value: currentUser.value?.firstName,
    icon: '👤',
    show: true
  },
  {
    label: 'Familiya',
    value: currentUser.value?.lastName,
    icon: '👤',
    show: true
  },
  {
    label: 'Otasining ismi',
    value: currentUser.value?.middleName,
    icon: '👤',
    show: !!currentUser.value?.middleName
  },
  {
    label: 'Username',
    value: currentUser.value?.username ? `@${currentUser.value.username}` : null,
    icon: '@',
    show: true
  },
  {
    label: 'Telefon',
    value: currentUser.value?.phone,
    icon: '📱',
    show: !!currentUser.value?.phone
  },
  {
    label: 'Telegram',
    value: currentUser.value?.telegramUsername,
    icon: '✈️',
    show: !!currentUser.value?.telegramUsername
  }
].filter(item => item.show && item.value))

// Settings menu structure
const settingsMenus = computed(() => [
  {
    title: 'Hisob sozlamalari',
    icon: '⚙️',
    items: [
      {
        label: 'Parolni o\'zgartirish',
        icon: '🔑',
        action: 'changePassword',
        enabled: false
      },
      {
        label: 'Profilni tahrirlash',
        icon: '✏️',
        action: 'editProfile',
        enabled: false
      },
      {
        label: 'Bildirishnomalar',
        icon: '🔔',
        action: 'notifications',
        enabled: false
      }
    ]
  },
  {
    title: 'Xavfsizlik',
    icon: '🛡️',
    items: [
      {
        label: 'Ikki bosqichli autentifikatsiya',
        icon: '🛡️',
        action: 'twoFactor',
        enabled: false
      },
      {
        label: 'Faol sessiyalar',
        icon: '📱',
        action: 'activeSessions',
        enabled: false
      }
    ]
  },
  {
    title: 'Umumiy',
    icon: '🌐',
    items: [
      {
        label: 'Til sozlamalari',
        icon: '🌐',
        action: 'language',
        enabled: false
      },
      {
        label: 'Mavzu (Theme)',
        icon: '🎨',
        action: 'theme',
        enabled: false
      },
      {
        label: 'Yordam',
        icon: 'ℹ️',
        action: 'help',
        enabled: false
      }
    ]
  }
])

// ==================== Navigation ====================
function goBack() {
  router.push('/dashboard')
}

function goToDashboard() {
  router.push('/dashboard')
}

// ==================== Authentication ====================
function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// ==================== Settings Actions ====================
function handleSettingAction(action) {
  // Placeholder for future implementations
  console.log('Setting action:', action)

  // TODO: Implement actual functionality
  alert(`${action} funksiyasi hozircha ishlamaydi. Tez orada qo'shiladi!`)
}
</script>

<template>
  <div class="settings-container">
    <SideMenu />

    <!-- Settings Header -->
    <div class="settings-header">
      <div class="header-left">
        <button
            @click="goBack"
            class="back-button"
            aria-label="Orqaga qaytish"
        >
          ← Orqaga
        </button>
        <h1>⚙️ Sozlamalar</h1>
      </div>
      <button
          @click="handleLogout"
          class="btn-logout"
          aria-label="Tizimdan chiqish"
      >
        🚪 Chiqish
      </button>
    </div>

    <!-- Settings Content -->
    <div class="settings-content">
      <!-- User Profile Section -->
      <div class="settings-section">
        <div class="section-header">
          <h2>
            <span class="section-icon">👤</span>
            Profil ma'lumotlari
          </h2>
          <button
              @click="goToDashboard"
              class="btn-view-dashboard"
              title="Dashboard ga o'tish"
          >
            Dashboard →
          </button>
        </div>

        <div class="settings-card profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              <span class="avatar-text">
                {{ currentUser?.firstName?.charAt(0) || 'U' }}{{ currentUser?.lastName?.charAt(0) || '' }}
              </span>
            </div>
            <div class="profile-info">
              <h3 class="profile-name">{{ userFullName }}</h3>
              <p class="profile-username">@{{ currentUser?.username }}</p>
            </div>
          </div>

          <div class="profile-details">
            <TransitionGroup name="list">
              <div
                  v-for="(info, index) in profileInfo"
                  :key="index"
                  class="info-row"
              >
                <div class="info-label">
                  <span class="info-icon">{{ info.icon }}</span>
                  <span>{{ info.label }}</span>
                </div>
                <span class="info-value">{{ info.value }}</span>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>

      <!-- Settings Menus -->
      <TransitionGroup name="section">
        <div
            v-for="(menu, menuIndex) in settingsMenus"
            :key="menuIndex"
            class="settings-section"
        >
          <div class="section-header">
            <h2>
              <span class="section-icon">{{ menu.icon }}</span>
              {{ menu.title }}
            </h2>
          </div>

          <div class="settings-card">
            <button
                v-for="(item, itemIndex) in menu.items"
                :key="itemIndex"
                class="settings-button"
                :class="{ disabled: !item.enabled }"
                @click="handleSettingAction(item.action)"
                :disabled="!item.enabled"
            >
              <div class="button-content">
                <span class="button-icon">{{ item.icon }}</span>
                <span class="button-label">{{ item.label }}</span>
                <span v-if="!item.enabled" class="coming-soon">Tez orada</span>
              </div>
              <span class="arrow">→</span>
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Danger Zone -->
      <div class="settings-section danger-zone">
        <div class="section-header">
          <h2>
            <span class="section-icon">⚠️</span>
            Xavfli zona
          </h2>
        </div>

        <div class="settings-card danger-card">
          <button
              @click="handleLogout"
              class="settings-button danger-button"
          >
            <div class="button-content">
              <span class="button-icon">🚪</span>
              <span class="button-label">Tizimdan chiqish</span>
            </div>
            <span class="arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Container ==================== */
.settings-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

/* ==================== Header ==================== */
.settings-header {
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.back-button:hover {
  background: #667eea;
  color: white;
  transform: translateX(-2px);
}

.settings-header h1 {
  margin: 0;
  color: #333;
  font-size: clamp(1.4rem, 3vw, 1.8rem);
  font-weight: 700;
}

.btn-logout {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #ff4757 0%, #ff3838 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.2);
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3);
}

/* ==================== Content ==================== */
.settings-content {
  max-width: 900px;
  margin: 0 auto;
}

.settings-section {
  margin-bottom: 2rem;
  animation: fadeIn 0.5s ease-out;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.settings-section h2 {
  color: #333;
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.3em;
}

.btn-view-dashboard {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-view-dashboard:hover {
  background: #5568d3;
  transform: translateX(3px);
}

/* ==================== Cards ==================== */
.settings-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.settings-card:hover {
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

/* ==================== Profile Card ==================== */
.profile-card {
  padding: 2rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.avatar-text {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  text-transform: uppercase;
}

.profile-info {
  flex: 1;
}

.profile-name {
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
}

.profile-username {
  margin: 0;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 600;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.info-row:hover {
  background: #e9ecef;
  transform: translateX(3px);
}

.info-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #666;
}

.info-icon {
  font-size: 1.2rem;
}

.info-value {
  color: #333;
  font-weight: 600;
}

/* ==================== Settings Buttons ==================== */
.settings-button {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1rem;
  background: white;
  border: none;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  font-family: inherit;
}

.settings-button:last-child {
  border-bottom: none;
}

.settings-button:hover:not(.disabled) {
  background: #f8f9fa;
  padding-left: 1.5rem;
}

.settings-button.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.button-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.button-icon {
  font-size: 1.3rem;
}

.button-label {
  font-weight: 600;
}

.coming-soon {
  padding: 0.25rem 0.625rem;
  background: #fef3c7;
  color: #f59e0b;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: auto;
}

.arrow {
  color: #667eea;
  font-size: 1.2rem;
  font-weight: 600;
  transition: transform 0.3s;
}

.settings-button:hover:not(.disabled) .arrow {
  transform: translateX(5px);
}

/* ==================== Danger Zone ==================== */
.danger-zone {
  margin-top: 3rem;
}

.danger-card {
  border: 2px solid #fee2e2;
  background: #fef2f2;
}

.danger-button {
  background: #fef2f2;
}

.danger-button:hover {
  background: #fee2e2;
  padding-left: 1.5rem;
}

.danger-button .button-label {
  color: #ef4444;
}

.danger-button .arrow {
  color: #ef4444;
}

/* ==================== Animations ==================== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* List Transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.list-move {
  transition: transform 0.3s;
}

/* Section Transition */
.section-enter-active,
.section-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.section-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.section-move {
  transition: transform 0.4s;
}

/* ==================== Responsive Design ==================== */
@media (max-width: 768px) {
  .settings-container {
    padding: 1rem;
  }

  .settings-header {
    flex-direction: column;
    gap: 1rem;
    margin-left: 0;
    padding: 1.25rem;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .settings-header h1 {
    font-size: 1.4rem;
  }

  .btn-logout {
    width: 100%;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .btn-view-dashboard {
    width: 100%;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-avatar {
    width: 70px;
    height: 70px;
  }

  .avatar-text {
    font-size: 1.75rem;
  }

  .profile-name {
    font-size: 1.3rem;
  }

  .profile-username {
    font-size: 1rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .settings-card {
    padding: 1.25rem;
  }
}

@media (max-width: 480px) {
  .profile-card {
    padding: 1.5rem;
  }

  .profile-avatar {
    width: 60px;
    height: 60px;
  }

  .avatar-text {
    font-size: 1.5rem;
  }

  .settings-button {
    padding: 1rem 0.75rem;
  }

  .button-icon {
    font-size: 1.2rem;
  }

  .button-label {
    font-size: 0.95rem;
  }

  .coming-soon {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
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

/* ==================== Print Styles ==================== */
@media print {
  .back-button,
  .btn-logout,
  .btn-view-dashboard,
  .settings-button,
  .danger-zone {
    display: none;
  }

  .settings-container {
    background: white;
  }

  .settings-card {
    box-shadow: none;
    border: 1px solid #e0e0e0;
  }
}
</style>