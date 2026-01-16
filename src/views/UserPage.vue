<script setup>
import {ref, onMounted, watch, nextTick, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

// ✅ Data states
const users = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

// ✅ Search and pagination
const searchQuery = ref('')
const filterDormId = ref(null)
const filterFloorId = ref(null)
const filterRoomId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

// ✅ Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSuccessModal = ref(false)
const isEditModalOpening = ref(false)

// ✅ Dropdown lists
const dormitories = ref([])
const floors = ref([])
const rooms = ref([])
const roles = ref([])
const editFloors = ref([])
const editRooms = ref([])
const filterFloors = ref([])
const filterRooms = ref([])

// ✅ Loading states
const loadingDorms = ref(false)
const loadingFloors = ref(false)
const loadingRooms = ref(false)
const loadingRoles = ref(false)

// ✅ Form data - resettable defaults
const defaultCreateForm = {
  firstName: '',
  lastName: '',
  middleName: '',
  username: '',
  password: '',
  telegramUsername: '',
  phone: '',
  roleId: null,
  dormId: null,
  floorId: null,
  roomId: null
}

const createForm = ref({...defaultCreateForm})
const editForm = ref({
  id: 0,
  ...defaultCreateForm
})

const deleteId = ref(null)

// ✅ Error states
const formErrors = ref({
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  phone: '',
  roleId: ''
})

const modalMessage = ref({
  title: '',
  text: '',
  type: 'success'
})

// ✅ Loading states for actions
const createLoading = ref(false)
const editLoading = ref(false)
const deleteLoading = ref(false)

// ✅ COMPUTED - totalPages calculation
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

// ✅ COMPUTED - Check if filters active
const hasActiveFilters = computed(() => {
  return filterDormId.value || filterFloorId.value || filterRoomId.value
})

// ✅ COMPUTED - Check if any search active
const hasSearch = computed(() => {
  return searchQuery.value || hasActiveFilters.value
})

// ============ FUNCTIONS ============

function goBack() {
  router.push('/dashboard')
}

// ✅ Fetch users with error handling
async function fetchUsers() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.post('/api/user/list', {
      page: currentPage.value - 1,
      size: pageSize.value,
      search: {
        value: searchQuery.value || null,
        dormId: filterDormId.value,
        floorId: filterFloorId.value,
        roomId: filterRoomId.value
      }
    })

    users.value = response.data.list || []
    total.value = response.data.total || 0
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

// ✅ Fetch reference data
async function fetchDormitories() {
  loadingDorms.value = true
  try {
    const response = await axios.post('/api/dorm/list', {
      page: 0,
      size: 100,
      search: { value: null }
    })
    dormitories.value = response.data.list || []
  } catch (err) {
    console.error('Dormitories fetch error:', err)
  } finally {
    loadingDorms.value = false
  }
}

// ✅ Generic fetch floors function
async function fetchFloors(dormId, targetArray = 'floors') {
  if (!dormId) {
    if (targetArray === 'filterFloors') {
      filterFloors.value = []
      filterFloorId.value = null
      filterRooms.value = []
      filterRoomId.value = null
    } else {
      floors.value = []
    }
    return
  }

  try {
    const response = await axios.post(`/api/floor/list/${dormId}`, {
      page: 0,
      size: 1000,
      search: { value: null }
    })

    const data = response.data.list || []
    if (targetArray === 'filterFloors') {
      filterFloors.value = data
    } else {
      floors.value = data
    }
  } catch (err) {
    console.error('Floors fetch error:', err)
  }
}

// ✅ Generic fetch rooms function
async function fetchRooms(floorId, targetArray = 'rooms') {
  if (!floorId) {
    if (targetArray === 'filterRooms') {
      filterRooms.value = []
      filterRoomId.value = null
    } else {
      rooms.value = []
    }
    return
  }

  try {
    const response = await axios.get(`/api/room/list/${floorId}`)
    const data = response.data || []

    if (targetArray === 'filterRooms') {
      filterRooms.value = data
    } else {
      rooms.value = data
    }
  } catch (err) {
    console.error('Rooms fetch error:', err)
  }
}

// ✅ Fetch roles
async function fetchRoles() {
  loadingRoles.value = true
  try {
    const response = await axios.get('/api/role/list')
    roles.value = response.data || []
  } catch (err) {
    console.error('Roles fetch error:', err)
  } finally {
    loadingRoles.value = false
  }
}

// ============ SEARCH & FILTER FUNCTIONS ============

function handleSearch() {
  currentPage.value = 1
  fetchUsers()
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  fetchUsers()
}

function clearFilters() {
  filterDormId.value = null
  filterFloorId.value = null
  filterRoomId.value = null
  filterFloors.value = []
  filterRooms.value = []
  currentPage.value = 1
  fetchUsers()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchUsers()
  }
}

// ============ MODAL MESSAGE FUNCTIONS ============

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

// ============ FORM VALIDATION ============

function clearFormErrors() {
  formErrors.value = {
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    phone: '',
    roleId: ''
  }
}

// ✅ Check username exists (dengan caching)
const usernameCheckCache = new Map()

async function checkUsernameExists(username, userId = null) {
  if (!username?.trim()) {
    return false
  }

  const usernameValue = username.trim()
  const cacheKey = `${usernameValue}:${userId || 'new'}`

  if (usernameCheckCache.has(cacheKey)) {
    return usernameCheckCache.get(cacheKey)
  }

  try {
    const response = await axios.get('/api/auth/check-exist-username', {
      params: {
        username: usernameValue,
        ...(userId && { id: userId.toString() })
      }
    })

    const exists = response.data === true
    usernameCheckCache.set(cacheKey, exists)
    return exists
  } catch (err) {
    console.error('Username check error:', err)
    return false
  }
}

// ✅ Improved validation
async function validateForm(form, isEdit = false) {
  clearFormErrors()
  let isValid = true

  if (!form.firstName?.trim()) {
    formErrors.value.firstName = 'Ismni kiriting!'
    isValid = false
  }

  if (!form.lastName?.trim()) {
    formErrors.value.lastName = 'Familiyani kiriting!'
    isValid = false
  }

  if (form.username?.trim()) {
    const userId = isEdit ? form.id : null
    const usernameExists = await checkUsernameExists(form.username, userId)

    if (usernameExists) {
      formErrors.value.username = 'Bu username allaqachon band!'
      isValid = false
    }
  }

  return isValid
}

// ============ CREATE MODAL ============

async function openCreateModal() {
  createForm.value = {...defaultCreateForm}
  floors.value = []
  rooms.value = []
  clearFormErrors()

  if (dormitories.value.length === 0) {
    await fetchDormitories()
  }
  if (roles.value.length === 0) {
    await fetchRoles()
  }

  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  clearFormErrors()
}

async function createUser() {
  const isFormValid = await validateForm(createForm.value)

  if (!isFormValid) {
    return
  }

  createLoading.value = true

  try {
    const payload = {
      firstName: createForm.value.firstName?.trim() || '',
      lastName: createForm.value.lastName?.trim() || '',
      middleName: createForm.value.middleName?.trim() || '',
      username: createForm.value.username?.trim() || '',
      password: createForm.value.password?.trim() || '',
      telegramUsername: createForm.value.telegramUsername?.trim() || '',
      phone: createForm.value.phone?.trim() || '',
      roleId: createForm.value.roleId || null,
      dormId: createForm.value.dormId || null,
      floorId: createForm.value.floorId || null,
      roomId: createForm.value.roomId || null
    }

    await axios.post('/api/user/create', payload)

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi muvaffaqiyatli yaratildi')
    fetchUsers()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    createLoading.value = false
  }
}

// ============ EDIT MODAL ============

async function openEditModal(user) {
  isEditModalOpening.value = true
  editFloors.value = []
  editRooms.value = []

  const selectedRoleId = user.roleIds?.[0] || null

  editForm.value = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName || '',
    username: user.username,
    password: '',
    telegramUsername: user.telegramUsername || '',
    phone: user.phone,
    roleId: selectedRoleId,
    dormId: user.dormId,
    floorId: user.floorId,
    roomId: user.roomId
  }

  clearFormErrors()

  if (dormitories.value.length === 0) {
    await fetchDormitories()
  }
  if (roles.value.length === 0) {
    await fetchRoles()
  }

  if (editForm.value.dormId) {
    await fetchFloorsForEdit(editForm.value.dormId)
  }

  if (editForm.value.floorId) {
    await fetchRoomsForEdit(editForm.value.floorId)
  }

  showEditModal.value = true

  await nextTick()
  isEditModalOpening.value = false
}

// ✅ Separate edit floor/room fetch
async function fetchFloorsForEdit(dormId) {
  if (!dormId) {
    editFloors.value = []
    editRooms.value = []
    return
  }

  try {
    const response = await axios.post(`/api/floor/list/${dormId}`, {
      page: 0,
      size: 1000,
      search: { value: null }
    })
    editFloors.value = response.data.list || []
  } catch (err) {
    console.error('Edit floors fetch error:', err)
    editFloors.value = []
  }
}

async function fetchRoomsForEdit(floorId) {
  if (!floorId) {
    editRooms.value = []
    return
  }

  try {
    const response = await axios.get(`/api/room/list/${floorId}`)
    editRooms.value = response.data || []
  } catch (err) {
    console.error('Edit rooms fetch error:', err)
    editRooms.value = []
  }
}

function closeEditModal() {
  showEditModal.value = false
  clearFormErrors()
  isEditModalOpening.value = false
}

async function updateUser() {
  const isFormValid = await validateForm(editForm.value, true)

  if (!isFormValid) {
    return
  }

  editLoading.value = true

  try {
    const requestBody = {
      id: editForm.value.id,
      firstName: editForm.value.firstName?.trim() || '',
      lastName: editForm.value.lastName?.trim() || '',
      middleName: editForm.value.middleName?.trim() || '',
      username: editForm.value.username?.trim() || '',
      telegramUsername: editForm.value.telegramUsername?.trim() || '',
      phone: editForm.value.phone?.trim() || '',
      roleId: editForm.value.roleId || null,
      dormId: editForm.value.dormId || null,
      floorId: editForm.value.floorId || null,
      roomId: editForm.value.roomId || null
    }

    if (editForm.value.password?.trim()) {
      requestBody.password = editForm.value.password.trim()
    }

    await axios.put('/api/user/update', requestBody)

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi muvaffaqiyatli yangilandi')
    fetchUsers()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    editLoading.value = false
  }
}

// ============ DELETE MODAL ============

function openDeleteModal(id) {
  deleteId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function deleteUser() {
  deleteLoading.value = true

  try {
    await axios.delete(`/api/user/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi muvaffaqiyatli o\'chirildi')
    fetchUsers()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    deleteLoading.value = false
  }
}

// ============ WATCHERS FOR CASCADE DROPDOWNS ============

// Create form watchers
watch(() => createForm.value.dormId, (newVal) => {
  createForm.value.floorId = null
  createForm.value.roomId = null
  rooms.value = []
  if (newVal) {
    fetchFloors(newVal, 'floors')
  } else {
    floors.value = []
  }
})

watch(() => createForm.value.floorId, (newVal) => {
  createForm.value.roomId = null
  if (newVal) {
    fetchRooms(newVal, 'rooms')
  } else {
    rooms.value = []
  }
})

// Edit form watchers - WITH MODAL OPENING CHECK
watch(() => editForm.value.dormId, async (newVal) => {
  if (isEditModalOpening.value) return

  editForm.value.floorId = null
  editForm.value.roomId = null
  editRooms.value = []

  if (newVal) {
    await fetchFloorsForEdit(newVal)
  } else {
    editFloors.value = []
  }
})

watch(() => editForm.value.floorId, async (newVal) => {
  if (isEditModalOpening.value) return

  editForm.value.roomId = null

  if (newVal) {
    await fetchRoomsForEdit(newVal)
  } else {
    editRooms.value = []
  }
})

// Filter watchers
watch(() => filterDormId.value, (newVal) => {
  filterFloorId.value = null
  filterRoomId.value = null
  filterRooms.value = []
  if (newVal) {
    fetchFloors(newVal, 'filterFloors')
  } else {
    filterFloors.value = []
  }
  currentPage.value = 1
  fetchUsers()
})

watch(() => filterFloorId.value, (newVal) => {
  filterRoomId.value = null
  if (newVal) {
    fetchRooms(newVal, 'filterRooms')
  } else {
    filterRooms.value = []
  }
  currentPage.value = 1
  fetchUsers()
})

watch(() => filterRoomId.value, () => {
  currentPage.value = 1
  fetchUsers()
})

// ============ LIFECYCLE ============

onMounted(() => {
  fetchUsers()
  fetchDormitories()
  fetchRoles()
})
</script>

<template>
  <div class="page-container">
    <SideMenu/>

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>👥 Foydalanuvchilar</h1>
      </div>
      <button @click="openCreateModal" class="btn-create">+ Yangi qo'shish</button>
    </div>

    <!-- Search and Filters -->
    <div class="search-container">
      <div class="search-box">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Qidirish..."
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

      <div class="filters-box">
        <div class="filter-group">
          <select v-model="filterDormId" class="filter-select">
            <option :value="null" disabled hidden>Yotoqxonani tanlang</option>
            <option v-for="dorm in dormitories" :key="dorm.id" :value="dorm.id">
              {{ dorm.name }}
            </option>
          </select>
          <button
              v-if="filterDormId"
              @click="filterDormId = null"
              class="filter-clear-btn"
              title="Tozalash"
          >
            ✕
          </button>
        </div>

        <div class="filter-group">
          <select v-model="filterFloorId" class="filter-select" :disabled="!filterDormId">
            <option :value="null" disabled hidden>Qavatni tanlang</option>
            <option v-for="floor in filterFloors" :key="floor.id" :value="floor.id">
              {{ floor.name }}
            </option>
          </select>
          <button
              v-if="filterFloorId"
              @click="filterFloorId = null"
              class="filter-clear-btn"
              title="Tozalash"
          >
            ✕
          </button>
        </div>

        <div class="filter-group">
          <select v-model="filterRoomId" class="filter-select" :disabled="!filterFloorId">
            <option :value="null" disabled hidden>Xonani tanlang</option>
            <option v-for="room in filterRooms" :key="room.id" :value="room.id">
              {{ room.number }} - {{ room.name }}
            </option>
          </select>
          <button
              v-if="filterRoomId"
              @click="filterRoomId = null"
              class="filter-clear-btn"
              title="Tozalash"
          >
            ✕
          </button>
        </div>

        <button
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="btn-clear-filters"
        >
          Barchasini tozalash
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
        <button @click="fetchUsers" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="users.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Foydalanuvchilar topilmadi</h3>
        <p v-if="hasSearch">
          Filter bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday foydalanuvchi yo'q</p>
      </div>

      <!-- Users Table -->
      <div v-else class="table-container">
        <table class="users-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>F.I.O</th>
            <th>Username</th>
            <th>Telefon</th>
            <th>Telegram</th>
            <th>Rol</th>
            <th>Yotoqxona</th>
            <th>Qavat</th>
            <th>Xona</th>
            <th>Amallar</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td class="user-name-cell">
              {{ user.lastName }} {{ user.firstName }} {{ user.middleName }}
            </td>
            <td>{{ user.username }}</td>
            <td>{{ user.phone }}</td>
            <td>{{ user.telegramUsername || '-' }}</td>
            <td>
                <span class="role-badge">
                  {{ user.roles?.join(', ') || '-' }}
                </span>
            </td>
            <td>{{ user.dormName || '-' }}</td>
            <td>{{ user.floorNumber || '-' }}</td>
            <td>{{ user.roomNumber || '-' }}</td>
            <td class="actions-cell">
              <button @click="openEditModal(user)" class="btn-edit">✏️</button>
              <button @click="openDeleteModal(user.id)" class="btn-delete">🗑️</button>
            </td>
          </tr>
          </tbody>
        </table>

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
      <div class="modal modal-xlarge">
        <div class="modal-header">
          <h2>👤 Yangi Foydalanuvchi Qo'shish</h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Ism *</label>
              <input
                  v-model="createForm.firstName"
                  type="text"
                  placeholder="Ismni kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.firstName }"
                  @input="formErrors.firstName = ''"
              />
              <p v-if="formErrors.firstName" class="error-message">{{ formErrors.firstName }}</p>
            </div>

            <div class="form-group">
              <label>Familiya *</label>
              <input
                  v-model="createForm.lastName"
                  type="text"
                  placeholder="Familiyani kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.lastName }"
                  @input="formErrors.lastName = ''"
              />
              <p v-if="formErrors.lastName" class="error-message">{{ formErrors.lastName }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>Otasining ismi</label>
            <input
                v-model="createForm.middleName"
                type="text"
                placeholder="Otasining ismini kiriting"
                class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input
                  v-model="createForm.username"
                  type="text"
                  placeholder="Username ni kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.username }"
                  @input="formErrors.username = ''"
              />
              <p v-if="formErrors.username" class="error-message">{{ formErrors.username }}</p>
            </div>

            <div class="form-group">
              <label>Parol</label>
              <input
                  v-model="createForm.password"
                  type="password"
                  placeholder="Parolni kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.password }"
                  @input="formErrors.password = ''"
              />
              <p v-if="formErrors.password" class="error-message">{{ formErrors.password }}</p>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Telefon</label>
              <input
                  v-model="createForm.phone"
                  type="tel"
                  placeholder="+998901234567"
                  class="form-input"
                  :class="{ 'input-error': formErrors.phone }"
                  @input="formErrors.phone = ''"
              />
              <p v-if="formErrors.phone" class="error-message">{{ formErrors.phone }}</p>
            </div>

            <div class="form-group">
              <label>Telegram Username</label>
              <input
                  v-model="createForm.telegramUsername"
                  type="text"
                  placeholder="@username"
                  class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Rol</label>
            <select
                v-model="createForm.roleId"
                class="form-select"
            >
              <option :value="null" disabled hidden>Rolni tanlang</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
            <p v-if="formErrors.roleId" class="error-message">{{ formErrors.roleId }}</p>
          </div>

          <div class="form-divider">Joylashuv ma'lumotlari</div>

          <div class="form-group">
            <label>Yotoqxona</label>
            <select v-model="createForm.dormId" class="form-select">
              <option :value="null" disabled hidden>Yotoqxonani tanlang</option>
              <option v-for="dorm in dormitories" :key="dorm.id" :value="dorm.id">
                {{ dorm.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Qavat</label>
            <select
                v-model="createForm.floorId"
                class="form-select"
                :disabled="!createForm.dormId"
            >
              <option :value="null" disabled hidden>Qavatni tanlang</option>
              <option v-for="floor in floors" :key="floor.id" :value="floor.id">
                {{ floor.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Xona</label>
            <select
                v-model="createForm.roomId"
                class="form-select"
                :disabled="!createForm.floorId"
            >
              <option :value="null" disabled hidden>Xonani tanlang</option>
              <option v-for="room in rooms" :key="room.id" :value="room.id">
                {{ room.number }} - xona
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">
            Bekor qilish
          </button>
          <button @click="createUser" class="btn-submit" :disabled="createLoading">
            <span v-if="createLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal modal-xlarge">
        <div class="modal-header">
          <h2>✏️ Foydalanuvchini Tahrirlash</h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Ism *</label>
              <input
                  v-model="editForm.firstName"
                  type="text"
                  placeholder="Ismni kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.firstName }"
                  @input="formErrors.firstName = ''"
              />
              <p v-if="formErrors.firstName" class="error-message">{{ formErrors.firstName }}</p>
            </div>

            <div class="form-group">
              <label>Familiya *</label>
              <input
                  v-model="editForm.lastName"
                  type="text"
                  placeholder="Familiyani kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.lastName }"
                  @input="formErrors.lastName = ''"
              />
              <p v-if="formErrors.lastName" class="error-message">{{ formErrors.lastName }}</p>
            </div>
          </div>

          <div class="form-group">
            <label>Otasining ismi</label>
            <input
                v-model="editForm.middleName"
                type="text"
                placeholder="Otasining ismini kiriting"
                class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input
                  v-model="editForm.username"
                  type="text"
                  placeholder="Username ni kiriting"
                  class="form-input"
                  :class="{ 'input-error': formErrors.username }"
                  @input="formErrors.username = ''"
              />
              <p v-if="formErrors.username" class="error-message">{{ formErrors.username }}</p>
            </div>

            <div class="form-group">
              <label>Parol (bo'sh qoldiring, o'zgartirmaslik uchun)</label>
              <input
                  v-model="editForm.password"
                  type="password"
                  placeholder="Yangi parol"
                  class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Telefon</label>
              <input
                  v-model="editForm.phone"
                  type="tel"
                  placeholder="+998901234567"
                  class="form-input"
                  :class="{ 'input-error': formErrors.phone }"
                  @input="formErrors.phone = ''"
              />
              <p v-if="formErrors.phone" class="error-message">{{ formErrors.phone }}</p>
            </div>

            <div class="form-group">
              <label>Telegram Username</label>
              <input
                  v-model="editForm.telegramUsername"
                  type="text"
                  placeholder="@username"
                  class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Rol</label>
            <select
                v-model="editForm.roleId"
                class="form-select"
            >
              <option :value="null" disabled hidden>Rolni tanlang</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
            <p v-if="formErrors.roleId" class="error-message">{{ formErrors.roleId }}</p>
          </div>

          <div class="form-divider">Joylashuv ma'lumotlari</div>

          <div class="form-group">
            <label>Yotoqxona</label>
            <select v-model="editForm.dormId" class="form-select">
              <option :value="null" disabled hidden>Yotoqxonani tanlang</option>
              <option v-for="dorm in dormitories" :key="dorm.id" :value="dorm.id">
                {{ dorm.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Qavat</label>
            <select
                v-model="editForm.floorId"
                class="form-select"
                :disabled="!editForm.dormId"
            >
              <option :value="null" disabled hidden>Qavatni tanlang</option>
              <option v-for="floor in editFloors" :key="floor.id" :value="floor.id">
                {{ floor.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Xona</label>
            <select
                v-model="editForm.roomId"
                class="form-select"
                :disabled="!editForm.floorId"
            >
              <option :value="null" disabled hidden>Xonani tanlang</option>
              <option v-for="room in editRooms" :key="room.id" :value="room.id">
                {{ room.number }} - xona
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel" :disabled="editLoading">
            Bekor qilish
          </button>
          <button @click="updateUser" class="btn-submit" :disabled="editLoading">
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
            Haqiqatan ham ushbu foydalanuvchini o'chirmoqchimisiz?
            <br><strong>Bu amalni ortga qaytarib bo'lmaydi!</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel" :disabled="deleteLoading">
            Bekor qilish
          </button>
          <button @click="deleteUser" class="btn-delete-confirm" :disabled="deleteLoading">
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
  margin-bottom: 1rem;
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

.filters-box {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-group {
  position: relative;
  flex: 1;
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.filter-clear-btn {
  padding: 0.5rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s;
  min-width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-clear-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.btn-clear-filters {
  padding: 0.75rem 1.5rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-clear-filters:hover {
  background: #d97706;
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
}

.users-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.users-table tbody tr:hover {
  background: #f8f9fa;
}

.users-table td {
  padding: 1rem;
  font-size: 0.95rem;
}

.user-name-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #667eea;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.btn-edit {
  padding: 0.5rem 0.75rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-edit:hover {
  background: #d97706;
}

.btn-delete {
  padding: 0.5rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-delete:hover {
  background: #dc2626;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
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

.modal-xlarge {
  max-width: 800px;
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
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-input, .form-select {
  display: block;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error, .form-select.input-error {
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

.form-divider {
  margin: 1.5rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  font-weight: 600;
  color: #667eea;
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

@media (max-width: 968px) {
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

  .btn-create {
    width: 100%;
  }

  .search-box {
    flex-direction: column;
  }

  .filters-box {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .filter-select {
    min-width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  .users-table {
    min-width: 1000px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }

  .pagination {
    flex-direction: column;
  }

  .pagination-numbers {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>