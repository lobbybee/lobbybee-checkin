import { reactive, ref } from 'vue'
import type { CheckinState, Guest, Suggestion } from '~/types/checkin'
import {
  ApiError,
  uploadPrimary,
  patchPrimary,
  uploadAccompanying,
  patchAccompanying,
  completeCheckin
} from '~/utils/checkinApi'

// API rejects images > 5 MB (413); we pre-check to avoid the round-trip.
const MAX_BYTES = 5 * 1024 * 1024
const MAX_GUESTS = 6

/** A single upload tile's state (client preview + upload tracking). */
export interface FileSlot {
  file: File | null
  url: string | null
  error: string | null
  missing: boolean
  /** True once this exact file has been POSTed to the server. */
  uploaded: boolean
}

const newSlot = (): FileSlot => reactive({ file: null, url: null, error: null, missing: false, uploaded: false })

/** Drop empty-string keys so PATCH only sends fields the user actually provided. */
function pruneEmpty<T extends Record<string, string>>(obj: T): Partial<T> {
  const out: Partial<T> = {}
  for (const k in obj) {
    if (obj[k]) out[k] = obj[k]
  }
  return out
}

/** Put a file into a slot, validating type + size. Resets its uploaded flag. */
export function assignFile(slot: FileSlot, file: File | null): boolean {
  if (!file) return false
  if (file.type.indexOf('image/') !== 0) {
    slot.error = "That file isn't an image — please upload a photo."
    return false
  }
  if (file.size > MAX_BYTES) {
    slot.error = 'Image is over 5 MB — please use a smaller photo.'
    return false
  }
  if (slot.url) URL.revokeObjectURL(slot.url)
  slot.file = file
  slot.url = URL.createObjectURL(file)
  slot.error = null
  slot.missing = false
  slot.uploaded = false
  return true
}

export function clearSlot(slot: FileSlot): void {
  // Only object URLs need revoking; a remote server URL is a harmless no-op.
  if (slot.url && slot.url.startsWith('blob:')) URL.revokeObjectURL(slot.url)
  slot.file = null
  slot.url = null
  slot.error = null
  slot.missing = false
  slot.uploaded = false
}

/** Show an already-uploaded document from its server URL (no local File). */
function preloadSlot(slot: FileSlot, url: string | null): void {
  slot.file = null
  // Resolve relative media paths (e.g. /media/…) against the API host.
  slot.url = url && !/^https?:\/\//.test(url) ? apiHost + url : url
  slot.error = null
  slot.missing = false
  slot.uploaded = true // exists server-side; don't force a re-upload
}

/** True if a slot has a document — a freshly picked File or one already on the server. */
export function slotHasDoc(slot: FileSlot): boolean {
  return !!(slot.file || slot.url || slot.uploaded)
}

/** Review model for one accompanying guest (id resolves the PATCH target). */
interface GuestReview {
  id: number
  full_name: string
  document_number: string
}

// ---------- singleton store (one client session) ----------
let apiHost = ''
let token = ''

const step = ref(1)
const guestCount = ref(0)
// Companions already uploaded on the server — the stepper can't go below this (no delete endpoint).
const minGuests = ref(0)
const loading = ref(false)
const actionError = ref<string | null>(null)
const completed = ref(false)

const hotel = reactive({ name: '', city: '', logo_url: null as string | null })
// Editable review values (primary). document_number lives on the document but is edited here.
const guest = reactive({ full_name: '', date_of_birth: '', nationality: '', document_number: '' })
const accompanying = reactive<GuestReview[]>([])

const primary = reactive({ front: newSlot(), back: newSlot() })
const guestDocs = reactive<FileSlot[]>([])

// Prior-stay guests offered for one-tap attach, and the ids the user picked.
const suggestions = reactive<Suggestion[]>([])
const picked = reactive(new Set<number>())

function seedPrimaryReview(g: Guest, documentNumber: string) {
  guest.full_name = g.full_name || ''
  guest.date_of_birth = g.date_of_birth || ''
  guest.nationality = g.nationality || ''
  guest.document_number = documentNumber || ''
}

function seedAccompanyingReview(state: CheckinState) {
  accompanying.splice(0)
  for (const a of state.accompanying_guests) {
    accompanying.push({ id: a.id, full_name: a.full_name || '', document_number: a.document_number || '' })
  }
}

/** Grow/shrink the companion upload slots to match the stepper. */
function syncGuestSlots() {
  while (guestDocs.length < guestCount.value) guestDocs.push(newSlot())
  while (guestDocs.length > guestCount.value) clearSlot(guestDocs.pop()!)
}

export function useCheckin() {
  /** Seed from the validated GET state. completed → jump straight to the read-only success screen. */
  function init(state: CheckinState, host: string, tok: string) {
    apiHost = host
    token = tok
    loading.value = false
    actionError.value = null
    Object.assign(hotel, state.hotel)
    seedPrimaryReview(state.guest, state.primary_document?.document_number ?? '')
    seedAccompanyingReview(state)

    // Hydrate the primary tiles from any already-uploaded images.
    clearSlot(primary.front)
    clearSlot(primary.back)
    if (state.primary_document) {
      preloadSlot(primary.front, state.primary_document.front_url)
      if (state.primary_document.back_url) preloadSlot(primary.back, state.primary_document.back_url)
    }

    // One companion tile per existing guest, pre-filled with its uploaded doc.
    guestDocs.splice(0)
    for (const a of state.accompanying_guests) {
      const slot = newSlot()
      preloadSlot(slot, a.document_url)
      guestDocs.push(slot)
    }
    guestCount.value = state.accompanying_guests.length
    minGuests.value = state.accompanying_guests.length

    // Prior-stay suggestions (reset picks each session).
    suggestions.splice(0, suggestions.length, ...(state.accompanying_suggestions ?? []))
    picked.clear()

    completed.value = state.completed
    step.value = state.completed ? 4 : 1
  }

  function togglePick(id: number) {
    if (picked.has(id)) picked.delete(id)
    else picked.add(id)
  }

  function changeGuests(delta: number) {
    guestCount.value = Math.max(minGuests.value, Math.min(MAX_GUESTS, guestCount.value + delta))
    syncGuestSlots()
  }

  function showStep(n: number) {
    step.value = n
  }

  // ---------- client-side validation (avoids needless API calls) ----------
  function validateStep1(): boolean {
    const ok = slotHasDoc(primary.front)
    primary.front.missing = !ok
    return ok
  }

  function validateStep2(): boolean {
    let ok = true
    for (const slot of guestDocs) {
      if (!slotHasDoc(slot)) {
        slot.missing = true
        ok = false
      }
    }
    return ok
  }

  function validateReview(): boolean {
    let ok = true
    if (!guest.full_name.trim()) ok = false
    if (!guest.document_number.trim()) ok = false
    for (const g of accompanying) {
      if (!g.full_name.trim()) ok = false
    }
    return ok
  }

  /** Shared failure handling: 409 = already completed → show success; else surface the message. */
  function handleError(err: unknown): void {
    if (err instanceof ApiError && err.status === 409) {
      completed.value = true
      step.value = 4
      return
    }
    actionError.value = err instanceof ApiError ? err.message : 'Network error — please try again.'
  }

  // ---------- step actions (server sync) ----------

  /** POST primary-doc (unless the current file was already uploaded), then advance. */
  async function submitPrimary(): Promise<void> {
    const needUpload = !primary.front.uploaded || (!!primary.back.file && !primary.back.uploaded)
    if (!needUpload) {
      showStep(guestCount.value > 0 ? 2 : 3)
      return
    }
    loading.value = true
    actionError.value = null
    try {
      const result = await uploadPrimary(apiHost, token, primary.front.file!, primary.back.file)
      seedPrimaryReview(result.guest, result.document.document_number)
      primary.front.uploaded = true
      primary.back.uploaded = !!primary.back.file
      showStep(guestCount.value > 0 ? 2 : 3)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** POST accompanying-doc for each new companion image, then advance. */
  async function submitGuests(): Promise<void> {
    loading.value = true
    actionError.value = null
    try {
      let latest: CheckinState | null = null
      for (const slot of guestDocs) {
        if (slot.file && !slot.uploaded) {
          latest = await uploadAccompanying(apiHost, token, slot.file)
          slot.uploaded = true
        }
      }
      if (latest) seedAccompanyingReview(latest)
      showStep(3)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  /** PATCH corrections (primary + each companion) then POST complete. Omits empty optionals. */
  async function confirm(): Promise<void> {
    loading.value = true
    actionError.value = null
    try {
      await patchPrimary(apiHost, token, pruneEmpty({
        full_name: guest.full_name.trim(),
        date_of_birth: guest.date_of_birth.trim(),
        nationality: guest.nationality.trim(),
        document_number: guest.document_number.trim()
      }))
      for (const g of accompanying) {
        await patchAccompanying(apiHost, token, g.id, pruneEmpty({
          full_name: g.full_name.trim(),
          document_number: g.document_number.trim()
        }))
      }
      await completeCheckin(apiHost, token, [...picked])
      completed.value = true
      showStep(4)
    } catch (err) {
      handleError(err)
    } finally {
      loading.value = false
    }
  }

  function revokeAll() {
    clearSlot(primary.front)
    clearSlot(primary.back)
    guestDocs.forEach(clearSlot)
  }

  return {
    // state
    step,
    guestCount,
    minGuests,
    loading,
    actionError,
    completed,
    hotel,
    guest,
    accompanying,
    primary,
    guestDocs,
    suggestions,
    picked,
    MAX_GUESTS,
    // actions
    init,
    togglePick,
    changeGuests,
    showStep,
    validateStep1,
    validateStep2,
    validateReview,
    submitPrimary,
    submitGuests,
    confirm,
    revokeAll
  }
}
