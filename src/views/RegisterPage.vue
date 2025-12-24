<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

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

watch(username, async (newUsername) => {
  if (!newUsername || newUsername.length < 3) {
    isUsernameValid.value = false
    usernameError.value = ''
    return
  }

  isCheckingUsername.value = true
  usernameError.value = ''

  try {
    const response = await fetch(
      `http://localhost:8080/api/auth/check-exist-username?username=${newUsername}`
    )
    
    const isAvailable = await response.json()
    
    if (isAvailable === true) {
      isUsernameValid.value = true
      usernameError.value = ''
    } else {
      isUsernameValid.value = false
      usernameError.value = 'Bu username band qilingan!'
    }
  } catch (error) {
    console.error('Username tekshirishda xatolik:', error)
    isUsernameValid.value = false
    usernameError.value = 'Tekshirishda xatolik yuz berdi'
  } finally {
    isCheckingUsername.value = false
  }
})

async function handleRegister() {
  error.value = ''
  
  if (!firstName.value || !lastName.value || !username.value || !password.value || !confirmPassword.value) {
    error.value = 'Majburiy maydonlarni to\'ldiring!'
    return
  }

  if (!isUsernameValid.value) {
    error.value = 'Username band qilingan yoki noto\'g\'ri!'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak!'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Parollar bir xil emas!'
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
      <div class="logo">
        <h1 class="project-name">🏠 Mening yotoqxonam</h1>
      </div>
      
      <h2>Ro'yxatdan o'tish</h2>
      <p class="subtitle">Yangi hisob yarating</p>

      <form @submit.prevent="handleRegister">
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">Ism <span class="required">*</span></label>
            <input
              id="firstName"
              v-model="firstName"
              type="text"
              placeholder="Ismingiz"
              required
            />
          </div>

          <div class="form-group">
            <label for="lastName">Familiya <span class="required">*</span></label>
            <input
              id="lastName"
              v-model="lastName"
              type="text"
              placeholder="Familiyangiz"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="middleName">Otasining ismi</label>
          <input
            id="middleName"
            v-model="middleName"
            type="text"
            placeholder="Otangizning ismi"
          />
        </div>

        <div class="form-group">
          <label for="username">Username <span class="required">*</span></label>
          <div class="input-with-validation">
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Username tanlang"
              :class="{ 
                'input-invalid': usernameError && username.length >= 3,
                'input-valid': isUsernameValid && username.length >= 3
              }"
              required
            />
            <span v-if="isCheckingUsername" class="validation-icon checking">⏳</span>
            <span v-else-if="isUsernameValid && username.length >= 3" class="validation-icon valid">✓</span>
            <span v-else-if="usernameError && username.length >= 3" class="validation-icon invalid">✗</span>
          </div>
          <span v-if="usernameError && username.length >= 3" class="field-error">
            {{ usernameError }}
          </span>
          <span v-else-if="isUsernameValid && username.length >= 3" class="field-success">
            Username mavjud!
          </span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">Parol <span class="required">*</span></label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Kamida 6 ta belgi"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword">Parolni tasdiqlang <span class="required">*</span></label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Parolni qayta kiriting"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="telegramUsername">Telegram Username</label>
          <input
            id="telegramUsername"
            v-model="telegramUsername"
            type="text"
            placeholder="@username"
          />
        </div>

        <div class="form-group">
          <label for="phone">Telefon raqam</label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="+998 90 123 45 67"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary" 
          :disabled="loading || !isUsernameValid || isCheckingUsername"
        >
          {{ loading ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish' }}
        </button>
      </form>

      <div class="auth-footer">
        <p>
          Hisobingiz bormi?
          <router-link to="/login">Kirish</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
}

.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
}

.logo {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.project-name {
  color: #667eea;
  font-size: 1.8rem;
  margin: 0;
  font-weight: 700;
}

h2 {
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.6rem;
  text-align: center;
}

.subtitle {
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
}

.required {
  color: #ff4757;
}

.input-with-validation {
  position: relative;
  display: flex;
  align-items: center;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.input-invalid {
  border-color: #ff4757 !important;
  background-color: #fff5f5;
}

.input-valid {
  border-color: #2ecc71 !important;
  background-color: #f0fff4;
}

.validation-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  pointer-events: none;
}

.validation-icon.checking {
  color: #667eea;
}

.validation-icon.valid {
  color: #2ecc71;
  font-weight: bold;
}

.validation-icon.invalid {
  color: #ff4757;
  font-weight: bold;
}

.field-error {
  display: block;
  color: #ff4757;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.field-success {
  display: block;
  color: #2ecc71;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.btn {
  width: 100%;
  padding: 0.875rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #ccc;
}

.auth-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>