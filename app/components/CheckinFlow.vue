<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { CheckinState } from '~/types/checkin'
import StepWelcome from '~/components/steps/StepWelcome.vue'
import StepGuests from '~/components/steps/StepGuests.vue'
import StepReview from '~/components/steps/StepReview.vue'
import StepSuccess from '~/components/steps/StepSuccess.vue'

const props = defineProps<{ token: string; apiHost: string; session: CheckinState }>()

const {
  step, guestCount, loading, actionError, completed,
  init, changeGuests, showStep,
  validateStep1, validateStep2, validateReview,
  submitPrimary, submitGuests, confirm, revokeAll
} = useCheckin()

// Seed store from the validated token session before any step renders.
init(props.session, props.apiHost, props.token)

// Bumped on a failed review validation → tells StepReview to surface field errors + focus.
const reviewTrigger = ref(0)

const segments = [1, 2, 3, 4]
const scrollEl = ref<HTMLElement | null>(null)

watch(step, () => {
  if (scrollEl.value) scrollEl.value.scrollTop = 0
})

async function advance() {
  if (loading.value) return
  if (step.value === 1) {
    if (!validateStep1()) return
    await submitPrimary()
  } else if (step.value === 2) {
    if (!validateStep2()) return
    await submitGuests()
  } else if (step.value === 3) {
    if (!validateReview()) {
      reviewTrigger.value++
      return
    }
    await confirm()
  }
}

function back() {
  if (step.value === 2) showStep(1)
  else if (step.value === 3) showStep(guestCount.value > 0 ? 2 : 1)
}

const primaryLabel = computed(() =>
  step.value === 1 ? 'Continue'
    : step.value === 2 ? 'Continue to review'
      : 'Confirm & complete check-in'
)

const waHref = 'https://wa.me/919400408414'

// Auto-redirect to the concierge chat 10s after the check-in completes.
const countdown = ref(10)
let timer: ReturnType<typeof setInterval> | undefined

watch(completed, (done) => {
  if (!done || timer) return
  timer = setInterval(() => {
    if (--countdown.value > 0) return
    clearInterval(timer)
    window.location.href = waHref
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer)
  revokeAll()
})
</script>

<template>
  <div class="app">
    <a class="wa-back" :href="waHref" rel="noopener">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      Back to WhatsApp
    </a>

    <!-- progress -->
    <div class="progress">
      <div
        v-for="i in segments"
        :key="i"
        class="seg"
        :class="{ done: i < step, active: i === step }"
      />
    </div>

    <div ref="scrollEl" class="scroll">
      <StepWelcome v-show="step === 1" @change-guests="changeGuests" />
      <StepGuests v-show="step === 2" />
      <StepReview v-show="step === 3" :error-trigger="reviewTrigger" />
      <StepSuccess v-show="step === 4" :submitting="loading" :completed="completed" />
    </div>

    <!-- footer action -->
    <div v-if="step !== 4" class="footer">
      <div v-if="actionError" class="action-error" role="alert">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" stroke-linecap="round" /></svg>
        <span>{{ actionError }}</span>
      </div>
      <div class="stack">
        <button class="btn btn-primary" :disabled="loading" @click="advance">
          <span v-if="loading" class="btn-spinner" />
          {{ loading ? 'Please wait…' : primaryLabel }}
        </button>
        <button v-if="step > 1" class="btn btn-ghost" :disabled="loading" @click="back">Back</button>
      </div>
    </div>
    <div v-else-if="completed" class="footer">
      <div class="stack">
        <a
          class="btn btn-wa"
          :href="waHref"
          rel="noopener"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.09c-.24.68-1.4 1.3-1.94 1.35-.5.05-1.13.07-1.82-.11-.42-.11-.96-.29-1.65-.59-2.9-1.25-4.79-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-2.99 0-1.42.75-2.12 1.01-2.41.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.65.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.28-.12.55.16.29.72 1.18 1.54 1.91 1.06.94 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.29.36-.24.6-.14.24.09 1.54.72 1.8.86.26.14.44.21.5.31.07.11.07.62-.17 1.3Z" /></svg>
          Continue to experience
        </a>
        <p class="wa-hint" role="status" aria-live="polite">
          Opening WhatsApp in {{ countdown }}s…
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wa-back {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px; /* .app already pads the top safe area */
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  text-decoration: none;
}

.progress {
  display: flex;
  gap: 6px;
  padding: 16px 24px 12px;
  flex: 0 0 auto;
}

.progress .seg {
  height: 5px;
  flex: 1;
  border-radius: 99px;
  background: var(--border);
  transition: background .35s ease;
}

.progress .seg.done {
  background: var(--accent);
}

.progress .seg.active {
  background: linear-gradient(90deg, var(--accent), var(--accent-soft));
}

.scroll {
  flex: 1 1 auto;
  min-height: 0; /* without this a flex child refuses to shrink and the footer gets pushed off */
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 8px;
}

.scroll::-webkit-scrollbar {
  width: 0;
}

.footer {
  flex: 0 0 auto;
  padding: 14px 20px calc(20px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), var(--surface) 30%);
}

.stack {
  display: flex;
  flex-direction: column;
}

.wa-hint {
  margin: 10px 0 0;
  text-align: center;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--muted);
}

.action-error {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--danger-soft);
  border: 1px solid #F6C9CB;
  color: #9A2A2E;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 10px;
}

.action-error svg {
  flex: 0 0 auto;
  margin-top: 1px;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid rgba(62, 48, 0, .3);
  border-top-color: var(--accent-ink);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
