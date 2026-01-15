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

// Axios interceptor setup - token expire bo'lsa handle qil
setupApiInterceptor()

// Router guard setup - har sahifada tekshir
router.beforeEach((to, from, next) => {
    // Login sahifasi public
    if (to.path === '/login' || to.path === '/register') {
        next()
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