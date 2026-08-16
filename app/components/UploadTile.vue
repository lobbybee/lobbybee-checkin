<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'
import { assignFile, clearSlot, type FileSlot } from '~/composables/useCheckin'

const props = defineProps<{
  state: FileSlot
  label: string
  sub: string
  /** Shown when the tile is required-but-empty after a validation attempt. */
  missingMsg: string
  /** Full width (single-column guest doc) vs. half (front/back grid). */
  full?: boolean
}>()

const inputId = useId()
const galleryEl = useTemplateRef<HTMLInputElement>('gallery')
const cameraEl = useTemplateRef<HTMLInputElement>('camera')

const message = computed(() => props.state.error || (props.state.missing ? props.missingMsg : ''))
const bad = computed(() => !!props.state.error || props.state.missing)

async function onChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = '' // allow re-selecting the same file after a removal
  await assignFile(props.state, file)
}

function onRemove(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  clearSlot(props.state)
}
</script>

<template>
  <div>
    <label
      class="tile"
      :class="{ filled: state.url, err: bad, full }"
      :for="inputId"
    >
      <input
        :id="inputId"
        ref="gallery"
        type="file"
        accept="image/*"
        class="sr-file"
        :disabled="state.busy"
        :aria-label="`${label} of ID document`"
        @change="onChange"
      >
      <!-- Touch devices get an explicit camera path; desktop has no camera, so it stays hidden. -->
      <input
        ref="camera"
        type="file"
        accept="image/*"
        capture="environment"
        class="sr-file"
        :disabled="state.busy"
        :aria-label="`Take a photo of the ${label.toLowerCase()} of ID document`"
        @change="onChange"
      >
      <div v-if="state.busy" class="busy">
        <div class="spinner" />
        <div class="cap">
          Compressing…
        </div>
      </div>
      <svg v-if="!state.url" class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 8l1.5-2.5A2 2 0 0 1 7.2 4.5h9.6a2 2 0 0 1 1.7 1L20 8" stroke-linecap="round" />
        <rect x="2.5" y="7.5" width="19" height="12" rx="3" />
        <circle cx="12" cy="13.5" r="3.4" />
      </svg>
      <div v-if="!state.url" class="cap">
        {{ label }}<small>{{ sub }}</small>
      </div>
      <div v-if="!state.url" class="picks">
        <button type="button" class="pick" :disabled="state.busy" @click.stop.prevent="cameraEl?.click()">
          Camera
        </button>
        <button type="button" class="pick" :disabled="state.busy" @click.stop.prevent="galleryEl?.click()">
          Files
        </button>
      </div>

      <img v-if="state.url" :src="state.url" alt="">
      <button v-if="state.url" type="button" class="remove" aria-label="Remove photo" @click="onRemove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
      <span v-if="state.url" class="badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
        </svg>{{ label }}
      </span>
    </label>

    <div v-if="message" class="err-msg" role="alert">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" stroke-linecap="round" />
      </svg>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<style scoped>
.tile {
  position: relative;
  aspect-ratio: 1.55 / 1;
  border-radius: 18px;
  border: 2px dashed var(--border);
  background: var(--surface-2);
  cursor: pointer;
  overflow: hidden;
  transition: .22s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 10px;
}

.tile:active {
  transform: scale(.98);
}

.tile .ic {
  width: 30px;
  height: 30px;
  color: var(--accent-ink);
  opacity: .75;
}

.tile .cap {
  font-size: 13px;
  font-weight: 600;
  color: var(--fg);
}

.tile .cap small {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  margin-top: 2px;
}

/* Covers the preview/prompt while the picked image is re-encoded. */
.tile .busy {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: var(--surface-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tile .spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 3px solid var(--accent-soft);
  border-top-color: var(--accent);
  animation: tile-spin .8s linear infinite;
}

@keyframes tile-spin {
  to {
    transform: rotate(360deg);
  }
}

.tile img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tile .remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(20, 16, 10, .6);
  backdrop-filter: blur(6px);
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tile .remove svg {
  width: 13px;
  height: 13px;
  color: #fff;
}

.tile.filled {
  border-style: solid;
  border-color: var(--ok);
}

.tile .badge {
  position: absolute;
  left: 8px;
  bottom: 8px;
  background: rgba(20, 16, 10, .62);
  backdrop-filter: blur(6px);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 99px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tile .badge svg {
  width: 12px;
  height: 12px;
  color: #7CF0AE;
}

.tile.err {
  border-color: var(--danger);
  background: var(--danger-soft);
  animation: shake .4s;
}

.tile.err .ic {
  color: var(--danger);
  opacity: 1;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.err-msg {
  display: flex;
  color: var(--danger);
  font-size: 12.5px;
  font-weight: 600;
  margin: 9px 4px 0;
  align-items: center;
  gap: 6px;
}

.picks {
  display: none;
  gap: 8px;
}

/* Touch-only: a phone has a camera, a desktop label-tap already opens the file dialog. */
@media (pointer: coarse) {
  .picks {
    display: flex;
  }
}

.pick {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--fg);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 99px;
  cursor: pointer;
}

.pick:active {
  background: var(--accent-soft);
}

.sr-file {
  position: absolute;
  top: 0;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.tile:focus-within {
  outline: 3px solid var(--accent-ink);
  outline-offset: 2px;
}

@media (hover: hover) {
  .tile:hover {
    border-color: var(--accent);
    background: #FFFDF5;
  }

  .tile.filled:hover {
    border-color: var(--ok);
  }
}
</style>
