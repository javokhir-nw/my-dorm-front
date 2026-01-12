<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import api from '../api/api.js'

// ==================== Composables ====================
const router = useRouter()
const authStore = useAuthStore()

// ==================== State - Users Data ====================
const users = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

// ==================== State - Search & Pagination ====================
const searchQuery = ref('')
const filterDormId = ref(null)
const filterFloorId = ref(null)
const filterRoomId = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

// ==================== State - Modals ====================
const modals = ref({
  create: false,
  edit: false,
  delete: false,
  message: false
})

// ==================== State - Dropdown Lists ====================
const dormitories = ref([])
const roles = ref([])

const lists = ref({
  create: {floors: [], rooms: []},
  edit: {floors: [], rooms: []},
  filter: {floors: [], rooms: []}
})

const loadingStates = ref({
  dorms: false,
  floors: false,
  rooms: false,
  roles: false
})

// ==================== State - Forms ====================
const createDefaultForm = () => ({
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
})

const createForm = ref(createDefaultForm())
const editForm = ref(createDefaultForm())
const deleteId = ref(null)

// ==================== State - Messages & Loading ====================
const modalMessage = ref({
  title: '',
  text: '',
  type: 'success'
})

const modalLoading = ref({
  create: false,
  edit: false,
  delete: false
})

const formErrors = ref({
  firstName: '',
  lastName: '',
  username: '',
  password: '',
  phone: '',
  roleId: ''
})

// ==================== Computed Properties ====================
const hasUsers = computed(() => users.value.length > 0)
const hasFilters = computed(() => filterDormId.value || filterFloorId.value || filterRoomId.value)
const hasSearch = computed(() => searchQuery.value.trim().length > 0)

const paginationRange = computed(() => {
  const range = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    range.push(i)
  }

  return range
})

// ==================== Navigation ====================
function goBack() {
  router.push('/dashboard')
}

// ==================== API - Users ====================
async function fetchUsers() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/user/list', {
      page: currentPage.value - 1,
      size: pageSize.value,
      search: {
        value: searchQuery.value.trim() || null,
        dormId: filterDormId.value,
        floorId: filterFloorId.value,
        roomId: filterRoomId.value
      }
    })

    users.value = response.data.list || []
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

// ==================== API - Dropdown Data ====================
async function fetchDormitories() {
  if (dormitories.value.length > 0) return

  loadingStates.value.dorms = true

  try {
    const response = await api.post('/dorm/list', {
      page: 0,
      size: 100,
      search: {value: null}
    })
    dormitories.value = response.data.list || []
  } catch (err) {
    console.error('Dormitories fetch error:', err)
  } finally {
    loadingStates.value.dorms = false
  }
}

async function fetchRoles() {
  if (roles.value.length > 0) return

  loadingStates.value.roles = true

  try {
    const response = await api.get('/role/list')
    roles.value = response.data || []
  } catch (err) {
    console.error('Roles fetch error:', err)
  } finally {
    loadingStates.value.roles = false
  }
}

async function fetchFloors(dormId, context = 'create') {
  if (!dormId) {
    lists.value[context].floors = []
    if (context === 'filter') {
      filterFloorId.value = null
      filterRoomId.value = null
      lists.value[context].rooms = []
    }
    return
  }

  loadingStates.value.floors = true

  try {
    const response = await api.post(`/floor/list/${dormId}`, {
      page: 0,
      size: 1000,
      search: {value: null}
    })
    lists.value[context].floors = response.data.list || []
  } catch (err) {
    console.error('Floors fetch error:', err)
  } finally {
    loadingStates.value.floors = false
  }
}

async function fetchRooms(floorId, context = 'create') {
  if (!floorId) {
    lists.value[context].rooms = []
    if (context === 'filter') {
      filterRoomId.value = null
    }
    return
  }

  loadingStates.value.rooms = true

  try {
    const response = await api.get(`/room/list/${floorId}`)
    lists.value[context].rooms = response.data || []
  } catch (err) {
    console.error('Rooms fetch error:', err)
  } finally {
    loadingStates.value.rooms = false
  }
}

// ==================== Search & Filters ====================
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
  lists.value.filter.floors = []
  lists.value.filter.rooms = []
  currentPage.value = 1
  fetchUsers()
}

// ==================== Pagination ====================
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
    currentPage.value = page
    fetchUsers()
  }
}

// ==================== Modal Helpers ====================
function openModal(modalName) {
  modals.value[modalName] = true
}

function closeModal(modalName) {
  modals.value[modalName] = false
}

function showMessage(title, text, type = 'success') {
  modalMessage.value = {title, text, type}
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

// ==================== Form Validation ====================
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

async function checkUsernameExists(username, userId = null) {
  if (!username?.trim()) return false

  try {
    const params = new URLSearchParams({username: username.trim()})
    if (userId) params.append('id', userId)

    const response = await api.get(`/auth/check-exist-username?${params}`)
    return response.data === true
  } catch (err) {
    console.error('Username check error:', err)
    return false
  }
}

// Debounced username validation
async function validateUsername(context = 'create') {
  const form = context === 'create' ? createForm : editForm
  const validation = usernameValidation.value[context]
  const username = form.value.username

  // Clear previous timeout
  if (usernameCheckTimeout) {
    clearTimeout(usernameCheckTimeout)
  }

  // Reset
  validation.isChecking = false
  validation.isValid = null
  validation.message = ''

  if (!username || username.trim().length === 0) {
    return
  }

  if (username.trim().length < 3) {
    validation.isValid = false
    validation.message = 'Username kamida 3 ta belgidan iborat bo\'lishi kerak!'
    return
  }

  validation.isChecking = true
  validation.message = 'Tekshirilmoqda...'

  usernameCheckTimeout = setTimeout(async () => {
    try {
      const userId = context === 'edit' ? editForm.value.id : null
      const exists = await checkUsernameExists(username, userId)

      if (exists) {
        validation.isValid = false
        validation.message = 'Bu username allaqachon band!'
      } else {
        validation.isValid = true
        validation.message = 'Usernamedan foydalanish mumkin'
      }
    } catch (err) {
      validation.isValid = false
      validation.message = 'Tekshirishda xatolik'
    } finally {
      validation.isChecking = false
    }
  }, 500)
}

// ==================== Form Validation ====================
function validateForm(form, isEdit = false) {
  clearFormErrors()
  let isValid = true

  // formData.value o'rniga form ishlatiladi
  if (!form.firstName?.trim()) {
    formErrors.value.firstName = 'Ism kiriting!'
    isValid = false
  }

  return isValid
}

const usernameValidation = ref({
  create: {
    isChecking: false,
    isValid: null,
    message: ''
  },
  edit: {
    isChecking: false,
    isValid: null,
    message: ''
  }
})

// Debounce timeout
let usernameCheckTimeout = null

// ==================== CRUD Operations ====================
async function openCreateModal() {
  createForm.value = createDefaultForm()
  lists.value.create.floors = []
  lists.value.create.rooms = []
  clearFormErrors()

  // Username validation ni tozalash
  usernameValidation.value.create = {
    isChecking: false,
    isValid: null,
    message: ''
  }

  await Promise.all([fetchDormitories(), fetchRoles()])
  openModal('create')
}

function closeCreateModal() {
  closeModal('create')
  clearFormErrors()
}

async function createUser() {
  // formData emas, createForm.value ishlatiladi
  if (!(await validateForm(createForm.value, false))) return

  modalLoading.value.create = true

  try {
    const response = await api.post('/user/create', createForm.value)

    // AXIOS ishlatilganda response.ok bo'lmaydi, shuning uchun bu qatorni olib tashlang:
    // if (!response.ok) throw new Error(...)

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi yaratildi')
    await fetchUsers() // Listni yangilash
  } catch (err) {
    showErrorMessage('Xatolik!', err.response?.data?.message || 'Yaratishda xatolik yuz berdi')
  } finally {
    modalLoading.value.create = false
  }
}

async function openEditModal(user) {
  const selectedRoleId = Array.isArray(user.roleIds) && user.roleIds.length > 0
      ? user.roleIds[0]
      : null

  editForm.value = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    middleName: user.middleName || '',
    username: user.username,
    password: '',
    telegramUsername: user.telegramUsername || '',
    phone: user.phone || '',
    roleId: selectedRoleId,
    dormId: user.dormId,
    floorId: user.floorId,
    roomId: user.roomId
  }

  clearFormErrors()
  await Promise.all([fetchDormitories(), fetchRoles()])

  if (editForm.value.dormId) {
    await fetchFloors(editForm.value.dormId, 'edit')
    if (editForm.value.floorId) {
      await fetchRooms(editForm.value.floorId, 'edit')
    }
  }

  openModal('edit')
}

function closeEditModal() {
  closeModal('edit')
  clearFormErrors()
}

async function updateUser() {
  if (!validateForm(createForm.value, true)) return

  modalLoading.value.edit = true

  try {
    const requestBody = {
      id: editForm.value.id,
      firstName: editForm.value.firstName.trim(),
      lastName: editForm.value.lastName.trim(),
      middleName: editForm.value.middleName?.trim() || '',
      username: editForm.value.username.trim(),
      telegramUsername: editForm.value.telegramUsername?.trim() || '',
      phone: editForm.value.phone?.trim() || '',
      roleId: editForm.value.roleId,
      dormId: editForm.value.dormId,
      floorId: editForm.value.floorId,
      roomId: editForm.value.roomId
    }

    if (editForm.value.password?.trim()) {
      requestBody.password = editForm.value.password.trim()
    }

    const response = await api.put('/user/update', requestBody)

    if (!response.ok) {
      throw new Error('Foydalanuvchini yangilashda xatolik')
    }

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi muvaffaqiyatli yangilandi')
    await fetchUsers()
  } catch (err) {
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    modalLoading.value.edit = false
  }
}

function openDeleteModal(id) {
  deleteId.value = id
  openModal('delete')
}

function closeDeleteModal() {
  closeModal('delete')
  deleteId.value = null
}

async function deleteUser() {
  modalLoading.value.delete = true
  try {
    // Axiosda response.ok shart emas, xato bo'lsa catchga tushadi
    await api.delete(`/user/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Foydalanuvchi o\'chirildi')

    // Ro'yxatni yangilash uchun chaqiramiz
    await fetchUsers()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.response?.data?.message || 'O\'chirishda xato yuz berdi')
  } finally {
    modalLoading.value.delete = false
  }
}

// ==================== Watchers ====================
watch(() => createForm.value.dormId, (newVal) => {
  createForm.value.floorId = null
  createForm.value.roomId = null
  lists.value.create.rooms = []
  if (newVal) fetchFloors(newVal, 'create')
  else lists.value.create.floors = []
})

watch(() => createForm.value.floorId, (newVal) => {
  createForm.value.roomId = null
  if (newVal) fetchRooms(newVal, 'create')
  else lists.value.create.rooms = []
})

watch(() => editForm.value.dormId, (newVal) => {
  editForm.value.floorId = null
  editForm.value.roomId = null
  lists.value.edit.rooms = []
  if (newVal) fetchFloors(newVal, 'edit')
  else lists.value.edit.floors = []
})

watch(() => editForm.value.floorId, (newVal) => {
  editForm.value.roomId = null
  if (newVal) fetchRooms(newVal, 'edit')
  else lists.value.edit.rooms = []
})

watch(() => filterDormId.value, (newVal) => {
  filterFloorId.value = null
  filterRoomId.value = null
  lists.value.filter.rooms = []
  if (newVal) fetchFloors(newVal, 'filter')
  else lists.value.filter.floors = []
  currentPage.value = 1
  fetchUsers()
})

watch(() => filterFloorId.value, (newVal) => {
  filterRoomId.value = null
  if (newVal) fetchRooms(newVal, 'filter')
  else lists.value.filter.rooms = []
  currentPage.value = 1
  fetchUsers()
})

watch(() => filterRoomId.value, () => {
  currentPage.value = 1
  fetchUsers()
})

// ==================== Lifecycle ====================
onMounted(async () => {
  await Promise.all([fetchUsers(), fetchDormitories(), fetchRoles()])
})
</script>

<template>
  <div class="page-container">
    <SideMenu/>

    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button" aria-label="Orqaga">
          ← Orqaga
        </button>
        <h1>👥 Foydalanuvchilar</h1>
        <span v-if="total > 0" class="count-badge">{{ total }} ta</span>
      </div>
      <button
          @click="openCreateModal"
          class="btn-create"
          :disabled="loading"
      >
        + Yangi qo'shish
      </button>
    </div>

    <!-- Search and Filters -->
    <div class="search-container">
      <!-- Search Box -->
      <div class="search-box">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Ism, familiya yoki username bo'yicha qidirish..."
            @keyup.enter="handleSearch"
            class="search-input"
            :disabled="loading"
        />
        <button
            @click="handleSearch"
            class="btn-search"
            :disabled="loading"
        >
          🔍 Qidirish
        </button>
        <button
            v-if="hasSearch"
            @click="clearSearch"
            class="btn-clear"
            :disabled="loading"
            title="Qidiruvni tozalash"
        >
          ✕
        </button>
      </div>

      <!-- Filters Box -->
      <div class="filters-box">
        <div class="filter-group">
          <select v-model="filterDormId" class="filter-select" :disabled="loading">
            <option :value="null">Barcha yotoqxonalar</option>
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
          <select
              v-model="filterFloorId"
              class="filter-select"
              :disabled="!filterDormId || loading"
          >
            <option :value="null">Barcha qavatlar</option>
            <option
                v-for="floor in lists.filter.floors"
                :key="floor.id"
                :value="floor.id"
            >
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
          <select
              v-model="filterRoomId"
              class="filter-select"
              :disabled="!filterFloorId || loading"
          >
            <option :value="null">Barcha xonalar</option>
            <option
                v-for="room in lists.filter.rooms"
                :key="room.id"
                :value="room.id"
            >
              {{ room.number }}
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
            v-if="hasFilters"
            @click="clearFilters"
            class="btn-clear-filters"
            :disabled="loading"
        >
          Filtrlarni tozalash
        </button>
      </div>
    </div>

    <!-- Main Content -->
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
        <button @click="fetchUsers" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="!hasUsers" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>Foydalanuvchilar topilmadi</h3>
        <p v-if="hasSearch || hasFilters">
          Filter yoki qidiruv bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday foydalanuvchi yo'q</p>
        <button
            v-if="!hasSearch && !hasFilters"
            @click="openCreateModal"
            class="btn-add-first"
        >
          + Birinchi foydalanuvchini qo'shish
        </button>
      </div>

      <!-- Users Table -->
      <div v-else class="table-container">
        <div class="table-wrapper">
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
              <th class="actions-header">Amallar</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="user in users" :key="user.id">
              <td class="id-cell">{{ user.id }}</td>
              <td class="name-cell">
                <div class="user-name">
                  {{ user.lastName }} {{ user.firstName }}
                  <span v-if="user.middleName" class="middle-name">
                      {{ user.middleName }}
                    </span>
                </div>
              </td>
              <td>
                <span class="username-badge">{{ user.username || '-' }}</span>
              </td>
              <td>{{ user.phone || '-' }}</td>
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
                <button
                    @click="openEditModal(user)"
                    class="btn-edit"
                    title="Tahrirlash"
                    aria-label="Foydalanuvchini tahrirlash"
                >
                  ✏️
                </button>
                <button
                    @click="openDeleteModal(user.id)"
                    class="btn-delete"
                    title="O'chirish"
                    aria-label="Foydalanuvchini o'chirish"
                >
                  🗑️
                </button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination">
          <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="pagination-btn"
          >
            ← Oldingi
          </button>

          <div class="pagination-numbers">
            <button
                v-for="page in paginationRange"
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
    <Transition name="modal">
      <div
          v-if="modals.create"
          class="modal-overlay"
          @click.self="closeCreateModal"
      >
        <div class="modal modal-xlarge">
          <div class="modal-header">
            <h2>👤 Yangi Foydalanuvchi</h2>
            <button @click="closeCreateModal" class="modal-close" aria-label="Yopish">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label for="create-firstName">
                  Ism <span class="required">*</span>
                </label>
                <input
                    id="create-firstName"
                    v-model="createForm.firstName"
                    type="text"
                    placeholder="Ismni kiriting"
                    class="form-input"
                    :class="{ 'input-error': formErrors.firstName }"
                    @input="formErrors.firstName = ''"
                    :disabled="modalLoading.create"
                />
                <Transition name="slide-down">
                  <p v-if="formErrors.firstName" class="error-message">
                    {{ formErrors.firstName }}
                  </p>
                </Transition>
              </div>

              <div class="form-group">
                <label for="create-lastName">
                  Familiya <span class="required">*</span>
                </label>
                <input
                    id="create-lastName"
                    v-model="createForm.lastName"
                    type="text"
                    placeholder="Familiyani kiriting"
                    class="form-input"
                    :class="{ 'input-error': formErrors.lastName }"
                    @input="formErrors.lastName = ''"
                    :disabled="modalLoading.create"
                />
                <Transition name="slide-down">
                  <p v-if="formErrors.lastName" class="error-message">
                    {{ formErrors.lastName }}
                  </p>
                </Transition>
              </div>
            </div>

            <div class="form-group">
              <label for="create-middleName">Otasining ismi</label>
              <input
                  id="create-middleName"
                  v-model="createForm.middleName"
                  type="text"
                  placeholder="Otasining ismini kiriting"
                  class="form-input"
                  :disabled="modalLoading.create"
              />
            </div>

            <div class="form-row">

              <div class="form-group">
                <label for="create-username">Username</label>
                <div class="input-with-validation">
                  <input
                      id="create-username"
                      v-model="createForm.username"
                      type="text"
                      placeholder="Username ni kiriting (kamida 3 ta harf)"
                      class="form-input"
                      :class="{
        'input-error': formErrors.username || usernameValidation.create.isValid === false,
        'input-success': usernameValidation.create.isValid === true
      }"
                      @input="validateUsername('create')"
                      :disabled="modalLoading.create"
                  />
                  <span v-if="usernameValidation.create.isChecking" class="validation-icon checking">
      ⏳
    </span>
                  <span v-else-if="usernameValidation.create.isValid === true" class="validation-icon success">
      ✓
    </span>
                  <span v-else-if="usernameValidation.create.isValid === false" class="validation-icon error">
      ✗
    </span>
                </div>
                <Transition name="slide-down">
                  <p
                      v-if="usernameValidation.create.message"
                      :class="[
        'validation-message',
        usernameValidation.create.isValid === true ? 'success' : 'error'
      ]"
                  >
                    {{ usernameValidation.create.message }}
                  </p>
                </Transition>
              </div>

              <div class="form-group">
                <label for="create-password">Parol</label>
                <input
                    id="create-password"
                    v-model="createForm.password"
                    type="password"
                    placeholder="Parolni kiriting"
                    class="form-input"
                    :disabled="modalLoading.create"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="create-phone">Telefon</label>
                <input
                    id="create-phone"
                    v-model="createForm.phone"
                    type="tel"
                    placeholder="+998 90 123 45 67"
                    class="form-input"
                    :disabled="modalLoading.create"
                />
              </div>

              <div class="form-group">
                <label for="create-telegram">Telegram</label>
                <input
                    id="create-telegram"
                    v-model="createForm.telegramUsername"
                    type="text"
                    placeholder="@username"
                    class="form-input"
                    :disabled="modalLoading.create"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="create-role">Rol</label>
              <select
                  id="create-role"
                  v-model="createForm.roleId"
                  class="form-select"
                  :disabled="modalLoading.create"
              >
                <option :value="null">Rolni tanlang</option>
                <option v-for="role in roles" :key="role.id" :value="role.id">
                  {{ role.name }}
                </option>
              </select>
            </div>

            <div class="form-divider">Joylashuv</div>

            <div class="form-group">
              <label for="create-dorm">Yotoqxona</label>
              <select
                  id="create-dorm"
                  v-model="createForm.dormId"
                  class="form-select"
                  :disabled="modalLoading.create"
              >
                <option :value="null">Tanlang</option>
                <option
                    v-for="dorm in dormitories"
                    :key="dorm.id"
                    :value="dorm.id"
                >
                  {{ dorm.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="create-floor">Qavat</label>
              <select
                  id="create-floor"
                  v-model="createForm.floorId"
                  class="form-select"
                  :disabled="!createForm.dormId || modalLoading.create"
              >
                <option :value="null">Tanlang</option>
                <option
                    v-for="floor in lists.create.floors"
                    :key="floor.id"
                    :value="floor.id"
                >
                  {{ floor.name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="create-room">Xona</label>
              <select
                  id="create-room"
                  v-model="createForm.roomId"
                  class="form-select"
                  :disabled="!createForm.floorId || modalLoading.create"
              >
                <option :value="null">Tanlang</option>
                <option
                    v-for="room in lists.create.rooms"
                    :key="room.id"
                    :value="room.id"
                >
                  {{ room.number }}
                </option>
              </select>
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
                @click="createUser"
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

    <!-- Edit Modal (similar structure to Create) -->
    <Transition name="modal">
      <div
          v-if="modals.edit"
          class="modal-overlay"
          @click.self="closeEditModal"
      >
        <div class="modal modal-xlarge">
          <div class="modal-header">
            <h2>✏️ Tahrirlash</h2>
            <button @click="closeEditModal" class="modal-close" aria-label="Yopish">
              ✕
            </button>
          </div>

          <div class="modal-body">
            <!-- Same form structure as Create, using editForm and lists.edit -->
            <div class="form-row">
              <div class="form-group">
                <label>Ism <span class="required">*</span></label>
                <input
                    v-model="editForm.firstName"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': formErrors.firstName }"
                    @input="formErrors.firstName = ''"
                    :disabled="modalLoading.edit"
                />
                <Transition name="slide-down">
                  <p v-if="formErrors.firstName" class="error-message">
                    {{ formErrors.firstName }}
                  </p>
                </Transition>
              </div>
              <div class="form-group">
                <label>Familiya <span class="required">*</span></label>
                <input
                    v-model="editForm.lastName"
                    type="text"
                    class="form-input"
                    :class="{ 'input-error': formErrors.lastName }"
                    @input="formErrors.lastName = ''"
                    :disabled="modalLoading.edit"
                />
                <Transition name="slide-down">
                  <p v-if="formErrors.lastName" class="error-message">
                    {{ formErrors.lastName }}
                  </p>
                </Transition>
              </div>
            </div>
            <!-- Rest of edit form similar to create -->
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
                @click="updateUser"
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
            <button @click="closeDeleteModal" class="modal-close" aria-label="Yopish">
              ✕
            </button>
          </div>
          <div class="modal-body">
            <p class="delete-warning">
              Haqiqatan ham ushbu foydalanuvchini o'chirmoqchimisiz?
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
                @click="deleteUser"
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
            <button @click="closeMessageModal" class="btn-message-ok">
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

/* ==================== Header ==================== */
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
  font-family: inherit;
}

.back-button:hover {
  background: #667eea;
  color: white;
  transform: translateX(-2px);
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
  transition: all 0.3s;
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

/* ==================== Search & Filters ==================== */
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
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.btn-search {
  padding: 0.875rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-search:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 0.875rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-clear:hover:not(:disabled) {
  background: #dc2626;
}

.filters-box {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
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
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.filter-clear-btn:hover {
  background: #dc2626;
  transform: scale(1.05);
}

.btn-clear-filters {
  padding: 0.875rem 1.5rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
  white-space: nowrap;
}

.btn-clear-filters:hover:not(:disabled) {
  background: #d97706;
  transform: translateY(-2px);
}

/* ==================== Content States ==================== */
.page-content {
  max-width: 1200px;
  margin: 0 auto;
}

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
  to {
    transform: rotate(360deg);
  }
}

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
  color: #ef4444;
  margin-bottom: 1.5rem;
  font-weight: 600;
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
}

.empty-state {
  background: white;
  padding: 4rem 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.empty-state h3 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}

.empty-state p {
  color: #666;
  margin: 0 0 1.5rem 0;
}

.btn-add-first {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-add-first:hover {
  background: #059669;
  transform: translateY(-2px);
}

/* ==================== Table ==================== */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1000px;
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
  white-space: nowrap;
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

.id-cell {
  font-weight: 600;
  color: #667eea;
}

.name-cell {
  min-width: 200px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.middle-name {
  display: block;
  font-size: 0.85rem;
  color: #666;
  font-weight: 400;
  margin-top: 0.25rem;
}

.username-badge {
  font-family: monospace;
  font-weight: 600;
  color: #667eea;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #667eea;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}

.btn-edit,
.btn-delete {
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover {
  background: #d97706;
  transform: translateY(-2px);
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-2px);
}

/* ==================== Pagination ==================== */
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
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.pagination-btn:hover:not(:disabled) {
  background: #5568d3;
  transform: translateY(-2px);
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
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.pagination-number:hover {
  background: #f0f0ff;
}

.pagination-number.active {
  background: #667eea;
  color: white;
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

.modal-xlarge {
  max-width: 750px;
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
  margin-bottom: 1.5rem;
}

.form-group:last-child {
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;
  font-family: inherit;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input:disabled,
.form-select:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
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
  font-weight: 500;
}

.form-divider {
  margin: 1.5rem 0;
  padding: 0.75rem;
  background: #f8f9fa;
  border-left: 4px solid #667eea;
  font-weight: 600;
  color: #667eea;
  border-radius: 4px;
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: inherit;
}

.btn-delete-confirm:hover:not(:disabled) {
  background: #dc2626;
  transform: translateY(-2px);
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

/* Message Modal */
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

/* Username Validation Styles */
.input-with-validation {
  position: relative;
}

.validation-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
}

.validation-icon.checking {
  animation: pulse 1s ease-in-out infinite;
}

.validation-icon.success {
  color: #10b981;
}

.validation-icon.error {
  color: #ef4444;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.form-input.input-success {
  border-color: #10b981;
}

.form-input.input-success:focus {
  box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
}

.validation-message {
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.validation-message.success {
  color: #10b981;
}

.validation-message.error {
  color: #ef4444;
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
@media (max-width: 968px) {
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
    width: 100%;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal {
    width: 95%;
  }

  .pagination {
    flex-direction: column;
  }

  .pagination-numbers {
    flex-wrap: wrap;
    justify-content: center;
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