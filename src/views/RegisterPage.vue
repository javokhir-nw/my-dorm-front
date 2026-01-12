<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/api.js'

// ==================== Composables ====================
const router = useRouter()
const authStore = useAuthStore()

// ==================== State ====================
const formData = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  username: '',
  password: '',
  confirmPassword: '',
  telegramUsername: '',
  phone: ''
})

const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Username validation state
const usernameValidation = ref({
  isChecking: false,
  isValid: false,
  error: ''
})

// ==================== Computed Properties ====================
const isFormValid = computed(() => {
  return (
      formData.value.firstName.trim() &&
      formData.value.lastName.trim() &&
      formData.value.username.trim() &&
      formData.value.password.trim() &&
      formData.value.confirmPassword.trim() &&
      usernameValidation.value.isValid &&
      !usernameValidation.value.isChecking
  )
})

const buttonText = computed(() => {
  return loading.value ? 'Yuklanmoqda...' : 'Ro\'yxatdan o\'tish'
})

const passwordStrength = computed(() => {
  const password = formData.value.password
  if (!password) return { level: 0, text: '', color: '' }

  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  if (strength <= 2) return { level: 1, text: 'Zaif', color: '#ff4757' }
  if (strength <= 3) return { level: 2, text: 'O\'rtacha', color: '#ffa502' }
  return { level: 3, text: 'Kuchli', color: '#2ecc71' }
})

const passwordsMatch = computed(() => {
  if (!formData.value.confirmPassword) return null
  return formData.value.password === formData.value.confirmPassword
})

// ==================== Username Validation ====================
let usernameCheckTimeout = null

watch(() => formData.value.username, async (newUsername) => {
  // Clear previous timeout
  if (usernameCheckTimeout) {
    clearTimeout(usernameCheckTimeout)
  }

  // Reset validation state
  usernameValidation.value.error = ''

  if (!newUsername || newUsername.length < 3) {
    usernameValidation.value.isValid = false
    usernameValidation.value.isChecking = false
    return
  }

  // Username format validation
  if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
    usernameValidation.value.isValid = false
    usernameValidation.value.error = 'Faqat harflar, raqamlar va _ belgisi'
    return
  }

  // Debounce API call
  usernameValidation.value.isChecking = true

  usernameCheckTimeout = setTimeout(async () => {
    try {
      const response = await api.get('/auth/check-exist-username', {
        params: { username: newUsername }
      })

      const isAvailable = response.data

      if (isAvailable === true) {
        usernameValidation.value.isValid = true
        usernameValidation.value.error = ''
      } else {
        usernameValidation.value.isValid = false
        usernameValidation.value.error = 'Bu username band qilingan!'
      }
    } catch (err) {
      console.error('Username tekshirishda xatolik:', err)
      usernameValidation.value.isValid = false
      usernameValidation.value.error = 'Tekshirishda xatolik yuz berdi'
    } finally {
      usernameValidation.value.isChecking = false
    }
  }, 500) // 500ms debounce
})

// ==================== Form Validation ====================
function validateForm() {
  // Required fields
  if (!formData.value.firstName.trim()) {
    error.value = 'Ismingizni kiriting!'
    return false
  }

  if (!formData.value.lastName.trim()) {
    error.value = 'Familiyangizni kiriting!'
    return false
  }

  if (!formData.value.username.trim()) {
    error.value = 'Username kiriting!'
    return false
  }

  if (!usernameValidation.value.isValid) {
    error.value = 'Username band qilingan yoki noto\'g\'ri!'
    return false
  }

  if (!formData.value.password) {
    error.value = 'Parolni kiriting!'
    return false
  }

  if (formData.value.password.length < 6) {
    error.value = 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak!'
    return false
  }

  if (!formData.value.confirmPassword) {
    error.value = 'Parolni tasdiqlang!'
    return false
  }

  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Parollar bir xil emas!'
    return false
  }

  return true
}

function clearError() {
  error.value = ''
}

// ==================== Form Submission ====================
async function handleRegister() {
  clearError()

  if (!validateForm()) {
    return
  }

  loading.value = true

  try {
    const result = await authStore.register({
      firstName: formData.value.firstName.trim(),
      lastName: formData.value.lastName.trim(),
      middleName: formData.value.middleName.trim() || undefined,
      username: formData.value.username.trim(),
      password: formData.value.password,
      telegramUsername: formData.value.telegramUsername.trim() || undefined,
      phone: formData.value.phone.trim() || undefined
    })

    if (result.success) {
      // Success - redirect to dashboard
      await router.push('/dashboard')
    } else {
      // Show error message
      error.value = result.message || 'Ro\'yxatdan o\'tishda xatolik yuz berdi'
    }
  } catch (err) {
    error.value = 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.'
    console.error('Register error:', err)
  } finally {
    loading.value = false
  }
}

// ==================== Password Visibility Toggle ====================
function togglePasswordVisibility(field) {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else {
    showConfirmPassword.value = !showConfirmPassword.value
  }
}

// ==================== Navigation ====================
function goToLogin() {
  router.push('/login')
}

function goToHome() {
  router.push('/')
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <!-- Logo Section -->
      <div class="logo">
        <button
            @click="goToHome"
            class="logo-button"
            aria-label="Bosh sahifaga qaytish"
        >
          <h1 class="project-name">
            <span class="project-icon">🏠</span>
            Mening yotoqxonam
          </h1>
        </button>
      </div>

      <!-- Header -->
      <div class="auth-header">
        <h2>Xush kelibsiz!</h2>
        <p class="subtitle">Yangi hisob yarating</p>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="auth-form" novalidate>
        <!-- Name Fields -->
        <div class="form-row">
          <div class="form-group">
            <label for="firstName">
              Ism
              <span class="required" aria-label="Majburiy maydon">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                  id="firstName"
                  v-model="formData.firstName"
                  type="text"
                  placeholder="Ismingiz"
                  class="form-input"
                  autocomplete="given-name"
                  required
                  @input="clearError"
                  :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="lastName">
              Familiya
              <span class="required" aria-label="Majburiy maydon">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input
                  id="lastName"
                  v-model="formData.lastName"
                  type="text"
                  placeholder="Familiyangiz"
                  class="form-input"
                  autocomplete="family-name"
                  required
                  @input="clearError"
                  :disabled="loading"
              />
            </div>
          </div>
        </div>

        <!-- Middle Name -->
        <div class="form-group">
          <label for="middleName">Otasining ismi</label>
          <div class="input-wrapper">
            <span class="input-icon">👤</span>
            <input
                id="middleName"
                v-model="formData.middleName"
                type="text"
                placeholder="Otangizning ismi"
                class="form-input"
                autocomplete="additional-name"
                :disabled="loading"
            />
          </div>
        </div>

        <!-- Username -->
        <div class="form-group">
          <label for="username">
            Username
            <span class="required" aria-label="Majburiy maydon">*</span>
          </label>
          <div class="input-wrapper">
            <span class="input-icon">@</span>
            <input
                id="username"
                v-model="formData.username"
                type="text"
                placeholder="Username tanlang"
                class="form-input"
                :class="{
                'input-invalid': usernameValidation.error && formData.username.length >= 3,
                'input-valid': usernameValidation.isValid && formData.username.length >= 3
              }"
                autocomplete="username"
                required
                @input="clearError"
                :disabled="loading"
            />
            <span v-if="usernameValidation.isChecking" class="validation-icon checking">
              <span class="spinner-small"></span>
            </span>
            <span
                v-else-if="usernameValidation.isValid && formData.username.length >= 3"
                class="validation-icon valid"
            >
              ✓
            </span>
            <span
                v-else-if="usernameValidation.error && formData.username.length >= 3"
                class="validation-icon invalid"
            >
              ✗
            </span>
          </div>
          <Transition name="slide-down">
            <span
                v-if="usernameValidation.error && formData.username.length >= 3"
                class="field-error"
            >
              {{ usernameValidation.error }}
            </span>
            <span
                v-else-if="usernameValidation.isValid && formData.username.length >= 3"
                class="field-success"
            >
              ✓ Username mavjud!
            </span>
          </Transition>
        </div>

        <!-- Password Fields -->
        <div class="form-row">
          <div class="form-group">
            <label for="password">
              Parol
              <span class="required" aria-label="Majburiy maydon">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Kamida 6 ta belgi"
                  class="form-input"
                  autocomplete="new-password"
                  required
                  @input="clearError"
                  :disabled="loading"
              />
              <button
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('password')"
                  :aria-label="showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                  tabindex="0"
              >
                <span v-if="showPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
            <!-- Password Strength Indicator -->
            <Transition name="slide-down">
              <div v-if="formData.password" class="password-strength">
                <div class="strength-bar">
                  <div
                      class="strength-fill"
                      :style="{
                      width: `${(passwordStrength.level / 3) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }"
                  ></div>
                </div>
                <span class="strength-text" :style="{ color: passwordStrength.color }">
                  {{ passwordStrength.text }}
                </span>
              </div>
            </Transition>
          </div>

          <div class="form-group">
            <label for="confirmPassword">
              Parolni tasdiqlang
              <span class="required" aria-label="Majburiy maydon">*</span>
            </label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input
                  id="confirmPassword"
                  v-model="formData.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Parolni qayta kiriting"
                  class="form-input"
                  :class="{
                  'input-invalid': passwordsMatch === false,
                  'input-valid': passwordsMatch === true
                }"
                  autocomplete="new-password"
                  required
                  @input="clearError"
                  :disabled="loading"
              />
              <button
                  type="button"
                  class="password-toggle"
                  @click="togglePasswordVisibility('confirm')"
                  :aria-label="showConfirmPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'"
                  tabindex="0"
              >
                <span v-if="showConfirmPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
            <Transition name="slide-down">
              <span v-if="passwordsMatch === false" class="field-error">
                ✗ Parollar bir xil emas!
              </span>
              <span v-else-if="passwordsMatch === true" class="field-success">
                ✓ Parollar bir xil
              </span>
            </Transition>
          </div>
        </div>

        <!-- Contact Fields -->
        <div class="form-row">
          <div class="form-group">
            <label for="telegramUsername">Telegram Username</label>
            <div class="input-wrapper">
              <span class="input-icon">✈️</span>
              <input
                  id="telegramUsername"
                  v-model="formData.telegramUsername"
                  type="text"
                  placeholder="@username"
                  class="form-input"
                  :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="phone">Telefon raqam</label>
            <div class="input-wrapper">
              <span class="input-icon">📱</span>
              <input
                  id="phone"
                  v-model="formData.phone"
                  type="tel"
                  placeholder="+998 90 123 45 67"
                  class="form-input"
                  autocomplete="tel"
                  :disabled="loading"
              />
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <Transition name="slide-down">
          <div v-if="error" class="error-message" role="alert">
            <span class="error-icon">⚠️</span>
            {{ error }}
          </div>
        </Transition>

        <!-- Submit Button -->
        <button
            type="submit"
            class="btn btn-primary"
            :disabled="loading || !isFormValid"
            :aria-busy="loading"
        >
          <span v-if="loading" class="btn-spinner"></span>
          <span>{{ buttonText }}</span>
        </button>
      </form>

      <!-- Footer -->
      <div class="auth-footer">
        <p>
          Hisobingiz bormi?
          <button
              @click="goToLogin"
              class="link-button"
              :disabled="loading"
          >
            Kirish
          </button>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ==================== Container ==================== */
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 1rem;
  position: relative;
}

.auth-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="none"/><circle cx="50" cy="50" r="40" fill="rgba(255,255,255,0.05)"/></svg>');
  opacity: 0.3;
  pointer-events: none;
}

/* ==================== Card ==================== */
.auth-card {
  background: white;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 650px;
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ==================== Logo Section ==================== */
.logo {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f0f0f0;
}

.logo-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.3s;
}

.logo-button:hover {
  transform: scale(1.05);
}

.logo-button:focus {
  outline: 2px solid #667eea;
  outline-offset: 4px;
  border-radius: 8px;
}

.project-name {
  color: #667eea;
  font-size: clamp(1.4rem, 3vw, 1.8rem);
  margin: 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.project-icon {
  display: inline-block;
  animation: bounce 2s infinite;
}

/* ==================== Header ==================== */
.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  color: #333;
  margin: 0 0 0.5rem 0;
  font-size: clamp(1.4rem, 2.5vw, 1.6rem);
  font-weight: 700;
}

.subtitle {
  color: #666;
  margin: 0;
  font-size: clamp(0.9rem, 1.5vw, 1rem);
}

/* ==================== Form ==================== */
.auth-form {
  margin-bottom: 1.5rem;
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
  font-weight: 600;
  font-size: 0.95rem;
}

.required {
  color: #ff4757;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  font-size: 1.2rem;
  pointer-events: none;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.6;
}

.form-input.input-invalid {
  border-color: #ff4757;
  background-color: #fff5f5;
}

.form-input.input-valid {
  border-color: #2ecc71;
  background-color: #f0fff4;
}

.form-input::placeholder {
  color: #999;
}

/* Password Toggle Button */
.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.3s;
  z-index: 2;
}

.password-toggle:hover {
  background: #f0f0f0;
}

.password-toggle:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

/* Validation Icons */
.validation-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
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

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(102, 126, 234, 0.3);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Field Messages */
.field-error {
  display: block;
  color: #ff4757;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.field-success {
  display: block;
  color: #2ecc71;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

/* Password Strength */
.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  width: 100%;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
}

.strength-text {
  font-size: 0.85rem;
  font-weight: 600;
}

/* Error Message */
.error-message {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  padding: 0.875rem 1rem;
  border-radius: 10px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-left: 4px solid #dc2626;
}

.error-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

/* Submit Button */
.btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn:hover::before {
  width: 500px;
  height: 500px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: #ccc;
}

.btn-primary:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Footer */
.auth-footer {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}

.auth-footer p {
  margin: 0;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
  font-family: inherit;
  text-decoration: none;
  transition: all 0.3s;
}

.link-button:hover:not(:disabled) {
  text-decoration: underline;
  color: #5568d3;
}

.link-button:focus {
  outline: 2px solid #667eea;
  outline-offset: 2px;
  border-radius: 2px;
}

.link-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ==================== Animations ==================== */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

/* ==================== Responsive Design ==================== */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  .form-input {
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    font-size: 0.95rem;
  }

  .input-icon {
    left: 0.875rem;
    font-size: 1.1rem;
  }

  .btn {
    padding: 0.875rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 360px) {
  .auth-card {
    padding: 1.5rem 1rem;
  }

  .logo {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }

  .auth-header {
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.25rem;
  }
}

/* ==================== Accessibility ==================== */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>