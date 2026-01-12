<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import api from "../api/api.js";

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
  type: 'success' // success or error
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
    const { data } = await api.post('/dorm/list', {
      page: currentPage.value - 1,
      size: pageSize.value,
      search: {
        value: searchQuery.value || ''
      }
    })

    dormitories.value = data.list || []
    total.value = data.total || 0
    totalPages.value =
        data.totalPages || Math.ceil(total.value / pageSize.value)

  } catch (err) {
    if (err.response?.status === 401) {
      authStore.logout()
    } else {
      error.value =
          err.response?.data?.message ||
          'Server bilan bog‘lanishda xatolik!'
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
    await api.post('/dorm/create', {
      name: createForm.value.name.trim()
    })

    closeCreateModal()
    showSuccessMessage(
        'Muvaffaqiyatli!',
        'Yotoqxona muvaffaqiyatli yaratildi'
    )
    fetchDormitories()

  } catch (err) {
    formError.value =
        err.response?.data?.message || 'Xatolik yuz berdi!'
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
    await api.post('/dorm/update', {
      id: editForm.value.id,
      name: editForm.value.name.trim()
    })

    closeEditModal()
    showSuccessMessage(
        'Muvaffaqiyatli!',
        'Yotoqxona muvaffaqiyatli yangilandi'
    )
    fetchDormitories()

  } catch (err) {
    formError.value =
        err.response?.data?.message || 'Xatolik yuz berdi!'
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
    await api.delete(`/dorm/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage(
        'Muvaffaqiyatli!',
        'Yotoqxona muvaffaqiyatli o‘chirildi'
    )
    fetchDormitories()

  } catch (err) {
    closeDeleteModal()
    showErrorMessage(
        'Xatolik!',
        err.response?.data?.message || 'Xatolik yuz berdi!'
    )
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
        <h1>🏢 Yotoqxonalar</h1>
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
          🔍 Qidirish
        </button>
        <button
            v-if="searchQuery"
            @click="clearSearch"
            class="btn-clear"
            :disabled="loading"
        >
          ✕
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
        <div class="empty-icon">🏢</div>
        <h3>Yotoqxonalar topilmadi</h3>
        <p v-if="searchQuery">
          "{{ searchQuery }}" bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday yotoqxona yo'q</p>
      </div>

      <!-- Dormitories List -->
      <div v-else>
        <div class="dormitories-grid">
          <div
              v-for="dorm in dormitories"
              :key="dorm.id"
              class="dormitory-card"
          >
            <div class="card-header">
              <div class="card-icon">🏢</div>
              <h3 class="dormitory-name">O'zbekiston Xalqaro Islomshunoslik akademiyasi</h3>
            </div>

            <div class="card-body">
              <h3 class="dormitory-name">{{ dorm.name }}</h3>

              <div class="dormitory-info">
                <div class="info-item" v-if="dorm.ownerFirstName || dorm.ownerLastName">
                  <span class="info-label">Yotoqxona Mudiri:</span>
                  <span class="info-value">
                    {{ dorm.ownerFirstName }} {{ dorm.ownerLastName }}
                    <span v-if="dorm.ownerMiddleName">{{ dorm.ownerMiddleName }}</span>
                  </span>
                </div>

                <div class="info-item" v-else>
                  <span class="info-label">Owner ID:</span>
                  <span class="info-value">{{ dorm.ownerId }}</span>
                </div>

                <div class="info-item" v-if="dorm.floors">
                  <span class="info-label">Qavatlar:</span>
                  <span class="info-value">{{ dorm.floors }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button @click="viewDormitory(dorm.id)" class="btn-view">Ko'rish →</button>
              <button @click.stop="openEditModal(dorm)" class="btn-edit">✏️ Tahrirlash</button>
              <button @click.stop="openDeleteModal(dorm.id)" class="btn-delete">🗑️ O'chirish</button>
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
            ← Oldingi
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
            Keyingi →
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal">
        <div class="modal-header">
          <h2>🏢 Yangi Yotoqxona Qo'shish</h2>
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
          <h2>🗑️ O'chirishni tasdiqlash</h2>
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
            <span v-if="modalMessage.type === 'success'">✓</span>
            <span v-else>✕</span>
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
}

.btn-search:hover:not(:disabled) {
  background: #5568d3;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 0.75rem 1rem;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-clear:hover:not(:disabled) {
  background: #ff3838;
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
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

/* Dormitories Grid */
.dormitories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dormitory-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  overflow: hidden;
}

.dormitory-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.card-icon {
  font-size: 2rem;
  margin-right: 7px;
}

.card-body {
  padding: 1.5rem;
}

.dormitory-name {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.dormitory-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 0.5rem;
}

.btn-view {
  flex: 1;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-view:hover {
  background: #5568d3;
}

.btn-edit {
  padding: 0.75rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: #dc2626;
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
}

.pagination-btn:hover:not(:disabled) {
  background: #5568d3;
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
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error {
  border-color: #ef4444;
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
  font-size: 3rem;
  font-weight: bold;
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

  .dormitories-grid {
    grid-template-columns: 1fr;
  }

  .card-footer {
    flex-direction: column;
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