import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import HomePage from '../views/HomePage.vue'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import DashboardPage from '../views/DashboardPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import DormitoriesPage from '../views/DormitoriesPage.vue'
import DormitoryDetailPage from '../views/DormitoryDetailPage.vue'
import FloorDetailPage from '../views/FloorDetailPage.vue'
import UserPage from '../views/UserPage.vue'
import RoomTypePage from "../views/RoomTypePage.vue";
import AttendancePage from "../views/AttendancePage.vue";
import AttendanceItemPage from "../views/AttendanceItemPage.vue";

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginPage
    },
    {
        path: '/register',
        name: 'Register',
        component: RegisterPage
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: DashboardPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/settings',
        name: 'Settings',
        component: SettingsPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/dormitories',
        name: 'Dormitories',
        component: DormitoriesPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/dormitory/:id',
        name: 'DormitoryDetail',
        component: DormitoryDetailPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/floor/:id',
        name: 'FloorDetail',
        component: FloorDetailPage,
        meta: { requiresAuth: true }
    },
    {
        path: '/users',
        name: 'Users',
        component: UserPage,
        meta: { requiresAuth: true } // agar auth kerak bo'lsa
    },
    {
        path: '/room-type',
        name: 'RoomType',
        component: RoomTypePage,
        meta: { requiresAuth: true } // agar auth kerak bo'lsa
    },
    {
        path: '/attendance',
        name: 'Attendance',
        component: AttendancePage,
        meta: { requiresAuth: true } // agar auth kerak bo'lsa
    },
    {
        path: '/attendance/:id',
        name: 'AttendanceItem',
        component: AttendanceItemPage,
        meta: { requiresAuth: true }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next('/login')
    } else {
        next()
    }
})

export default router