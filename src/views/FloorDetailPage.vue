<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import api from "../api/api.js"

// ==================== Composables ====================
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ==================== Constants ====================
const floorId = route.params.id

// ==================== State ====================
const floor = ref(null)
const loading = ref(false)
const error = ref('')

// Room types
const roomTypes = ref([])
const loadingRoomTypes = ref(false)

// Modal states
const modals = ref({
  create: false,
  edit: false,
  delete: false,
  message: false
})

// Form data with default values factory
const createDefaultForm = () => ({
  number: '',
  name: '',
  floorId: floorId,
  roomTypeId: null,
  capacity: null,
  isRoom: true
})

const createForm = ref(createDefaultForm())
const editForm = ref(createDefaultForm())
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
  number: '',
  name: '',
  roomTypeId: '',
  capacity: ''
})

// ==================== Computed ====================
const hasRooms = computed(() => floor.value?.rooms?.length > 0)
const roomsCount = computed(() => floor.value?.rooms?.length || 0)
const leaderFullName = computed(() => {
  if (!floor.value) return 'Tayinlanmagan'

  const { leaderFirstName, leaderLastName, leaderMiddleName } = floor.value
  if (!leaderFirstName && !leaderLastName) return 'Tayinlanmagan'

  return [leaderFirstName, leaderLastName, leaderMiddleName]
      .filter(Boolean)
      .join(' ')
})

// ==================== Navigation ====================
function goBack() {
  const dormitoryId = floor.value?.dormitoryId
  router.push(dormitoryId ? `/dormitory/${dormitoryId}` : '/dormitories')
}

function viewRoom(roomId) {
  router.push(`/room/${roomId}`)
}

// ==================== API Calls ====================
async function fetchFloorDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.get(`/floor/get/${floorId}`)
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
  if (roomTypes.value.length > 0) return

  loadingRoomTypes.value = true

  try {
    const response = await api.get('/room-type/list')
    roomTypes.value = response.data
  } catch (err) {
    console.error('Room types fetch error:', err)
  } finally {
    loadingRoomTypes.value = false
  }
}

// ==================== Form Validation ====================
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

  if (!form.number?.trim()) {
    formErrors.value.number = 'Xona raqamini kiriting!'
    isValid = false
  }

  if (!form.roomTypeId) {
    formErrors.value.roomTypeId = 'Xona turini tanlang!'
    isValid = false
  }

  // Capacity validation only for bedroom (isRoom = true)
  if (form.isRoom && (!form.capacity || form.capacity < 1)) {
    formErrors.value.capacity = 'Yotoq xonasi uchun sig\'imni kiriting!'
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

// ==================== CRUD Operations ====================

// Create Room
async function openCreateModal() {
  createForm.value = createDefaultForm()
  clearFormErrors()
  await fetchRoomTypes()
  openModal('create')
}

function closeCreateModal() {
  closeModal('create')
}

async function createRoom() {
  if (!validateForm(createForm.value)) return

  modalLoading.value.create = true

  try {
    const requestBody = {
      number: createForm.value.number.trim(),
      name: createForm.value.name.trim(),
      floorId: parseInt(floorId),
      roomTypeId: createForm.value.roomTypeId,
      isRoom: createForm.value.isRoom
    }

    // Add capacity only if it's a bedroom
    if (createForm.value.isRoom && createForm.value.capacity) {
      requestBody.capacity = parseInt(createForm.value.capacity)
    }

    const response = await api.post('/room/create', requestBody)

    if (!response.ok) {
      throw new Error('Xona yaratishda xatolik')
    }

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli yaratildi')
    await fetchFloorDetail()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.create = false
  }
}

// Edit Room
async function openEditModal(room) {
  editForm.value = {
    id: room.id,
    number: room.number,
    name: room.name || '',
    floorId: floorId,
    roomTypeId: room.roomTypeId,
    capacity: room.capacity || null,
    isRoom: room.isRoom ?? true
  }
  clearFormErrors()
  await fetchRoomTypes()
  openModal('edit')
}

function closeEditModal() {
  closeModal('edit')
}

async function updateRoom() {
  if (!validateForm(editForm.value)) return

  modalLoading.value.edit = true

  try {
    const requestBody = {
      id: editForm.value.id,
      number: editForm.value.number.trim(),
      name: editForm.value.name.trim(),
      floorId: parseInt(floorId),
      roomTypeId: editForm.value.roomTypeId,
      isRoom: editForm.value.isRoom
    }

    // Add capacity only if it's a bedroom
    if (editForm.value.isRoom && editForm.value.capacity) {
      requestBody.capacity = parseInt(editForm.value.capacity)
    }

    const response = await api.post('/room/update', requestBody)

    if (!response.ok) {
      throw new Error('Xonani yangilashda xatolik')
    }

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli yangilandi')
    await fetchFloorDetail()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.edit = false
  }
}

// Delete Room
function openDeleteModal(id) {
  deleteId.value = id
  openModal('delete')
}

function closeDeleteModal() {
  closeModal('delete')
  deleteId.value = null
}

async function deleteRoom() {
  modalLoading.value.delete = true

  try {
    const response = await api.delete(`/room/delete/${deleteId.value}`)

    if (!response.ok) {
      throw new Error('Xonani o\'chirishda xatolik')
    }

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Xona muvaffaqiyatli o\'chirildi')
    await fetchFloorDetail()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.delete = false
  }
}

// ==================== Lifecycle ====================
onMounted(() => {
  fetchFloorDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">
          ← Orqaga
        </button>
        <h1>🏢 Qavat ma'lumotlari</h1>
      </div>
      <button
          v-if="floor"
          @click="openCreateModal"
          class="btn-create"
      >
        + Xona qo'shish
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
        <p>{{ error }}</p>
        <button @click="fetchFloorDetail" class="btn-retry">
          Qayta urinish
        </button>
      </div>

      <!-- Floor Detail -->
      <div v-else-if="floor" class="detail-content">
        <!-- Main Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="info-icon">🏢</div>
            <div>
              <h2>{{ floor.name }}</h2>
              <p class="info-subtitle">{{ floor.dormitoryName }}</p>
              <p class="info-id">ID: {{ floor.id }}</p>
            </div>
          </div>

          <div class="info-body">
            <div class="info-row">
              <span class="info-label">Qavat rahbari:</span>
              <span
                  class="info-value"
                  :class="{ 'no-data': leaderFullName === 'Tayinlanmagan' }"
              >
                {{ leaderFullName }}
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Xonalar soni:</span>
              <span class="info-value">{{ roomsCount }} ta</span>
            </div>
          </div>
        </div>

        <!-- Rooms List -->
        <div class="rooms-section">
          <h3>Xonalar</h3>

          <!-- Rooms Grid -->
          <div v-if="hasRooms" class="rooms-grid">
            <div
                v-for="room in floor.rooms"
                :key="room.id"
                class="room-card"
            >
              <div class="room-header">
                <div class="room-number">{{ room.number }}</div>
              </div>

              <div class="room-body">
                <div v-if="room.capacity" class="room-info-item">
                  <span class="room-label">Sig'im:</span>
                  <span class="room-value">{{ room.capacity }} kishi</span>
                </div>

                <div class="room-info-item">
                  <span class="room-label">Xona turi:</span>
                  <span class="room-value">{{ room.roomTypeName }}</span>
                </div>
              </div>

              <div class="room-footer">
                <button
                    @click="viewRoom(room.id)"
                    class="btn-view-room"
                >
                  Ko'rish →
                </button>
                <button
                    @click.stop="openEditModal(room)"
                    class="btn-edit-room"
                >
                  ✏️
                </button>
                <button
                    @click.stop="openDeleteModal(room.id)"
                    class="btn-delete-room"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-rooms">
            <div class="empty-icon">📭</div>
            <p>Bu qavatda xonalar mavjud emas</p>
            <button @click="openCreateModal" class="btn-add-first">
              + Birinchi xonani qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <div
        v-if="modals.create"
        class="modal-overlay"
        @click.self="closeCreateModal"
    >
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>🚪 Yangi Xona Qo'shish</h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Xona raqami *</label>
            <input
                v-model="createForm.number"
                type="text"
                placeholder="Masalan: 101"
                class="form-input"
                :class="{ 'input-error': formErrors.number }"
                @input="formErrors.number = ''"
            />
            <p v-if="formErrors.number" class="error-message">
              {{ formErrors.number }}
            </p>
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
              <option
                  v-for="type in roomTypes"
                  :key="type.id"
                  :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
            <p v-if="formErrors.roomTypeId" class="error-message">
              {{ formErrors.roomTypeId }}
            </p>
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

          <div v-if="createForm.isRoom" class="form-group">
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
            <p v-if="formErrors.capacity" class="error-message">
              {{ formErrors.capacity }}
            </p>
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
              @click="createRoom"
              class="btn-submit"
              :disabled="modalLoading.create"
          >
            {{ modalLoading.create ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
        v-if="modals.edit"
        class="modal-overlay"
        @click.self="closeEditModal"
    >
      <div class="modal modal-large">
        <div class="modal-header">
          <h2>✏️ Xonani Tahrirlash</h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Xona raqami *</label>
            <input
                v-model="editForm.number"
                type="text"
                placeholder="Masalan: 101"
                class="form-input"
                :class="{ 'input-error': formErrors.number }"
                @input="formErrors.number = ''"
            />
            <p v-if="formErrors.number" class="error-message">
              {{ formErrors.number }}
            </p>
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
              <option
                  v-for="type in roomTypes"
                  :key="type.id"
                  :value="type.id"
              >
                {{ type.name }}
              </option>
            </select>
            <p v-if="formErrors.roomTypeId" class="error-message">
              {{ formErrors.roomTypeId }}
            </p>
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

          <div v-if="editForm.isRoom" class="form-group">
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
            <p v-if="formErrors.capacity" class="error-message">
              {{ formErrors.capacity }}
            </p>
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
              @click="updateRoom"
              class="btn-submit"
              :disabled="modalLoading.edit"
          >
            {{ modalLoading.edit ? 'Saqlanmoqda...' : 'Saqlash' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
        v-if="modals.delete"
        class="modal-overlay"
        @click.self="closeDeleteModal"
    >
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>🗑️ O'chirishni tasdiqlash</h2>
          <button @click="closeDeleteModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <p class="delete-warning">
            Haqiqatan ham ushbu xonani o'chirmoqchimisiz?
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
              @click="deleteRoom"
              class="btn-delete-confirm"
              :disabled="modalLoading.delete"
          >
            {{ modalLoading.delete ? 'O\'chirilmoqda...' : 'O\'chirish' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Success/Error Modal -->
    <div
        v-if="modals.message"
        class="modal-overlay"
        @click.self="modals.message = false"
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
              @click="modals.message = false"
              class="btn-message-ok"
          >
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
  transition: all 0.3s;
}

.btn-retry:hover {
  background: #5568d3;
}

/* Detail Content */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Info Card */
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
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.info-icon {
  font-size: 3rem;
}

.info-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.info-subtitle {
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
  font-size: 1rem;
}

.info-id {
  margin: 0;
  opacity: 0.8;
  font-size: 0.9rem;
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

/* Rooms Section */
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

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s;
  overflow: hidden;
}

.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.room-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
}

.room-number {
  font-size: 1.8rem;
  font-weight: 700;
}

.room-body {
  padding: 1.5rem;
}

.room-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.room-info-item:last-child {
  margin-bottom: 0;
}

.room-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.room-value {
  color: #333;
  font-weight: 600;
}

.room-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.5rem;
}

.btn-view-room {
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

.btn-view-room:hover {
  background: #5568d3;
}

.btn-edit-room {
  padding: 0.75rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-edit-room:hover {
  background: #d97706;
}

.btn-delete-room {
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-delete-room:hover {
  background: #dc2626;
}

/* Empty State */
.empty-rooms {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
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
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
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
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  transition: color 0.3s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  color: #333;
  background: #f0f0f0;
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

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error,
.form-select.input-error {
  border-color: #ef4444;
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
  flex-shrink: 0;
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

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    margin-left: 0;
    padding: 1rem;
  }

  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
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
    padding: 1.5rem;
  }

  .info-body {
    padding: 1.5rem;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0;
  }

  .rooms-section {
    padding: 1.5rem;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }

  .room-footer {
    flex-wrap: wrap;
  }

  .btn-view-room {
    width: 100%;
  }

  .modal {
    max-width: 100%;
    margin: 0;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-large {
    max-width: 100%;
  }

  .modal-small {
    max-width: 100%;
  }
}
</style>