<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const firstName = ref('')
const lastName = ref('')
const middleName = ref('')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const telegramUsername = ref('')
const phone = ref('')
const error = ref('')
const loading = ref(false)

const isCheckingUsername = ref(false)
const isUsernameValid = ref(false)
const usernameError = ref('')

watch(username, async (val) => {
  if (!val || val.length < 3) {
    isUsernameValid.value = false
    usernameError.value = ''
    return
  }

  isCheckingUsername.value = true
  try {
    const res = await axios.get('/api/auth/check-exist-username', {
      params: { username: val }
    })
    if (res.data === true) {
      isUsernameValid.value = true
      usernameError.value = ''
    } else {
      isUsernameValid.value = false
      usernameError.value = 'Bu username band!'
    }
  } catch {
    isUsernameValid.value = false
    usernameError.value = 'Tekshirishda xatolik'
  } finally {
    isCheckingUsername.value = false
  }
})

async function handleRegister() {
  error.value = ''

  if (!firstName.value || !lastName.value || !username.value || !password.value || !confirmPassword.value) {
    error.value = 'Majburiy maydonlarni to‘ldiring!'
    return
  }

  if (!isUsernameValid.value) {
    error.value = 'Username noto‘g‘ri yoki band!'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Parollar mos emas'
    return
  }

  loading.value = true

  const result = await authStore.register({
    firstName: firstName.value,
    lastName: lastName.value,
    middleName: middleName.value,
    username: username.value,
    password: password.value,
    telegramUsername: telegramUsername.value,
    phone: phone.value
  })

  loading.value = false

  if (result.success) {
    router.push('/dashboard')
  } else {
    error.value = result.message
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="project-name">Mening yotoqxonam</h1>
      <p class="subtitle">Yangi hisob yarating</p>

      <form @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label>Ism *</label>
            <input v-model="firstName" type="text" />
          </div>
          <div class="form-group">
            <label>Familiya *</label>
            <input v-model="lastName" type="text" />
          </div>
        </div>

        <div class="form-group">
          <label>Otasining ismi</label>
          <input v-model="middleName" type="text" />
        </div>

        <div class="form-group">
          <label>Username *</label>
          <div class="input-with-validation">
            <input
                v-model="username"
                type="text"
                :class="{
                'input-valid': isUsernameValid,
                'input-invalid': usernameError
              }"
            />
            <span v-if="isCheckingUsername" class="icon checking">⏳</span>
            <span v-else-if="isUsernameValid" class="icon valid">✓</span>
            <span v-else-if="usernameError" class="icon invalid">✗</span>
          </div>
          <small v-if="usernameError" class="field-error">{{ usernameError }}</small>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Parol *</label>
            <input v-model="password" type="password" />
          </div>
          <div class="form-group">
            <label>Parolni tasdiqlang *</label>
            <input v-model="confirmPassword" type="password" />
          </div>
        </div>

        <div class="form-group">
          <label>Telegram</label>
          <input v-model="telegramUsername" type="text" />
        </div>

        <div class="form-group">
          <label>Telefon</label>
          <input v-model="phone" type="tel" />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

        <button
            class="btn btn-primary"
            :disabled="loading || !isUsernameValid || isCheckingUsername"
        >
          {{ loading ? 'Yuklanmoqda...' : "Ro‘yxatdan o‘tish" }}
        </button>
      </form>

      <div class="auth-footer">
        Hisobingiz bormi?
        <router-link to="/login">Kirish</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* BACKGROUND */
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background:
      linear-gradient(rgba(102,126,234,.85), rgba(118,75,162,.85)),
      url('src/images/bg.png') center / cover no-repeat;
  padding: 2rem 1rem;
}

/* CARD */
.auth-card {
  width: 100%;
  max-width: 620px;
  padding: 2.8rem;
  border-radius: 22px;
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(10px);
  color: #fff;
  box-shadow: 0 25px 60px rgba(0,0,0,.25);
  animation: fadeUp .8s ease-out both;
}

.project-name {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: .3rem;
}

.subtitle {
  text-align: center;
  opacity: .9;
  margin-bottom: 2rem;
}

/* FORM */
input,
button {
  width: 100%;
  box-sizing: border-box;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.4rem;
}

label {
  display: block;
  margin-bottom: .4rem;
}

input {
  padding: .9rem 1rem;
  border-radius: 12px;
  border: none;
  font-size: 1rem;
  background: rgba(255,255,255,.95);
  color: #333;
}

.input-with-validation {
  position: relative;
}

.icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
}

.input-valid { border: 2px solid #2ecc71; }
.input-invalid { border: 2px solid #ff4757; }

.field-error {
  font-size: .85rem;
  color: #ffd6d6;
}

/* ERROR */
.error-message {
  background: rgba(255,80,80,.18);
  padding: .75rem;
  border-radius: 10px;
  margin-bottom: 1rem;
}

/* BUTTON */
.btn-primary {
  padding: .95rem;
  border-radius: 14px;
  font-size: 1.05rem;
  font-weight: 700;
  background: linear-gradient(135deg,#fff,#f3f4ff);
  color: #5b5bd6;
  transition: .25s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg,#667eea,#764ba2);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 14px 35px rgba(102,126,234,.55);
}

.btn-primary:disabled {
  opacity: .6;
}

/* FOOTER */
.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
}

/* ANIM */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(26px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
