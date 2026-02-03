import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { setupApiInterceptor } from './utils/ApiInterceptor.js'
import can from './directives/can.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// ✅ directive mount'dan oldin
app.directive('can', can)

// ✅ store endi pinia active bo'lgandan keyin ishlaydi
const authStore = useAuthStore()
authStore.checkAuth()

setupApiInterceptor()

router.beforeEach((to, from, next) => {
    // Public routes
    if (to.path === '/login' || to.path === '/register' || to.path === '/') {
        next()
        return
    }

    // ✅ Bitta joydan tekshiruv: expired + yo'q token ham shu yerda
    if (!authStore.isAuthenticated) {
        authStore.logout()
        next('/login')
        return
    }

    next()
})

app.mount('#app')
