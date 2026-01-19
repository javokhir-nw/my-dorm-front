<script setup>
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const dormitory = ref(null)
const loading = ref(false)
const error = ref('')

const dormitoryId = route.params.id

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showSuccessModal = ref(false)
const showLeaderModal = ref(false)

function copyTelegramLink(randomString) {
  const telegramLink = `https://t.me/nlw_support_bot?start=${randomString}`

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(telegramLink).then(() => {
        showSuccessMessage('Muvaffaqiyatli!', 'Telegram havolasi nusxalandi')
      })
    } else {
      copyToClipboardFallback(telegramLink)
    }
  } catch (err) {
    copyToClipboardFallback(telegramLink)
  }
}

function copyToClipboardFallback(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  document.body.appendChild(textArea)

  try {
    textArea.select()
    const successful = document.execCommand('copy')

    if (successful) {
      showSuccessMessage('Muvaffaqiyatli!', 'Havolasi nusxalandi')
    }
  } catch (err) {
    showErrorMessage('Xatolik!', 'Nusxalashda xatolik yuz berdi')
  } finally {
    document.body.removeChild(textArea)
  }
}

// Form data - leaderIds array ga o'zgartirdik
const createForm = ref({
  name: '',
  dormId: dormitoryId,
  leaderIds: [], // O'zgardi: bitta ID emas, array
  randomString: ''
})

const editForm = ref({
  id: 0,
  name: '',
  dormId: dormitoryId,
  leaderIds: [], // O'zgardi: bitta ID emas, array
  randomString: ''
})

// Leaders dropdown
const leaders = ref([])
const loadingLeaders = ref(false)
const leaderSearchQuery = ref('')

// Edit modal uchun alohida
const editLeaderSearchQuery = ref('')
const editModalLeaders = ref([])
const editLoadingLeaders = ref(false)

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
const generatingRandomString = ref(false)

// Form validation error
const formError = ref('')

function goBack() {
  router.push('/dormitories')
}

async function fetchDormitoryDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`/api/dorm/get/${dormitoryId}`)
    dormitory.value = response.data
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

function viewFloor(floorId) {
  router.push(`/floor/${floorId}`)
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

async function fetchLeaders(searchQuery = '') {
  loadingLeaders.value = true

  try {
    const response = await axios.post('/api/user/list', {
      page: 0,
      size: 100,
      search: {
        value: searchQuery || '',
        floorId: null,
        dormId: parseInt(dormitoryId)
      }
    })

    leaders.value = response.data.list || []
  } catch (err) {
    console.error('Leaders fetch error:', err)
    leaders.value = []
  } finally {
    loadingLeaders.value = false
  }
}

async function fetchEditModalLeaders(searchQuery = '', floorId = null) {
  editLoadingLeaders.value = true

  try {
    const response = await axios.post('/api/user/list', {
      page: 0,
      size: 100,
      search: {
        value: searchQuery || '',
        floorId: floorId || null,
        dormId: parseInt(dormitoryId)
      }
    })

    editModalLeaders.value = response.data.list || []
  } catch (err) {
    console.error('Edit leaders fetch error:', err)
    editModalLeaders.value = []
  } finally {
    editLoadingLeaders.value = false
  }
}

// ✅ Leader Modal Ochish (Edit) - floorId bilan
async function openLeaderModalForEdit() {
  showLeaderModal.value = true
  editLeaderSearchQuery.value = ''
  await fetchEditModalLeaders('', editForm.value.id)
}

// ✅ Leader Tanlash/O'chirish (Create Modal) - Toggle qilish
function toggleLeader(user) {
  const index = createForm.value.leaderIds.indexOf(user.id)

  if (index > -1) {
    // Agar allaqachon tanlangan bo'lsa, o'chirish
    createForm.value.leaderIds.splice(index, 1)
  } else {
    // Agar tanlanmagan bo'lsa, qo'shish
    createForm.value.leaderIds.push(user.id)
  }
}

// ✅ Leader Tanlash/O'chirish (Edit Modal) - Toggle qilish
function toggleEditLeader(user) {
  const index = editForm.value.leaderIds.indexOf(user.id)

  if (index > -1) {
    // Agar allaqachon tanlangan bo'lsa, o'chirish
    editForm.value.leaderIds.splice(index, 1)
  } else {
    // Agar tanlanmagan bo'lsa, qo'shish
    editForm.value.leaderIds.push(user.id)
  }
}

// ✅ Leader tanlangan yoki yo'qligini tekshirish (Create Modal)
function isLeaderSelected(userId) {
  return createForm.value.leaderIds.includes(userId)
}

// ✅ Leader tanlangan yoki yo'qligini tekshirish (Edit Modal)
function isEditLeaderSelected(userId) {
  return editForm.value.leaderIds.includes(userId)
}

// ✅ Leader Modal Ochish (Create)
async function openLeaderModalForCreate() {
  showLeaderModal.value = true
  leaderSearchQuery.value = ''
  await fetchLeaders()
}

// ✅ Search Leaders (Create Modal)
async function searchLeaders() {
  await fetchLeaders(leaderSearchQuery.value)
}

// ✅ Search Leaders (Edit Modal)
async function searchEditLeaders() {
  await fetchEditModalLeaders(editLeaderSearchQuery.value)
}

// ✅ Clear All Leaders (Create Modal)
function clearAllLeaders() {
  createForm.value.leaderIds = []
}

// ✅ Clear All Leaders (Edit Modal)
function clearAllEditLeaders() {
  editForm.value.leaderIds = []
}

// ✅ Tanlangan leaderlar nomlarini olish (Create Modal)
function getSelectedLeadersNames() {
  if (createForm.value.leaderIds.length === 0) {
    return 'Sardorlar tanlang'
  }

  const selectedLeaders = leaders.value.filter(u => createForm.value.leaderIds.includes(u.id))

  if (selectedLeaders.length === 0) {
    return `${createForm.value.leaderIds.length} ta sardor tanlangan`
  }

  if (selectedLeaders.length === 1) {
    const leader = selectedLeaders[0]
    return `${leader.lastName} ${leader.firstName} ${leader.middleName || ''}`.trim()
  }

  return `${selectedLeaders.length} ta sardor tanlangan`
}

// ✅ Tanlangan leaderlar nomlarini olish (Edit Modal)
function getSelectedEditLeadersNames() {
  if (editForm.value.leaderIds.length === 0) {
    return 'Sardorlar tanlang'
  }

  const selectedLeaders = editModalLeaders.value.filter(u => editForm.value.leaderIds.includes(u.id))

  if (selectedLeaders.length === 0) {
    return `${editForm.value.leaderIds.length} ta sardor tanlangan`
  }

  if (selectedLeaders.length === 1) {
    const leader = selectedLeaders[0]
    return `${leader.lastName} ${leader.firstName} ${leader.middleName || ''}`.trim()
  }

  return `${selectedLeaders.length} ta sardor tanlangan`
}

// ✅ RANDOM STRING GENERATE - CREATE
async function generateRandomStringForCreate() {
  generatingRandomString.value = true

  try {
    const response = await axios.get('/api/util/generate-random-string')
    const randomString = response.data

    createForm.value.randomString = randomString
  } catch (err) {
    console.error('Random string generate error:', err)
    showErrorMessage('Xatolik!', 'Random string yaratishda xatolik yuz berdi')
  } finally {
    generatingRandomString.value = false
  }
}

// ✅ RANDOM STRING GENERATE - EDIT
async function generateRandomStringForEdit() {
  generatingRandomString.value = true

  try {
    const response = await axios.get('/api/util/generate-random-string')
    const randomString = response.data

    editForm.value.randomString = randomString
  } catch (err) {
    console.error('Random string generate error:', err)
    showErrorMessage('Xatolik!', 'Random string yaratishda xatolik yuz berdi')
  } finally {
    generatingRandomString.value = false
  }
}

// ✅ COPY CREATE LINK
function copyCreateLink() {
  const link = `https://t.me/nlw_support_bot?start=${createForm.value.randomString}`

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showSuccessMessage('Muvaffaqiyatli!', 'Havolasi nusxalandi')
      })
    } else {
      copyToClipboardFallback(link)
    }
  } catch (err) {
    copyToClipboardFallback(link)
  }
}

// ✅ COPY EDIT LINK
function copyEditLink() {
  const link = `https://t.me/nlw_support_bot?start=${editForm.value.randomString}`

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showSuccessMessage('Muvaffaqiyatli!', 'Havolasi nusxalandi')
      })
    } else {
      copyToClipboardFallback(link)
    }
  } catch (err) {
    copyToClipboardFallback(link)
  }
}

// Create Floor
function openCreateModal() {
  createForm.value = {
    name: '',
    dormId: dormitoryId,
    leaderIds: [],
    randomString: ''
  }
  formError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  createForm.value = {
    name: '',
    dormId: dormitoryId,
    leaderIds: [],
    randomString: ''
  }
  formError.value = ''
  showLeaderModal.value = false
}

// ✅ Create Floor - leaderIds array yuboriladi
async function createFloor() {
  formError.value = ''

  if (!createForm.value.name.trim()) {
    formError.value = 'Iltimos, qavat nomini kiriting!'
    return
  }

  if (!createForm.value.randomString.trim()) {
    formError.value = 'Iltimos, havolani yarating!'
    return
  }

  createLoading.value = true

  try {
    const response = await axios.post('/api/floor/create', {
      name: createForm.value.name.trim(),
      dormId: parseInt(dormitoryId),
      leaderIds: createForm.value.leaderIds.length > 0 ? createForm.value.leaderIds : null,
      randString: createForm.value.randomString.trim()
    })

    closeCreateModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Qavat muvaffaqiyatli yaratildi')
    fetchDormitoryDetail()
  } catch (err) {
    formError.value = err.message || 'Xatolik yuz berdi!'
  } finally {
    createLoading.value = false
  }
}

// Edit Floor
function openEditModal(floor) {
  // userDtos dan leaderIds ni extract qilish
  const leaderIds = floor.userDtos && floor.userDtos.length > 0
      ? floor.userDtos.map(user => user.id)
      : []

  editForm.value = {
    id: floor.id,
    name: floor.name,
    dormId: dormitoryId,
    leaderIds: leaderIds,
    randomString: floor.randString || ''
  }
  formError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = {
    id: 0,
    name: '',
    dormId: dormitoryId,
    leaderIds: [],
    randomString: ''
  }
  formError.value = ''
  showLeaderModal.value = false
}

// ✅ Update Floor - leaderIds array yuboriladi
async function updateFloor() {
  formError.value = ''

  if (!editForm.value.name.trim()) {
    formError.value = 'Iltimos, qavat nomini kiriting!'
    return
  }

  editLoading.value = true

  try {
    const response = await axios.put('/api/floor/update', {
      id: editForm.value.id,
      name: editForm.value.name.trim(),
      dormId: parseInt(dormitoryId),
      leaderIds: editForm.value.leaderIds.length > 0 ? editForm.value.leaderIds : null,
      randString: editForm.value.randomString
    })

    closeEditModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Qavat muvaffaqiyatli yangilandi')
    fetchDormitoryDetail()
  } catch (err) {
    formError.value = err.message || 'Xatolik yuz berdi!'
  } finally {
    editLoading.value = false
  }
}

// Delete Floor
function openDeleteModal(id) {
  deleteId.value = id
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  deleteId.value = null
}

async function deleteFloor() {
  deleteLoading.value = true

  try {
    const response = await axios.delete(`/api/floor/delete/${deleteId.value}`)

    closeDeleteModal()
    showSuccessMessage('Muvaffaqiyatli!', 'Qavat muvaffaqiyatli o\'chirildi')
    fetchDormitoryDetail()
  } catch (err) {
    closeDeleteModal()
    showErrorMessage('Xatolik!', err.message || 'Xatolik yuz berdi!')
  } finally {
    deleteLoading.value = false
  }
}

onMounted(() => {
  fetchDormitoryDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu/>

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>🏢 Yotoqxona ma'lumotlari</h1>
      </div>
      <button v-if="dormitory" @click="openCreateModal" class="btn-create">+ Qavat qo'shish</button>
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
        <button @click="fetchDormitoryDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Dormitory Detail -->
      <div v-else-if="dormitory" class="detail-content">
        <!-- Main Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="info-icon">🏢</div>
            <div>
              <h2>{{ dormitory.name }}</h2>
            </div>
          </div>

          <div class="info-body">
            <div class="info-row">
              <span class="info-label">Yotoqxona mudiri:</span>
              <span class="info-value">
                {{ dormitory.ownerFirstName }} {{ dormitory.ownerLastName }}
                <span v-if="dormitory.ownerMiddleName">{{ dormitory.ownerMiddleName }}</span>
              </span>
            </div>

            <div class="info-row">
              <span class="info-label">Qavatlar soni:</span>
              <span class="info-value">{{ dormitory.floors?.length || 0 }} ta</span>
            </div>
          </div>
        </div>

        <!-- Floors List -->
        <div class="floors-section">
          <div class="floors-header">
            <h3>Qavatlar</h3>
          </div>

          <div v-if="dormitory.floors && dormitory.floors.length > 0" class="floors-grid">
            <div
                v-for="floor in dormitory.floors"
                :key="floor.id"
                class="floor-card"
            >
              <div class="floor-header">
                <div class="floor-icon">🏢</div>
                <h4>{{ floor.name }}</h4>
              </div>

              <div class="floor-body">
                <!-- Leaders Info -->
                <div class="floor-info-item">
                  <span class="floor-label">Qavat sardorlari:</span>
                  <div class="floor-value">
                    <div v-if="floor.userDtos && floor.userDtos.length > 0" class="leaders-list-display">
                      <div v-for="(leader, index) in floor.userDtos" :key="leader.id" class="leader-display-item">
                        <span class="leader-number">{{ index + 1 }}.</span>
                        <span class="leader-full-name">
                          {{ leader.lastName }} {{ leader.firstName }}
                          <span v-if="leader.middleName">{{ leader.middleName }}</span>
                        </span>
                      </div>
                    </div>
                    <span v-else class="no-data">Tayinlanmagan</span>
                  </div>
                </div>

                <!-- Rooms Count -->
                <div class="floor-info-item" v-if="floor.rooms !== null">
                  <span class="floor-label">Xonalar:</span>
                  <span class="floor-value">{{ floor.rooms?.length || 0 }} ta</span>
                </div>

                <!-- ✅ TELEGRAM LINK - LISTDA -->
                <div class="floor-info-item" v-if="floor.randString">
                  <span class="floor-label">Taklif havolasi:</span>
                  <div class="telegram-link-container">
                    <button
                        @click="copyTelegramLink(floor.randString)"
                        class="btn-copy-link"
                        title="Taklif havolani nusxalash"
                    >
                      📋 Taklif havolasini nusxalash
                    </button>
                  </div>
                </div>
              </div>

              <div class="floor-footer">
                <button @click="viewFloor(floor.id)" class="btn-view-floor">Ko'rish →</button>
                <button @click.stop="openEditModal(floor)" class="btn-edit-floor">✏️</button>
                <button @click.stop="openDeleteModal(floor.id)" class="btn-delete-floor">🗑️</button>
              </div>
            </div>
          </div>

          <div v-else class="empty-floors">
            <div class="empty-icon">📭</div>
            <p>Bu yotoqxonada qavatlar mavjud emas</p>
            <button @click="openCreateModal" class="btn-add-first">+ Birinchi qavatni qo'shish</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== CREATE MODAL ========== -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal">
        <div class="modal-header">
          <h2>🏢 Yangi Qavat Qo'shish</h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <!-- Qavat Nomi -->
          <div class="form-group">
            <label>Qavat nomi *</label>
            <input
                v-model="createForm.name"
                type="text"
                placeholder="Qavat nomini kiriting (masalan: 1-qavat)"
                class="form-input"
                :class="{ 'input-error': formError }"
                @input="formError = ''"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>

          <!-- Leader Tanlash -->
          <div class="form-group">
            <label>Qavat Sardorlari (ixtiyoriy, bir nechta tanlash mumkin)</label>
            <div class="leader-selector">
              <button
                  @click="openLeaderModalForCreate"
                  class="btn-select-leader"
              >
                👥 {{ getSelectedLeadersNames() }}
              </button>
              <button
                  v-if="createForm.leaderIds.length > 0"
                  @click="clearAllLeaders"
                  class="btn-clear-leader"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Qavat Havolasi -->
          <div class="form-group">
            <label>Qavat Taklif Havolasi *</label>
            <div class="random-string-container">
              <input
                  v-model="createForm.randomString"
                  type="text"
                  placeholder="Random string avtomatik yaratiladi"
                  class="form-input"
                  readonly
                  @click="$event.target.select()"
              />
              <button
                  @click="generateRandomStringForCreate"
                  class="btn-regenerate"
                  :disabled="generatingRandomString"
              >
                <span v-if="generatingRandomString">⏳</span>
                <span v-else>🔄 Yaratish</span>
              </button>
            </div>

            <!-- Generated Link Preview -->
            <div v-if="createForm.randomString" class="link-preview">
              <span class="preview-label">Taklif havolasi:</span>
              <div class="telegram-link-preview">
                <span class="link-text">
                  https://t.me/nlw_support_bot?start={{ createForm.randomString }}
                </span>
                <button
                    @click="copyCreateLink"
                    class="btn-copy-preview"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">
            Bekor qilish
          </button>
          <button @click="createFloor" class="btn-submit" :disabled="createLoading || !createForm.randomString">
            <span v-if="createLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========== EDIT MODAL ========== -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal">
        <div class="modal-header">
          <h2>✏️ Qavatni Tahrirlash</h2>
          <button @click="closeEditModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <!-- Qavat Nomi -->
          <div class="form-group">
            <label>Qavat nomi *</label>
            <input
                v-model="editForm.name"
                type="text"
                placeholder="Qavat nomini kiriting"
                class="form-input"
                :class="{ 'input-error': formError }"
                @input="formError = ''"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>

          <!-- Leader Tanlash -->
          <div class="form-group">
            <label>Qavat Sardorlari (ixtiyoriy, bir nechta tanlash mumkin)</label>
            <div class="leader-selector">
              <button
                  @click="openLeaderModalForEdit"
                  class="btn-select-leader"
              >
                👥 {{ getSelectedEditLeadersNames() }}
              </button>
              <button
                  v-if="editForm.leaderIds.length > 0"
                  @click="clearAllEditLeaders"
                  class="btn-clear-leader"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Qavat Havolasi -->
          <div class="form-group">
            <label>Qavat Taklif Havolasi</label>
            <div class="random-string-container">
              <input
                  v-model="editForm.randomString"
                  type="text"
                  placeholder="Random string"
                  class="form-input"
                  readonly
                  @click="$event.target.select()"
              />
              <button
                  @click="generateRandomStringForEdit"
                  class="btn-regenerate"
                  :disabled="generatingRandomString"
              >
                <span v-if="generatingRandomString">⏳</span>
                <span v-else>🔄 Qayta yaratish</span>
              </button>
            </div>

            <!-- Generated Link Preview -->
            <div v-if="editForm.randomString" class="link-preview">
              <span class="preview-label">Taklif havolasi:</span>
              <div class="telegram-link-preview">
                <span class="link-text">
                  https://t.me/nlw_support_bot?start={{ editForm.randomString }}
                </span>
                <button
                    @click="copyEditLink"
                    class="btn-copy-preview"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeEditModal" class="btn-cancel" :disabled="editLoading">
            Bekor qilish
          </button>
          <button @click="updateFloor" class="btn-submit" :disabled="editLoading">
            <span v-if="editLoading">Saqlanmoqda...</span>
            <span v-else>Saqlash</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========== LEADER SELECTION MODAL ========== -->
    <div v-if="showLeaderModal" class="modal-overlay" @click.self="showLeaderModal = false">
      <div class="modal leader-modal">
        <div class="modal-header">
          <h2>👥 Sardorlar Tanlang</h2>
          <button @click="showLeaderModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <!-- Selected Count -->
          <div class="selected-count">
            <span>Tanlangan: <strong>{{ !editForm.id ? createForm.leaderIds.length : editForm.leaderIds.length }}</strong></span>
          </div>

          <!-- Search Input -->
          <div class="leader-search">
            <!-- Create Modal uchun search input -->
            <input
                v-if="!editForm.id"
                v-model="leaderSearchQuery"
                type="text"
                placeholder="Sardorni qidirish (ism, familiya yoki telefon)"
                class="form-input"
                @keyup="searchLeaders()"
            />

            <!-- Edit Modal uchun search input -->
            <input
                v-else
                v-model="editLeaderSearchQuery"
                type="text"
                placeholder="Sardorni qidirish (ism, familiya yoki telefon)"
                class="form-input"
                @keyup="searchEditLeaders()"
            />

            <button
                @click="!editForm.id ? searchLeaders() : searchEditLeaders()"
                class="btn-search"
                :disabled="!editForm.id ? loadingLeaders : editLoadingLeaders"
            >
              🔍
            </button>
          </div>

          <!-- Leaders List -->
          <div class="leaders-list">
            <!-- Loading -->
            <div v-if="!editForm.id ? loadingLeaders : editLoadingLeaders" class="loading-text">
              Yuklanmoqda...
            </div>

            <!-- Empty -->
            <div v-else-if="(!editForm.id ? leaders : editModalLeaders).length === 0" class="empty-leaders">
              Foydalanuvchilar topilmadi
            </div>

            <!-- Leaders List -->
            <div
                v-for="user in (!editForm.id ? leaders : editModalLeaders)"
                :key="user.id"
                class="leader-item"
                :class="{ 'leader-selected': !editForm.id ? isLeaderSelected(user.id) : isEditLeaderSelected(user.id) }"
                @click="!editForm.id ? toggleLeader(user) : toggleEditLeader(user)"
            >
              <div class="leader-info">
                <span class="leader-name">
                  {{ user.lastName }} {{ user.firstName }}
                  <span v-if="user.middleName">{{ user.middleName }}</span>
                </span>
                <span class="leader-phone" v-if="user.phone">{{ user.phone }}</span>
              </div>
              <div class="leader-checkbox">
                <span v-if="!editForm.id ? isLeaderSelected(user.id) : isEditLeaderSelected(user.id)" class="checkmark">✓</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showLeaderModal = false" class="btn-submit">
            Tayyor
          </button>
        </div>
      </div>
    </div>

    <!-- ========== DELETE MODAL ========== -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>🗑️ O'chirishni tasdiqlash</h2>
          <button @click="closeDeleteModal" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <p class="delete-warning">
            Haqiqatan ham ushbu qavatni o'chirmoqchimisiz?
            <br>Bu amal bilan barcha xonalar ham o'chiriladi!
            <br><strong>Bu amalni ortga qaytarib bo'lmaydi!</strong>
          </p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn-cancel" :disabled="deleteLoading">
            Bekor qilish
          </button>
          <button @click="deleteFloor" class="btn-delete-confirm" :disabled="deleteLoading">
            <span v-if="deleteLoading">O'chirilmoqda...</span>
            <span v-else>O'chirish</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ========== SUCCESS/ERROR MODAL ========== -->
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

.floors-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.floors-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.floors-section h3 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.floors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.floor-card {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s;
  overflow: hidden;
}

.floor-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.floor-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.floor-icon {
  font-size: 1.8rem;
}

.floor-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.floor-body {
  padding: 1.5rem;
}

.floor-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.floor-info-item:last-child {
  margin-bottom: 0;
}

.floor-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.floor-value {
  color: #333;
  font-weight: 600;
}

.floor-value.no-data {
  color: #999;
  font-style: italic;
}

.leaders-list-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.leader-display-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

.leader-number {
  color: #667eea;
  font-weight: bold;
  font-size: 0.9rem;
}

.leader-full-name {
  color: #333;
  font-weight: 500;
  font-size: 0.9rem;
}

.telegram-link-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.telegram-link {
  background: #f0f0f0;
  color: #333;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.85rem;
  word-break: break-all;
  flex: 1;
  font-family: monospace;
  min-width: 150px;
}

.btn-copy-link {
  padding: 0.5rem 1rem;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.3s;
}

.btn-copy-link:hover {
  background: #0284c7;
}

.floor-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.5rem;
}

.btn-view-floor {
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

.btn-view-floor:hover {
  background: #5568d3;
}

.btn-edit-floor {
  padding: 0.75rem 1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-edit-floor:hover {
  background: #d97706;
}

.btn-delete-floor {
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-delete-floor:hover {
  background: #dc2626;
}

.empty-floors {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-floors p {
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
  overflow-y: auto;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  margin: auto;
}

.leader-modal {
  max-width: 600px;
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
  flex-shrink: 0;
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
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
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
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

.form-input.input-error {
  border-color: #ef4444;
}

.form-input[readonly] {
  background: #f5f5f5;
  cursor: text;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.leader-selector {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-select-leader {
  flex: 1;
  padding: 0.75rem;
  background: #f0f0f0;
  color: #333;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-align: left;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-select-leader:hover {
  background: #e0e0e0;
  border-color: #667eea;
}

.btn-clear-leader {
  padding: 0.75rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-clear-leader:hover {
  background: #dc2626;
}

.random-string-container {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.random-string-container .form-input {
  flex: 1;
  font-family: monospace;
}

.btn-regenerate {
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  white-space: nowrap;
  font-size: 0.9rem;
  font-family: inherit;
}

.btn-regenerate:hover:not(:disabled) {
  background: #5568d3;
}

.btn-regenerate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.preview-label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.telegram-link-preview {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background: white;
  padding: 0.5rem;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.link-text {
  flex: 1;
  font-size: 0.8rem;
  color: #0ea5e9;
  font-family: monospace;
  word-break: break-all;
}

.btn-copy-preview {
  padding: 0.5rem;
  background: #0ea5e9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  flex-shrink: 0;
  font-family: inherit;
}

.btn-copy-preview:hover {
  background: #0284c7;
}

.selected-count {
  padding: 0.75rem;
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  margin-bottom: 1rem;
  text-align: center;
  color: #0284c7;
}

.selected-count strong {
  color: #0369a1;
  font-size: 1.1rem;
}

.leader-search {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.leader-search .form-input {
  flex: 1;
}

.btn-search {
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-family: inherit;
}

.btn-search:hover:not(:disabled) {
  background: #5568d3;
}

.btn-search:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.leaders-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.loading-text {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.empty-leaders {
  padding: 2rem;
  text-align: center;
  color: #999;
}

.leader-item {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.leader-item:hover {
  background: #f9f9f9;
}

.leader-item.leader-selected {
  background: #eff6ff;
  border-left: 4px solid #0ea5e9;
}

.leader-item:last-child {
  border-bottom: none;
}

.leader-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.leader-name {
  color: #333;
  font-weight: 600;
}

.leader-phone {
  font-size: 0.85rem;
  color: #999;
}

.leader-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.leader-selected .leader-checkbox {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.checkmark {
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
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
  flex-shrink: 0;
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
  font-family: inherit;
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
  font-family: inherit;
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
  font-family: inherit;
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
  font-family: inherit;
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

  .info-header {
    flex-direction: column;
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    gap: 0.5rem;
  }

  .floors-grid {
    grid-template-columns: 1fr;
  }

  .floor-footer {
    flex-wrap: wrap;
  }

  .modal {
    width: 95%;
  }

  .random-string-container {
    flex-direction: column;
  }

  .btn-regenerate {
    width: 100%;
  }

  .telegram-link-container {
    flex-direction: column;
  }

  .btn-copy-link {
    width: 100%;
  }

  .link-preview {
    margin-top: 1rem;
  }

  .telegram-link-preview {
    flex-direction: column;
  }

  .btn-copy-preview {
    width: 100%;
  }
}
</style>