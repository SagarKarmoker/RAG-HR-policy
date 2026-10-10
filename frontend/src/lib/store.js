import { reactive, computed } from 'vue'
import {
  STAFF,
  seedDocuments,
  seedThreads,
  seedGaps,
  seedActivity,
  seedRatings,
} from './seed'

const KEY = 'hr-policy-rag.state.v1'

const defaults = () => ({
  session: null,
  documents: structuredClone(seedDocuments),
  threads: structuredClone(seedThreads),
  gaps: structuredClone(seedGaps),
  activity: structuredClone(seedActivity),
  ratings: { ...seedRatings },
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaults()
    const parsed = JSON.parse(raw)
    return { ...defaults(), ...parsed }
  } catch {
    return defaults()
  }
}

export const state = reactive(load())

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable — session stays in memory only */
  }
}

export function resetDemoData() {
  const fresh = defaults()
  fresh.session = state.session
  Object.assign(state, fresh)
  persist()
}

/* --------------------------------------------------------------- session --- */

export const session = computed(() => state.session)
export const isSignedIn = computed(() => Boolean(state.session))
export const isHr = computed(() => state.session?.role === 'hr')

export async function signIn(email, password) {
  const user = STAFF.find(
    (s) => s.email.toLowerCase() === String(email).trim().toLowerCase(),
  )
  if (!user) throw new Error('No employee account matches that email address.')
  if (String(password) !== 'demo') {
    throw new Error('Incorrect password. Use the demo password to continue.')
  }
  state.session = { ...user, signedInAt: new Date().toISOString() }
  persist()
  return state.session
}

export function signOut() {
  state.session = null
  persist()
}

/* ------------------------------------------------------------- documents --- */

export const visibleDocuments = computed(() =>
  state.documents.filter((doc) => doc.status === 'active'),
)

export function getDocument(id) {
  return state.documents.find((doc) => doc.id === id) || null
}

function logActivity(action, target, detail) {
  state.activity.unshift({
    id: `a-${Date.now()}`,
    at: new Date().toISOString(),
    actor: state.session?.name || 'Unknown',
    action,
    target,
    detail,
  })
  state.activity = state.activity.slice(0, 40)
}

export async function saveDocument(payload) {
  const now = new Date().toISOString()
  const actor = state.session?.name || 'Unknown'
  if (payload.id) {
    const doc = getDocument(payload.id)
    if (!doc) throw new Error('Document not found.')
    Object.assign(doc, payload, {
      id: doc.id,
      updatedAt: now,
      updatedBy: actor,
      fileName: payload.fileName || doc.fileName,
      fileType: payload.fileType || doc.fileType,
      sizeKb: payload.sizeKb || doc.sizeKb,
    })
    if (payload.newFile) doc.version = bumpVersion(doc.version)
    logActivity('edited', doc.title, payload.newFile ? `version ${doc.version}` : 'metadata')
    persist()
    return doc
  }
  const doc = {
    id: `doc-${Date.now()}`,
    sections: [],
    status: 'active',
    indexStatus: 'indexed',
    version: '1.0',
    updatedAt: now,
    updatedBy: actor,
    ...payload,
  }
  state.documents.unshift(doc)
  logActivity('uploaded', doc.title, 'indexed')
  persist()
  return doc
}

function bumpVersion(version) {
  const [major, minor = '0'] = String(version || '1.0').split('.')
  return `${Number(major) + 1}.0`
}

export async function setDocumentStatus(id, status) {
  const doc = getDocument(id)
  if (!doc) return null
  doc.status = status
  doc.updatedAt = new Date().toISOString()
  logActivity(status === 'archived' ? 'archived' : status, doc.title, `version ${doc.version}`)
  persist()
  return doc
}

export async function removeDocument(id) {
  const doc = getDocument(id)
  if (!doc) return
  state.documents = state.documents.filter((d) => d.id !== id)
  logActivity('deleted', doc.title, 'content removed from search and answers')
  persist()
}

export async function reindexDocument(id) {
  const doc = getDocument(id)
  if (!doc) return null
  doc.indexStatus = 'indexing'
  persist()
  await new Promise((resolve) => setTimeout(resolve, 1600))
  doc.indexStatus = 'indexed'
  doc.updatedAt = new Date().toISOString()
  logActivity('reindexed', doc.title, 'searchable')
  persist()
  return doc
}

/* --------------------------------------------------------------- threads --- */

export const threads = computed(() =>
  [...state.threads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
)

export function getThread(id) {
  return state.threads.find((t) => t.id === id) || null
}

export function createThread() {
  const thread = {
    id: `thread-${Date.now()}`,
    title: 'New question',
    createdAt: new Date().toISOString(),
    messages: [],
  }
  state.threads.unshift(thread)
  persist()
  return thread
}

export function renameThreadFromMessage(thread, message) {
  if (thread.messages.length <= 1 && thread.title === 'New question') {
    thread.title = message.content.length > 48 ? `${message.content.slice(0, 48)}…` : message.content
  }
}

export function deleteThread(id) {
  state.threads = state.threads.filter((t) => t.id !== id)
  persist()
}

export function rateMessage(messageId, value) {
  state.ratings[messageId] = state.ratings[messageId] === value ? null : value
  persist()
}

/* ------------------------------------------------------------------ gaps --- */

export function recordGap(term) {
  const key = term.trim().toLowerCase()
  if (!key) return
  const today = new Date().toISOString().slice(0, 10)
  const existing = state.gaps.find((g) => g.term.toLowerCase() === key)
  if (existing) {
    existing.searches += 1
    existing.lastSeen = today
  } else {
    state.gaps.push({
      term,
      searches: 1,
      firstSeen: today,
      lastSeen: today,
    })
  }
  persist()
}

export function removeGap(term) {
  state.gaps = state.gaps.filter((g) => g.term !== term)
  persist()
}
