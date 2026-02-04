<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''

  if (!username.value || !password.value) {
    error.value = 'Username va parolni kiriting!'
    return
  }

  loading.value = true

  const result = await authStore.login({
    username: username.value,
    password: password.value
  })

  loading.value = false

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message || 'Kirishda xatolik yuz berdi'
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="project-name">Mening yotoqxonam</h1>
      <p class="subtitle">Hisobingizga kiring</p>

      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Username</label>
          <input
              v-model="username"
              type="text"
              placeholder="Username kiriting"
          />
        </div>

        <div class="form-group">
          <label>Parol</label>
          <input
              v-model="password"
              type="password"
              placeholder="Parolingizni kiriting"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Yuklanmoqda...' : 'Kirish' }}
        </button>
      </form>

      <div class="auth-footer">
        Hisobingiz yo‘qmi?
        <router-link to="/register">Ro‘yxatdan o‘ting</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* =====================
   PAGE BACKGROUND
===================== */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;

  background:
      linear-gradient(
          rgba(102, 126, 234, 0.85),
          rgba(118, 75, 162, 0.85)
      ),
      url('src/images/bg.png') center / cover no-repeat;
}

/* =====================
   CARD
===================== */
.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.8rem 2.5rem;

  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  border-radius: 20px;

  color: white;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);

  animation: fadeUp 0.8s ease-out both;
}

/* =====================
   TITLE
===================== */
.project-name {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 6px 25px rgba(0, 0, 0, 0.35);
}

.subtitle {
  text-align: center;
  opacity: 0.9;
  margin-bottom: 2.2rem;
}

/* =====================
   FORM CONTROLS (MUHIM)
===================== */
input,
button {
  width: 100%;
  box-sizing: border-box;
}

.form-group {
  margin-bottom: 1.4rem;
}

label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.95rem;
}

input {
  padding: 0.9rem 1rem;
  border-radius: 12px;
  border: none;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
}

input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.35);
}

/* =====================
   ERROR
===================== */
.error-message {
  background: rgba(255, 80, 80, 0.18);
  color: #ffd6d6;
  padding: 0.75rem;
  border-radius: 10px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

/* =====================
   BUTTON (KUCHLI)
===================== */
.btn {
  padding: 0.95rem;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary {
  background: linear-gradient(
      135deg,
      #ffffff,
      #f3f4ff
  );
  color: #5b5bd6;

  box-shadow:
      0 8px 25px rgba(255, 255, 255, 0.35),
      inset 0 0 0 1px rgba(102, 126, 234, 0.25);

  transition:
      transform 0.25s ease,
      box-shadow 0.25s ease,
      background 0.25s ease,
      color 0.25s ease;
}


.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);

  background: linear-gradient(
      135deg,
      #667eea,
      #764ba2
  );

  color: #ffffff;

  box-shadow:
      0 14px 35px rgba(102, 126, 234, 0.55);
}


.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* =====================
   FOOTER
===================== */
.auth-footer {
  margin-top: 1.6rem;
  text-align: center;
  font-size: 0.95rem;
  opacity: 0.9;
}

.auth-footer a {
  color: #fff;
  font-weight: 600;
  text-decoration: underline;
}

/* =====================
   ANIMATION
===================== */
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(26px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =====================
   MOBILE
===================== */
@media (max-width: 480px) {
  .auth-card {
    padding: 2.2rem 1.8rem;
  }

  .project-name {
    font-size: 1.7rem;
  }
}
</style>
