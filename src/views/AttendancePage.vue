<script setup>
import {ref, onMounted, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

const attendances = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

// Search and pagination parameters
const searchQuery = ref('')
const filterDormId = ref(null)
const filterFloorId = ref(null)
const selectedDate = ref(getTodayDate())
const currentPage = ref(1)
const pageSize = ref(10)

// Lists for dropdowns
const dormitories = ref([])
const filterFloors = ref([])

// Loading states
const loadingDorms = ref(false)

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
    const response = await authStore.makeAuthenticatedRequest('http://localhost:8080/api/attendance/list', {
      method: 'POST',
      body: JSON.stringify({
        page: currentPage.value - 1,
        size: pageSize.value,
        search: {
          value: searchQuery.value || null,
          dormId: filterDormId.value,
          floorId: filterFloorId.value,
          date: selectedDate.value
        }
      })
    })

    if (!response.ok) {
      throw new Error('Davomat ma\'lumotlarini yuklashda xatolik')
    }

    const data = await response.json()
    attendances.value = data.list || []
    total.value = data.total || 0
    totalPages.value = data.totalPages || Math.ceil(total.value / pageSize.value)
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

async function fetchDormitories() {
  loadingDorms.value = true

  try {
    const response = await authStore.makeAuthenticatedRequest('http://localhost:8080/api/dorm/list', {
      method: 'POST',
      body: JSON.stringify({
        page: 0,
        size: 100,
        search: {
          value: null
        }
      })
    })

    if (!response.ok) {
      throw new Error('Yotoqxonalarni yuklashda xatolik')
    }

    const data = await response.json()
    dormitories.value = data.list || []
  } catch (err) {
    console.error('Dormitories fetch error:', err)
  } finally {
    loadingDorms.value = false
  }
}

async function fetchFloors(dormId) {
  if (!dormId) {
    filterFloors.value = []
    filterFloorId.value = null
    return
  }

  try {
    const response = await authStore.makeAuthenticatedRequest(
        `http://localhost:8080/api/floor/list/${dormId}`,
        {
          method: 'POST',
          body: JSON.stringify({
            page: 0,
            size: 1000,
            search: {
              value: null
            }
          })
        }
    )

    if (!response.ok) {
      throw new Error('Qavatlarni yuklashda xatolik')
    }

    const data = await response.json()
    filterFloors.value = data.list || []
  } catch (err) {
    console.error('Floors fetch error:', err)
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

// Watchers for filters
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
    <SideMenu/>

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>📋 Davomat</h1>
      </div>
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
          <label class="filter-label">📅 Sana:</label>
          <input
              v-model="selectedDate"
              type="date"
              class="date-input"
          />
        </div>

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

        <button
            v-if="filterDormId || filterFloorId || selectedDate !== getTodayDate()"
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
        <button @click="fetchAttendances" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="attendances.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Davomat ma'lumotlari topilmadi</h3>
        <p v-if="searchQuery || filterDormId || filterFloorId || selectedDate !== getTodayDate()">
          Filter bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday davomat ma'lumoti yo'q</p>
      </div>

      <!-- Attendances Table -->
      <div v-else class="table-container">
        <table class="attendances-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Yotoqxona</th>
            <th>Qavat</th>
            <th>Sana</th>
            <th>Amallar</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="attendance in attendances" :key="attendance.id">
            <td>{{ attendance.id }}</td>
            <td class="dorm-name-cell">{{ attendance.dormName }}</td>
            <td>{{ attendance.floorName }}</td>
            <td class="date-cell">📅 {{ attendance.createdDate }}</td>
            <td class="actions-cell">
              <button @click="viewAttendanceDetail(attendance.id)" class="btn-view-detail">
                👁️ Ko'rish
              </button>
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

/* Search and Filters */
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
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.filter-label {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.date-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s;
}

.date-input:focus {
  outline: none;
  border-color: #667eea;
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

/* Loading */
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
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Error */
.error-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.error-card p {
  color: #ff4757;
  margin-bottom: 1rem;
  font-weight: 600;
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
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #666;
  font-size: 1rem;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.attendances-table {
  width: 100%;
  border-collapse: collapse;
}

.attendances-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.attendances-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
}

.attendances-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.attendances-table tbody tr:hover {
  background: #f8f9fa;
}

.attendances-table td {
  padding: 1rem;
  font-size: 0.95rem;
}

.dorm-name-cell {
  font-weight: 600;
  color: #333;
}

.date-cell {
  color: #667eea;
  font-weight: 600;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.btn-view-detail {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view-detail:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* Pagination */
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
  flex-wrap: wrap;
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
  transform: translateY(-2px);
}

.pagination-number.active {
  background: #667eea;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* Responsive */
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

  .page-header h1 {
    font-size: 1.5rem;
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

  .attendances-table {
    min-width: 600px;
  }

  .pagination {
    flex-direction: column;
  }

  .pagination-numbers {
    justify-content: center;
  }
}
</style>