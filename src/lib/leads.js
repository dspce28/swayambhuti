// Send an enquiry to /api/lead. Fire-and-forget safe: uses keepalive so it completes even while
// WhatsApp opens. If the network fails, the lead is queued in this browser and retried next visit.
import { getAttribution } from './marketing'

const QUEUE = 'sw-lead-queue'
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE) || '[]')
  } catch {
    return []
  }
}
const write = (q) => {
  try {
    localStorage.setItem(QUEUE, JSON.stringify(q.slice(-5)))
  } catch {
    /* storage blocked */
  }
}

async function post(payload, timeoutMs = 9000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t = ctrl && setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      signal: ctrl?.signal,
    })
    const data = await r.json().catch(() => ({}))
    return { status: r.status, ...data }
  } finally {
    if (t) clearTimeout(t)
  }
}

// returns { state: 'delivered' | 'unconfigured' | 'queued' | 'invalid', error? }
export async function submitLead(lead) {
  const payload = { ...lead, page: window.location.pathname, attribution: getAttribution() }
  try {
    const r = await post(payload)
    if (r.status === 200) return { state: 'delivered' }
    if (r.status === 202) return { state: 'unconfigured' }
    if (r.status === 400) return { state: 'invalid', error: r.error }
    throw new Error(String(r.status))
  } catch {
    write([...read(), payload])
    return { state: 'queued' }
  }
}

// retry anything that failed on a previous visit
export async function flushLeadQueue() {
  const q = read()
  if (!q.length) return
  const left = []
  for (const p of q) {
    try {
      const r = await post(p)
      if (r.status >= 500 || r.status === 429) left.push(p)
    } catch {
      left.push(p)
    }
  }
  write(left)
}
