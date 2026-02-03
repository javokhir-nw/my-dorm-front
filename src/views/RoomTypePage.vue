<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const authStore = useAuthStore()

/**
 * ✅ 403 uchun eng ko‘p sabab: Authorization header yo‘qligi.
 * Bu interceptor har requestga token qo‘shadi (agar bor bo‘lsa).
 *
 * Pitfall:
 * - Agar siz cookie-session + CSRF ishlatsangiz, token emas, CSRF kerak bo‘ladi.
 *   Unda withCredentials true bo‘lishi mumkin. (pastda komment qilingan)
 */
const api = axios.create({
  // baseURL kerak bo‘lsa shu yerga qo‘ying:
  // baseURL: '/',
  // Agar cookie-session ishlatsangiz yoqing:
  // withCredentials: true,
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

const roomTypes = ref([])
const loading = ref(false)
const error = ref('')

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSuccessModal = ref(false)

// Form data
const createForm = ref({ name: '' })
const editForm = ref({ id: null, name: '' })
const deleteId = ref(null)

// Success/Error message
const modalMessage = ref({ title: '', text: '', type: 'success' })

// Loading states for modals
const createLoading = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)

// Form validation errors
const formErrors = ref({ name: '' })

async function fetchRoomTypes() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/api/room-type/list')
    roomTypes.value = response.data
  } catch (err) {
    // Diagnostika
    console.log('LIST ERR:', err?.response?.status, err?.response?.data)

    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err?.response?.data?.message || err.message || "Server bilan bog'lanishda xatolik!"
    }
  } finally {
    loading.value = false
  }
}

function showSuccessMessage(title, text) {
  modalMessage.value = { title, text, type: 'success' }
  showSuccessModal.value = true
}

function showErrorMessage(title, text) {
  modalMessage.value = { title, text, type: 'error' }
  showSuccessModal.value = true
}

function closeSuccessModal() {
  showSuccessModal.value = false
}

function clearFormErrors() {
  formErrors.value = { name: '' }
}

function validateForm(form) {
  clearFormErrors()
  let isValid = true

  if (!form.name || !form.name.trim()) {
    formErrors.value.name = 'Xona turi nomini kiriting!'
    isValid = false
  }

  return isValid
}

// Create Room Type
function openCreateModal() {
  createForm.value = { name: '' }
  clearFormErrors()
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  clearFormErrors()
}

async function createRoomType() {
  if (!validateForm(createForm.value)) return
  createLoading.value = true

  try {
    const requestBody = { name: createForm.value.name.trim() }
    await api.post('/api/room-type/create', requestBody)

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona turi muvaffaqiyatli yaratildi')
    fetchRoomTypes()
  } catch (err) {
    console.log('CREATE ERR:', err?.response?.status, err?.response?.data)

    const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Xatolik yuz berdi!'

    showErrorMessage('Xatolik!', msg)
  } finally {
    createLoading.value = false
  }
}

// Edit Room Type
function openEditModal(roomType) {
  editForm.value = { id: roomType.id, name: roomType.name }
  clearFormErrors()
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  clearFormErrors()
}

async function updateRoomType() {
  if (!validateForm(editForm.value)) return
  editLoading.value = true

  try {
    const requestBody = { id: editForm.value.id, name: editForm.value.name.trim() }

    // Agar backend PUT kutsa:
    // await api.put('/api/room-type/update', requestBody)
    // Sizda POST ishlatilgan, shuni qoldirdim:
    await api.post('/api/room-type/update', requestBody)

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona turi muvaffaqiyatli yangilandi')
    fetchRoomTypes()
  } catch (err) {
    console.log('UPDATE ERR:', err?.response?.status, err?.response?.data)

    const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Xatolik yuz berdi!'

    showErrorMessage('Xatolik!', msg)
  } finally {
    editLoading.value = false
  }
}

// Delete Room Type
function openDeleteModal(id) {
  deleteId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function deleteRoomType() {
  deleteLoading.value = true

  try {
    await api.delete(`/api/room-type/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', "Xona turi muvaffaqiyatli o'chirildi")
    fetchRoomTypes()
  } catch (err) {
    console.log('DELETE ERR:', err?.response?.status, err?.response?.data)

    closeDeleteModal()
    const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        'Xatolik yuz berdi!'

    showErrorMessage('Xatolik!', msg)
  } finally {
    deleteLoading.value = false
  }
}

onMounted(fetchRoomTypes)
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <span class="page-title__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12h18"></path>
              <path d="M5 12V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5"></path>
              <path d="M4 20h16"></path>
              <path d="M7 20v-5h10v5"></path>
            </svg>
          </span>
          <h1>Xona turlari</h1>
        </div>
      </div>

      <button @click="openCreateModal" class="btn-create">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Xona turi qo'shish
      </button>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="fetchRoomTypes" class="btn-retry">Qayta urinish</button>
      </div>

      <div v-else class="content-card">
        <div v-if="roomTypes && roomTypes.length > 0" class="room-types-list">
          <div v-for="roomType in roomTypes" :key="roomType.id" class="room-type-item">
            <div class="room-type-info">
              <div class="room-type-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z"></path>
                  <circle cx="7.5" cy="7.5" r="1.5"></circle>
                </svg>
              </div>
              <div class="room-type-details">
                <h3 class="room-type-name">{{ roomType.name }}</h3>
                <p class="room-type-id">ID: {{ roomType.id }}</p>
              </div>
            </div>

            <div class="room-type-actions">
              <button @click="openEditModal(roomType)" class="btn-edit" title="Tahrirlash">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"></path>
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                Tahrirlash
              </button>

              <button @click="openDeleteModal(roomType.id)" class="btn-delete" title="O'chirish">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M8 6V4h8v2"></path>
                  <path d="M19 6l-1 14H6L5 6"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                </svg>
                O'chirish
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
          <h3>Xona turlari mavjud emas</h3>
          <p>Birinchi xona turini qo'shish uchun yuqoridagi tugmani bosing</p>
          <button @click="openCreateModal" class="btn-add-first">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Birinchi xona turini qo'shish
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <!-- ✅ modal-compact qo‘shildi -->
      <div class="modal modal-medium modal-compact">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41 11 3H4v7l9.59 9.59a2 2 0 0 0 2.82 0l4.18-4.18a2 2 0 0 0 0-2.82Z"></path>
                <circle cx="7.5" cy="7.5" r="1.5"></circle>
              </svg>
            </span>
            Yangi Xona Turi Qo'shish
          </h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Xona turi nomi *</label>
            <input
                v-model="createForm.name"
                type="text"
                placeholder="Masalan: Yotoqxona, Oshxona, Hojatxona"
                class="form-input"
                :class="{ 'input-error': formErrors.name }"
                @input="formErrors.name = ''"
            />
            <p v-if="formErrors.name" class="error-message">{{ formErrors.name }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">Bekor qilish</button>
          <button @click="createRoomType" class="btn-submit" :disabled="createLoading">
            <span v-if="createLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <!-- ✅ modal-compact qo‘shildi -->
      <div class="modal modal-medium modal-compact">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </span>
            Xona turini tahrirlash
          </h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Xona turi nomi *</label>
            <input
                v-model="editForm.name"
                type="text"
                placeholder="Masalan: Yotoqxona, Oshxona, Hojatxona"
                class="form-input"
                :class="{ 'input-error': formErrors.name }"
                @input="formErrors.name = ''"
            />
            <p v-if="formErrors.name" class="error-message">{{ formErrors.name }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel" :disabled="editLoading">Bekor qilish</button>
          <button @click="updateRoomType" class="btn-submit" :disabled="editLoading">
            <span v-if="editLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M19 6l-1 14H6L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </span>
            O'chirishni tasdiqlash
          </h2>
          <button @click="closeDeleteModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <p class="delete-warning">
            Haqiqatan ham ushbu xona turini o'chirmoqchimisiz?
            <br /><strong>Bu amalni ortga qaytarib bo'lmaydi!</strong>
          </p>
        </div>

        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel" :disabled="deleteLoading">Bekor qilish</button>
          <button @click="deleteRoomType" class="btn-delete-confirm" :disabled="deleteLoading">
            <span v-if="deleteLoading">O'chirilmoqda...</span>
            <span v-else>O'chirish</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Modal -->
    <div v-if="showSuccessModal" class="modal-overlay" @click.self="closeSuccessModal">
      <div class="modal modal-message">
        <div class="modal-body message-body">
          <div :class="['message-icon', `icon-${modalMessage.type}`]">
            <span v-if="modalMessage.type === 'success'">✓</span>
            <span v-else>✕</span>
          </div>
          <h3 class="message-title">{{ modalMessage.title }}</h3>
          <p class="message-text">{{ modalMessage.text }}</p>
          <button @click="closeSuccessModal" class="btn-message-ok">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === sizning CSS’ingiz (qisqartirmadim), faqat 2 joyga fix qo‘shdim === */

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

.btn-create:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

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

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

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

/* Content Card */
.content-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Room Types List */
.room-types-list { display: flex; flex-direction: column; gap: 1rem; }

.room-type-item {
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

.room-type-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.room-type-info { display: flex; align-items: center; gap: 1.5rem; }

.room-type-icon {
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

.room-type-item:hover .room-type-icon {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.room-type-icon svg { width: 28px; height: 28px; }

.room-type-details { display: flex; flex-direction: column; gap: 0.35rem; }

.room-type-name { margin: 0; color: #1a202c; font-size: 1.3rem; font-weight: 700; }
.room-type-id { margin: 0; color: #9ca3af; font-size: 0.875rem; font-weight: 500; }

.room-type-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }

.btn-edit, .btn-delete {
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
}

.btn-edit svg, .btn-delete svg { width: 16px; height: 16px; }

.btn-edit {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.btn-edit:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.btn-delete {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.btn-delete:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

/* Empty State */
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

.btn-add-first:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* Modal Styles */
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

.modal-small { max-width: 420px; }
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

/* ✅ gradient fix (sizda 135deg: xato edi) */
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

.form-group { margin-bottom: 1.25rem; }
.form-group:last-child { margin-bottom: 0; }

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #1a202c;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: all 0.3s;
  font-family: inherit;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
  background: white;
}

.form-input.input-error { border-color: #ef4444; background: #fef2f2; }
.form-input.input-error:focus { box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12); }

.error-message { color: #ef4444; font-size: 0.85rem; margin-top: 0.4rem; margin-bottom: 0; font-weight: 500; }

.delete-warning { color: #dc2626; font-weight: 600; text-align: center; line-height: 1.7; font-size: 1rem; }

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

.btn-cancel {
  padding: 0.7rem 1.5rem;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
}
.btn-cancel:hover:not(:disabled) { background: #e5e7eb; transform: translateY(-2px); }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

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
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-delete-confirm {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.btn-delete-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}
.btn-delete-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Success/Error Message Modal */
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

/* =========================
   ✅ Create/Update inputlarni kichraytirish
   (faqat modal-compact bo‘lsa)
   IMPORTANT: bu blok style oxirida turishi kerak
========================= */
.modal-compact .modal-body { padding: 0.95rem !important; }
.modal-compact .form-group { margin-bottom: 0.75rem !important; }
.modal-compact .form-group label { margin-bottom: 0.25rem !important; font-size: 0.86rem !important; }
.modal-compact .form-input {
  padding: 0.45rem 0.75rem !important;
  font-size: 0.88rem !important;
  min-height: 36px !important;
  border-radius: 8px !important;
}
.modal-compact .btn-cancel,
.modal-compact .btn-submit {
  padding: 0.6rem 1.25rem !important;
  font-size: 0.92rem !important;
}

/* Responsive */
@media (max-width: 768px) {
  .page-container { padding: 1rem; padding-left: 1rem; }

  .page-header { flex-direction: column; gap: 1rem; padding: 1.25rem; }

  .header-left { width: 100%; justify-content: flex-start; }

  .page-title__icon { width: 40px; height: 40px; }
  .page-title__icon svg { width: 20px; height: 20px; }

  .page-header h1 { font-size: 1.25rem; }

  .btn-create { width: 100%; justify-content: center; }

  .room-type-item { flex-direction: column; gap: 1.5rem; text-align: center; padding: 1.5rem; }
  .room-type-info { flex-direction: column; width: 100%; }
  .room-type-actions { width: 100%; flex-direction: column; }
  .btn-edit, .btn-delete { width: 100%; justify-content: center; }

  .modal { width: 95%; margin: 1rem; }
  .modal-footer { padding: 1.25rem; flex-direction: column; }

  .btn-cancel, .btn-submit, .btn-delete-confirm { width: 100%; }
}
</style>
