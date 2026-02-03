import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '../router'

const API_URL = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const token = ref(localStorage.getItem('token') || null)
    const userId = ref(localStorage.getItem('userId') || null)
    const roleIds = ref(JSON.parse(localStorage.getItem('roleIds') || '[]'))
    const permissionIds = ref(JSON.parse(localStorage.getItem('permissionIds') || '[]'))
    const permissionNames = ref(JSON.parse(localStorage.getItem('permissionNames') || '[]'))

    const isAuthenticated = computed(() => !!token.value && !isTokenExpired(token.value))
    const currentUser = computed(() => user.value)

    // ✅ UI uchun bitta standart manba
    const permissions = computed(() => {
        if (Array.isArray(permissionNames.value) && permissionNames.value.length) {
            return permissionNames.value
        }
        const up = user.value?.permissions
        if (Array.isArray(up) && up.length) {
            return up.map(p => p?.name).filter(Boolean)
        }
        return []
    })

    function isTokenExpired(jwtToken) {
        if (!jwtToken) return true
        try {
            const base64Url = jwtToken.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            const decoded = JSON.parse(jsonPayload)
            const currentTime = Math.floor(Date.now() / 1000)
            return decoded.exp && decoded.exp < currentTime
        } catch (err) {
            console.error('Token decode error:', err)
            return true
        }
    }

    function handleUnauthorized() {
        logout()
        router.push('/login')
    }

    async function makeAuthenticatedRequest(url, options = {}) {
        if (isTokenExpired(token.value)) {
            handleUnauthorized()
            throw new Error('Token expired - Session ended')
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token.value}`,
                ...options.headers
            }
        })

        if (response.status === 401 || response.status === 403) {
            handleUnauthorized()
            throw new Error('Unauthorized - Session expired')
        }

        return response
    }

    async function login(userData) {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: userData.username,
                    password: userData.password
                })
            })

            if (response.status === 403) {
                return { success: false, message: 'Login yoki parol xato!' }
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                return { success: false, message: errorData.message || 'Login yoki parol xato!' }
            }

            const data = await response.json()

            token.value = data.token
            userId.value = data.id
            roleIds.value = data.roleIds || []

            const permIds = data.permissions ? data.permissions.map(p => p.id) : []
            permissionIds.value = permIds

            const permNames = data.permissions ? data.permissions.map(p => p.name) : []
            permissionNames.value = permNames

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

            localStorage.setItem('token', data.token)
            localStorage.setItem('userId', data.id)
            localStorage.setItem('roleIds', JSON.stringify(data.roleIds || []))
            localStorage.setItem('permissionIds', JSON.stringify(permIds))
            localStorage.setItem('permissionNames', JSON.stringify(permNames))
            localStorage.setItem('user', JSON.stringify(user.value))

            return { success: true, message: 'Muvaffaqiyatli kirildi!' }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, message: "Server bilan bog'lanishda xatolik yuz berdi!" }
        }
    }

    async function register(userData) {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                const errorData = await response.json().catch(() => ({}))
                return { success: false, message: errorData.message || "Ro'yxatdan o'tishda xatolik!" }
            }

            const data = await response.json()

            token.value = data.token
            userId.value = data.id
            roleIds.value = data.roleIds || []

            const permIds = data.permissions ? data.permissions.map(p => p.id) : []
            permissionIds.value = permIds

            const permNames = data.permissions ? data.permissions.map(p => p.name) : []
            permissionNames.value = permNames

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

            localStorage.setItem('token', data.token)
            localStorage.setItem('userId', data.id)
            localStorage.setItem('roleIds', JSON.stringify(data.roleIds || []))
            localStorage.setItem('permissionIds', JSON.stringify(permIds))
            localStorage.setItem('permissionNames', JSON.stringify(permNames))
            localStorage.setItem('user', JSON.stringify(user.value))

            return { success: true, message: "Muvaffaqiyatli ro'yxatdan o'tdingiz!" }
        } catch (error) {
            console.error('Register error:', error)
            return { success: false, message: "Server bilan bog'lanishda xatolik yuz berdi!" }
        }
    }

    function logout() {
        token.value = null
        user.value = null
        userId.value = null
        roleIds.value = []
        permissionIds.value = []
        permissionNames.value = []

        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userId')
        localStorage.removeItem('roleIds')
        localStorage.removeItem('permissionIds')
        localStorage.removeItem('permissionNames')
    }

    function checkAuth() {
        const savedToken = localStorage.getItem('token')
        const savedUser = localStorage.getItem('user')
        const savedUserId = localStorage.getItem('userId')
        const savedRoleIds = localStorage.getItem('roleIds')
        const savedPermissionIds = localStorage.getItem('permissionIds')
        const savedPermissionNames = localStorage.getItem('permissionNames')

        if (savedToken && savedUser) {
            if (isTokenExpired(savedToken)) {
                logout()
                return
            }

            token.value = savedToken
            user.value = JSON.parse(savedUser)
            userId.value = savedUserId
            roleIds.value = JSON.parse(savedRoleIds || '[]')
            permissionIds.value = JSON.parse(savedPermissionIds || '[]')
            permissionNames.value = JSON.parse(savedPermissionNames || '[]')
        }
    }

    checkAuth()

    return {
        // state/refs
        user,
        token,
        userId,
        roleIds,
        permissionIds,
        permissionNames,

        // computed
        isAuthenticated,
        currentUser,
        permissions,

        // actions
        login,
        register,
        logout,
        checkAuth,
        makeAuthenticatedRequest,
        isTokenExpired
    }
})
