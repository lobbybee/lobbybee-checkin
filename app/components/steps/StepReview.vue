<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps<{ errorTrigger: number }>()

const { guest, accompanying, primary, guestDocs, suggestions, picked } = useCheckin()

// Prior-stay guests the user chose to attach (read-only in review).
const pickedSuggestions = computed(() => suggestions.filter(s => picked.has(s.id)))

const root = ref<HTMLElement | null>(null)
// Only surface required-field errors after the user tries to confirm.
const showErrors = ref(false)

watch(
  () => props.errorTrigger,
  async () => {
    showErrors.value = true
    await nextTick()
    root.value?.querySelector<HTMLInputElement>('.field.bad input')?.focus()
  }
)

const bad = (value: string) => showErrors.value && !value.trim()
</script>

<template>
  <section ref="root">
    <h2 class="title review-title">Review your details</h2>
    <p class="sub">Check what we read from your documents. Tap any field to correct it before we finish.</p>

    <!-- Primary guest -->
    <div class="review-card">
      <div class="rev-head">
        <div class="avatar">1</div>
        <div class="rt">
          <strong>Primary guest</strong>
          <span>Document details</span>
        </div>
        <span class="doc-chip">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" stroke-linecap="round" /><path d="M4 12h16" stroke-linecap="round" /></svg>
          Auto-detected
        </span>
      </div>

      <div v-if="primary.front.url || primary.back.url" class="rev-thumbs">
        <img v-if="primary.front.url" class="rev-thumb" alt="ID front" :src="primary.front.url">
        <img v-if="primary.back.url" class="rev-thumb" alt="ID back" :src="primary.back.url">
      </div>

      <div class="ocr-flag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" stroke-linecap="round" /></svg>
        We couldn't read every field automatically. Please confirm the details below.
      </div>

      <div class="field" :class="{ bad: bad(guest.full_name) }">
        <label for="pf-name">Full name *</label>
        <input id="pf-name" v-model="guest.full_name" type="text" :class="{ bad: bad(guest.full_name) }" placeholder="As printed on your ID">
        <div class="fld-err">This field is required.</div>
      </div>

      <div class="grid2">
        <div class="field">
          <label for="pf-dob">Date of birth</label>
          <input id="pf-dob" v-model="guest.date_of_birth" type="date">
        </div>
        <div class="field">
          <label for="pf-nat">Nationality</label>
          <input id="pf-nat" v-model="guest.nationality" type="text" placeholder="e.g. IN">
        </div>
      </div>

      <div class="field" :class="{ bad: bad(guest.document_number) }">
        <label for="pf-num">Document number *</label>
        <input id="pf-num" v-model="guest.document_number" type="text" :class="{ bad: bad(guest.document_number) }" placeholder="ID / document number">
        <div class="fld-err">This field is required.</div>
      </div>
    </div>

    <!-- Accompanying guests -->
    <div v-for="(g, i) in accompanying" :key="i" class="review-card">
      <div class="rev-head">
        <div class="avatar">{{ i + 2 }}</div>
        <div class="rt">
          <strong>Guest {{ i + 2 }}</strong>
          <span>Accompanying guest</span>
        </div>
      </div>

      <div v-if="guestDocs[i]?.url" class="rev-thumbs">
        <img class="rev-thumb" :alt="`Guest ${i + 2} ID`" :src="guestDocs[i]!.url!">
      </div>

      <div class="field" :class="{ bad: bad(g.full_name) }">
        <label :for="`g${i}-name`">Full name *</label>
        <input :id="`g${i}-name`" v-model="g.full_name" type="text" :class="{ bad: bad(g.full_name) }" placeholder="As printed on the ID">
        <div class="fld-err">This field is required.</div>
      </div>

      <div class="field">
        <label :for="`g${i}-num`">Document number</label>
        <input :id="`g${i}-num`" v-model="g.document_number" type="text" placeholder="ID / document number">
      </div>
    </div>

    <!-- Attached from previous stays (read-only) -->
    <div v-for="s in pickedSuggestions" :key="`s-${s.id}`" class="review-card">
      <div class="rev-head">
        <img v-if="s.document_url" :src="s.document_url" alt="" class="sg-thumb">
        <div v-else class="avatar">{{ (s.full_name || '?').charAt(0).toUpperCase() }}</div>
        <div class="rt">
          <strong>{{ s.full_name || 'Previous guest' }}</strong>
          <span>Added from a previous stay</span>
        </div>
        <span class="doc-chip">Attached</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.review-title {
  margin-top: 8px;
}

.review-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 16px 16px 18px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.rev-head {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 6px;
}

.sg-thumb {
  width: 44px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(160deg, var(--accent-soft), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: var(--accent-ink);
  font-size: 16px;
  flex: 0 0 auto;
}

.rt {
  flex: 1;
  min-width: 0;
}

.rt strong {
  font-size: 16px;
  font-weight: 800;
  display: block;
}

.rt span {
  font-size: 12.5px;
  color: var(--muted);
}

.doc-chip {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
  color: var(--accent-ink);
  background: var(--accent-soft);
  border-radius: 99px;
  padding: 4px 10px;
}

.rev-thumbs {
  display: flex;
  gap: 8px;
  margin: 12px 0 4px;
}

.rev-thumb {
  width: 64px;
  height: 42px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.field {
  margin-top: 12px;
}

.field label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 2px 5px;
}

.field input {
  width: 100%;
  height: 46px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface-2);
  padding: 0 14px;
  font: inherit;
  font-size: 16px; /* <16px makes iOS Safari zoom the whole page on focus */
  font-weight: 500;
  color: var(--fg);
  transition: border-color .15s, box-shadow .15s, background .15s;
}

.field input::placeholder {
  color: #B4A896;
}

.field input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-soft);
  background: var(--surface);
}

.field input.bad {
  border-color: var(--danger);
  background: var(--danger-soft);
}

.fld-err {
  display: none;
  color: var(--danger);
  font-size: 12px;
  font-weight: 600;
  margin: 5px 2px 0;
}

.field.bad .fld-err {
  display: block;
}

.grid2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ocr-flag {
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
  margin: 12px 0 2px;
}

.ocr-flag svg {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  margin-top: 1px;
}
</style>
