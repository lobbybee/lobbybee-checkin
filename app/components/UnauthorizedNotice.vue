<script setup lang="ts">
import { computed } from 'vue'
import BeeLogo from '~/components/BeeLogo.vue'

const props = withDefaults(defineProps<{ variant?: 'invalid' | 'expired' }>(), { variant: 'invalid' })

const copy = computed(() =>
  props.variant === 'expired'
    ? {
        title: 'Check-in link expired',
        body: 'This check-in link has expired. Please contact reception to get a fresh link and complete your check-in.'
      }
    : {
        title: 'Check-in link not valid',
        body: 'This check-in link is missing, expired, or unauthorized. Please open the personal link from your booking confirmation, or ask reception for a fresh one.'
      }
)
</script>

<template>
  <div class="app">
    <div class="body" role="alert">
      <BeeLogo class="logo" />
      <div class="lock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10.5" width="16" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke-linecap="round" /></svg>
      </div>
      <h1>{{ copy.title }}</h1>
      <p>{{ copy.body }}</p>
    </div>
  </div>
</template>

<style scoped>
.body {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 32px calc(40px + env(safe-area-inset-bottom));
}

.logo {
  width: 70px;
  height: 70px;
  margin-bottom: 4px;
  opacity: .9;
}

.lock {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: var(--surface-2);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 14px 0 20px;
}

.lock svg {
  width: 26px;
  height: 26px;
  color: var(--muted);
}

h1 {
  margin: 0 0 10px;
  font-size: 23px;
  font-weight: 800;
  letter-spacing: -.02em;
  color: var(--fg);
}

p {
  margin: 0;
  max-width: 300px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--muted);
}
</style>
