<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const authStore = useAuthStore()

const dormitories = ref([])
const total = ref(0)
const totalPages = ref(0)
const loading = ref(false)
const error = ref('')

// Search and pagination parameters
const searchQuery = ref('')
const currentPage = ref(0)
const pageSize = ref(10)

function goBack() {
  router.push('/dashboard')
}

async function fetchDormitories() {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.makeAuthenticatedRequest('http://localhost:8080/api/dorm/list', {
      method: 'POST',
      body: JSON.stringify({
        page: currentPage.value,
        size: pageSize.value,
        search: {
          value: searchQuery.value || ''
        }
      })
    })

    if (!response.ok) {
      throw new Error('Yotoqxonalarni yuklashda xatolik')
    }

    const data = await response.json()
    dormitories.value = data.list || []
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

function handleSearch() {
  currentPage.value = 1
  fetchDormitories()
}

function clearSearch() {
  searchQuery.value = ''
  currentPage.value = 1
  fetchDormitories()
}

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchDormitories()
  }
}

function viewDormitory(id) {
  router.push(`/dormitory/${id}`)
}

onMounted(() => {
  fetchDormitories()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>🏢 Yotoqxonalar</h1>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-box">
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Yotoqxona nomini kiriting..."
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
        <button @click="fetchDormitories" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="dormitories.length === 0" class="empty-state">
        <div class="empty-icon">🏢</div>
        <h3>Yotoqxonalar topilmadi</h3>
        <p v-if="searchQuery">
          "{{ searchQuery }}" bo'yicha natija topilmadi
        </p>
        <p v-else>Hozircha hech qanday yotoqxona yo'q</p>
      </div>

      <!-- Dormitories List -->
      <div v-else>
        <div class="dormitories-grid">
          <div
              v-for="dorm in dormitories"
              :key="dorm.id"
              class="dormitory-card"
              @click="viewDormitory(dorm.id)"
          >
            <div class="card-header">
              <div class="card-icon">🏢</div>
              <h3 class="dormitory-name">O'zbekiston Xalqaro Islomshunoslik akademiyasi</h3>
            </div>

            <div class="card-body">
              <h3 class="dormitory-name">{{ dorm.name }}</h3>

              <div class="dormitory-info">
                <div class="info-item" v-if="dorm.ownerFirstName || dorm.ownerLastName">
                  <span class="info-label">Yotoqxona Mudiri:</span>
                  <span class="info-value">
                    {{ dorm.ownerFirstName }} {{ dorm.ownerLastName }}
                    <span v-if="dorm.ownerMiddleName">{{ dorm.ownerMiddleName }}</span>
                  </span>
                </div>

                <div class="info-item" v-else>
                  <span class="info-label">Owner ID:</span>
                  <span class="info-value">{{ dorm.ownerId }}</span>
                </div>

                <div class="info-item" v-if="dorm.floors">
                  <span class="info-label">Qavatlar:</span>
                  <span class="info-value">{{ dorm.floors }}</span>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-view">Ko'rish →</button>
            </div>
          </div>
        </div>

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

/* Search Bar */
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

.btn-clear:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

/* Dormitories Grid */
.dormitories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.dormitory-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
}

.dormitory-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.card-icon {
  font-size: 2rem;
  margin-right: 7px;
}

.card-id {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

.card-body {
  padding: 1.5rem;
}

.dormitory-name {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.dormitory-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-weight: 600;
}

.card-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.btn-view {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-view:hover {
  background: #5568d3;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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

@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
    padding-left: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .header-left {
    width: 100%;
  }

  .page-header h1 {
    font-size: 1.4rem;
  }

  .search-box {
    flex-direction: column;
  }

  .dormitories-grid {
    grid-template-columns: 1fr;
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