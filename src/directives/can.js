import { useAuthStore } from '../stores/auth'

function norm(x) {
    return String(x ?? '').trim().toLowerCase()
}

function toArray(val) {
    if (val == null) return []
    return Array.isArray(val) ? val : [val]
}

/**
 * binding.value formatlari:
 * 1) String: v-can="'view users'"
 * 2) Array (ALL required): v-can="['view users','view dormitories']"
 * 3) Object:
 *    - any: true bo'lsa OR (kamida bittasi)
 *      v-can="{ any: ['view users','view dormitories'] }"
 *    - all: AND (hammasi)
 *      v-can="{ all: ['view users','view dormitories'] }"
 */
function evaluate(bindingValue, permissions) {
    const perms = (permissions ?? []).map(norm)

    // Object mode
    if (bindingValue && typeof bindingValue === 'object' && !Array.isArray(bindingValue)) {
        if (bindingValue.any) {
            const requiredAny = toArray(bindingValue.any).map(norm)
            return requiredAny.some(p => perms.includes(p))
        }
        if (bindingValue.all) {
            const requiredAll = toArray(bindingValue.all).map(norm)
            return requiredAll.every(p => perms.includes(p))
        }
    }

    // Default: ALL required (array yoki string)
    const required = toArray(bindingValue).map(norm)
    return required.every(p => perms.includes(p))
}

function apply(el, binding) {
    const authStore = useAuthStore()
    const ok = evaluate(binding.value, authStore.permissions)

    // ✅ remove() o‘rniga hide: reaktiv update'lar uchun xavfsizroq
    el.style.display = ok ? '' : 'none'
}

export default {
    mounted(el, binding) {
        apply(el, binding)
    },
    updated(el, binding) {
        apply(el, binding)
    }
}
