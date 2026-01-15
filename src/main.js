import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setupApiInterceptor } from './utils/ApiInterceptor.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Auth store setup
const authStore = useAuthStore()

// App load bo'lganida token tekshir
authStore.checkAuth()

// Axios interceptor setup
setupApiInterceptor()

// Router guard setup
router.beforeEach((to, from, next) => {
    // Login va register public
    if (to.path === '/login' || to.path === '/register' || to.path === '/') {
        next()
        return
    }

    // ✅ MUHIM - Token expired tekshir
    if (authStore.isTokenExpired(authStore.token)) {
        authStore.logout()
        next('/login')
        return
    }

    // Token bo'lmasa login'ga o'tkazish
    if (!authStore.isAuthenticated) {
        next('/login')
        return
    }

    next()
})

app.mount('#app')