<script setup lang="ts">
import { computed } from 'vue'
import type { CheckinState } from '~/types/checkin'
import CheckinFlow from '~/components/CheckinFlow.vue'
import UnauthorizedNotice from '~/components/UnauthorizedNotice.vue'

const route = useRoute()
const config = useRuntimeConfig()
const apiHost = config.public.apiHost
const token = computed(() => String(route.params.token ?? ''))

// GET state on load — client-side (browser holds the token and calls the API directly).
// server:false → the request fires from the browser, so it's visible in Network and hits the API.
const { data: session, status, error } = useFetch<CheckinState>(
  () => `${apiHost}/api/chat/web-checkin/${encodeURIComponent(token.value)}/`,
  { server: false, lazy: true, transform: (res: { data: CheckinState }) => res.data }
)

// 410 → expired copy, everything else (404 / network) → generic invalid copy.
const variant = computed<'invalid' | 'expired'>(() =>
  error.value?.statusCode === 410 ? 'expired' : 'invalid'
)
</script>

<template>
  <UnauthorizedNotice v-if="status === 'error'" :variant="variant" />
  <ClientOnly v-else-if="session">
    <CheckinFlow :token="token" :api-host="apiHost" :session="session" />
    <template #fallback>
      <div class="app gate">
        <div class="spinner" />
      </div>
    </template>
  </ClientOnly>
  <div v-else class="app gate">
    <div class="spinner" />
  </div>
</template>

<style scoped>
.gate {
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: 6px solid var(--accent-soft);
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
