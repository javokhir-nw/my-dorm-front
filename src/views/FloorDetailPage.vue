<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import SideMenu from '../views/SideMenu.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const floor = ref(null)
const loading = ref(false)
const error = ref('')

const floorId = route.params.id

function goBack() {
  // Agar dormitoryId bo'lsa, yotoqxona sahifasiga qaytish
  if (floor.value?.dormitoryId) {
    router.push(`/dormitory/${floor.value.dormitoryId}`)
  } else {
    router.push('/dormitories')
  }
}

async function fetchFloorDetail() {
  loading.value = true
  error.value = ''

  try {
    const response = await authStore.makeAuthenticatedRequest(
        `http://localhost:8080/api/floor/get/${floorId}`,
        {
          method: 'GET'
        }
    )

    if (!response.ok) {
      throw new Error('Qavat ma\'lumotlarini yuklashda xatolik')
    }

    const data = await response.json()
    floor.value = data
  } catch (err) {
    if (err.message !== 'Unauthorized - Session expired') {
      error.value = err.message || 'Server bilan bog\'lanishda xatolik!'
    }
  } finally {
    loading.value = false
  }
}

function viewRoom(roomId) {
  router.push(`/room/${roomId}`)
}

onMounted(() => {
  fetchFloorDetail()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <div class="page-header">
      <div class="header-left">
        <button @click="goBack" class="back-button">← Orqaga</button>
        <h1>🏢 Qavat ma'lumotlari</h1>
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
        <button @click="fetchFloorDetail" class="btn-retry">Qayta urinish</button>
      </div>

      <!-- Floor Detail -->
      <div v-else-if="floor" class="detail-content">
        <!-- Main Info Card -->
        <div class="info-card">
          <div class="info-header">
            <div class="info-icon">🏢</div>
            <div>
              <h2>{{ floor.name }}</h2>
              <p class="info-subtitle">{{ floor.dormitoryName }}</p>
              <p class="info-id">ID: {{ floor.id }}</p>
            </div>
          </div>

          <div class="info-body">
            <div class="info-row">
              <span class="info-label">Qavat rahbari:</span>
              <span class="info-value" v-if="floor.leaderFirstName || floor.leaderLastName">
                {{ floor.leaderFirstName }} {{ floor.leaderLastName }}
                <span v-if="floor.leaderMiddleName">{{ floor.leaderMiddleName }}</span>
              </span>
              <span class="info-value no-data" v-else>Tayinlanmagan</span>
            </div>

            <div class="info-row">
              <span class="info-label">Xonalar soni:</span>
              <span class="info-value">{{ floor.rooms?.length || 0 }} ta</span>
            </div>
          </div>
        </div>

        <!-- Rooms List -->
        <div class="rooms-section">
          <h3>Xonalar</h3>

          <div v-if="floor.rooms && floor.rooms.length > 0" class="rooms-grid">
            <div
                v-for="room in floor.rooms"
                :key="room.id"
                class="room-card"
                @click="viewRoom(room.id)"
            >
              <div class="room-header">
                <div class="room-number">{{ room.number }}</div>
                <div class="room-type-badge">{{ room.roomTypeName }}</div>
              </div>

              <div class="room-body">
                <div class="room-info-item">
                  <span class="room-label">Xona nomi:</span>
                  <span class="room-value">{{ room.name }}</span>
                </div>

                <div class="room-info-item">
                  <span class="room-label">Sig'im:</span>
                  <span class="room-value">{{ room.capacity }} kishi</span>
                </div>

                <div class="room-info-item">
                  <span class="room-label">Xona turi:</span>
                  <span class="room-value">{{ room.roomTypeName }}</span>
                </div>
              </div>

              <div class="room-footer">
                <button class="btn-view-room">Ko'rish →</button>
              </div>
            </div>
          </div>

          <div v-else class="empty-rooms">
            <div class="empty-icon">📭</div>
            <p>Bu qavatda xonalar mavjud emas</p>
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

.info-subtitle {
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
  font-size: 1rem;
}

.info-id {
  margin: 0;
  opacity: 0.8;
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

.info-value.no-data {
  color: #999;
  font-style: italic;
}

/* Rooms Section */
.rooms-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.rooms-section h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.3s;
  cursor: pointer;
  overflow: hidden;
}

.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #667eea;
}

.room-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-number {
  font-size: 1.8rem;
  font-weight: 700;
}

.room-type-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

.room-body {
  padding: 1.5rem;
}

.room-info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

.room-info-item:last-child {
  margin-bottom: 0;
}

.room-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

.room-value {
  color: #333;
  font-weight: 600;
}

.room-footer {
  padding: 1rem 1.5rem;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.btn-view-room {
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

.btn-view-room:hover {
  background: #5568d3;
}

/* Empty State */
.empty-rooms {
  text-align: center;
  padding: 3rem 2rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-rooms p {
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

  .rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>