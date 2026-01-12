<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import api from "../api/api.js"

const router = useRouter()
const authStore = useAuthStore()

const attendances = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

// Search and pagination
const searchQuery = ref('')
const filterDormId = ref(null)
const filterFloorId = ref(null)
const selectedDate = ref(getTodayDate())
const currentPage = ref(1)
const pageSize = ref(10)

// Dropdown lists
const dormitories = ref([])
const filterFloors = ref([])
const loadingDorms = ref(false)
const loadingFloors = ref(false)

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function goBack() {
  router.push('/dashboard')
}

function viewAttendanceDetail(attendanceId) {
  router.push(`/attendance/${attendanceId}`)
}

async function fetchAttendances() {
  loading.value = true
  error.value = ''

  try {
    const response = await api.post('/attendance/list', {
      page: currentPage.value - 1,
      size: pageSize.value,
      search: {
        value: searchQuery.value || null,
        dormId: filterDormId.value,
        floorId: filterFloorId.value,
        date: selectedDate.value
      }
    })

    const data = response.data
    console.log(data)
    attendances.value = data.list || []
    console.log(data.list)
    total.value = data.totalElements || 0
    totalPages.value = data.totalPages || 0
  } catch (err) {
    if (err.response?.status === 401) {
      error.value = 'Unauthorized - Session expired'
      authStore.logout()
    } else {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

async function fetchDormitories() {
  loadingDorms.value = true

  try {
    const response = await api.post('/dorm/list', {
      page: 0,
      size: 100,
      search: { value: null }
    })

    const data = response.data
    dormitories.value = data.content || []
  } catch (err) {
    console.error('Failed to fetch dormitories:', err)
  } finally {
    loadingDorms.value = false
  }
}

async function fetchFloors(dormId) {
  if (!dormId) return

  loadingFloors.value = true

  try {
    const response = await api.post(`/floor/list/${dormId}`, {
      page: 0,
      size: 1000,
      search: { value: null }
    })

    const data = response.data
    filterFloors.value = data.content || []
  } catch (err) {
    console.error('Failed to fetch floors:', err)
    filterFloors.value = []
  } finally {
    loadingFloors.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchAttendances()
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  fetchAttendances()
}

function clearFilters() {
  filterDormId.value = null
  filterFloorId.value = null
  filterFloors.value = []
  selectedDate.value = getTodayDate()
  currentPage.value = 1
  fetchAttendances()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchAttendances()
  }
}

// Watchers
watch(() => filterDormId.value, (newVal) => {
  filterFloorId.value = null
  filterFloors.value = []
  if (newVal) {
    fetchFloors(newVal)
  }
  currentPage.value = 1
  fetchAttendances()
})

watch(() => filterFloorId.value, () => {
  currentPage.value = 1
  fetchAttendances()
})

watch(() => selectedDate.value, () => {
  currentPage.value = 1
  fetchAttendances()
})

onMounted(() => {
  fetchAttendances()
  fetchDormitories()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-content">
        <button @click="goBack" class="back-btn">
          <span>←</span>
          Orqaga
        </button>
        <h1>📋 Davomat ro'yxati</h1>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- Search & Filters -->
      <div class="filters-section">
        <div class="search-bar">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="🔍 Qidirish..."
              @keyup.enter="handleSearch"
              class="search-input"
          />
          <button @click="handleSearch" class="btn-primary" :disabled="loading">
            Qidirish
          </button>
          <button v-if="searchQuery" @click="clearSearch" class="btn-clear" :disabled="loading">
            ✕
          </button>
        </div>

        <div class="filters-grid">
          <div class="filter-item">
            <label>📅 Sana</label>
            <input v-model="selectedDate" type="date" class="input-date" />
          </div>

          <div class="filter-item">
            <label>🏢 Yotoqxona</label>
            <div class="select-wrapper">
              <select v-model="filterDormId" class="select-input">
                <option :value="null">Barchasi</option>
                <option v-for="dorm in dormitories" :key="dorm.id" :value="dorm.id">
                  {{ dorm.name }}
                </option>
              </select>
              <button v-if="filterDormId" @click="filterDormId = null" class="clear-icon">✕</button>
            </div>
          </div>

          <div class="filter-item">
            <label>📊 Qavat</label>
            <div class="select-wrapper">
              <select v-model="filterFloorId" class="select-input" :disabled="!filterDormId">
                <option :value="null">Barchasi</option>
                <option v-for="floor in filterFloors" :key="floor.id" :value="floor.id">
                  {{ floor.name }}
                </option>
              </select>
              <button v-if="filterFloorId" @click="filterFloorId = null" class="clear-icon">✕</button>
            </div>
          </div>

          <button
              v-if="filterDormId || filterFloorId || selectedDate !== getTodayDate()"
              @click="clearFilters"
              class="btn-reset"
          >
            🔄 Tozalash
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="state-card">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="state-card error">
        <p>❌ {{ error }}</p>
        <button @click="fetchAttendances" class="btn-primary">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="attendances.length === 0" class="state-card">
        <div class="empty-icon">📋</div>
        <h3>Ma'lumot topilmadi</h3>
        <p v-if="searchQuery || filterDormId || filterFloorId || selectedDate !== getTodayDate()">
          Filter shartlariga mos natija yo'q
        </p>
        <p v-else>Hozircha davomat ma'lumotlari mavjud emas</p>
      </div>

      <!-- Attendances Table -->
      <div v-else class="table-wrapper">
        <div class="table-card">
          <table class="data-table">
            <thead>
            <tr>
              <th>ID</th>
              <th>Yotoqxona</th>
              <th>Qavat</th>
              <th>Sana</th>
              <th class="text-center">Amallar</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="attendance in attendances" :key="attendance.id">
              <td class="id-cell">#{{ attendance.id }}</td>
              <td class="bold-cell">{{ attendance.dormName }}</td>
              <td>{{ attendance.floorName }}</td>
              <td class="date-cell">
                <span class="date-badge">📅 {{ attendance.createdDate }}</span>
              </td>
              <td class="text-center">
                <button @click="viewAttendanceDetail(attendance.id)" class="btn-view">
                  👁️ Ko'rish
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

          <div class="pagination-pages">
            <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="['page-btn', { active: page === currentPage }]"
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
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 1.5rem;
}

.page-header {
  max-width: 1400px;
  margin: 0 auto 2rem;
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f8f9fa;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  color: #495057;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #667eea;
  color: white;
  transform: translateX(-3px);
}

.back-btn span {
  font-size: 1.2rem;
}

.page-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: #2d3748;
  font-weight: 700;
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Filters Section */
.filters-section {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.search-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-primary {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-clear {
  padding: 0.875rem 1.25rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.btn-clear:hover:not(:disabled) {
  background: #dc2626;
  transform: scale(1.05);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-item label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
}

.input-date,
.select-input {
  padding: 0.875rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  background: white;
  transition: all 0.2s;
}

.input-date:focus,
.select-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.select-input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.select-wrapper .select-input {
  flex: 1;
  padding-right: 2.5rem;
}

.clear-icon {
  position: absolute;
  right: 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.clear-icon:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.btn-reset {
  padding: 0.875rem 1.5rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-reset:hover {
  background: #d97706;
  transform: translateY(-2px);
}

/* State Cards */
.state-card {
  background: white;
  padding: 4rem 2rem;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.state-card.error p {
  color: #ef4444;
  font-weight: 600;
  margin-bottom: 1.5rem;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1.5rem;
  border: 4px solid #e9ecef;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.state-card h3 {
  color: #2d3748;
  margin-bottom: 0.75rem;
  font-size: 1.5rem;
}

.state-card p {
  color: #718096;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

/* Table */
.table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.table-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.data-table th {
  padding: 1.25rem 1.5rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

.data-table tbody tr {
  border-bottom: 1px solid #f1f3f5;
  transition: all 0.2s;
}

.data-table tbody tr:hover {
  background: #f8f9fa;
}

.data-table td {
  padding: 1.25rem 1.5rem;
  font-size: 0.95rem;
  color: #495057;
}

.id-cell {
  font-weight: 600;
  color: #6c757d;
}

.bold-cell {
  font-weight: 600;
  color: #2d3748;
}

.date-cell {
  color: #667eea;
}

.date-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: #e0e7ff;
  color: #667eea;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.875rem;
}

.text-center {
  text-align: center;
}

.btn-view {
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-view:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* Pagination */
.pagination {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #adb5bd;
}

.pagination-pages {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.625rem 1rem;
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 45px;
}

.page-btn:hover {
  background: #f0f4ff;
  transform: translateY(-2px);
}

.page-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Responsive */
@media (max-width: 968px) {
  .page-container {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-header h1 {
    font-size: 1.5rem;
  }

  .search-bar {
    flex-direction: column;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .table-card {
    overflow-x: auto;
  }

  .data-table {
    min-width: 600px;
  }

  .pagination {
    flex-direction: column;
  }
}
</style>