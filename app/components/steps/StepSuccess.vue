<script setup lang="ts">
defineProps<{ submitting: boolean; completed: boolean }>()
</script>

<template>
  <section>
    <div v-if="submitting || !completed" class="final" role="status" aria-live="polite">
      <div class="spinner" />
      <h2>Submitting your check-in…</h2>
      <p>Saving your documents and notifying reception. This only takes a moment.</p>
    </div>

    <div v-else class="final" role="status" aria-live="polite">
      <div class="success-mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </div>
      <h2>You're all checked in!</h2>
      <p>Check-in submitted to reception. They'll have your keys ready, and our concierge is standing by on WhatsApp.</p>
      <div class="keychip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="15" r="4" /><path d="M11 12l8-8 2 2-2 2 2 2-2 2-3-3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        Reception notified · Concierge on WhatsApp
      </div>
    </div>
  </section>
</template>

<style scoped>
.final {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100%;
  padding: 30px 26px;
}

.spinner {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  border: 6px solid var(--accent-soft);
  border-top-color: var(--accent);
  animation: spin 1s linear infinite;
  margin-bottom: 26px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.final h2 {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -.02em;
  margin: 0 0 8px;
}

.final p {
  font-size: 15px;
  color: var(--muted);
  line-height: 1.5;
  margin: 0;
  max-width: 270px;
}

.success-mark {
  width: 104px;
  height: 104px;
  border-radius: 50%;
  background: linear-gradient(160deg, #4FD48A, #2FA36B);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 14px 34px rgba(47, 163, 107, .4);
  animation: pop .5s cubic-bezier(.2, 1.3, .4, 1) both;
}

.success-mark svg {
  width: 52px;
  height: 52px;
  color: #fff;
}

@keyframes pop {
  0% {
    transform: scale(.4);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.keychip {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 13.5px;
  color: var(--fg);
  font-weight: 600;
}

.keychip svg {
  width: 18px;
  height: 18px;
  color: var(--accent-ink);
}
</style>
