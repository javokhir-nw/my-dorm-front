<script setup>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// ==================== Composables ====================
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ==================== State ====================
const isMenuOpen = ref(false)
const expandedMenus = ref({
  malumotnoma: false
})

// ==================== Computed Properties ====================
const currentUser = computed(() => authStore.currentUser)

const userFullName = computed(() => {
  if (!currentUser.value) return 'Foydalanuvchi'

  const { firstName, lastName } = currentUser.value
  return [firstName, lastName].filter(Boolean).join(' ') || 'Foydalanuvchi'
})

const currentPath = computed(() => route.path)

// Menu structure with icons and routes
const menuItems = computed(() => [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    route: '/dashboard',
    type: 'link'
  },
  {
    id: 'malumotnoma',
    label: 'Ma\'lumotnoma',
    icon: '📚',
    type: 'dropdown',
    children: [
      {
        id: 'dormitories',
        label: 'Yotoqxonalar',
        icon: '🏢',
        route: '/dormitories'
      },
      {
        id: 'users',
        label: 'Foydalanuvchilar',
        icon: '👥',
        route: '/users'
      },
      {
        id: 'room-types',
        label: 'Xona turlari',
        icon: '🏷️',
        route: '/room-type'
      },
      {
        id: 'attendance',
        label: 'Navbatchilik',
        icon: '📋',
        route: '/attendance'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Sozlamalar',
    icon: '⚙️',
    route: '/settings',
    type: 'link'
  }
])

// Check if current route is active
const isRouteActive = (itemRoute) => {
  return currentPath.value === itemRoute || currentPath.value.startsWith(itemRoute + '/')
}

// Check if dropdown has active child
const hasActiveChild = (children) => {
  return children?.some(child => isRouteActive(child.route))
}

// ==================== Menu Management ====================
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
  // Reset expanded menus
  Object.keys(expandedMenus.value).forEach(key => {
    expandedMenus.value[key] = false
  })
}

function toggleDropdown(menuId) {
  expandedMenus.value[menuId] = !expandedMenus.value[menuId]
}

// ==================== Navigation ====================
function navigateTo(path) {
  router.push(path)
  closeMenu()
}

function handleMenuItemClick(item) {
  if (item.type === 'link') {
    navigateTo(item.route)
  } else if (item.type === 'dropdown') {
    toggleDropdown(item.id)
  }
}

function handleDropdownItemClick(route) {
  navigateTo(route)
}

// ==================== Authentication ====================
function handleLogout() {
  authStore.logout()
  closeMenu()
  router.push('/login')
}
</script>

<template>
  <div>
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

    <!-- Side Menu -->
    <Transition name="slide">
      <div
          v-if="isMenuOpen"
          class="side-menu"
          :class="{ open: isMenuOpen }"
      >
        <div class="menu-header">
          <h3>🏠 Menu</h3>
          <button
              class="close-button"
              @click="closeMenu"
              aria-label="Yopish"
          >
            ✕
          </button>
        </div>

        <nav class="menu-nav">
          <!-- User Info Card -->
          <div class="user-info-menu">
            <div class="user-avatar">
              <span class="avatar-text">
                {{ currentUser?.firstName?.charAt(0) || 'U' }}{{ currentUser?.lastName?.charAt(0) || '' }}
              </span>
            </div>
            <div class="user-details">
              <p class="user-name">{{ userFullName }}</p>
              <p class="user-username">@{{ currentUser?.username }}</p>
            </div>
          </div>

          <!-- Menu Items -->
          <div class="menu-items">
            <template v-for="item in menuItems" :key="item.id">
              <!-- Regular Link Item -->
              <button
                  v-if="item.type === 'link'"
                  @click="handleMenuItemClick(item)"
                  class="menu-item"
                  :class="{ active: isRouteActive(item.route) }"
              >
                <span class="menu-icon">{{ item.icon }}</span>
                <span class="menu-label">{{ item.label }}</span>
                <span v-if="isRouteActive(item.route)" class="active-indicator">●</span>
              </button>

              <!-- Dropdown Item -->
              <div v-else-if="item.type === 'dropdown'" class="dropdown-wrapper">
                <button
                    @click="handleMenuItemClick(item)"
                    class="menu-item dropdown-btn"
                    :class="{
                    active: hasActiveChild(item.children),
                    expanded: expandedMenus[item.id]
                  }"
                >
                  <div class="menu-item-content">
                    <span class="menu-icon">{{ item.icon }}</span>
                    <span class="menu-label">{{ item.label }}</span>
                  </div>
                  <span
                      class="arrow"
                      :class="{ rotated: expandedMenus[item.id] }"
                  >
                    ▼
                  </span>
                </button>

                <!-- Dropdown Menu -->
                <Transition name="dropdown">
                  <div
                      v-show="expandedMenus[item.id]"
                      class="dropdown-menu"
                  >
                    <button
                        v-for="child in item.children"
                        :key="child.id"
                        @click="handleDropdownItemClick(child.route)"
                        class="dropdown-item"
                        :class="{ active: isRouteActive(child.route) }"
                    >
                      <span class="dropdown-icon">{{ child.icon }}</span>
                      <span class="dropdown-label">{{ child.label }}</span>
                      <span v-if="isRouteActive(child.route)" class="active-indicator">●</span>
                    </button>
                  </div>
                </Transition>
              </div>
            </template>

            <!-- Logout Button -->
            <button
                @click="handleLogout"
                class="menu-item logout"
            >
              <span class="menu-icon">🚪</span>
              <span class="menu-label">Chiqish</span>
            </button>
          </div>
        </nav>
      </div>
    </Transition>

    <!-- Overlay -->
    <Transition name="fade">
      <div
          v-if="isMenuOpen"
          class="overlay"
          @click="closeMenu"
          aria-hidden="true"
      ></div>
    </Transition>
  </div>
</template>

<style scoped>
/* ==================== Hamburger Button ==================== */
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

.menu-button:active {
  transform: scale(0.98);
}

.menu-button:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
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

/* ==================== Side Menu ==================== */
.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 320px;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

/* Scrollbar styling */
.side-menu::-webkit-scrollbar {
  width: 6px;
}

.side-menu::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.side-menu::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 3px;
}

.side-menu::-webkit-scrollbar-thumb:hover {
  background: #5568d3;
}

/* ==================== Menu Header ==================== */
.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-shrink: 0;
}

.menu-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
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

.close-button:focus {
  outline: 2px solid white;
  outline-offset: 2px;
}

/* ==================== Menu Nav ==================== */
.menu-nav {
  padding: 1rem;
  flex: 1;
  overflow-y: auto;
}

/* ==================== User Info ==================== */
.user-info-menu {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 2px solid #e9ecef;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.avatar-text {
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  text-transform: uppercase;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 700;
  color: #333;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-username {
  color: #667eea;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 600;
}

/* ==================== Menu Items ==================== */
.menu-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.menu-item {
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  text-align: left;
  color: #333;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  font-family: inherit;
}

.menu-item:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateX(5px);
}

.menu-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
}

.menu-item.active .menu-icon {
  transform: scale(1.1);
}

.menu-item-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.menu-icon {
  font-size: 1.3rem;
  transition: transform 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-label {
  flex: 1;
}

.active-indicator {
  color: #10b981;
  font-size: 0.6rem;
  margin-left: auto;
}

.menu-item.active .active-indicator {
  color: white;
}

/* ==================== Logout Button ==================== */
.menu-item.logout {
  background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%);
  border-color: #fecaca;
  color: #ef4444;
  margin-top: 1rem;
}

.menu-item.logout:hover {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-color: #ef4444;
}

/* ==================== Dropdown ==================== */
.dropdown-wrapper {
  margin-bottom: 0;
}

.dropdown-btn {
  justify-content: space-between;
}

.dropdown-btn.expanded {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: 0;
}

.arrow {
  transition: transform 0.3s;
  color: #667eea;
  font-size: 0.85rem;
  font-weight: bold;
}

.arrow.rotated {
  transform: rotate(180deg);
}

.menu-item.active .arrow {
  color: white;
}

.dropdown-menu {
  background: #f8f9fa;
  border: 2px solid #f0f0f0;
  border-top: none;
  border-radius: 0 0 10px 10px;
  padding: 0.5rem 0;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  text-align: left;
  color: #555;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  font-family: inherit;
}

.dropdown-item:hover {
  background: white;
  color: #667eea;
  padding-left: 3rem;
}

.dropdown-item.active {
  background: white;
  color: #667eea;
  font-weight: 700;
}

.dropdown-icon {
  font-size: 1.1rem;
}

.dropdown-label {
  flex: 1;
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
  backdrop-filter: blur(2px);
}

/* ==================== Animations ==================== */
/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  transform: translateX(-100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* Fade Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Dropdown Transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform-origin: top;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scaleY(0);
}

/* ==================== Responsive Design ==================== */
@media (max-width: 768px) {
  .side-menu {
    width: 280px;
  }

  .menu-header h3 {
    font-size: 1.3rem;
  }

  .user-avatar {
    width: 45px;
    height: 45px;
  }

  .avatar-text {
    font-size: 1.1rem;
  }

  .user-name {
    font-size: 0.95rem;
  }

  .menu-item {
    padding: 0.875rem;
    font-size: 0.95rem;
  }

  .menu-icon {
    font-size: 1.2rem;
  }
}

@media (max-width: 360px) {
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

  .side-menu {
    width: 260px;
  }

  .user-info-menu {
    padding: 1rem;
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
  .menu-button,
  .side-menu,
  .overlay {
    display: none;
  }
}
</style>