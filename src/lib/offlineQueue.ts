import type { CareType } from '@prisma/client'

// Simple offline queue for care events using localStorage
// Events are stored with a client-generated id and timestamp

export type CareEventPayload = {
  plantId: string
  type: CareType
  note?: string
  userName?: string
}

interface QueuedEvent extends CareEventPayload {
  id: string
  ts: number
}

const STORAGE_KEY = 'careEventQueue'

function loadQueue(): QueuedEvent[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  } catch {
    // ignore
  }
}

export async function submitCareEvent(payload: CareEventPayload) {
  try {
    const res = await fetch('/api/care-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error('Request failed')
  } catch {
    enqueue(payload)
  }
}

function enqueue(payload: CareEventPayload) {
  const queue = loadQueue()
  queue.push({ ...payload, id: crypto.randomUUID(), ts: Date.now() })
  saveQueue(queue)
}

export async function flushQueue() {
  const queue = loadQueue()
  if (queue.length === 0) return
  const remaining: QueuedEvent[] = []
  for (const evt of queue) {
    try {
      const res = await fetch('/api/care-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantId: evt.plantId, type: evt.type, note: evt.note, userName: evt.userName })
      })
      if (res.status === 409) {
        // duplicate/conflict, drop it
        continue
      }
      if (!res.ok) {
        remaining.push(evt)
      }
    } catch {
      remaining.push(evt)
    }
  }
  saveQueue(remaining)
}

export function initCareQueue() {
  if (typeof window === 'undefined') return
  window.addEventListener('online', flushQueue)
  // attempt initial flush
  flushQueue()
}

