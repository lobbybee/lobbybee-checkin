// Shapes mirror the API (GET/POST/PATCH under /api/chat/web-checkin/<token>/).

export interface Hotel {
  name: string
  city: string
  logo_url: string | null
}

export interface Guest {
  full_name: string
  date_of_birth: string // yyyy-mm-dd
  nationality: string
}

export interface PrimaryDocument {
  id: number
  document_type: string
  document_number: string
  front_url: string | null
  back_url: string | null
}

export interface AccompanyingGuest {
  id: number
  full_name: string
  document_number: string
  document_url: string | null
}

/** A guest from a prior check-in, offered to attach without re-uploading. */
export interface Suggestion {
  id: number
  full_name: string
  document_number: string
  document_url: string | null
}

/** Full check-in state (GET, and returned by PATCH / accompanying POST). */
export interface CheckinState {
  completed: boolean
  hotel: Hotel
  guest: Guest
  primary_document: PrimaryDocument | null
  accompanying_guests: AccompanyingGuest[] // uploaded this session
  accompanying_suggestions: Suggestion[] // from prior check-ins
}

/** Returned by POST primary-doc — OCR result, not full state. */
export interface PrimaryUploadResult {
  ocr_success: boolean
  document: PrimaryDocument
  guest: Guest
}

/** Fields the user can correct for the primary guest (PATCH primary-doc). */
export interface PrimaryCorrections {
  full_name?: string
  date_of_birth?: string
  nationality?: string
  document_number?: string
}
