<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

const dormitories = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

// Search and pagination parameters
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSuccessModal = ref(false)

// Form data
const createForm = ref({
  name: ''
})

const editForm = ref({
  id: 0,
  name: ''
})

const deleteId = ref(null)

// Success/Error message
const modalMessage = ref({
  title: '',
  text: '',
  type: 'success'
})

// Loading states for modals
const createLoading = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)

// Form validation error
const formError = ref('')

function goBack() {
  router.push('/dashboard')
}

async function fetchDormitories() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post('/api/dorm/list', {
      page: currentPage.value - 1,
      size: pageSize.value,
      search: {
        value: searchQuery.value || ''
      }
    })

    dormitories.value = response.data.list || []
    total.value = response.data.total || 0
    totalPages.value = response.data.totalPages || Math.ceil(total.value / pageSize.value)
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchDormitories()
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  fetchDormitories()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchDormitories()
  }
}

function viewDormitory(id) {
  router.push(`/dormitory/${id}`)
}

function showSuccessMessage(title, text) {
  modalMessage.value = {
    title,
    text,
    type: 'success'
  }
  showSuccessModal.value = true
}

function showErrorMessage(title, text) {
  modalMessage.value = {
    title,
    text,
    type: 'error'
  }
  showSuccessModal.value = true
}

function closeSuccessModal() {
  showSuccessModal.value = false
}

// Create Dormitory
function openCreateModal() {
  createForm.value.name = ''
  formError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  createForm.value.name = ''
  formError.value = ''
}

async function createDormitory() {
  formError.value = ''

  if (!createForm.value.name.trim()) {
    formError.value = 'Iltimos, yotoqxona nomini kiriting!'
    return
  }

  createLoading.value = true

  try {
    const response = await axios.post('/api/dorm/create', {
      name: createForm.value.name.trim()
    })

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Yotoqxona muvaffaqiyatli yaratildi')
    fetchDormitories()
  } catch (err) {
    formError.value = err.message || 'Xatolik yuz berdi!'
  } finally {
    createLoading.value = false
  }
}

// Edit Dormitory
function openEditModal(dorm) {
  editForm.value.id = dorm.id
  editForm.value.name = dorm.name
  formError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value.id = 0
  editForm.value.name = ''
  formError.value = ''
}

async function updateDormitory() {
  formError.value = ''

  if (!editForm.value.name.trim()) {
    formError.value = 'Iltimos, yotoqxona nomini kiriting!'
    return
  }

  editLoading.value = true

  try {
    const response = await axios.post('/api/dorm/update', {
      id: editForm.value.id,
      name: editForm.value.name.trim()
    })

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Yotoqxona muvaffaqiyatli yangilandi')
    fetchDormitories()
  } catch (err) {
    formError.value = err.message || 'Xatolik yuz berdi!'
  } finally {
    editLoading.value = false
  }
}

// Delete Dormitory
function openDeleteModal(id) {
  deleteId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function deleteDormitory() {
  deleteLoading.value = true

  try {
    const response = await axios.delete(`/api/dorm/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Yotoqxona muvaffaqiyatli o\'chirildi')
    fetchDormitories()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchDormitories()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>Yotoqxonalar</h1>
      </div>
      <button @click="openCreateModal" class="btn-create">+ Yangi qo'shish</button>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-box">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Yotoqxona nomini kiriting..."
            @keyup.enter="handleSearch"
            class="search-input"
        />
        <button @click="handleSearch" class="btn-search" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          Qidirish
        </button>
        <button
            v-if="searchQuery"
            @click="clearSearch"
            class="btn-clear"
            :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <div class="page-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="fetchDormitories" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="dormitories.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <h3>Yotoqxonalar topilmadi</h3>
        <p v-if="searchQuery">
          "{{ searchQuery }}" bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday yotoqxona yo'q</p>
      </div>

      <!-- Dormitories List -->
      <div v-else>
        <div class="dormitories-list">
          <div
              v-for="(dorm, index) in dormitories"
              :key="dorm.id"
              class="dorm-list-item"
          >
            <div class="dorm-list-number">{{ (currentPage - 1) * pageSize + index + 1 }}</div>

            <div class="dorm-list-content">
              <div class="dorm-list-header">
                <h4 class="dorm-list-name">{{ dorm.name }}</h4>
                <span class="dorm-list-floors" v-if="dorm.floors">{{ dorm.floors }} ta qavat</span>
              </div>

              <div class="dorm-list-details">
                <div class="dorm-detail-row" v-if="dorm.ownerFirstName || dorm.ownerLastName">
                  <span class="detail-label">Yotoqxona Mudir(as)i:</span>
                  <div class="detail-value">
                    <span class="manager-badge">
                      {{ dorm.ownerFirstName }} {{ dorm.ownerLastName }}
                      <span v-if="dorm.ownerMiddleName">{{ dorm.ownerMiddleName }}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="dorm-list-actions">
              <button @click="viewDormitory(dorm.id)" class="btn-action btn-view" title="Ko'rish">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button @click.stop="openEditModal(dorm)" class="btn-action btn-edit" title="Tahrirlash">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button @click.stop="openDeleteModal(dorm.id)" class="btn-action btn-delete" title="O'chirish">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="pagination-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Oldingi
          </button>

          <div class="pagination-numbers">
            <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="['pagination-number', { active: page === currentPage }]"
            >
              {{ page }}
            </button>
          </div>

          <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="pagination-btn"
          >
            Keyingi
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal">
        <div class="modal-header">
          <h2>➕ Yangi Yotoqxona Qo'shish</h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Yotoqxona nomi *</label>
            <input
                v-model="createForm.name"
                type="text"
                placeholder="Yotoqxona nomini kiriting"
                class="form-input"
                :class="{ 'input-error': formError }"
                @keyup.enter="createDormitory"
                @input="formError = ''"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">
            Bekor qilish
          </button>
          <button @click="createDormitory" class="btn-submit" :disabled="createLoading">
            <span v-if="createLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h2>✏️ Yotoqxonani Tahrirlash</h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Yotoqxona nomi *</label>
            <input
                v-model="editForm.name"
                type="text"
                placeholder="Yotoqxona nomini kiriting"
                class="form-input"
                :class="{ 'input-error': formError }"
                @keyup.enter="updateDormitory"
                @input="formError = ''"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel" :disabled="editLoading">
            Bekor qilish
          </button>
          <button @click="updateDormitory" class="btn-submit" :disabled="editLoading">
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
          <h2>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            O'chirishni tasdiqlash
          </h2>
          <button @click="closeDeleteModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            Haqiqatan ham ushbu yotoqxonani o'chirmoqchimisiz?
            <br>Bu amalni ortga qaytarib bo'lmaydi!
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel" :disabled="deleteLoading">
            Bekor qilish
          </button>
          <button @click="deleteDormitory" class="btn-delete-confirm" :disabled="deleteLoading">
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
            <svg v-if="modalMessage.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </div>
          <h3 class="message-title">{{ modalMessage.title }}</h3>
          <p class="message-text">{{ modalMessage.text }}</p>
          <button @click="closeSuccessModal" class="btn-message-ok">
            OK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
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
  transition: all 0.3s;
}

.back-button:hover {
  background: #667eea;
  color: white;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.8rem;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
}

.btn-create:hover {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Search Bar */
.search-container {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
}

.search-box {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-search:hover:not(:disabled) {
  background: #5568d3;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-clear:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.btn-clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading */
.loading-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error */
.error-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
}

.error-card p {
  color: #ff4757;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-retry:hover {
  background: #5568d3;
}

/* Empty State */
.empty-state {
  background: white;
  padding: 4rem 2rem;
  border-radius: 12px;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1.5rem;
  color: #ccc;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

/* ========== LIST VIEW STYLES - KICHIKROQ BALANDLIK ========== */
.dormitories-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;  /* ✅ 1rem dan 0.75rem ga */
  margin-bottom: 2rem;
}

.dorm-list-item {
  display: flex;
  align-items: stretch;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  min-height: 70px;  /* ✅ Qo'shildi - minimal balandlik */
}

.dorm-list-item:hover {
  border-color: #667eea;
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.15);
}

.dorm-list-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;  /* ✅ 1.5rem dan 1.2rem ga */
  font-weight: bold;
  min-width: 55px;  /* ✅ 70px dan 55px ga */
  padding: 0.75rem;  /* ✅ 1.5rem 1rem dan 0.75rem ga */
}

.dorm-list-content {
  flex: 1;
  padding: 0.75rem 1rem;  /* ✅ Vertical kichikroq */
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 0.5rem;  /* ✅ 1rem dan 0.5rem ga */
}

.dorm-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dorm-list-name {
  margin: 0;
  font-size: 1.1rem;  /* ✅ 1.3rem dan 1.1rem ga */
  color: #333;
  font-weight: 700;
  line-height: 1.2;  /* ✅ Qo'shildi */
}

.dorm-list-floors {
  background: #667eea;
  color: white;
  padding: 0.3rem 0.7rem;  /* ✅ 0.4rem 0.8rem dan kichikroq */
  border-radius: 20px;
  font-size: 0.8rem;  /* ✅ 0.85rem dan 0.8rem ga */
  font-weight: 600;
}

.dorm-list-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;  /* ✅ 0.75rem dan 0.5rem ga */
}

.dorm-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;  /* ✅ 1rem dan 0.75rem ga */
}

.detail-label {
  font-size: 0.85rem;  /* ✅ 0.9rem dan 0.85rem ga */
  color: #666;
  font-weight: 500;
  min-width: 120px;  /* ✅ 140px dan 120px ga */
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.manager-badge {
  background: #eff6ff;
  color: #1e40af;
  padding: 0.3rem 0.7rem;  /* ✅ 0.4rem 0.8rem dan kichikroq */
  border-radius: 6px;
  font-size: 0.8rem;  /* ✅ 0.85rem dan 0.8rem ga */
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.dorm-list-actions {
  display: flex;
  flex-direction: row;  /* ✅ column dan row ga */
  gap: 0.5rem;  /* ✅ Gorizontal gap */
  padding: 0.75rem 1rem;  /* ✅ Gorizontal padding */
  background: #f8f9fa;
  border-left: 1px solid #e0e0e0;
  min-width: auto;  /* ✅ 50px emas, auto */
  justify-content: center;
  align-items: center;  /* ✅ Qo'shildi */
}

.btn-action {
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;  /* ✅ Qo'shildi - kichraymaslik uchun */
}

.btn-action svg {
  width: 18px;
  height: 18px;
  transition: transform 0.3s;
}

.btn-action:hover svg {
  transform: scale(1.1);
}

.btn-view {
  background: #667eea;
  color: white;
}

.btn-view:hover {
  background: #5568d3;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn:hover:not(:disabled) {
  background: #5568d3;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #ccc;
}

.pagination-numbers {
  display: flex;
  gap: 0.5rem;
}

.pagination-number {
  padding: 0.5rem 1rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.pagination-number:hover {
  background: #f0f0ff;
}

.pagination-number.active {
  background: #667eea;
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-small {
  max-width: 400px;
}

.modal-message {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #999;
  font-size: 0.95rem;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.delete-warning {
  color: #ef4444;
  font-weight: 600;
  text-align: center;
  line-height: 1.6;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-cancel:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-submit:hover:not(:disabled) {
  background: #5568d3;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  padding: 0.75rem 1.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #dc2626;
}

.btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success/Error Message Modal */
.message-body {
  text-align: center;
  padding: 2rem 1.5rem;
}

.message-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-success {
  background: #d1fae5;
  color: #10b981;
}

.icon-error {
  background: #fee2e2;
  color: #ef4444;
}

.message-title {
  color: #333;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
}

.message-text {
  color: #666;
  font-size: 1rem;
  margin: 0 0 1.5rem 0;
}

.btn-message-ok {
  padding: 0.75rem 2rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s;
  min-width: 120px;
}

.btn-message-ok:hover {
  background: #5568d3;
}

/* ========== RESPONSIVE DESIGN ========== */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    margin-left: 0;
  }

  .header-left {
    width: 100%;
  }

  .page-header h1 {
    font-size: 1.4rem;
  }

  .btn-create {
    width: 100%;
  }

  .search-box {
    flex-direction: column;
  }

  /* Mobile list view adjustments */
  .dorm-list-item {
    flex-direction: column;
  }

  .dorm-list-number {
    min-width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
  }

  .dorm-list-actions {
    flex-direction: row;
    border-left: none;
    border-top: 1px solid #e0e0e0;
    min-width: 100%;
    justify-content: space-evenly;
  }

  .dorm-detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-label {
    min-width: auto;
  }

  .pagination {
    flex-direction: column;
  }

  .pagination-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>