<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const dormitory = ref(null)
const loading = ref(false)
const error = ref('')

const dormitoryId = route.params.id

function goBack() {
  router.push('/dormitories')
}

async function fetchDormitoryDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.makeAuthenticatedRequest(
        `http://localhost:8080/api/dorm/get/${dormitoryId}`,
        {
          method: 'GET'
        }
    )

    if (!response.ok) {
      throw new Error('Yotoqxona ma\'lumotlarini yuklashda xatolik')
    }

    const data = await response.json()
    dormitory.value = data
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

onMounted(() => {
  fetchDormitoryDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>🏢 Yotoqxona ma'lumotlari</h1>
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
          <h3>Qavatlar</h3>

          <div v-if="dormitory.floors && dormitory.floors.length > 0" class="floors-grid">
            <div
                v-for="floor in dormitory.floors"
                :key="floor.id"
                class="floor-card"
                @click="viewFloor(floor.id)"
            >
              <div class="floor-header">
                <div class="floor-icon">🏢</div>
                <h4>{{ floor.name }}</h4>
              </div>

              <div class="floor-body">
                <div class="floor-info-item" v-if="floor.leaderFirstName || floor.leaderLastName">
                  <span class="floor-label">Qavat rahbari:</span>
                  <span class="floor-value">
                    {{ floor.leaderFirstName }} {{ floor.leaderLastName }}
                    <span v-if="floor.leaderMiddleName">{{ floor.leaderMiddleName }}</span>
                  </span>
                </div>

                <div class="floor-info-item" v-else>
                  <span class="floor-label">Qavat rahbari:</span>
                  <span class="floor-value no-data">Tayinlanmagan</span>
                </div>

                <div class="floor-info-item" v-if="floor.rooms !== null">
                  <span class="floor-label">Xonalar:</span>
                  <span class="floor-value">{{ floor.rooms?.length || 0 }} ta</span>
                </div>
              </div>

              <div class="floor-footer">
                <button class="btn-view-floor">Ko'rish →</button>
              </div>
            </div>
          </div>

          <div v-else class="empty-floors">
            <div class="empty-icon">📭</div>
            <p>Bu yotoqxonada qavatlar mavjud emas</p>
          </div>
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

/* Detail Content */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
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
  font-size: 3rem;
}

.info-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
}

.info-id {
  margin: 0;
  opacity: 0.9;
  font-size: 0.9rem;
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

/* Floors Section */
.floors-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.floors-section h3 {
  margin: 0 0 1.5rem 0;
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
  cursor: pointer;
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

.floor-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.btn-view-floor {
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

.btn-view-floor:hover {
  background: #5568d3;
}

/* Empty State */
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
  margin: 0;
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
}
</style>