// Real Web Check-in API client. Pure functions — pass apiHost in (no Nuxt context needed),
// so this stays testable and callable from anywhere.
//
// Base: {apiHost}/api/chat/web-checkin/<token>/   ·   auth = the <token> in the URL only.
// Every response uses the envelope { success, message, data }.

import type {
  CheckinState,
  PrimaryUploadResult,
  PrimaryCorrections
} from '~/types/checkin'

interface Envelope<T> {
  success: boolean
  message: string
  data: T
}

/** All paths in one place — a wrong path here is a one-line fix. */
const base = (apiHost: string, token: string) =>
  `${apiHost}/api/chat/web-checkin/${encodeURIComponent(token)}`

const ENDPOINTS = {
  state: (h: string, t: string) => `${base(h, t)}/`,
  primary: (h: string, t: string) => `${base(h, t)}/primary-doc/`,
  accompanying: (h: string, t: string) => `${base(h, t)}/accompanying-doc/`,
  accompanyingDoc: (h: string, t: string, id: number) => `${base(h, t)}/accompanying-doc/${id}/`,
  complete: (h: string, t: string) => `${base(h, t)}/complete/`
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Friendly fallback per status when the envelope carries no message.
const STATUS_MESSAGE: Record<number, string> = {
  400: 'Please add the required document.',
  404: "We couldn't find this check-in link.",
  409: 'This check-in has already been completed.',
  410: 'This check-in link has expired. Please contact reception.',
  413: 'Image is over 5 MB — please use a smaller photo.',
  415: "That file isn't an image — please upload a photo.",
  429: 'Too many requests — please wait a moment and try again.',
  500: "Something went wrong on our side. Please try again."
}

// ofetch throws FetchError on non-2xx; the parsed envelope is on err.data.
function toApiError(err: unknown): ApiError {
  const e = err as { status?: number, statusCode?: number, data?: { message?: string } }
  const status = e.statusCode ?? e.status ?? 0
  const message = e.data?.message || STATUS_MESSAGE[status] || 'Network error — please try again.'
  return new ApiError(status, message)
}

/** Build multipart FormData from a fields object. The server's PATCH accepts form, not JSON. */
function toForm(fields: Record<string, string | undefined>): FormData {
  const form = new FormData()
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) form.append(k, v)
  }
  return form
}

async function request<T>(url: string, opts: Parameters<typeof $fetch>[1]): Promise<T> {
  try {
    const res = await $fetch<Envelope<T>>(url, opts)
    return res.data
  } catch (err) {
    throw toApiError(err)
  }
}

// ---------- endpoints ----------

/** GET state. Throws ApiError (404 invalid, 410 expired) so the page can gate on it. */
export function getState(apiHost: string, token: string): Promise<CheckinState> {
  return request<CheckinState>(ENDPOINTS.state(apiHost, token), { method: 'GET' })
}

/** POST primary-doc — upload front (required) + optional back, run OCR. */
export function uploadPrimary(
  apiHost: string,
  token: string,
  front: File,
  back: File | null
): Promise<PrimaryUploadResult> {
  const form = new FormData()
  form.append('front', front)
  if (back) form.append('back', back)
  return request<PrimaryUploadResult>(ENDPOINTS.primary(apiHost, token), { method: 'POST', body: form })
}

/** PATCH primary-doc — correct fields only (no image). Returns full state. */
export function patchPrimary(
  apiHost: string,
  token: string,
  corrections: PrimaryCorrections
): Promise<CheckinState> {
  return request<CheckinState>(ENDPOINTS.primary(apiHost, token), { method: 'PATCH', body: toForm(corrections) })
}

/** POST accompanying-doc — one companion image. Returns full state (guest appended). */
export function uploadAccompanying(apiHost: string, token: string, file: File): Promise<CheckinState> {
  const form = new FormData()
  form.append('file', file)
  return request<CheckinState>(ENDPOINTS.accompanying(apiHost, token), { method: 'POST', body: form })
}

/** PATCH accompanying-doc/<id> — correct a companion's fields. Returns full state. */
export function patchAccompanying(
  apiHost: string,
  token: string,
  guestId: number,
  corrections: { full_name?: string, document_number?: string }
): Promise<CheckinState> {
  return request<CheckinState>(ENDPOINTS.accompanyingDoc(apiHost, token, guestId), {
    method: 'PATCH',
    body: toForm(corrections)
  })
}

/**
 * POST complete — finalize. Requires a primary document to exist.
 * picked_guest_ids attaches chosen suggestions (prior-stay guests); final roster =
 * this session's uploads ∪ picked. Sent as JSON (complete handles no files).
 */
export function completeCheckin(
  apiHost: string,
  token: string,
  pickedGuestIds: number[]
): Promise<{ completed: boolean }> {
  return request<{ completed: boolean }>(ENDPOINTS.complete(apiHost, token), {
    method: 'POST',
    body: { picked_guest_ids: pickedGuestIds }
  })
}
