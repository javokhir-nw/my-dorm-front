import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const userId = ref(localStorage.getItem('userId') || null)
  const roleIds = ref(JSON.parse(localStorage.getItem('roleIds') || '[]'))
  const permissionIds = ref(JSON.parse(localStorage.getItem('permissionIds') || '[]'))

  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  async function login(userData) {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          password: userData.password
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { 
          success: false, 
          message: errorData.message || 'Username yoki parol noto\'g\'ri!' 
        }
      }

      const data = await response.json()
      
      // Ma'lumotlarni saqlash
      token.value = data.token
      userId.value = data.id
      roleIds.value = data.roleIds || []
      
      // Permission ID larini olish
      const permIds = data.permissions ? data.permissions.map(p => p.id) : []
      permissionIds.value = permIds
      
      user.value = {
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        telegramUsername: data.telegramUsername,
        phone: data.phone,
        roles: data.roles,
        permissions: data.permissions,
        status: data.status
      }
      
      // LocalStorage ga saqlash
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.id)
      localStorage.setItem('roleIds', JSON.stringify(data.roleIds || []))
      localStorage.setItem('permissionIds', JSON.stringify(permIds))
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true, message: 'Muvaffaqiyatli kirildi!' }
      
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: 'Server bilan bog\'lanishda xatolik yuz berdi!' 
      }
    }
  }

  async function register(userData) {
    try {
      const response = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          middleName: userData.middleName || null,
          username: userData.username,
          password: userData.password,
          telegramUsername: userData.telegramUsername || null,
          phone: userData.phone || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { 
          success: false, 
          message: errorData.message || 'Ro\'yxatdan o\'tishda xatolik!' 
        }
      }

      const data = await response.json()
      
      // Ma'lumotlarni saqlash
      token.value = data.token
      userId.value = data.id
      roleIds.value = data.roleIds || []
      
      // Permission ID larini olish
      const permIds = data.permissions ? data.permissions.map(p => p.id) : []
      permissionIds.value = permIds
      
      user.value = {
        id: data.id,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName,
        telegramUsername: data.telegramUsername,
        phone: data.phone,
        roles: data.roles,
        permissions: data.permissions,
        status: data.status
      }
      
      // LocalStorage ga saqlash
      localStorage.setItem('token', data.token)
      localStorage.setItem('userId', data.id)
      localStorage.setItem('roleIds', JSON.stringify(data.roleIds || []))
      localStorage.setItem('permissionIds', JSON.stringify(permIds))
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true, message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz!' }
      
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        message: 'Server bilan bog\'lanishda xatolik yuz berdi!' 
      }
    }
  }

  function logout() {
    token.value = null
    user.value = null
    userId.value = null
    roleIds.value = []
    permissionIds.value = []
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userId')
    localStorage.removeItem('roleIds')
    localStorage.removeItem('permissionIds')
  }

  function checkAuth() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedUserId = localStorage.getItem('userId')
    const savedRoleIds = localStorage.getItem('roleIds')
    const savedPermissionIds = localStorage.getItem('permissionIds')
    
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
      userId.value = savedUserId
      roleIds.value = JSON.parse(savedRoleIds || '[]')
      permissionIds.value = JSON.parse(savedPermissionIds || '[]')
    }
  }

  // Ilova yuklanganda tekshirish
  checkAuth()

  return {
    user,
    token,
    userId,
    roleIds,
    permissionIds,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    checkAuth
  }
})