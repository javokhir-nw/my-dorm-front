import { useAuthStore } from '../stores/auth'
import router from '../router'

export function setupApiInterceptor() {
    const originalFetch = window.fetch

    window.fetch = async function(...args) {
        const response = await originalFetch(...args)

        // Agar 403 xatosi bo'lsa
        if (response.status === 403) {
            const authStore = useAuthStore()

            // Barcha ma'lumotlarni tozalash
            authStore.logout()

            // Login sahifasiga yo'naltirish
            router.push('/login')

            // Xabar ko'rsatish (optional)
            console.warn('Session expired. Please login again.')
        }

        return response
    }
}