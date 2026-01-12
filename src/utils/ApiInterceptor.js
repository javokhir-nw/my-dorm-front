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

    // Response interceptor - 401 xatolarni tutish
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token muddati tugagan yoki noto'g'ri
                localStorage.removeItem('token')
                localStorage.removeItem('user')
                router.push('/login')
            }
            return Promise.reject(error)
        }
    )
}