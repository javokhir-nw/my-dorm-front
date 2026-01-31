<script setup>
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const floor = ref(null)
const loading = ref(false)
const error = ref('')

const floorId = route.params.id

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSuccessModal = ref(false)

// Room types
const roomTypes = ref([])
const loadingRoomTypes = ref(false)

// Form data
const createForm = ref({
  number: '',
  name: '',
  floorId: floorId,
  roomTypeId: null,
  capacity: null,
  isRoom: true
})

const editForm = ref({
  id: 0,
  number: '',
  name: '',
  floorId: floorId,
  roomTypeId: null,
  capacity: null,
  isRoom: true
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

// Form validation errors
const formErrors = ref({
  number: '',
  name: '',
  roomTypeId: '',
  capacity: ''
})

function goBack() {
  if (floor.value?.dormitoryId) {
    router.push(`/dormitory/${floor.value.dormitoryId}`)
  } else {
    router.push('/dormitories')
  }
}

async function fetchFloorDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`/api/floor/get/${floorId}`)
    floor.value = response.data
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

async function fetchRoomTypes() {
  loadingRoomTypes.value = true

  try {
    const response = await axios.get('/api/room-type/list')
    roomTypes.value = response.data
  } catch (err) {
    console.error('Room types fetch error:', err)
  } finally {
    loadingRoomTypes.value = false
  }
}

function viewRoom(roomId) {
  router.push(`/room/${roomId}`)
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

function clearFormErrors() {
  formErrors.value = {
    number: '',
    name: '',
    roomTypeId: '',
    capacity: ''
  }
}

function validateForm(form) {
  clearFormErrors()
  let isValid = true

  if (!form.roomTypeId) {
    formErrors.value.roomTypeId = 'Xona turini tanlang!'
    isValid = false
  }

  if (form.isRoom) {
    if (!form.capacity || form.capacity < 1) {
      formErrors.value.capacity = 'Yotoq xonasi uchun sig\'imni kiriting!'
      isValid = false
    }
  }

  return isValid
}

async function openCreateModal() {
  createForm.value = {
    number: '',
    name: '',
    floorId: floorId,
    roomTypeId: null,
    capacity: null,
    isRoom: true
  }
  clearFormErrors()

  if (roomTypes.value.length === 0) {
    await fetchRoomTypes()
  }

  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  clearFormErrors()
}

async function createRoom() {
  if (!validateForm(createForm.value)) {
    return
  }

  createLoading.value = true

  try {
    const requestBody = {
      floorId: parseInt(floorId),
      roomTypeId: createForm.value.roomTypeId,
      isRoom: createForm.value.isRoom
    }

    if (createForm.value.number && createForm.value.number.trim()) {
      requestBody.number = createForm.value.number.trim()
    }

    if (createForm.value.name && createForm.value.name.trim()) {
      requestBody.name = createForm.value.name.trim()
    }

    if (createForm.value.isRoom && createForm.value.capacity) {
      requestBody.capacity = parseInt(createForm.value.capacity)
    }

    const response = await axios.post('/api/room/create', requestBody)

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli yaratildi')
    fetchFloorDetail()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    createLoading.value = false
  }
}

async function openEditModal(room) {
  editForm.value = {
    id: room.id,
    number: room.number || '',
    name: room.name || '',
    floorId: floorId,
    roomTypeId: room.roomTypeId,
    capacity: room.capacity || null,
    isRoom: room.isRoom === true
  }
  clearFormErrors()

  if (roomTypes.value.length === 0) {
    await fetchRoomTypes()
  }

  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  clearFormErrors()
}

async function updateRoom() {
  if (!validateForm(editForm.value)) {
    return
  }

  editLoading.value = true

  try {
    const requestBody = {
      id: editForm.value.id,
      floorId: parseInt(floorId),
      roomTypeId: editForm.value.roomTypeId,
      isRoom: editForm.value.isRoom
    }

    if (editForm.value.number && editForm.value.number.trim()) {
      requestBody.number = editForm.value.number.trim()
    }

    if (editForm.value.name && editForm.value.name.trim()) {
      requestBody.name = editForm.value.name.trim()
    }

    if (editForm.value.isRoom && editForm.value.capacity) {
      requestBody.capacity = parseInt(editForm.value.capacity)
    }

    const response = await axios.post('/api/room/update', requestBody)

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli yangilandi')
    fetchFloorDetail()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    editLoading.value = false
  }
}

function openDeleteModal(id) {
  deleteId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function deleteRoom() {
  deleteLoading.value = true

  try {
    const response = await axios.delete(`/api/room/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli o\'chirildi')
    fetchFloorDetail()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchFloorDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu/>

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <div class="page-title">
          <span class="page-title__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 20h16"></path>
              <path d="M8 4v16"></path>
              <path d="M16 4v16"></path>
            </svg>
          </span>
          <h1>Qavat ma'lumotlari</h1>
        </div>
      </div>
      <button v-if="floor" @click="openCreateModal" class="btn-create">+ Xona qo'shish</button>
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
        <button @click="fetchFloorDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Floor Detail -->
      <div v-else-if="floor" class="detail-content">
        <!-- Main Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div>
              <h2>{{ floor.name }}</h2>
              <p class="info-subtitle">{{ floor.dormitoryName }}</p>
            </div>
          </div>

          <div class="info-body">
            <div class="info-row">
              <span class="info-label">Qavat rahbari:</span>
              <span class="info-value" v-if="floor.leaderFirstName || floor.leaderLastName">
                {{ floor.leaderFirstName }} {{ floor.leaderLastName }}
                <span v-if="floor.leaderMiddleName">{{ floor.leaderMiddleName }}</span>
              </span>
              <span class="info-value no-data" v-else>Tayinlanmagan</span>
            </div>

            <div class="info-row">
              <span class="info-label">Xonalar soni:</span>
              <span class="info-value">{{ floor.rooms?.length || 0 }} ta</span>
            </div>
          </div>
        </div>

        <!-- Rooms List -->
        <div class="rooms-section">
          <h3>Xonalar ro'yxati</h3>

          <div v-if="floor.rooms && floor.rooms.length > 0" class="rooms-list">
            <div
                v-for="(room, index) in floor.rooms"
                :key="room.id"
                class="room-list-item"
            >
              <div class="room-list-number">{{ room.number || index + 1 }}</div>

              <div class="room-list-content">
                <div class="room-list-header">
                  <h4 class="room-list-name">{{ room.name || 'Xona #' + (room.number || index + 1) }}</h4>
                  <span class="room-list-capacity" v-if="room.capacity">{{ room.capacity }} kishi</span>
                </div>

                <div class="room-list-details">
                  <div class="room-detail-row">
                    <span class="detail-label">Xona turi:</span>
                    <div class="detail-value">
                      <span class="room-type-badge">{{ room.roomTypeName }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="room-list-actions">
                <button @click="viewRoom(room.id)" class="btn-action btn-view" title="Ko'rish">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                <button @click.stop="openEditModal(room)" class="btn-action btn-edit" title="Tahrirlash">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button @click.stop="openDeleteModal(room.id)" class="btn-action btn-delete" title="O'chirish">
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

          <div v-else class="empty-rooms">
            <div class="empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </div>
            <p>Bu qavatda xonalar mavjud emas</p>
            <button @click="openCreateModal" class="btn-add-first">+ Birinchi xonani qo'shish</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </span>
            Yangi xona qo'shish
          </h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Xona raqami</label>
            <input
                v-model="createForm.number"
                type="text"
                placeholder="Masalan: 101"
                class="form-input"
                :class="{ 'input-error': formErrors.number }"
                @input="formErrors.number = ''"
            />
            <p v-if="formErrors.number" class="error-message">{{ formErrors.number }}</p>
          </div>

          <div class="form-group">
            <label>Xona nomi</label>
            <input
                v-model="createForm.name"
                type="text"
                placeholder="Masalan: Katta zal"
                class="form-input"
                :class="{ 'input-error': formErrors.name }"
                @input="formErrors.name = ''"
            />
            <p v-if="formErrors.name" class="error-message">{{ formErrors.name }}</p>
          </div>

          <div class="form-group">
            <label>Xona turi *</label>
            <select
                v-model="createForm.roomTypeId"
                class="form-select"
                :class="{ 'input-error': formErrors.roomTypeId }"
                @change="formErrors.roomTypeId = ''"
            >
              <option :value="null" disabled>Xona turini tanlang</option>
              <option v-for="type in roomTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
            <p v-if="formErrors.roomTypeId" class="error-message">{{ formErrors.roomTypeId }}</p>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                  type="checkbox"
                  v-model="createForm.isRoom"
                  class="form-checkbox"
              />
              <div class="checkbox-text">
                <strong>Yotoq xonasi</strong>
                <small>Agar bu yotoq xonasi bo'lsa, belgilang</small>
              </div>
            </label>
          </div>

          <div class="form-group" v-if="createForm.isRoom">
            <label>Sig'im (necha kishilik) *</label>
            <input
                v-model.number="createForm.capacity"
                type="number"
                min="1"
                placeholder="Masalan: 4"
                class="form-input"
                :class="{ 'input-error': formErrors.capacity }"
                @input="formErrors.capacity = ''"
            />
            <p v-if="formErrors.capacity" class="error-message">{{ formErrors.capacity }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">
            Bekor qilish
          </button>
          <button @click="createRoom" class="btn-submit" :disabled="createLoading">
            <span v-if="createLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </span>
            Xonani tahrirlash
          </h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Xona raqami</label>
            <input
                v-model="editForm.number"
                type="text"
                placeholder="Masalan: 101"
                class="form-input"
                :class="{ 'input-error': formErrors.number }"
                @input="formErrors.number = ''"
            />
            <p v-if="formErrors.number" class="error-message">{{ formErrors.number }}</p>
          </div>

          <div class="form-group">
            <label>Xona nomi</label>
            <input
                v-model="editForm.name"
                type="text"
                placeholder="Masalan: Katta zal"
                class="form-input"
                :class="{ 'input-error': formErrors.name }"
                @input="formErrors.name = ''"
            />
            <p v-if="formErrors.name" class="error-message">{{ formErrors.name }}</p>
          </div>

          <div class="form-group">
            <label>Xona turi *</label>
            <select
                v-model="editForm.roomTypeId"
                class="form-select"
                :class="{ 'input-error': formErrors.roomTypeId }"
                @change="formErrors.roomTypeId = ''"
            >
              <option :value="null" disabled>Xona turini tanlang</option>
              <option v-for="type in roomTypes" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
            <p v-if="formErrors.roomTypeId" class="error-message">{{ formErrors.roomTypeId }}</p>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                  type="checkbox"
                  v-model="editForm.isRoom"
                  class="form-checkbox"
              />
              <div class="checkbox-text">
                <strong>Yotoq xonasi</strong>
                <small>Agar bu yotoq xonasi bo'lsa, belgilang</small>
              </div>
            </label>
          </div>

          <div class="form-group" v-if="editForm.isRoom">
            <label>Sig'im (necha kishilik) *</label>
            <input
                v-model.number="editForm.capacity"
                type="number"
                min="1"
                placeholder="Masalan: 4"
                class="form-input"
                :class="{ 'input-error': formErrors.capacity }"
                @input="formErrors.capacity = ''"
            />
            <p v-if="formErrors.capacity" class="error-message">{{ formErrors.capacity }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel" :disabled="editLoading">
            Bekor qilish
          </button>
          <button @click="updateRoom" class="btn-submit" :disabled="editLoading">
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
            Haqiqatan ham ushbu xonani o'chirmoqchimisiz?
            <br><strong>Bu amalni ortga qaytarib bo'lmaydi!</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel" :disabled="deleteLoading">
            Bekor qilish
          </button>
          <button @click="deleteRoom" class="btn-delete-confirm" :disabled="deleteLoading">
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

.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

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

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.info-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
}

.info-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.info-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 1rem;
}

.info-body {
  padding: 2rem;
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
  font-weight: 600;
}

.info-value.no-data {
  color: #999;
  font-style: italic;
}

.rooms-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.rooms-section h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

/* ========== LIST VIEW STYLES ========== */
.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.room-list-item {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s;
  min-height: 70px;
}

.room-list-item:hover {
  border-color: #667eea;
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.15);
}

.room-list-number {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  min-width: 55px;
  margin-left: 1rem;
  padding: 0.75rem;
}

.room-list-content {
  flex: 1;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}

.room-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.room-list-name {
  margin: 0;
  font-size: 1.1rem;
  color: #333;
  font-weight: 700;
  line-height: 1.2;
}

.room-list-capacity {
  background: #667eea;
  color: white;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.room-list-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.room-detail-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  min-width: 80px;
  flex-shrink: 0;
}

.detail-value {
  flex: 1;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.room-type-badge {
  background: #eff6ff;
  color: #1e40af;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.room-list-actions {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border-left: 1px solid #e0e0e0;
  min-width: auto;
  justify-content: center;
  align-items: center;
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
  flex-shrink: 0;
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

.empty-rooms {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  margin-bottom: 1.5rem;
  color: #ccc;
}

.empty-rooms p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.btn-add-first {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-add-first:hover {
  background: #059669;
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
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-large {
  max-width: 600px;
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
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.modal-title {
  gap: 0.6rem;
}

.modal-title-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #eef2ff;
  color: #667eea;
}

.modal-title-icon svg {
  width: 18px;
  height: 18px;
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
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.form-input, .form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error, .form-select.input-error {
  border-color: #ef4444;
}

.form-input::placeholder {
  color: #999;
  font-size: 0.95rem;
}

.form-select {
  cursor: pointer;
  background: white;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.checkbox-label:hover {
  background: #e9ecef;
}

.form-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-top: 2px;
}

.checkbox-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.checkbox-text strong {
  color: #333;
  font-size: 1rem;
}

.checkbox-text small {
  color: #666;
  font-size: 0.875rem;
  line-height: 1.4;
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
  position: sticky;
  bottom: 0;
  background: white;
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

  .info-header {
    flex-direction: column;
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .room-list-item {
    flex-direction: column;
  }

  .room-list-number {
    min-width: 100%;
    padding: 1rem;
    font-size: 1.2rem;
  }

  .room-list-actions {
    flex-direction: row;
    border-left: none;
    border-top: 1px solid #e0e0e0;
    min-width: 100%;
    justify-content: space-evenly;
  }

  .room-detail-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-label {
    min-width: auto;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }
}
</style>
