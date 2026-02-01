<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()

const duties = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

/** Filters + pagination */
const filterDormId = ref(null)
const filterFloorId = ref(null)
const selectedDate = ref(getTodayDateISO()) // YYYY-MM-DD
const currentPage = ref(1) // UI: 1-based
const pageSize = ref(10)

/** Dropdown lists */
const dormitories = ref([])
const filterFloors = ref([])
const loadingDorms = ref(false)
const loadingFloors = ref(false)

function goBack() {
  router.push('/dashboard')
}

function viewDutyDetail(dutyId) {
  router.push(`/duty/${dutyId}`)
}

/** YYYY-MM-DD (date input uchun) */
function getTodayDateISO() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** YYYY-MM-DD -> DD-MM-YYYY (API format) */
function toDDMMYYYY(isoDate) {
  if (!isoDate) return null
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return null
  return `${d}-${m}-${y}`
}

/** ===== API CALLS ===== */
async function fetchDuties() {
  loading.value = true
  error.value = ''

  try {
    const payload = {
      size: pageSize.value,
      page: currentPage.value - 1,
      search: {
        dormId: filterDormId.value,
        floorId: filterFloorId.value,
        date: toDDMMYYYY(selectedDate.value)
      }
    }

    const response = await axios.post('/api/duty/list', payload)

    duties.value = response.data.list || []
    total.value = response.data.total || 0
    totalPages.value =
        response.data.totalPages || Math.ceil((total.value || 0) / pageSize.value)
  } catch (err) {
    if (err?.message !== 'Unauthorized - Session expired') {
      error.value = err?.message || "Server bilan bog'lanishda xatolik!"
    }
  } finally {
    loading.value = false
  }
}

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

async function fetchFloors(dormId) {
  if (!dormId) {
    filterFloors.value = []
    filterFloorId.value = null
    return
  }

  loadingFloors.value = true
  try {
    const response = await axios.post(`/api/floor/list/${dormId}`, {
      page: 0,
      size: 1000,
      search: { value: null }
    })
    filterFloors.value = response.data.list || []
  } catch (err) {
    console.error('Floors fetch error:', err)
  } finally {
    loadingFloors.value = false
  }
}

function clearFilters() {
  filterDormId.value = null
  filterFloorId.value = null
  filterFloors.value = []
  selectedDate.value = getTodayDateISO()
  currentPage.value = 1
  fetchDuties()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchDuties()
  }
}

/** ===== WATCHERS ===== */
watch(
    () => filterDormId.value,
    (newVal) => {
      filterFloorId.value = null
      filterFloors.value = []
      if (newVal) fetchFloors(newVal)
      currentPage.value = 1
      fetchDuties()
    }
)

watch(
    () => filterFloorId.value,
    () => {
      currentPage.value = 1
      fetchDuties()
    }
)

watch(
    () => selectedDate.value,
    () => {
      currentPage.value = 1
      fetchDuties()
    }
)

onMounted(() => {
  fetchDormitories()
  fetchDuties()
})

/** ===== UI FIELD MAPPERS ===== */
function getDormitoryName(duty) {
  return duty?.dormitoryName || duty?.dormName || '—'
}

function getFloorName(duty) {
  return duty?.floorName || duty?.floor || '—'
}

function getDutyDateLabel(duty) {
  return duty?.date || duty?.dutyDate || toDDMMYYYY(selectedDate.value) || '—'
}

function getAuthorName(duty) {
  // creatorLastName creatorFirstName creatorMiddleName
  return [duty?.creatorLastName, duty?.creatorFirstName, duty?.creatorMiddleName]
      .filter(Boolean)
      .join(' ') || '—'
}
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button" title="Orqaga">
          <svg
              class="btn-svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
            <path d="M9 12h12" />
          </svg>
          Orqaga
        </button>

        <div class="page-title">
          <span class="page-title__icon" aria-hidden="true">
            <!-- Professional shield icon -->
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"></path>
              <path d="M9.5 12l1.7 1.7L14.8 10"></path>
            </svg>
          </span>
          <h1>Navbatchilik</h1>
        </div>
      </div>
    </div>

    <!-- Filters (Search yo‘q) -->
    <div class="search-container">
      <div class="filters-box">
        <div class="filter-group">
          <label class="filter-label">Sana</label>
          <input v-model="selectedDate" type="date" class="date-input" />
        </div>

        <div class="filter-group">
          <label class="filter-label">Yotoqxona</label>
          <div class="select-wrap">
            <select v-model="filterDormId" class="filter-select" :disabled="loadingDorms">
              <option :value="null" disabled hidden>Tanlang</option>
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
        </div>

        <div class="filter-group">
          <label class="filter-label">Qavat</label>
          <div class="select-wrap">
            <select
                v-model="filterFloorId"
                class="filter-select"
                :disabled="!filterDormId || loadingFloors"
            >
              <option :value="null" disabled hidden>Tanlang</option>
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
        </div>

        <button
            v-if="filterDormId || filterFloorId || selectedDate !== getTodayDateISO()"
            @click="clearFilters"
            class="btn-clear-filters"
        >
          Tozalash
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
        <button @click="fetchDuties" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty -->
      <div v-else-if="duties.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"></path>
          </svg>
        </div>
        <h3>Ma’lumot topilmadi</h3>
        <p>Tanlangan filterlar bo‘yicha natija yo‘q</p>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table class="duties-table">
          <thead>
          <tr>
            <th>ID</th>
            <th>Yotoqxona</th>
            <th>Qavat</th>
            <th>Sana</th>
            <th>Muallif</th>
            <th class="actions-th"></th>
          </tr>
          </thead>

          <tbody>
          <tr v-for="duty in duties" :key="duty.id">
            <td>{{ duty.id }}</td>
            <td class="strong-cell">{{ getDormitoryName(duty) }}</td>
            <td>{{ getFloorName(duty) }}</td>
            <td class="date-cell">
              <span class="date-badge">
                <svg class="mini-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                  <path d="M16 2v4"></path>
                  <path d="M8 2v4"></path>
                  <path d="M3 10h18"></path>
                </svg>
                {{ getDutyDateLabel(duty) }}
              </span>
            </td>
            <td>{{ getAuthorName(duty) }}</td>

            <!-- ✅ o‘ng burchak: ko‘zcha -->
            <td class="actions-cell">
              <button @click="viewDutyDetail(duty.id)" class="btn-eye" title="Ko‘rish">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
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
  padding-left: 5.5rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: white;
  padding: 0.9rem 1.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0,0,0,0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.page-title__icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  padding: 0.35rem;
  flex-shrink: 0;
}

.page-title__icon svg {
  width: 16px;
  height: 16px;
}

.page-title h1 {
  margin: 0;
  color: #111827;
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1;
}

.btn-svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.back-button {
  padding: 0.45rem 0.9rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  font-size: 0.85rem;
  color: #4f46e5;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.back-button:hover {
  background: #eef2ff;
  transform: translateY(-1px);
}

/* Filters */
.search-container {
  max-width: 1200px;
  margin: 0 auto 1.5rem;
}

.filters-box {
  background: white;
  padding: 1.25rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
  min-width: 220px;
}

.filter-label {
  font-weight: 800;
  color: #374151;
  font-size: 0.85rem;
}

.select-wrap {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.date-input,
.filter-select {
  flex: 1;
  padding: 0.72rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.date-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.12);
}

.filter-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f5f5;
}

.filter-clear-btn {
  width: 38px;
  height: 38px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 900;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.filter-clear-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

.btn-clear-filters {
  padding: 0.72rem 1.1rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
  height: 42px;
}

.btn-clear-filters:hover {
  background: #d97706;
}

/* Content */
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
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  color: #ef4444;
  margin-bottom: 1rem;
  font-weight: 800;
}

.btn-retry {
  padding: 0.75rem 1.25rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
}

.btn-retry:hover {
  background: #5568d3;
}

/* Empty */
.empty-state {
  background: white;
  padding: 4rem 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  opacity: 0.7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #eef2ff;
  color: #667eea;
}

.empty-icon svg {
  width: 34px;
  height: 34px;
}

.empty-state h3 {
  color: #111827;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 900;
}

.empty-state p {
  color: #6b7280;
  font-size: 1rem;
}

/* Table */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.duties-table {
  width: 100%;
  border-collapse: collapse;
}

.duties-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.duties-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 800;
  font-size: 0.95rem;
}

.actions-th {
  text-align: center;
  width: 72px;
}

.duties-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.duties-table tbody tr:hover {
  background: #f8f9fa;
}

.duties-table td {
  padding: 1rem;
  font-size: 0.95rem;
  color: #111827;
}

.strong-cell {
  font-weight: 900;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 800;
}

.mini-ico {
  width: 16px;
  height: 16px;
}

/* Actions */
.actions-cell {
  display: flex;
  justify-content: center;
}

.btn-eye {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.25);
  background: #eef2ff;
  color: #4f46e5;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-eye svg {
  width: 18px;
  height: 18px;
}

.btn-eye:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.22);
  background: #e0e7ff;
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
  padding: 0.75rem 1.25rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
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
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
}

.pagination-number:hover {
  background: #f0f0ff;
  transform: translateY(-2px);
}

.pagination-number.active {
  background: #667eea;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.25);
}

/* Responsive */
@media (max-width: 968px) {
  .page-container {
    padding: 1rem;
    padding-left: 1rem;
  }

  .filters-box {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: 100%;
  }

  .table-container {
    overflow-x: auto;
  }

  .duties-table {
    min-width: 820px; /* author ustuni bor */
  }

  .pagination {
    flex-direction: column;
  }

  .pagination-numbers {
    justify-content: center;
  }
}
</style>
