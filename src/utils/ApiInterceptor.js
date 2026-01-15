import axios from 'axios'
import router from '../router'

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function setupApiInterceptor() {
    // Base URL ni o'rnatish
    axios.defaults.baseURL = API_URL

    // Request interceptor - har bir so'rovga token qo'shish
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        },
        (error) => {
            return Promise.reject(error)
        }
    )

    // Response interceptor - 401, 403 xatolarni tutish
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // 401 yoki 403 bo'lsa logout qil
            if (error.response?.status === 401 || error.response?.status === 403) {
                // Token o'chir
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                localStorage.removeItem('userId')
                localStorage.removeItem('roleIds')
                localStorage.removeItem('permissionIds')

                // Login sahifasiga o'tkazish
                router.push('/login')

                // Store'ni tozalash
                const { useAuthStore } = require('../stores/auth')
                const authStore = useAuthStore()
                authStore.logout()
            }
            return Promise.reject(error)
        }
    )
}