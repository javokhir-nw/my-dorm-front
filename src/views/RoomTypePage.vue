<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import api from '../api/api.js'

// ==================== Composables ====================
const authStore = useAuthStore()

// ==================== State ====================
const roomTypes = ref([])
const loading = ref(false)
const error = ref('')

// Modal states
const modals = ref({
  create: false,
  edit: false,
  delete: false,
  message: false
})

// Form data with default factory
const createDefaultForm = () => ({
  name: ''
})

const createForm = ref(createDefaultForm())
const editForm = ref({
  id: null,
  name: ''
})
const deleteId = ref(null)

// Message modal data
const modalMessage = ref({
  title: '',
  text: '',
  type: 'success'
})

// Loading states for modals
const modalLoading = ref({
  create: false,
  edit: false,
  delete: false
})

// Form validation errors
const formErrors = ref({
  name: ''
})

// ==================== Computed Properties ====================
const hasRoomTypes = computed(() => roomTypes.value?.length > 0)
const roomTypesCount = computed(() => roomTypes.value?.length || 0)

// ==================== API Calls ====================
async function fetchRoomTypes() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get('/room-type/list')
    roomTypes.value = response.data || []
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

// ==================== Form Validation ====================
function clearFormErrors() {
  formErrors.value = {
    name: ''
  }
}

function validateForm(form) {
  clearFormErrors()
  let isValid = true

  if (!form.name?.trim()) {
    formErrors.value.name = 'Xona turi nomini kiriting!'
    isValid = false
  }

  if (form.name?.trim().length < 2) {
    formErrors.value.name = 'Nom kamida 2 ta belgidan iborat bo\'lishi kerak!'
    isValid = false
  }

  return isValid
}

// ==================== Modal Helpers ====================
function openModal(modalName) {
  modals.value[modalName] = true
}

function closeModal(modalName) {
  modals.value[modalName] = false
  clearFormErrors()
}

function showMessage(title, text, type = 'success') {
  modalMessage.value = { title, text, type }
  openModal('message')
}

function showSuccessMessage(title, text) {
  showMessage(title, text, 'success')
}

function showErrorMessage(title, text) {
  showMessage(title, text, 'error')
}

function closeMessageModal() {
  closeModal('message')
}

// ==================== CRUD Operations ====================

// Create Room Type
function openCreateModal() {
  createForm.value = createDefaultForm()
  clearFormErrors()
  openModal('create')
}

function closeCreateModal() {
  closeModal('create')
}

async function createRoomType() {
  if (!validateForm(createForm.value)) return

  modalLoading.value.create = true

  try {
    const response = await api.post('/room-type/create', {
      name: createForm.value.name.trim()
    })

    if (!response.ok) {
      throw new Error('Xona turini yaratishda xatolik')
    }

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona turi muvaffaqiyatli yaratildi')
    await fetchRoomTypes()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.create = false
  }
}

// Edit Room Type
function openEditModal(roomType) {
  editForm.value = {
    id: roomType.id,
    name: roomType.name
  }
  clearFormErrors()
  openModal('edit')
}

function closeEditModal() {
  closeModal('edit')
}

async function updateRoomType() {
  if (!validateForm(editForm.value)) return

  modalLoading.value.edit = true

  try {
    const response = await api.put('/room-type/update', {
      id: editForm.value.id,
      name: editForm.value.name.trim()
    })

    if (!response.ok) {
      throw new Error('Xona turini yangilashda xatolik')
    }

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona turi muvaffaqiyatli yangilandi')
    await fetchRoomTypes()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.edit = false
  }
}

// Delete Room Type
function openDeleteModal(id) {
  deleteId.value = id
  openModal('delete')
}

function closeDeleteModal() {
  closeModal('delete')
  deleteId.value = null
}

async function deleteRoomType() {
  modalLoading.value.delete = true

  try {
    const response = await api.delete(`/room-type/delete/${deleteId.value}`)

    if (!response.ok) {
      throw new Error('Xona turini o\'chirishda xatolik')
    }

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona turi muvaffaqiyatli o\'chirildi')
    await fetchRoomTypes()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.delete = false
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchRoomTypes()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1>🏷️ Xona Turlari</h1>
        <span v-if="hasRoomTypes" class="count-badge">
          {{ roomTypesCount }} ta
        </span>
      </div>
      <button
          @click="openCreateModal"
          class="btn-create"
          :disabled="loading"
      >
        + Xona turi qo'shish
      </button>
    </div>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-card">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button @click="fetchRoomTypes" class="btn-retry">
          Qayta urinish
        </button>
      </div>

      <!-- Room Types List -->
      <div v-else class="content-card">
        <div v-if="hasRoomTypes" class="room-types-list">
          <TransitionGroup name="list">
            <div
                v-for="roomType in roomTypes"
                :key="roomType.id"
                class="room-type-item"
            >
              <div class="room-type-info">
                <div class="room-type-icon">🏷️</div>
                <div class="room-type-details">
                  <h3 class="room-type-name">{{ roomType.name }}</h3>
                  <p class="room-type-id">ID: {{ roomType.id }}</p>
                </div>
              </div>

              <div class="room-type-actions">
                <button
                    @click="openEditModal(roomType)"
                    class="btn-edit"
                    title="Tahrirlash"
                    aria-label="Xona turini tahrirlash"
                >
                  ✏️ Tahrirlash
                </button>
                <button
                    @click="openDeleteModal(roomType.id)"
                    class="btn-delete"
                    title="O'chirish"
                    aria-label="Xona turini o'chirish"
                >
                  🗑️ O'chirish
                </button>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>Xona turlari mavjud emas</h3>
          <p>Birinchi xona turini qo'shish uchun yuqoridagi tugmani bosing</p>
          <button @click="openCreateModal" class="btn-add-first">
            + Birinchi xona turini qo'shish
          </button>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Transition name="modal">
      <div
          v-if="modals.create"
          class="modal-overlay"
          @click.self="closeCreateModal"
      >
        <div class="modal modal-medium">
          <div class="modal-header">
            <h2>🏷️ Yangi Xona Turi Qo'shish</h2>
            <button
                @click="closeCreateModal"
                class="modal-close"
                aria-label="Yopish"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="create-name">
                Xona turi nomi
                <span class="required" aria-label="Majburiy maydon">*</span>
              </label>
              <input
                  id="create-name"
                  v-model="createForm.name"
                  type="text"
                  placeholder="Masalan: Yotoqxona, Oshxona, Hojatxona"
                  class="form-input"
                  :class="{ 'input-error': formErrors.name }"
                  @input="formErrors.name = ''"
                  :disabled="modalLoading.create"
                  autofocus
              />
              <Transition name="slide-down">
                <p v-if="formErrors.name" class="error-message">
                  {{ formErrors.name }}
                </p>
              </Transition>
            </div>
          </div>

          <div class="modal-footer">
            <button
                @click="closeCreateModal"
                class="btn-cancel"
                :disabled="modalLoading.create"
            >
              Bekor qilish
            </button>
            <button
                @click="createRoomType"
                class="btn-submit"
                :disabled="modalLoading.create"
            >
              <span v-if="modalLoading.create" class="btn-spinner"></span>
              <span>{{ modalLoading.create ? 'Saqlanmoqda...' : 'Saqlash' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Edit Modal -->
    <Transition name="modal">
      <div
          v-if="modals.edit"
          class="modal-overlay"
          @click.self="closeEditModal"
      >
        <div class="modal modal-medium">
          <div class="modal-header">
            <h2>✏️ Xona Turini Tahrirlash</h2>
            <button
                @click="closeEditModal"
                class="modal-close"
                aria-label="Yopish"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="edit-name">
                Xona turi nomi
                <span class="required" aria-label="Majburiy maydon">*</span>
              </label>
              <input
                  id="edit-name"
                  v-model="editForm.name"
                  type="text"
                  placeholder="Masalan: Yotoqxona, Oshxona, Hojatxona"
                  class="form-input"
                  :class="{ 'input-error': formErrors.name }"
                  @input="formErrors.name = ''"
                  :disabled="modalLoading.edit"
                  autofocus
              />
              <Transition name="slide-down">
                <p v-if="formErrors.name" class="error-message">
                  {{ formErrors.name }}
                </p>
              </Transition>
            </div>
          </div>

          <div class="modal-footer">
            <button
                @click="closeEditModal"
                class="btn-cancel"
                :disabled="modalLoading.edit"
            >
              Bekor qilish
            </button>
            <button
                @click="updateRoomType"
                class="btn-submit"
                :disabled="modalLoading.edit"
            >
              <span v-if="modalLoading.edit" class="btn-spinner"></span>
              <span>{{ modalLoading.edit ? 'Saqlanmoqda...' : 'Saqlash' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Modal -->
    <Transition name="modal">
      <div
          v-if="modals.delete"
          class="modal-overlay"
          @click.self="closeDeleteModal"
      >
        <div class="modal modal-small">
          <div class="modal-header">
            <h2>🗑️ O'chirishni tasdiqlash</h2>
            <button
                @click="closeDeleteModal"
                class="modal-close"
                aria-label="Yopish"
            >
              ✕
            </button>
          </div>

          <div class="modal-body">
            <p class="delete-warning">
              Haqiqatan ham ushbu xona turini o'chirmoqchimisiz?
              <br><strong>Bu amalni ortga qaytarib bo'lmaydi!</strong>
            </p>
          </div>

          <div class="modal-footer">
            <button
                @click="closeDeleteModal"
                class="btn-cancel"
                :disabled="modalLoading.delete"
            >
              Bekor qilish
            </button>
            <button
                @click="deleteRoomType"
                class="btn-delete-confirm"
                :disabled="modalLoading.delete"
            >
              <span v-if="modalLoading.delete" class="btn-spinner"></span>
              <span>{{ modalLoading.delete ? 'O\'chirilmoqda...' : 'O\'chirish' }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Success/Error Modal -->
    <Transition name="modal">
      <div
          v-if="modals.message"
          class="modal-overlay"
          @click.self="closeMessageModal"
      >
        <div class="modal modal-message">
          <div class="modal-body message-body">
            <div :class="['message-icon', `icon-${modalMessage.type}`]">
              <span v-if="modalMessage.type === 'success'">✓</span>
              <span v-else>✕</span>
            </div>
            <h3 class="message-title">{{ modalMessage.title }}</h3>
            <p class="message-text">{{ modalMessage.text }}</p>
            <button
                @click="closeMessageModal"
                class="btn-message-ok"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* ==================== Container ==================== */
.page-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem;
}

/* ==================== Page Header ==================== */
.page-header {
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

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: clamp(1.5rem, 3vw, 1.8rem);
  font-weight: 700;
}

.count-badge {
  padding: 0.375rem 0.875rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
  font-family: inherit;
}

.btn-create:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-create:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* ==================== Loading ==================== */
.loading-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  to { transform: rotate(360deg); }
}

/* ==================== Error ==================== */
.error-card {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-card p {
  color: #ff4757;
  margin-bottom: 1.5rem;
  font-weight: 600;
  font-size: 1.05rem;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-retry:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* ==================== Content Card ==================== */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

/* ==================== Room Types List ==================== */
.room-types-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.room-type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.room-type-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.room-type-info {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.room-type-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.room-type-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.room-type-name {
  margin: 0;
  color: #333;
  font-size: 1.25rem;
  font-weight: 700;
}

.room-type-id {
  margin: 0;
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
}

.room-type-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-edit,
.btn-delete {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* ==================== Empty State ==================== */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.empty-state h3 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.empty-state p {
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

.btn-add-first {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
  font-family: inherit;
}

.btn-add-first:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* ==================== Modal Styles ==================== */
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
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 450px;
}

.modal-medium {
  max-width: 550px;
}

.modal-message {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 2px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
  border-radius: 16px 16px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 700;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.75rem;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.modal-close:hover {
  color: #333;
  background: #f0f0f0;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #333;
  font-weight: 600;
  font-size: 1rem;
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input.input-error:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.delete-warning {
  color: #ef4444;
  font-weight: 600;
  text-align: center;
  line-height: 1.8;
  font-size: 1.05rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  position: sticky;
  bottom: 0;
  background: white;
  border-radius: 0 0 16px 16px;
}

.btn-cancel {
  padding: 0.875rem 1.75rem;
  background: #e9ecef;
  color: #333;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  font-family: inherit;
}

.btn-cancel:hover:not(:disabled) {
  background: #dee2e6;
  transform: translateY(-2px);
}

.btn-cancel:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit {
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-delete-confirm {
  padding: 0.875rem 1.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-delete-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ==================== Message Modal ==================== */
.message-body {
  text-align: center;
  padding: 2.5rem 2rem;
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
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}

.icon-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #ef4444;
}

.message-title {
  color: #333;
  font-size: 1.75rem;
  margin: 0 0 0.75rem 0;
  font-weight: 700;
}

.message-text {
  color: #666;
  font-size: 1.05rem;
  margin: 0 0 2rem 0;
  line-height: 1.6;
}

.btn-message-ok {
  padding: 0.875rem 2.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.05rem;
  transition: all 0.3s;
  min-width: 140px;
  font-family: inherit;
}

.btn-message-ok:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* ==================== Animations ==================== */
/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal {
  transform: translateY(-50px);
}

.modal-leave-to .modal {
  transform: translateY(50px);
}

/* List Transition */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Slide Down Transition */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

/* ==================== Responsive ==================== */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    margin-left: 0;
    padding: 1.25rem;
  }

  .header-left {
    width: 100%;
    justify-content: space-between;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .btn-create {
    width: 100%;
  }

  .room-type-item {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .room-type-info {
    flex-direction: column;
    width: 100%;
  }

  .room-type-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-edit,
  .btn-delete {
    width: 100%;
    justify-content: center;
  }

  .modal {
    width: 95%;
    max-width: 100%;
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-body {
    padding: 1.5rem;
  }

  .modal-footer {
    padding: 1.25rem;
    flex-direction: column;
  }

  .btn-cancel,
  .btn-submit,
  .btn-delete-confirm {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .content-card {
    padding: 1.5rem;
  }

  .room-type-icon {
    width: 50px;
    height: 50px;
    font-size: 1.75rem;
  }

  .room-type-name {
    font-size: 1.1rem;
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
</style>