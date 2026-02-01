<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

/**
 * ✅ 401/403 eng ko‘p sabab: Authorization header yo‘qligi yoki token noto‘g‘ri.
 * Interceptor har requestga token qo‘shadi (agar bor bo‘lsa).
 */
const api = axios.create({
  // baseURL: 'http://localhost:8080', // kerak bo‘lsa yoqing
  // withCredentials: true, // cookie-session bo‘lsa
})

api.interceptors.request.use((config) => {
  const token =
      authStore.token ||
      authStore.accessToken ||
      authStore.authToken ||
      authStore?.user?.token

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const roles = ref([])
const loading = ref(false)
const error = ref('')

// View modal states
const showViewModal = ref(false)
const selectedRole = ref({ id: null, name: '' })

// Success/Error message modal (xuddi sizdagi pattern)
const showMessageModal = ref(false)
const modalMessage = ref({ title: '', text: '', type: 'success' })

function showSuccessMessage(title, text) {
  modalMessage.value = { title, text, type: 'success' }
  showMessageModal.value = true
}
function showErrorMessage(title, text) {
  modalMessage.value = { title, text, type: 'error' }
  showMessageModal.value = true
}
function closeMessageModal() {
  showMessageModal.value = false
}

async function fetchRoles() {
  loading.value = true
  error.value = ''

  try {
    const res = await api.get('/api/role/list')
    // Siz yuborgan response: [{id,name}, ...]
    roles.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.log('ROLE LIST ERR:', err?.response?.status, err?.response?.data)
    error.value =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Server bilan bog'lanishda xatolik!"
  } finally {
    loading.value = false
  }
}

// View modal
function openViewModal(role) {
  selectedRole.value = { id: role.id, name: role.name }
  showViewModal.value = true
}
function closeViewModal() {
  showViewModal.value = false
  selectedRole.value = { id: null, name: '' }
}

onMounted(fetchRoles)
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <span class="page-title__icon">
            <!-- icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <h1>Rollar</h1>
        </div>
      </div>

      <button @click="fetchRoles" class="btn-create" :disabled="loading" title="Yangilash">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
          <path d="M21 3v6h-6"></path>
        </svg>
        Yangilash
      </button>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="fetchRoles" class="btn-retry">Qayta urinish</button>
      </div>

      <div v-else class="content-card">
        <div v-if="roles && roles.length > 0" class="roles-list">
          <div v-for="role in roles" :key="role.id" class="role-item">
            <div class="role-info">
              <div class="role-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z"></path>
                </svg>
              </div>
              <div class="role-details">
                <h3 class="role-name">{{ role.name }}</h3>
                <p class="role-id">ID: {{ role.id }}</p>
              </div>
            </div>

            <div class="role-actions">
              <!-- ✅ Ko‘zcha (view) -->
              <button @click="openViewModal(role)" class="btn-view" title="Ko‘rish">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Ko‘rish
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16v12H4z"></path>
              <path d="m22 8-10 6L2 8"></path>
            </svg>
          </div>
          <h3>Rollar mavjud emas</h3>
          <p>Role list bo‘sh qaytdi yoki ruxsat yo‘q.</p>
          <button @click="fetchRoles" class="btn-add-first">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
              <path d="M21 3v6h-6"></path>
            </svg>
            Qayta yuklash
          </button>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-medium modal-compact">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            Role ma’lumoti
          </h2>
          <button @click="closeViewModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="info-row">
            <span class="info-label">ID</span>
            <span class="info-value">{{ selectedRole.id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">NAME</span>
            <span class="info-value code">{{ selectedRole.name }}</span>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-submit">Yopish</button>
        </div>
      </div>
    </div>

    <!-- Success/Error Message Modal -->
    <div v-if="showMessageModal" class="modal-overlay" @click.self="closeMessageModal">
      <div class="modal modal-message">
        <div class="modal-body message-body">
          <div :class="['message-icon', `icon-${modalMessage.type}`]">
            <span v-if="modalMessage.type === 'success'">✓</span>
            <span v-else>✕</span>
          </div>
          <h3 class="message-title">{{ modalMessage.title }}</h3>
          <p class="message-text">{{ modalMessage.text }}</p>
          <button @click="closeMessageModal" class="btn-message-ok">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* RoomTypesPage styling’iga moslashtirdim (o‘xshash ko‘rinish) */

.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
  padding-left: 5.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem 1.75rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.header-left { display: flex; align-items: center; gap: 1rem; }
.page-title { display: flex; align-items: center; gap: 1rem; }

.page-title__icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  flex-shrink: 0;
}
.page-title__icon svg { width: 24px; height: 24px; }

.page-header h1 {
  margin: 0;
  color: #1a202c;
  font-size: 1.5rem;
  font-weight: 700;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-create svg { width: 18px; height: 18px; }
.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}
.btn-create:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.page-content { max-width: 1400px; margin: 0 auto; }

/* Loading */
.loading-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin { 0% { transform: rotate(0deg);} 100%{ transform: rotate(360deg);} }

/* Error */
.error-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.error-card p { color: #ef4444; margin-bottom: 1rem; font-weight: 600; }
.btn-retry {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-retry:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

/* Content */
.content-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* List */
.roles-list { display: flex; flex-direction: column; gap: 1rem; }

.role-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.75rem;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.role-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.role-info { display: flex; align-items: center; gap: 1.5rem; }

.role-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transition: all 0.3s;
  flex-shrink: 0;
}
.role-item:hover .role-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}
.role-icon svg { width: 28px; height: 28px; }

.role-details { display: flex; flex-direction: column; gap: 0.35rem; }
.role-name { margin: 0; color: #1a202c; font-size: 1.3rem; font-weight: 700; }
.role-id { margin: 0; color: #9ca3af; font-size: 0.875rem; font-weight: 500; }

.role-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }

.btn-view {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-view svg { width: 16px; height: 16px; }
.btn-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* Empty */
.empty-state { text-align: center; padding: 4rem 2rem; }
.empty-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}
.empty-icon svg { width: 40px; height: 40px; }
.empty-state h3 { color: #1a202c; margin: 0 0 0.75rem 0; font-size: 1.6rem; font-weight: 700; }
.empty-state p { color: #6b7280; margin: 0 0 2rem 0; font-size: 1.05rem; }
.btn-add-first {
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-add-first svg { width: 18px; height: 18px; }
.btn-add-first:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }

/* Modal (RoomTypesPage’dagi bilan bir xil) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}
.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-height: 85vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-medium { max-width: 480px; }
.modal-message { max-width: 380px; }

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 16px 16px 0 0;
}
.modal-header h2 { margin: 0; color: #1a202c; font-size: 1.2rem; font-weight: 700; }
.modal-title { display: flex; align-items: center; gap: 0.6rem; }
.modal-title-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea;
  flex-shrink: 0;
}
.modal-title-icon svg { width: 18px; height: 18px; }

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #9ca3af;
  transition: all 0.3s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-shrink: 0;
}
.modal-close:hover { color: #1a202c; background: #f3f4f6; transform: rotate(90deg); }

.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 2px solid #f3f4f6;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  position: sticky;
  bottom: 0;
  background: white;
  border-radius: 0 0 16px 16px;
}

/* View modal info rows */
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  margin-bottom: 0.75rem;
}
.info-label { color: #6b7280; font-weight: 700; font-size: 0.9rem; }
.info-value { color: #111827; font-weight: 700; font-size: 0.95rem; }
.info-value.code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

/* Buttons used in modal footer */
.btn-submit {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

/* Message modal */
.message-body { text-align: center; padding: 2rem 1.5rem; }
.message-icon {
  width: 70px; height: 70px; border-radius: 50%;
  margin: 0 auto 1.25rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; font-weight: bold;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.icon-success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #10b981; }
.icon-error { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #ef4444; }
.message-title { color: #1a202c; font-size: 1.5rem; margin: 0 0 0.6rem 0; font-weight: 700; }
.message-text { color: #6b7280; font-size: 1rem; margin: 0 0 1.5rem 0; line-height: 1.6; }
.btn-message-ok {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  min-width: 120px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-message-ok:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

/* Compact modal */
.modal-compact .modal-body { padding: 0.95rem !important; }

/* Responsive */
@media (max-width: 768px) {
  .page-container { padding: 1rem; padding-left: 1rem; }
  .page-header { flex-direction: column; gap: 1rem; padding: 1.25rem; }
  .btn-create { width: 100%; justify-content: center; }
  .role-item { flex-direction: column; gap: 1.5rem; text-align: center; padding: 1.5rem; }
  .role-info { flex-direction: column; width: 100%; }
  .role-actions { width: 100%; flex-direction: column; }
  .btn-view { width: 100%; justify-content: center; }
  .modal { width: 95%; margin: 1rem; }
  .modal-footer { padding: 1.25rem; flex-direction: column; }
  .btn-submit { width: 100%; }
}
</style>
