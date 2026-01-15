import axios from 'axios'
import { useAuthStore } from '../stores/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function setupApiInterceptor() {
    axios.defaults.baseURL = API_URL

    // Request interceptor
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token')
            if (token) {
                config.headers.Authorization = `Bearer ${token}`
            }
            return config
        },
        (error) => Promise.reject(error)
    )

    // Response interceptor
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401 || error.response?.status === 403) {
                const authStore = useAuthStore()
                authStore.logout()
                // Router.push('/login') automatik bo'ladi auth guard da
            }
            return Promise.reject(error)
        }
    )
}