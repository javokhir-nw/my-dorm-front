<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import SideMenu from '../views/SideMenu.vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const api = axios.create({})

api.interceptors.request.use((config) => {
  const token =
      authStore.token ||
      authStore.accessToken ||
      authStore.authToken ||
      authStore?.user?.token

  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── States ───────────────────────────────────────────
const roles = ref([])
const allPermissions = ref([]) // /api/permission/list dan olingan
const loading = ref(false)
const error = ref('')

// View modal
const showViewModal = ref(false)
const selectedViewRole = ref(null) // get/{id} response (permissionIds bilan)
const viewLoading = ref(false)

// Create modal
const showCreateModal = ref(false)
const createForm = ref({ name: '', code: '', permissionIds: [] })
const createLoading = ref(false)

// Update modal
const showUpdateModal = ref(false)
const updateForm = ref({ id: null, name: '', code: '', permissionIds: [] })
const updateLoading = ref(false)

// Success/Error message modal
const showMessageModal = ref(false)
const modalMessage = ref({ title: '', text: '', type: 'success' })

// ─── Helpers ──────────────────────────────────────────
function showSuccessMessage(title, text) {
  modalMessage.value = { title, text, type: 'success' }
  showMessageModal.value = true
}
function showErrorMessage(title, text) {
  modalMessage.value = { title, text, type: 'error' }
  showMessageModal.value = true
}
function closeMessageModal() {
  showMessageModal.value = false
}

// ─── Permissions grouped by className ─────────────────
// { "Dormitory": [{id,name,className}, ...], "Role": [...], ... }
const groupedPermissions = computed(() => {
  const map = {}
  allPermissions.value.forEach((p) => {
    const key = p.className || 'Other'
    if (!map[key]) map[key] = []
    map[key].push(p)
  })
  // Har group ichida name bo'yicha sort
  Object.keys(map).forEach((key) => {
    map[key].sort((a, b) => a.name.localeCompare(b.name))
  })
  return map
})

// Sorted class names
const sortedClassNames = computed(() => {
  return Object.keys(groupedPermissions.value).sort()
})

// ─── Fetch ────────────────────────────────────────────
async function fetchRoles() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get('/api/role/list')
    roles.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.log('ROLE LIST ERR:', err?.response?.status, err?.response?.data)
    error.value =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err.message ||
        "Server bilan bog'lanishda xatolik!"
  } finally {
    loading.value = false
  }
}

async function fetchPermissions() {
  try {
    const res = await api.get('/api/permission/list')
    allPermissions.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.log('PERMISSION LIST ERR:', err?.response?.status, err?.response?.data)
    showErrorMessage('Xato', 'Permission list yuklashda xatolik!')
  }
}

// ─── View Modal ───────────────────────────────────────
async function openViewModal(role) {
  showViewModal.value = true
  viewLoading.value = true
  selectedViewRole.value = null
  try {
    const res = await api.get(`/api/role/get/${role.id}`)
    selectedViewRole.value = res.data
  } catch (err) {
    console.log('ROLE GET ERR:', err?.response?.status, err?.response?.data)
    showViewModal.value = false
    showErrorMessage('Xato', 'Role ma\'lumotini yuklab olishda xatolik!')
  } finally {
    viewLoading.value = false
  }
}
function closeViewModal() {
  showViewModal.value = false
  selectedViewRole.value = null
}

// ─── Create Modal ─────────────────────────────────────
function openCreateModal() {
  createForm.value = { name: '', code: '', permissionIds: [] }
  showCreateModal.value = true
}
function closeCreateModal() {
  showCreateModal.value = false
}

// Create: checkbox toggle
function toggleCreatePermission(permId) {
  const idx = createForm.value.permissionIds.indexOf(permId)
  if (idx === -1) {
    createForm.value.permissionIds.push(permId)
  } else {
    createForm.value.permissionIds.splice(idx, 1)
  }
}

// Create: className group select/deselect
function toggleCreateGroup(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  const allSelected = groupIds.every((id) => createForm.value.permissionIds.includes(id))
  if (allSelected) {
    // Deselect
    createForm.value.permissionIds = createForm.value.permissionIds.filter(
        (id) => !groupIds.includes(id)
    )
  } else {
    // Select all
    groupIds.forEach((id) => {
      if (!createForm.value.permissionIds.includes(id)) {
        createForm.value.permissionIds.push(id)
      }
    })
  }
}

function isCreateGroupFullySelected(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  return groupIds.length > 0 && groupIds.every((id) => createForm.value.permissionIds.includes(id))
}

function isCreateGroupPartiallySelected(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  const selected = groupIds.filter((id) => createForm.value.permissionIds.includes(id))
  return selected.length > 0 && selected.length < groupIds.length
}

async function submitCreate() {
  if (!createForm.value.name.trim()) {
    showErrorMessage('Xato', 'Role name bo\'yicha bosilib kiritilgan bolishi kerak!')
    return
  }
  createLoading.value = true
  try {
    await api.post('/api/role/save', {
      name: createForm.value.name.trim(),
      code: createForm.value.code.trim(),
      permissionIds: createForm.value.permissionIds,
    })
    closeCreateModal()
    showSuccessMessage('Muvaffaqiyat', 'Role muvaffaqiyatli yaratilgan!')
    await fetchRoles()
  } catch (err) {
    console.log('CREATE ROLE ERR:', err?.response?.status, err?.response?.data)
    showErrorMessage(
        'Xato',
        err?.response?.data?.message || err?.response?.data?.error || 'Role yaratishda xatolik!'
    )
  } finally {
    createLoading.value = false
  }
}

// ─── Update Modal ─────────────────────────────────────
async function openUpdateModal(role) {
  showUpdateModal.value = true
  updateLoading.value = true
  updateForm.value = { id: role.id, name: '', code: '', permissionIds: [] }
  try {
    const res = await api.get(`/api/role/get/${role.id}`)
    updateForm.value = {
      id: res.data.id,
      name: res.data.name || '',
      code: res.data.code || '',
      permissionIds: Array.isArray(res.data.permissionIds) ? [...res.data.permissionIds] : [],
    }
  } catch (err) {
    console.log('ROLE GET FOR UPDATE ERR:', err?.response?.status, err?.response?.data)
    showUpdateModal.value = false
    showErrorMessage('Xato', 'Role ma\'lumotini yuklab olishda xatolik!')
  } finally {
    updateLoading.value = false
  }
}
function closeUpdateModal() {
  showUpdateModal.value = false
}

function toggleUpdatePermission(permId) {
  const idx = updateForm.value.permissionIds.indexOf(permId)
  if (idx === -1) {
    updateForm.value.permissionIds.push(permId)
  } else {
    updateForm.value.permissionIds.splice(idx, 1)
  }
}

function toggleUpdateGroup(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  const allSelected = groupIds.every((id) => updateForm.value.permissionIds.includes(id))
  if (allSelected) {
    updateForm.value.permissionIds = updateForm.value.permissionIds.filter(
        (id) => !groupIds.includes(id)
    )
  } else {
    groupIds.forEach((id) => {
      if (!updateForm.value.permissionIds.includes(id)) {
        updateForm.value.permissionIds.push(id)
      }
    })
  }
}

function isUpdateGroupFullySelected(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  return groupIds.length > 0 && groupIds.every((id) => updateForm.value.permissionIds.includes(id))
}

function isUpdateGroupPartiallySelected(className) {
  const groupIds = (groupedPermissions.value[className] || []).map((p) => p.id)
  const selected = groupIds.filter((id) => updateForm.value.permissionIds.includes(id))
  return selected.length > 0 && selected.length < groupIds.length
}

async function submitUpdate() {
  if (!updateForm.value.name.trim()) {
    showErrorMessage('Xato', 'Role name bo\'yicha bosilib kiritilgan bolishi kerak!')
    return
  }
  updateLoading.value = true
  try {
    await api.post('/api/role/save', {
      id: updateForm.value.id,
      name: updateForm.value.name.trim(),
      code: updateForm.value.code.trim(),
      permissionIds: updateForm.value.permissionIds,
    })
    closeUpdateModal()
    showSuccessMessage('Muvaffaqiyat', 'Role muvaffaqiyatli yangilanган!')
    await fetchRoles()
  } catch (err) {
    console.log('UPDATE ROLE ERR:', err?.response?.status, err?.response?.data)
    showErrorMessage(
        'Xato',
        err?.response?.data?.message || err?.response?.data?.error || 'Role yangilanishda xatolik!'
    )
  } finally {
    updateLoading.value = false
  }
}

// View modal'da className bo'yicha permission filter
function getViewPermissionsForClass(className) {
  if (!selectedViewRole.value?.permissionIds) return []
  return (groupedPermissions.value[className] || []).filter((p) =>
      selectedViewRole.value.permissionIds.includes(p.id)
  )
}

// Select All / Deselect All toggle
function toggleAllPermissions(mode) {
  const allIds = allPermissions.value.map((p) => p.id)
  if (mode === 'create') {
    createForm.value.permissionIds =
        createForm.value.permissionIds.length === allIds.length ? [] : [...allIds]
  } else {
    updateForm.value.permissionIds =
        updateForm.value.permissionIds.length === allIds.length ? [] : [...allIds]
  }
}

// ─── Init ─────────────────────────────────────────────
onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<template>
  <div class="page-container">
    <SideMenu />

    <!-- ── Header ── -->
    <div class="page-header">
      <div class="header-left">
        <div class="page-title">
          <span class="page-title__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </span>
          <h1>Rollar</h1>
        </div>
      </div>

      <div class="header-actions">
        <button @click="openCreateModal" class="btn-create" title="Yangi role">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 8v8"></path>
            <path d="M8 12h8"></path>
          </svg>
          Yaratish
        </button>
        <button @click="fetchRoles" class="btn-refresh" :disabled="loading" title="Yangilash">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-2.64-6.36"></path>
            <path d="M21 3v6h-6"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- ── Content ── -->
    <div class="page-content">
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <p>{{ error }}</p>
        <button @click="fetchRoles" class="btn-retry">Qayta urinish</button>
      </div>

      <div v-else class="content-card">
        <div v-if="roles && roles.length > 0" class="roles-list">
          <div v-for="role in roles" :key="role.id" class="role-item">
            <div class="role-info">
              <div class="role-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z"></path>
                </svg>
              </div>
              <div class="role-details">
                <h3 class="role-name">{{ role.name }}</h3>
                <p class="role-id">ID: {{ role.id }}</p>
              </div>
            </div>

            <div class="role-actions">
              <button @click="openViewModal(role)" class="btn-action btn-view" title="Ko'rish">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Ko'rish</span>
              </button>
              <button @click="openUpdateModal(role)" class="btn-action btn-update" title="Tahrirlash">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Tahrirlash</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z"></path>
            </svg>
          </div>
          <h3>Rollar mavjud emas</h3>
          <p>Birinchi role yarating!</p>
          <button @click="openCreateModal" class="btn-add-first">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
            Yangi Role
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         VIEW MODAL
         ═══════════════════════════════════════════════════ -->
    <div v-if="showViewModal" class="modal-overlay" @click.self="closeViewModal">
      <div class="modal modal-medium">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </span>
            Role ma'lumoti
          </h2>
          <button @click="closeViewModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="viewLoading" class="modal-loading">
            <div class="spinner spinner-sm"></div>
            <p>Yuklanmoqda...</p>
          </div>

          <template v-else-if="selectedViewRole">
            <div class="info-row">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedViewRole.id }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">NAME</span>
              <span class="info-value code">{{ selectedViewRole.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">CODE</span>
              <span class="info-value code">{{ selectedViewRole.code }}</span>
            </div>

            <!-- Permissions list (read-only) -->
            <div class="permissions-section">
              <h4 class="permissions-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Permissions
                <span class="permissions-count">{{ selectedViewRole.permissionIds?.length || 0 }}</span>
              </h4>

              <div v-if="selectedViewRole.permissionIds && selectedViewRole.permissionIds.length > 0" class="view-permissions-groups">
                <div v-for="className in sortedClassNames" :key="className" class="view-perm-group">
                  <template v-if="getViewPermissionsForClass(className).length > 0">
                    <div class="view-perm-group-title">{{ className }}</div>
                    <div class="view-perm-tags">
                      <span
                          v-for="perm in getViewPermissionsForClass(className)"
                          :key="perm.id"
                          class="perm-tag"
                      >{{ perm.name }}</span>
                    </div>
                  </template>
                </div>
              </div>
              <p v-else class="no-permissions">Permission yo'q</p>
            </div>
          </template>
        </div>

        <div class="modal-footer">
          <button @click="closeViewModal" class="btn-submit">Yopish</button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         CREATE MODAL
         ═══════════════════════════════════════════════════ -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon modal-title-icon--green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </span>
            Yangi Role Yaratish
          </h2>
          <button @click="closeCreateModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <!-- Name & Code -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Role Name <span class="required">*</span></label>
              <input
                  v-model="createForm.name"
                  type="text"
                  class="form-input"
                  placeholder="Mas: ROLE_ADMIN"
                  :disabled="createLoading"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Code</label>
              <input
                  v-model="createForm.code"
                  type="text"
                  class="form-input"
                  placeholder="Mas: ROLE_ADMIN"
                  :disabled="createLoading"
              />
            </div>
          </div>

          <!-- Permissions checkboxes -->
          <div class="permissions-section">
            <div class="permissions-header">
              <h4 class="permissions-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Permissions
                <span class="permissions-count">{{ createForm.permissionIds.length }} / {{ allPermissions.length }}</span>
              </h4>
              <!-- Select All -->
              <label class="select-all-label">
                <input
                    type="checkbox"
                    class="checkbox-input"
                    :checked="createForm.permissionIds.length === allPermissions.length && allPermissions.length > 0"
                    @change="toggleAllPermissions('create')"
                    :disabled="createLoading"
                />
                <span class="select-all-text">Barchasini tanlash</span>
              </label>
            </div>

            <div class="permissions-groups">
              <div v-for="className in sortedClassNames" :key="className" class="perm-group">
                <!-- Group header with checkbox -->
                <label class="group-header-label">
                  <input
                      type="checkbox"
                      class="checkbox-input"
                      :checked="isCreateGroupFullySelected(className)"
                      :indeterminate="isCreateGroupPartiallySelected(className)"
                      @change="toggleCreateGroup(className)"
                      :disabled="createLoading"
                  />
                  <span class="group-name">{{ className }}</span>
                  <span class="group-count">{{ groupedPermissions[className].length }}</span>
                </label>

                <!-- Permission items -->
                <div class="perm-items">
                  <label
                      v-for="perm in groupedPermissions[className]"
                      :key="perm.id"
                      class="perm-label"
                  >
                    <input
                        type="checkbox"
                        class="checkbox-input"
                        :checked="createForm.permissionIds.includes(perm.id)"
                        @change="toggleCreatePermission(perm.id)"
                        :disabled="createLoading"
                    />
                    <span class="perm-name">{{ perm.name }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeCreateModal" class="btn-cancel" :disabled="createLoading">Bekor</button>
          <button @click="submitCreate" class="btn-submit btn-submit--green" :disabled="createLoading">
            <span v-if="createLoading" class="btn-spinner"></span>
            <template v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 8v8"></path>
                <path d="M8 12h8"></path>
              </svg>
            </template>
            Yaratish
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         UPDATE MODAL
         ═══════════════════════════════════════════════════ -->
    <div v-if="showUpdateModal" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h2 class="modal-title">
            <span class="modal-title-icon modal-title-icon--orange">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </span>
            Role Tahrirlash
          </h2>
          <button @click="closeUpdateModal" class="modal-close">✕</button>
        </div>

        <div class="modal-body">
          <div v-if="updateLoading" class="modal-loading">
            <div class="spinner spinner-sm"></div>
            <p>Yuklanmoqda...</p>
          </div>

          <template v-else>
            <!-- Name & Code -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Role Name <span class="required">*</span></label>
                <input
                    v-model="updateForm.name"
                    type="text"
                    class="form-input"
                    placeholder="Mas: ROLE_ADMIN"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Code</label>
                <input
                    v-model="updateForm.code"
                    type="text"
                    class="form-input"
                    placeholder="Mas: ROLE_ADMIN"
                />
              </div>
            </div>

            <!-- Permissions checkboxes (pre-filled from GET) -->
            <div class="permissions-section">
              <div class="permissions-header">
                <h4 class="permissions-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Permissions
                  <span class="permissions-count">{{ updateForm.permissionIds.length }} / {{ allPermissions.length }}</span>
                </h4>
                <label class="select-all-label">
                  <input
                      type="checkbox"
                      class="checkbox-input"
                      :checked="updateForm.permissionIds.length === allPermissions.length && allPermissions.length > 0"
                      @change="toggleAllPermissions('update')"
                  />
                  <span class="select-all-text">Barchasini tanlash</span>
                </label>
              </div>

              <div class="permissions-groups">
                <div v-for="className in sortedClassNames" :key="className" class="perm-group">
                  <label class="group-header-label">
                    <input
                        type="checkbox"
                        class="checkbox-input"
                        :checked="isUpdateGroupFullySelected(className)"
                        :indeterminate="isUpdateGroupPartiallySelected(className)"
                        @change="toggleUpdateGroup(className)"
                    />
                    <span class="group-name">{{ className }}</span>
                    <span class="group-count">{{ groupedPermissions[className].length }}</span>
                  </label>

                  <div class="perm-items">
                    <label
                        v-for="perm in groupedPermissions[className]"
                        :key="perm.id"
                        class="perm-label"
                    >
                      <input
                          type="checkbox"
                          class="checkbox-input"
                          :checked="updateForm.permissionIds.includes(perm.id)"
                          @change="toggleUpdatePermission(perm.id)"
                      />
                      <span class="perm-name">{{ perm.name }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="modal-footer">
          <button @click="closeUpdateModal" class="btn-cancel" :disabled="updateLoading">Bekor</button>
          <button @click="submitUpdate" class="btn-submit btn-submit--orange" :disabled="updateLoading">
            <span v-if="updateLoading" class="btn-spinner"></span>
            <template v-else>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </template>
            Saqlash
          </button>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════
         SUCCESS / ERROR MESSAGE MODAL
         ═══════════════════════════════════════════════════ -->
    <div v-if="showMessageModal" class="modal-overlay" @click.self="closeMessageModal">
      <div class="modal modal-message">
        <div class="modal-body message-body">
          <div :class="['message-icon', `icon-${modalMessage.type}`]">
            <span v-if="modalMessage.type === 'success'">✓</span>
            <span v-else>✕</span>
          </div>
          <h3 class="message-title">{{ modalMessage.title }}</h3>
          <p class="message-text">{{ modalMessage.text }}</p>
          <button @click="closeMessageModal" class="btn-message-ok">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>



<style scoped>
/* ── Base layout ── */
.page-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  padding: 2rem;
  padding-left: 5.5rem;
}

/* ── Header ── */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem 1.75rem;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.header-left { display: flex; align-items: center; gap: 1rem; }
.page-title { display: flex; align-items: center; gap: 1rem; }
.page-title__icon {
  width: 48px; height: 48px;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px; color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  flex-shrink: 0;
}
.page-title__icon svg { width: 24px; height: 24px; }
.page-header h1 { margin: 0; color: #1a202c; font-size: 1.5rem; font-weight: 700; }

.header-actions { display: flex; align-items: center; gap: 0.75rem; }

.btn-create {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white; border: none; border-radius: 12px;
  cursor: pointer; font-weight: 600; font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  white-space: nowrap; display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.3s;
}
.btn-create svg { width: 18px; height: 18px; }
.btn-create:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-refresh {
  width: 44px; height: 44px;
  display: flex; align-items: center; justify-content: center;
  background: white; border: 2px solid #e5e7eb; border-radius: 12px;
  cursor: pointer; color: #667eea; transition: all 0.3s;
}
.btn-refresh svg { width: 20px; height: 20px; }
.btn-refresh:hover { border-color: #667eea; background: #eef2ff; transform: translateY(-2px); }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* ── Content ── */
.page-content { max-width: 1400px; margin: 0 auto; }

.loading-container {
  text-align: center; padding: 4rem 2rem;
  background: white; border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.spinner {
  width: 50px; height: 50px; margin: 0 auto 1rem;
  border: 4px solid #f0f0f0; border-top: 4px solid #667eea;
  border-radius: 50%; animation: spin 1s linear infinite;
}
.spinner-sm { width: 28px !important; height: 28px !important; margin: 0 auto 0.75rem !important; }
@keyframes spin { to { transform: rotate(360deg); } }

.error-card {
  background: white; padding: 2rem; border-radius: 16px;
  text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}
.error-card p { color: #ef4444; margin-bottom: 1rem; font-weight: 600; }
.btn-retry {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; border: none; border-radius: 10px;
  cursor: pointer; font-weight: 600; transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-retry:hover { transform: translateY(-2px); }

.content-card {
  background: white; border-radius: 16px; padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* ── Role List ── */
.roles-list { display: flex; flex-direction: column; gap: 1rem; }

.role-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.5rem 1.75rem;
  background: white; border: 2px solid #e5e7eb; border-radius: 14px;
  transition: all 0.3s; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.role-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}
.role-info { display: flex; align-items: center; gap: 1.5rem; }
.role-icon {
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transition: all 0.3s; flex-shrink: 0;
}
.role-item:hover .role-icon { transform: scale(1.05); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3); }
.role-icon svg { width: 28px; height: 28px; }
.role-details { display: flex; flex-direction: column; gap: 0.35rem; }
.role-name { margin: 0; color: #1a202c; font-size: 1.3rem; font-weight: 700; }
.role-id { margin: 0; color: #9ca3af; font-size: 0.875rem; font-weight: 500; }

.role-actions { display: flex; gap: 0.75rem; flex-shrink: 0; }

.btn-action {
  padding: 0.7rem 1.1rem; border: none; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 0.9rem;
  display: flex; align-items: center; gap: 0.45rem;
  transition: all 0.3s;
}
.btn-action svg { width: 15px; height: 15px; }

.btn-view {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-view:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

.btn-update {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.btn-update:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); }

/* ── Empty State ── */
.empty-state { text-align: center; padding: 4rem 2rem; }
.empty-icon {
  width: 80px; height: 80px; margin: 0 auto 1.5rem;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 24px;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea; box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}
.empty-icon svg { width: 40px; height: 40px; }
.empty-state h3 { color: #1a202c; margin: 0 0 0.75rem; font-size: 1.6rem; font-weight: 700; }
.empty-state p { color: #6b7280; margin: 0 0 2rem; font-size: 1.05rem; }
.btn-add-first {
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white; border: none; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 1rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.3s;
}
.btn-add-first svg { width: 18px; height: 18px; }
.btn-add-first:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }

/* ════════════════════════════════════════════════════════
   MODALS
   ════════════════════════════════════════════════════════ */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex; justify-content: center; align-items: center;
  z-index: 2000; backdrop-filter: blur(8px);
}
.modal {
  background: white; border-radius: 16px; width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  max-height: 85vh; overflow-y: auto;
  animation: modalSlideIn 0.3s ease-out;
}
@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-30px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-medium { max-width: 500px; }
.modal-large { max-width: 720px; }
.modal-message { max-width: 380px; }

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  display: flex; justify-content: space-between; align-items: center;
  position: sticky; top: 0; background: white; z-index: 10;
  border-radius: 16px 16px 0 0;
}
.modal-header h2 { margin: 0; color: #1a202c; font-size: 1.2rem; font-weight: 700; }
.modal-title { display: flex; align-items: center; gap: 0.6rem; }
.modal-title-icon {
  width: 34px; height: 34px; border-radius: 10px;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea; flex-shrink: 0;
}
.modal-title-icon svg { width: 18px; height: 18px; }
.modal-title-icon--green { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #10b981; }
.modal-title-icon--orange { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); color: #d97706; }

.modal-close {
  background: none; border: none; font-size: 1.5rem;
  cursor: pointer; color: #9ca3af; transition: all 0.3s;
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; flex-shrink: 0;
}
.modal-close:hover { color: #1a202c; background: #f3f4f6; transform: rotate(90deg); }

.modal-body { padding: 1.5rem; }
.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 2px solid #f3f4f6;
  display: flex; justify-content: flex-end; gap: 0.75rem;
  position: sticky; bottom: 0; background: white;
  border-radius: 0 0 16px 16px;
}

.modal-loading { text-align: center; padding: 2rem 0; }

/* ── Info Rows (View) ── */
.info-row {
  display: flex; justify-content: space-between; gap: 1rem;
  padding: 0.75rem 0.9rem;
  border: 2px solid #e5e7eb; border-radius: 12px;
  background: #fafafa; margin-bottom: 0.75rem;
}
.info-label { color: #6b7280; font-weight: 700; font-size: 0.9rem; }
.info-value { color: #111827; font-weight: 700; font-size: 0.95rem; }
.info-value.code { font-family: ui-monospace, Consolas, monospace; }

/* ── Form ── */
.form-row { display: flex; gap: 1rem; margin-bottom: 1.25rem; }
.form-group { flex: 1; display: flex; flex-direction: column; gap: 0.4rem; }
.form-label { color: #374151; font-weight: 600; font-size: 0.9rem; }
.form-label .required { color: #ef4444; }
.form-input {
  padding: 0.7rem 1rem;
  border: 2px solid #e5e7eb; border-radius: 10px;
  font-size: 0.95rem; color: #1a202c;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
}
.form-input:focus { border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15); }
.form-input:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }

/* ── Permissions Section ── */
.permissions-section { margin-top: 0.5rem; }
.permissions-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 1rem;
}
.permissions-title {
  margin: 0; color: #1a202c; font-size: 1rem; font-weight: 700;
  display: flex; align-items: center; gap: 0.5rem;
}
.permissions-count {
  font-size: 0.78rem; font-weight: 600;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #667eea; padding: 0.15rem 0.55rem; border-radius: 20px;
}
.no-permissions { color: #9ca3af; font-size: 0.9rem; margin: 0; font-style: italic; }

.select-all-label {
  display: flex; align-items: center; gap: 0.5rem;
  cursor: pointer; font-size: 0.875rem; color: #6b7280; font-weight: 600;
  user-select: none;
}

/* ── Checkbox Groups ── */
.permissions-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.perm-group {
  border: 2px solid #e5e7eb; border-radius: 12px;
  overflow: hidden; transition: border-color 0.2s;
}
.perm-group:hover { border-color: #c7d2fe; }

.group-header-label {
  display: flex; align-items: center; gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  background: #f8fafc; border-bottom: 2px solid #e5e7eb;
  cursor: pointer; user-select: none;
  transition: background 0.2s;
}
.group-header-label:hover { background: #eef2ff; }
.group-name { font-weight: 700; color: #1a202c; font-size: 0.9rem; flex: 1; }
.group-count {
  font-size: 0.72rem; font-weight: 700;
  background: #e0e7ff; color: #667eea;
  padding: 0.1rem 0.45rem; border-radius: 10px;
}

.perm-items { padding: 0.5rem 0.65rem; }
.perm-label {
  display: flex; align-items: center; gap: 0.55rem;
  padding: 0.38rem 0.3rem; border-radius: 6px;
  cursor: pointer; user-select: none;
  transition: background 0.15s;
  font-size: 0.85rem; color: #374151;
}
.perm-label:hover { background: #f0f4ff; }

/* ── Custom Checkbox ── */
.checkbox-input {
  -webkit-appearance: none;
  appearance: none;
  width: 18px; height: 18px; min-width: 18px;
  border: 2px solid #d1d5db; border-radius: 4px;
  background: white; cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.checkbox-input:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}
.checkbox-input:checked::after {
  content: '';
  position: absolute; left: 5px; top: 2px;
  width: 5px; height: 9px;
  border: solid white; border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.checkbox-input:indeterminate {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}
.checkbox-input:indeterminate::after {
  content: '';
  position: absolute; left: 3px; top: 7px;
  width: 10px; height: 2px;
  background: white; border-radius: 1px;
}
.checkbox-input:hover { border-color: #667eea; }

/* ── View Mode Permissions (tags) ── */
.view-permissions-groups { display: flex; flex-direction: column; gap: 0.75rem; }
.view-perm-group-title {
  font-size: 0.82rem; font-weight: 700; color: #667eea;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 0.35rem;
  padding-bottom: 0.25rem; border-bottom: 1px solid #e0e7ff;
}
.view-perm-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
.perm-tag {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  color: #4f46e5; font-size: 0.78rem; font-weight: 600;
  border-radius: 20px; border: 1px solid #c7d2fe;
}

/* ── Footer Buttons ── */
.btn-cancel {
  padding: 0.7rem 1.5rem;
  background: #f3f4f6; color: #374151;
  border: 2px solid #e5e7eb; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 0.95rem;
  transition: all 0.2s;
}
.btn-cancel:hover { background: #e5e7eb; }
.btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-submit {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; border: none; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  display: flex; align-items: center; gap: 0.5rem;
  transition: all 0.3s;
}
.btn-submit:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.btn-submit--green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.btn-submit--green:hover { box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }

.btn-submit--orange {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}
.btn-submit--orange:hover { box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4); }

.btn-spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top: 2px solid white;
  border-radius: 50%; animation: spin 0.6s linear infinite;
}

/* ── Message Modal ── */
.message-body { text-align: center; padding: 2rem 1.5rem; }
.message-icon {
  width: 70px; height: 70px; border-radius: 50%;
  margin: 0 auto 1.25rem;
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; font-weight: bold;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.icon-success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #10b981; }
.icon-error { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #ef4444; }
.message-title { color: #1a202c; font-size: 1.5rem; margin: 0 0 0.6rem; font-weight: 700; }
.message-text { color: #6b7280; font-size: 1rem; margin: 0 0 1.5rem; line-height: 1.6; }
.btn-message-ok {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white; border: none; border-radius: 10px;
  cursor: pointer; font-weight: 600; font-size: 1rem;
  min-width: 120px; transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
.btn-message-ok:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .page-container { padding: 1rem; padding-left: 1rem; }
  .page-header { flex-direction: column; gap: 1rem; padding: 1.25rem; }
  .header-actions { width: 100%; }
  .btn-create { flex: 1; justify-content: center; }
  .role-item { flex-direction: column; gap: 1.5rem; text-align: center; padding: 1.5rem; }
  .role-info { flex-direction: column; width: 100%; }
  .role-actions { width: 100%; }
  .btn-action { flex: 1; justify-content: center; }
  .modal { width: 95%; margin: 1rem; }
  .modal-footer { flex-direction: column; }
  .btn-submit, .btn-cancel { width: 100%; justify-content: center; }
  .form-row { flex-direction: column; }
  .permissions-groups { grid-template-columns: 1fr; }
}
</style>