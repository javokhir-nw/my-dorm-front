<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const route = useRoute()

const duty = ref(null)
const loading = ref(false)
const error = ref('')

const dutyId = route.params.id

// Filters
const searchQuery = ref('')
const filterRoomId = ref(null)
const filterUserId = ref(null)

/** ===== Helpers ===== */
function goBack() {
  router.push('/duty')
}

async function fetchDutyDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await axios.get(`/api/duty/get/${dutyId}`)
    duty.value = response.data
  } catch (err) {
    if (err?.message !== 'Unauthorized - Session expired') {
      error.value = err?.message || "Server bilan bog'lanishda xatolik!"
    }
  } finally {
    loading.value = false
  }
}

function clearFilters() {
  searchQuery.value = ''
  filterRoomId.value = null
  filterUserId.value = null
}

function getCreatorFullName() {
  if (!duty.value) return '—'
  return [duty.value.creatorLastName, duty.value.creatorFirstName, duty.value.creatorMiddleName]
      .filter(Boolean)
      .join(' ') || '—'
}

function getRoomLabel(item) {
  // roomName bor, roomNumber null bo'lishi mumkin
  const name = item?.roomName || '—'
  const num = item?.roomNumber ? ` · ${item.roomNumber}` : ''
  return `${name}${num}`
}

function getUserFullName(u) {
  return [u?.lastName, u?.firstName, u?.middleName].filter(Boolean).join(' ') || '—'
}

/** ===== Computed: unique rooms dropdown ===== */
const rooms = computed(() => {
  const list = duty.value?.dutyItemList || []
  const unique = new Map()

  list.forEach((item) => {
    if (!unique.has(item.roomId)) {
      unique.set(item.roomId, {
        id: item.roomId,
        label: getRoomLabel(item)
      })
    }
  })

  return Array.from(unique.values()).sort((a, b) => a.label.localeCompare(b.label))
})

/** ===== Computed: unique users dropdown ===== */
const users = computed(() => {
  const list = duty.value?.dutyItemList || []
  const unique = new Map()

  list.forEach((item) => {
    ;(item.dutyUsers || []).forEach((u) => {
      if (!unique.has(u.id)) {
        unique.set(u.id, { id: u.id, name: getUserFullName(u) })
      }
    })
  })

  return Array.from(unique.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )
})

/** ===== Filtered duty items ===== */
const filteredItems = computed(() => {
  const list = duty.value?.dutyItemList || []
  let items = [...list]

  // Filter by room
  if (filterRoomId.value !== null) {
    items = items.filter((it) => it.roomId === filterRoomId.value)
  }

  // Filter by user (keep only items where that user exists)
  if (filterUserId.value !== null) {
    items = items.filter((it) => (it.dutyUsers || []).some((u) => u.id === filterUserId.value))
  }

  // Search (room name/number + user full name)
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    items = items.filter((it) => {
      const roomText = `${it.roomName || ''} ${it.roomNumber || ''}`.toLowerCase()
      const usersText = (it.dutyUsers || []).map(getUserFullName).join(' ').toLowerCase()
      return roomText.includes(q) || usersText.includes(q)
    })
  }

  return items
})

/** ===== Stats ===== */
const stats = computed(() => {
  const list = duty.value?.dutyItemList || []

  const totalRooms = list.length
  const uniqueUsers = new Set()
  let totalAssignments = 0

  list.forEach((item) => {
    const arr = item.dutyUsers || []
    totalAssignments += arr.length
    arr.forEach((u) => uniqueUsers.add(u.id))
  })

  return {
    totalRooms,
    uniqueUsers: uniqueUsers.size,
    totalAssignments
  }
})

onMounted(() => {
  fetchDutyDetail()
})
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z"></path>
              <path d="M9.5 12l1.7 1.7L14.8 10"></path>
            </svg>
          </span>
          <h1>Navbatchilik tafsilotlari</h1>
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
        <button @click="fetchDutyDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Detail -->
      <div v-else-if="duty" class="detail-content">
        <!-- Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                <path d="M16 2v4"></path>
                <path d="M8 2v4"></path>
                <path d="M3 10h18"></path>
              </svg>
            </div>

            <div class="info-details">
              <h2>{{ duty.dormitoryName }} | {{ duty.floorName }}</h2>

              <p class="info-date">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="3"></rect>
                  <path d="M16 2v4"></path>
                  <path d="M8 2v4"></path>
                  <path d="M3 10h18"></path>
                </svg>
                {{ duty.createdDate }}
              </p>

              <p class="info-meta">
                <span class="meta-chip">
                  <span class="meta-label">Muallif</span>
                  {{ getCreatorFullName() }}
                </span>
              </p>
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
                  placeholder="Xona yoki F.I.O bo‘yicha qidirish..."
                  class="search-input"
              />
            </div>

            <div class="filter-group">
              <select v-model="filterRoomId" class="filter-select">
                <option :value="null">Barcha joylar</option>
                <option v-for="r in rooms" :key="r.id" :value="r.id">
                  {{ r.label }}
                </option>
              </select>
            </div>
            <button
                v-if="searchQuery || filterRoomId !== null || filterUserId !== null"
                @click="clearFilters"
                class="btn-clear-filters"
            >
              Tozalash
            </button>
          </div>
        </div>

        <!-- Items Table -->
        <div class="table-card">
          <div v-if="filteredItems.length === 0" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </div>
            <h3>Natija topilmadi</h3>
            <p>Filter shartlariga mos ma’lumot yo‘q</p>
          </div>

          <table v-else class="items-table">
            <thead>
            <tr>
              <th>№</th>
              <th>Joy</th>
              <th>Navbatchilar</th>
            </tr>
            </thead>

            <tbody>
            <tr v-for="(item, idx) in filteredItems" :key="item.id">
              <td class="index-cell">{{ idx + 1 }}</td>

              <td class="room-cell">
                <span class="room-badge">
                  {{ item.roomName }}
                  <span v-if="item.roomNumber" class="room-number"> · {{ item.roomNumber }} - xona</span>
                </span>
              </td>

              <td class="users-cell">
                <div class="users-wrap">
                  <span
                      v-for="u in (item.dutyUsers || [])"
                      :key="u.id"
                      class="user-pill"
                  >
                    {{ getUserFullName(u) }}
                  </span>

                  <span v-if="(item.dutyUsers || []).length === 0" class="muted">—</span>
                </div>
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
  flex-shrink: 0;
}

.info-icon svg {
  width: 28px;
  height: 28px;
}

.info-details h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.75rem;
  font-weight: 900;
}

.info-date {
  margin: 0 0 0.5rem 0;
  opacity: 0.95;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-date svg {
  width: 18px;
  height: 18px;
}

.info-meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.meta-chip {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.18);
}

.meta-label {
  font-size: 0.85rem;
  opacity: 0.95;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  padding: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

.stat-card.success {
  border-color: #10b981;
  background: linear-gradient(135deg, #d1fae5 0%, #ffffff 100%);
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

.stat-card.info .stat-icon {
  background: rgba(79, 70, 229, 0.12);
  color: #4c5be0;
}

.stat-icon svg {
  width: 22px;
  height: 22px;
}

.stat-value {
  font-size: 2rem;
  font-weight: 900;
  color: #111827;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 700;
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
  align-items: flex-start;
  margin-bottom: 1rem;
}

.filter-group {
  flex: 1 1 260px;
  min-width: 0;
}

.search-input,
.filter-select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
}

.filter-select {
  cursor: pointer;
  background: white;
}

.btn-clear-filters {
  padding: 0.75rem 1.2rem;
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  align-self: flex-start;
}

.btn-clear-filters:hover {
  background: #d97706;
}

.results-count {
  padding: 0.75rem 1rem;
  background: #f8f9fa;
  border-radius: 10px;
  color: #6b7280;
  font-size: 0.95rem;
}

.results-count strong {
  color: #4f46e5;
  font-weight: 900;
}

/* Table */
.table-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table thead {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.items-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 800;
  font-size: 0.95rem;
}

.items-table tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.items-table tbody tr:hover {
  background: #f8f9fa;
}

.items-table td {
  padding: 1rem;
  font-size: 0.95rem;
  vertical-align: top;
}

.index-cell {
  width: 60px;
  color: #9ca3af;
  font-weight: 800;
}

.room-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  background: #e0e7ff;
  color: #4f46e5;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
}

.room-badge svg {
  width: 16px;
  height: 16px;
}

.room-number {
  opacity: 0.9;
  font-weight: 800;
}

.users-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.user-pill {
  display: inline-flex;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  color: #111827;
  font-weight: 600;
  font-size: 0.9rem;
}

.muted {
  color: #9ca3af;
  font-weight: 800;
}

.count-cell {
  width: 90px;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  background: #d1fae5;
  color: #059669;
  font-weight: 600;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  width: 72px;
  height: 72px;
  margin: 0 auto 1rem;
  opacity: 0.65;
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

/* Responsive */
@media (max-width: 968px) {
  .page-container {
    padding: 1rem;
    padding-left: 1rem;
  }

  .info-header {
    flex-direction: column;
    text-align: center;
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

  .items-table {
    min-width: 860px;
  }
}
</style>
