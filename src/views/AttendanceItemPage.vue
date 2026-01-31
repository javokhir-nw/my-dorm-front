<script setup>
import {ref, computed, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {useAuthStore} from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'
import axios from 'axios'  // ✅ ADD THIS

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const attendance = ref(null)
const loading = ref(false)
const error = ref('')

const attendanceId = route.params.id

// Filter states
const searchQuery = ref('')
const filterRoomId = ref(null)
const filterAttendance = ref(null)

// Computed list of unique rooms for filter dropdown
const rooms = computed(() => {
  if (!attendance.value?.userDtoList) return []

  const uniqueRooms = new Map()
  attendance.value.userDtoList.forEach(user => {
    if (!uniqueRooms.has(user.roomId)) {
      uniqueRooms.set(user.roomId, {
        id: user.roomId,
        number: user.roomNumber
      })
    }
  })

  return Array.from(uniqueRooms.values()).sort((a, b) =>
      a.number.localeCompare(b.number, undefined, { numeric: true })
  )
})

// Computed filtered users
const filteredUsers = computed(() => {
  if (!attendance.value?.userDtoList) return []

  let users = [...attendance.value.userDtoList]

  // Filter by search query (name, phone)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    users = users.filter(user => {
      const fullName = `${user.lastName} ${user.firstName} ${user.middleName}`.toLowerCase()
      const reverseName = `${user.firstName} ${user.lastName} ${user.middleName}`.toLowerCase()
      const phone = (user.phone || '').toLowerCase()

      return fullName.includes(query) ||
          reverseName.includes(query) ||
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          (user.middleName && user.middleName.toLowerCase().includes(query)) ||
          phone.includes(query)
    })
  }

  // Filter by room
  if (filterRoomId.value !== null) {
    users = users.filter(user => user.roomId === filterRoomId.value)
  }

  // Filter by attendance status
  if (filterAttendance.value !== null) {
    users = users.filter(user => user.isAttended === filterAttendance.value)
  }

  return users
})

// Statistics
const stats = computed(() => {
  if (!attendance.value?.userDtoList) {
    return {
      total: 0,
      attended: 0,
      notAttended: 0,
      attendanceRate: 0
    }
  }

  const total = attendance.value.userDtoList.length
  const attended = attendance.value.userDtoList.filter(u => u.isAttended).length
  const notAttended = total - attended
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0

  return {
    total,
    attended,
    notAttended,
    attendanceRate
  }
})

function goBack() {
  router.push('/attendance')
}

// ✅ YO'ZGARTIRILDI - axios dan ishlash (baseURL avtomatik qo'shiladi)
async function fetchAttendanceDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`/api/attendance/get/${attendanceId}`)

    attendance.value = response.data
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  searchQuery.value = ''
  filterRoomId.value = null
  filterAttendance.value = null
}

onMounted(() => {
  fetchAttendanceDetail()
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
              <rect x="3" y="4" width="18" height="18" rx="3"></rect>
              <path d="M16 2v4"></path>
              <path d="M8 2v4"></path>
              <path d="M3 10h18"></path>
              <path d="M9 16l2 2 4-4"></path>
            </svg>
          </span>
          <h1>Davomat tafsilotlari</h1>
        </div>
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
        <button @click="fetchAttendanceDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Attendance Detail -->
      <div v-else-if="attendance" class="detail-content">
        <!-- Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                <path d="M16 2v4"></path>
                <path d="M8 2v4"></path>
                <path d="M3 10h18"></path>
                <path d="M9 16l2 2 4-4"></path>
              </svg>
            </div>
            <div class="info-details">
              <h2>{{ attendance.dormName }} - {{ attendance.floorName }}</h2>
              <p class="info-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                  <path d="M16 2v4"></path>
                  <path d="M8 2v4"></path>
                  <path d="M3 10h18"></path>
                </svg>
                {{ attendance.createdDate }}
              </p>
              <p class="info-id">ID: {{ attendance.id }}</p>
            </div>
          </div>

          <!-- Statistics -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M17 11a4 4 0 1 0-8 0"></path>
                  <path d="M3 21a6 6 0 0 1 12 0"></path>
                  <path d="M13 21a6 6 0 0 1 8-5.3"></path>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.total }}</div>
                <div class="stat-label">Jami</div>
              </div>
            </div>

            <div class="stat-card success">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l4 4L19 6"></path>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.attended }}</div>
                <div class="stat-label">Qatnashdi</div>
              </div>
            </div>

            <div class="stat-card danger">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 6L6 18"></path>
                  <path d="M6 6l12 12"></path>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.notAttended }}</div>
                <div class="stat-label">Qatnashmadi</div>
              </div>
            </div>

            <div class="stat-card info">
              <div class="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 3v18h18"></path>
                  <path d="M7 15l4-4 4 3 5-6"></path>
                </svg>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.attendanceRate }}%</div>
                <div class="stat-label">Davomat foizi</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-card">
          <div class="filters-row">
            <div class="filter-group">
              <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Ism, familiya yoki telefon bo'yicha qidirish..."
                  class="search-input"
              />
            </div>

            <div class="filter-group">
              <select v-model="filterRoomId" class="filter-select">
                <option :value="null">Barcha xonalar</option>
                <option v-for="room in rooms" :key="room.id" :value="room.id">
                  Xona {{ room.number }}
                </option>
              </select>
            </div>

            <div class="filter-group">
              <select v-model="filterAttendance" class="filter-select">
                <option :value="null">Barcha holat</option>
                <option :value="true">Qatnashdi</option>
                <option :value="false">Qatnashmadi</option>
              </select>
            </div>

            <button
                v-if="searchQuery || filterRoomId !== null || filterAttendance !== null"
                @click="clearFilters"
                class="btn-clear-filters"
            >
              Tozalash
            </button>
          </div>

          <div class="results-count">
            <span>Natijalar: <strong>{{ filteredUsers.length }}</strong> ta</span>
          </div>
        </div>

        <!-- Users Table -->
        <div class="table-card">
          <div v-if="filteredUsers.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3>Natija topilmadi</h3>
            <p>Filter shartlariga mos foydalanuvchi topilmadi</p>
          </div>

          <table v-else class="users-table">
            <thead>
            <tr>
              <th>№</th>
              <th>F.I.O</th>
              <th>Telefon</th>
              <th>Xona</th>
              <th>Holat</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(user, index) in filteredUsers" :key="user.id">
              <td class="index-cell">{{ index + 1 }}</td>
              <td class="name-cell">
                <div class="user-name">
                  {{ user.lastName }} {{ user.firstName }}
                  <span v-if="user.middleName" class="middle-name">{{ user.middleName }}</span>
                </div>
              </td>
              <td class="phone-cell">{{ user.phone || '-' }}</td>
              <td class="room-cell">
                <span class="room-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 10l9-7 9 7"></path>
                    <path d="M5 10v9h14v-9"></path>
                    <path d="M9 19v-5h6v5"></path>
                  </svg>
                  {{ user.roomNumber }}
                </span>
              </td>
              <td class="status-cell">
                <span :class="['status-badge', user.isAttended ? 'attended' : 'not-attended']">
                  <span class="status-icon" aria-hidden="true">
                    <svg v-if="user.isAttended" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12l4 4L19 6"></path>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 6L6 18"></path>
                      <path d="M6 6l12 12"></path>
                    </svg>
                  </span>
                  {{ user.isAttended ? 'Qatnashdi' : 'Qatnashmadi' }}
                </span>
              </td>
            </tr>
            </tbody>
          </table>
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

/* Detail Content */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
}

.info-icon svg {
  width: 28px;
  height: 28px;
}

.info-details h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
}

.info-date {
  margin: 0 0 0.25rem 0;
  opacity: 0.9;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-date svg {
  width: 18px;
  height: 18px;
}

.info-id {
  margin: 0;
  opacity: 0.8;
  font-size: 0.95rem;
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.stat-card.success {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #ffffff 100%);
}

.stat-card.danger {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fee2e2 0%, #ffffff 100%);
}

.stat-card.info {
  border-color: #667eea;
  background: linear-gradient(135deg, #e0e7ff 0%, #ffffff 100%);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.15);
  color: #4c5be0;
}

.stat-card.success .stat-icon {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.stat-card.danger .stat-icon {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.stat-card.info .stat-icon {
  background: rgba(79, 70, 229, 0.12);
  color: #4c5be0;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

/* Filters */
.filters-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.search-input, .filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.search-input:focus, .filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select {
  cursor: pointer;
  background: white;
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
  white-space: nowrap;
}

.btn-clear-filters:hover {
  background: #d97706;
}

.results-count {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  color: #666;
  font-size: 0.95rem;
}

.results-count strong {
  color: #667eea;
  font-weight: 700;
}

/* Table */
.table-card {
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
  font-size: 0.95rem;
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

.index-cell {
  font-weight: 600;
  color: #999;
  width: 60px;
}

.name-cell {
  min-width: 250px;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.middle-name {
  font-weight: 400;
  color: #666;
}

.phone-cell {
  color: #666;
  min-width: 130px;
}

.room-cell {
  min-width: 100px;
}

.room-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #667eea;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.room-badge svg {
  width: 16px;
  height: 16px;
}

.status-cell {
  min-width: 140px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge.attended {
  background: #d1fae5;
  color: #10b981;
}

.status-badge.not-attended {
  background: #fee2e2;
  color: #ef4444;
}

.status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.status-icon svg {
  width: 16px;
  height: 16px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  opacity: 0.6;
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
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.empty-state p {
  color: #666;
  font-size: 1rem;
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

  .info-header {
    flex-direction: column;
    text-align: center;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-row {
    flex-direction: column;
  }

  .filter-group {
    min-width: 100%;
  }

  .table-card {
    overflow-x: auto;
  }

  .users-table {
    min-width: 700px;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
