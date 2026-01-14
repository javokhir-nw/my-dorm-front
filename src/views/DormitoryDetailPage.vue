<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
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

// Form data
const createForm = ref({
  name: '',
  dormId: dormitoryId,
  leaderId: null
})

const editForm = ref({
  id: 0,
  name: '',
  dormId: dormitoryId,
  leaderId: null,
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

// Modal context (determines which modal is using the leader selector)
const leaderModalContext = ref('create') // 'create' or 'edit'

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

// ✅ Leaders Fetch Qilish (Create Modal)
async function fetchLeaders(searchQuery = '') {
  loadingLeaders.value = true

  try {
    const response = await axios.post('/api/user/list', {
      page: 0,
      size: 100,
      search: {
        value: searchQuery || '',
        floorId: 0
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

// ✅ Leaders Fetch Qilish (Edit Modal)
async function fetchEditModalLeaders(searchQuery = '') {
  editLoadingLeaders.value = true

  try {
    const response = await axios.post('/api/user/list', {
      page: 0,
      size: 100,
      search: {
        value: searchQuery || '',
        floorId: 0
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

// ✅ Leader Tanlash (Create Modal)
function selectLeader(user) {
  createForm.value.leaderId = user.id
  showLeaderModal.value = false
  leaderSearchQuery.value = ''
  leaders.value = []
}

// ✅ Leader Tanlash (Edit Modal)
function selectEditLeader(user) {
  editForm.value.leaderId = user.id
  showLeaderModal.value = false
  editLeaderSearchQuery.value = ''
  editModalLeaders.value = []
}

// ✅ Leader Modal Ochish (Create)
async function openLeaderModalForCreate() {
  leaderModalContext.value = 'create'
  showLeaderModal.value = true
  leaderSearchQuery.value = ''
  await fetchLeaders()
}

// ✅ Leader Modal Ochish (Edit)
async function openLeaderModalForEdit() {
  leaderModalContext.value = 'edit'
  showLeaderModal.value = true
  editLeaderSearchQuery.value = ''
  await fetchEditModalLeaders()
}

// ✅ Search Leaders (Create Modal)
async function searchLeaders() {
  await fetchLeaders(leaderSearchQuery.value)
}

// ✅ Search Leaders (Edit Modal)
async function searchEditLeaders() {
  await fetchEditModalLeaders(editLeaderSearchQuery.value)
}

// ✅ Clear Leader (Create Modal)
function clearLeader() {
  createForm.value.leaderId = null
}

// ✅ Clear Leader (Edit Modal)
function clearEditLeader() {
  editForm.value.leaderId = null
}

// Get selected leader name (Create Modal)
function getSelectedLeaderName() {
  if (!createForm.value.leaderId) return 'Rahbari tanlang'

  const leader = leaders.value.find(u => u.id === createForm.value.leaderId)
  if (leader) {
    return `${leader.lastName} ${leader.firstName} ${leader.middleName || ''}`.trim()
  }
  return 'Rahbari tanlang'
}

// Get selected leader name (Edit Modal)
function getSelectedEditLeaderName() {
  if (!editForm.value.leaderId) return 'Rahbari tanlang'

  const leader = editModalLeaders.value.find(u => u.id === editForm.value.leaderId)
  if (leader) {
    return `${leader.lastName} ${leader.firstName} ${leader.middleName || ''}`.trim()
  }
  return 'Rahbari tanlang'
}

// Create Floor
function openCreateModal() {
  createForm.value = {
    name: '',
    dormId: dormitoryId,
    leaderId: null
  }
  formError.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
  createForm.value = {
    name: '',
    dormId: dormitoryId,
    leaderId: null
  }
  formError.value = ''
  showLeaderModal.value = false
}

// ✅ Create Floor bilan leaderId
async function createFloor() {
  formError.value = ''

  if (!createForm.value.name.trim()) {
    formError.value = 'Iltimos, qavat nomini kiriting!'
    return
  }

  createLoading.value = true

  try {
    const response = await axios.post('/api/floor/create', {
      name: createForm.value.name.trim(),
      dormId: parseInt(dormitoryId),
      leaderId: createForm.value.leaderId
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
  editForm.value = {
    id: floor.id,
    name: floor.name,
    dormId: dormitoryId,
    leaderId: floor.leaderId || null,
    randomString: floor.randomString || ''
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
    leaderId: null,
    randomString: ''
  }
  formError.value = ''
  showLeaderModal.value = false
}

// ✅ Update Floor bilan leaderId
async function updateFloor() {
  formError.value = ''

  if (!editForm.value.name.trim()) {
    formError.value = 'Iltimos, qavat nomini kiriting!'
    return
  }

  editLoading.value = true

  try {
    const response = await axios.post('/api/floor/update', {
      id: editForm.value.id,
      name: editForm.value.name.trim(),
      dormId: parseInt(dormitoryId),
      leaderId: editForm.value.leaderId,
      randomString: editForm.value.randomString
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

// Telegram Link Copy
async function copyTelegramLink(randomString) {
  const telegramLink = `https://t.me/nlw_support_bot?start=${randomString}`

  try {
    // Modern browsers uchun
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(telegramLink)
      showSuccessMessage('Muvaffaqiyatli!', 'Telegram havolasi nusxalandi')
    } else {
      // Older browsers va mobile uchun fallback
      copyToClipboardFallback(telegramLink)
    }
  } catch (err) {
    console.error('Copy error:', err)
    // Agar clipboard fail bo'lsa fallback
    copyToClipboardFallback(telegramLink)
  }
}

// Telegram Link Share (Web Share API)
async function shareTelegramLink(randomString) {
  const telegramLink = `https://t.me/nlw_support_bot?start=${randomString}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Qavat Taklifi',
        text: 'Bu qavatga qo\'shilish uchun havolani bosing',
        url: telegramLink
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err)
        showErrorMessage('Xatolik!', 'Ulashishda xatolik yuz berdi')
      }
    }
  } else {
    // Fallback: copy to clipboard agar Web Share API mavjud bo'lmasa
    copyTelegramLink(randomString)
  }
}

// Fallback method - barcha devicelarda ishlaydi
function copyToClipboardFallback(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)

  try {
    textArea.select()
    const successful = document.execCommand('copy')

    if (successful) {
      showSuccessMessage('Muvaffaqiyatli!', 'Telegram havolasi nusxalandi')
    } else {
      showErrorMessage('Xatolik!', 'Nusxalashda xatolik yuz berdi')
    }
  } catch (err) {
    showErrorMessage('Xatolik!', 'Nusxalashda xatolik yuz berdi')
  } finally {
    document.body.removeChild(textArea)
  }
}

onMounted(() => {
  fetchDormitoryDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button" aria-label="Orqaga qaytish">← Orqaga</button>
        <h1>🏢 Yotoqxona ma'lumotlari</h1>
      </div>
      <button v-if="dormitory" @click="openCreateModal" class="btn-create">+ Qavat qo'shish</button>
    </div>

    <div class="page-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="fetchDormitoryDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <div v-else-if="dormitory" class="detail-content">
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
                <!-- Telegram Link Section -->
                <div class="floor-info-item" v-if="floor.randomString">
                  <span class="floor-label">Taklif havolasi:</span>
                  <div class="telegram-link-container">
                    <span class="telegram-link">
                      https://t.me/nlw_support_bot?start={{ floor.randomString }}
                    </span>
                    <div class="link-buttons">
                      <button
                          @click="copyTelegramLink(floor.randomString)"
                          class="btn-copy-link"
                          aria-label="Havolani nusxalash"
                          title="Havolani nusxalash"
                      >
                        📋 Nusxalash
                      </button>
                      <button
                          @click="shareTelegramLink(floor.randomString)"
                          class="btn-share-link"
                          aria-label="Havolani ulashish"
                          title="Havolani ulashish"
                      >
                        📤 Ulashish
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Rooms Count Section -->
                <div class="floor-info-item" v-if="floor.rooms !== null">
                  <span class="floor-label">Xonalar:</span>
                  <span class="floor-value">{{ floor.rooms?.length || 0 }} ta</span>
                </div>

                <!-- Leader Info Section -->
                <div class="floor-info-item" v-if="floor.leaderId">
                  <span class="floor-label">Qavat Rahbari:</span>
                  <span class="floor-value">{{ floor.leaderName || 'Belgilanmagan' }}</span>
                </div>
              </div>

              <div class="floor-footer">
                <button @click="viewFloor(floor.id)" class="btn-view-floor">Ko'rish →</button>
                <button
                    @click.stop="openEditModal(floor)"
                    class="btn-edit-floor"
                    aria-label="Qavatni tahrirlash"
                >
                  ✏️
                </button>
                <button
                    @click.stop="openDeleteModal(floor.id)"
                    class="btn-delete-floor"
                    aria-label="Qavatni o'chirish"
                >
                  🗑️
                </button>
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

    <!-- Create Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal">
        <div class="modal-header">
          <h2>🏢 Yangi Qavat Qo'shish</h2>
          <button @click="closeCreateModal" class="modal-close" aria-label="Modalni yopish">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="create-floor-name">Qavat nomi *</label>
            <input
                id="create-floor-name"
                v-model="createForm.name"
                type="text"
                placeholder="Qavat nomini kiriting (masalan: 1-qavat)"
                class="form-input"
                :class="{ 'input-error': formError }"
                @keyup.enter="createFloor"
                @input="formError = ''"
                aria-label="Qavat nomi"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>

          <!-- Leader Selection -->
          <div class="form-group">
            <label for="create-leader-select">Qavat Rahbari</label>
            <div class="leader-selector">
              <button
                  id="create-leader-select"
                  @click="openLeaderModalForCreate"
                  class="btn-select-leader"
                  aria-label="Rahbarni tanlang"
              >
                👤 {{ getSelectedLeaderName() }}
              </button>
              <button
                  v-if="createForm.leaderId"
                  @click="clearLeader"
                  class="btn-clear-leader"
                  aria-label="Rahbari o'chirish"
                  title="Rahbari o'chirish"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">
            Bekor qilish
          </button>
          <button @click="createFloor" class="btn-submit" :disabled="createLoading">
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
          <h2>✏️ Qavatni Tahrirlash</h2>
          <button @click="closeEditModal" class="modal-close" aria-label="Modalni yopish">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="edit-floor-name">Qavat nomi *</label>
            <input
                id="edit-floor-name"
                v-model="editForm.name"
                type="text"
                placeholder="Qavat nomini kiriting"
                class="form-input"
                :class="{ 'input-error': formError }"
                @keyup.enter="updateFloor"
                @input="formError = ''"
                aria-label="Qavat nomi"
            />
            <p v-if="formError" class="error-message">{{ formError }}</p>
          </div>

          <!-- Leader Selection (Edit Modal) -->
          <div class="form-group">
            <label for="edit-leader-select">Qavat Rahbari</label>
            <div class="leader-selector">
              <button
                  id="edit-leader-select"
                  @click="openLeaderModalForEdit"
                  class="btn-select-leader"
                  aria-label="Rahbarni tanlang"
              >
                👤 {{ getSelectedEditLeaderName() }}
              </button>
              <button
                  v-if="editForm.leaderId"
                  @click="clearEditLeader"
                  class="btn-clear-leader"
                  aria-label="Rahbari o'chirish"
                  title="Rahbari o'chirish"
              >
                ✕
              </button>
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

    <!-- Leader Selection Modal -->
    <div v-if="showLeaderModal" class="modal-overlay" @click.self="showLeaderModal = false">
      <div class="modal leader-modal">
        <div class="modal-header">
          <h2>👤 Rahbarni Tanlang</h2>
          <button @click="showLeaderModal = false" class="modal-close" aria-label="Modalni yopish">✕</button>
        </div>
        <div class="modal-body">
          <!-- Search Input -->
          <div class="leader-search">
            <input
                type="text"
                :value="leaderModalContext === 'create' ? leaderSearchQuery : editLeaderSearchQuery"
                @input="leaderModalContext === 'create' ? leaderSearchQuery = $event.target.value : editLeaderSearchQuery = $event.target.value"
                placeholder="Rahbari qidirish (ism, familiya yoki telefon)"
                class="form-input"
                @keyup.enter="leaderModalContext === 'create' ? searchLeaders() : searchEditLeaders()"
                aria-label="Rahbari qidirish"
            />
            <button
                @click="leaderModalContext === 'create' ? searchLeaders() : searchEditLeaders()"
                class="btn-search"
                :disabled="leaderModalContext === 'create' ? loadingLeaders : editLoadingLeaders"
                aria-label="Qidirish"
            >
              🔍
            </button>
          </div>

          <!-- Leaders List -->
          <div class="leaders-list">
            <div v-if="leaderModalContext === 'create' ? loadingLeaders : editLoadingLeaders" class="loading-text">
              Yuklanmoqda...
            </div>

            <div v-else-if="(leaderModalContext === 'create' ? leaders : editModalLeaders).length === 0" class="empty-leaders">
              Foydalanuvchilar topilmadi
            </div>

            <div
                v-for="user in (leaderModalContext === 'create' ? leaders : editModalLeaders)"
                :key="user.id"
                class="leader-item"
                @click="leaderModalContext === 'create' ? selectLeader(user) : selectEditLeader(user)"
                :aria-label="`${user.lastName} ${user.firstName} ni tanlang`"
                role="button"
                tabindex="0"
                @keydown.enter="leaderModalContext === 'create' ? selectLeader(user) : selectEditLeader(user)"
            >
              <div class="leader-info">
                <span class="leader-name">
                  {{ user.lastName }} {{ user.firstName }}
                  <span v-if="user.middleName">{{ user.middleName }}</span>
                </span>
                <span class="leader-phone" v-if="user.phone">{{ user.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="closeDeleteModal">
      <div class="modal modal-small">
        <div class="modal-header">
          <h2>🗑️ O'chirishni tasdiqlash</h2>
          <button @click="closeDeleteModal" class="modal-close" aria-label="Modalni yopish">✕</button>
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

.telegram-link-container {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
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
  min-width: 200px;
}

.link-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-copy-link {
  padding: 0.5rem 0.75rem;
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

.btn-share-link {
  padding: 0.5rem 0.75rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: all 0.3s;
  display: none;
}

/* Share button faqat mobile-da ko'rinadi */
@media (max-width: 768px) {
  .btn-share-link {
    display: block;
  }

  .telegram-link-container {
    flex-direction: column;
  }

  .telegram-link {
    width: 100%;
    min-width: auto;
  }
}

.btn-share-link:hover {
  background: #059669;
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
}

.btn-clear-leader:hover {
  background: #dc2626;
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
}

.leader-item:hover {
  background: #f9f9f9;
}

.leader-item:last-child {
  border-bottom: none;
}

.leader-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.leader-name {
  color: #333;
  font-weight: 600;
}

.leader-phone {
  font-size: 0.85rem;
  color: #999;
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
    margin: 1rem;
  }

  .telegram-link-container {
    flex-direction: column;
  }

  .btn-copy-link,
  .btn-share-link {
    width: 100%;
  }
}
</style>