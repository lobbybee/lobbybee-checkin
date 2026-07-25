<script setup lang="ts">
import { computed } from 'vue'
import BeeLogo from '~/components/BeeLogo.vue'
import UploadTile from '~/components/UploadTile.vue'

defineEmits<{ changeGuests: [delta: number] }>()

const { hotel, guestCount, minGuests, primary, suggestions, picked, togglePick, MAX_GUESTS } = useCheckin()

// Total companions = new IDs to upload + prior guests attached from suggestions.
const totalGuests = computed(() => guestCount.value + picked.size)
</script>

<template>
  <section>
    <div class="hero">
      <img v-if="hotel.logo_url" :src="hotel.logo_url" :alt="`${hotel.name} logo`" class="hotel-logo">
      <BeeLogo v-else />
      <div class="welcome">Welcome to</div>
      <h1>{{ hotel.name }}</h1>
      <div class="hero-city">{{ hotel.city }}</div>
      <p>Let's start your journey — a quick, contactless check-in in under a minute.</p>
    </div>

    <h2 class="title welcome-title">
      Primary guest ID <span class="req">*</span>
    </h2>
    <p class="hint welcome-hint">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="hint-ic">
        <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
        <path d="M9 20h6M10 22h4" stroke-linecap="round" />
      </svg>
      <span><b>Recommended:</b> Aadhaar, Driving Licence or Passport. Keep all four corners in frame.</span>
    </p>

    <div class="uploads">
      <UploadTile
        :state="primary.front"
        label="Front"
        sub="Required"
        missing-msg="Please add the front of your ID."
      />
      <UploadTile
        :state="primary.back"
        label="Back"
        sub="Optional"
        missing-msg=""
      />
    </div>

    <div class="card-label companions-label">Traveling companions</div>
    <div class="stepper-row">
      <div class="txt">
        <strong>Additional guests</strong>
        <span>Add each companion's ID next</span>
      </div>
      <div class="stepper">
        <button :disabled="guestCount === minGuests" aria-label="Remove guest" @click="$emit('changeGuests', -1)">−</button>
        <div class="val" aria-live="polite">{{ totalGuests }}</div>
        <button :disabled="guestCount === MAX_GUESTS" aria-label="Add guest" @click="$emit('changeGuests', 1)">+</button>
      </div>
    </div>

    <!-- prior-stay guests: attach without re-uploading -->
    <template v-if="suggestions.length">
      <div class="card-label companions-label">Traveled with you before</div>
      <p class="hint suggestion-hint">Tap to add them — no need to upload their ID again.</p>
      <button
        v-for="s in suggestions"
        :key="s.id"
        type="button"
        class="suggestion"
        :class="{ picked: picked.has(s.id) }"
        :aria-pressed="picked.has(s.id)"
        @click="togglePick(s.id)"
      >
        <img v-if="s.document_url" :src="s.document_url" alt="" class="sg-thumb">
        <span v-else class="sg-avatar">{{ (s.full_name || '?').charAt(0).toUpperCase() }}</span>
        <span class="sg-txt">
          <strong>{{ s.full_name || 'Previous guest' }}</strong>
          <small>From a previous stay</small>
        </span>
        <span class="sg-toggle">
          <svg v-if="picked.has(s.id)" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" /></svg>
          <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M12 5v14M5 12h14" stroke-linecap="round" /></svg>
          {{ picked.has(s.id) ? 'Added' : 'Add' }}
        </span>
      </button>
    </template>
  </section>
</template>

<style scoped>
.hero {
  margin: 2px -20px 18px;
  padding: 26px 24px 30px;
  background: linear-gradient(160deg, #FFE9A6 0%, #FECB14 100%);
  border-radius: 0 0 30px 30px;
  position: relative;
  overflow: hidden;
  text-align: center;
}

.hero::after {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(80% 60% at 20% 0%, rgba(255, 255, 255, .5), transparent 60%);
}

.hero :deep(.bee) {
  position: relative;
  width: 74px;
  height: 74px;
  margin: 2px auto 12px;
}

.hotel-logo {
  position: relative;
  display: block;
  width: 74px;
  height: 74px;
  margin: 2px auto 12px;
  object-fit: contain;
  border-radius: 16px;
  filter: drop-shadow(0 6px 12px rgba(120, 80, 0, .25));
}

.welcome {
  position: relative;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--accent-ink);
  opacity: .8;
  margin-bottom: 6px;
}

.hero h1 {
  position: relative;
  margin: 0;
  font-size: 29px;
  line-height: 1.12;
  font-weight: 800;
  letter-spacing: -.02em;
  color: #2A2000;
}

.hero-city {
  position: relative;
  font-size: 13.5px;
  font-weight: 600;
  color: #6A5410;
  margin-top: 3px;
}

.hero p {
  position: relative;
  margin: 10px auto 0;
  max-width: 280px;
  font-size: 15px;
  line-height: 1.45;
  color: #6A5410;
  font-weight: 500;
}

.welcome-title {
  margin-top: 14px;
  margin-bottom: 8px;
}

.welcome-title .req {
  color: var(--danger);
}

.welcome-hint {
  margin: 0 4px 14px;
}

.welcome-hint .hint-ic {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--muted);
}

.welcome-hint b {
  color: var(--fg);
}

.uploads {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.companions-label {
  margin-top: 26px;
}

.suggestion-hint {
  margin: -4px 4px 10px;
}

.suggestion {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 10px 12px;
  margin-bottom: 8px;
  cursor: pointer;
  font: inherit;
  transition: border-color .15s, background .15s;
}

.suggestion.picked {
  border-color: var(--ok);
  background: #F3FBF6;
}

.suggestion:active {
  transform: scale(.99);
}

.sg-thumb {
  width: 44px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--border);
  flex: 0 0 auto;
}

.sg-avatar {
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

.sg-txt {
  flex: 1;
  min-width: 0;
}

.sg-txt strong {
  display: block;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sg-txt small {
  font-size: 12px;
  color: var(--muted);
}

.sg-toggle {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  padding: 7px 12px;
  border-radius: 99px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--accent-ink);
}

.suggestion.picked .sg-toggle {
  background: var(--ok);
  border-color: var(--ok);
  color: #fff;
}

.stepper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 16px 18px;
  margin-top: 4px;
  box-shadow: var(--shadow);
}

.stepper-row .txt strong {
  display: block;
  font-size: 15.5px;
  font-weight: 700;
}

.stepper-row .txt span {
  font-size: 12.5px;
  color: var(--muted);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 4px;
}

.stepper button {
  width: 38px;
  height: 38px;
  border: 0;
  background: var(--surface);
  border-radius: 11px;
  font-size: 22px;
  font-weight: 500;
  color: var(--accent-ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(60, 45, 10, .12);
  transition: .15s;
}

.stepper button:active {
  transform: scale(.9);
}

.stepper button:disabled {
  opacity: .35;
  box-shadow: none;
  cursor: not-allowed;
}

.stepper button:focus-visible {
  outline: 3px solid var(--accent-ink);
  outline-offset: 2px;
}

.stepper .val {
  min-width: 34px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

@media (hover: hover) {
  .stepper button:hover:not(:disabled) {
    background: var(--accent-soft);
  }
}
</style>
