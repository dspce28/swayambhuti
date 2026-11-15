// Small shared helpers: IST time, edit similarity, post text assembly, readiness for autopilot.

const IST_OFFSET_MIN = 330

// "YYYY-MM-DDTHH:mm" in IST, for a given instant.
export function istString(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MIN * 60000).toISOString().slice(0, 16)
}

// The Monday after `date` (IST), as YYYY-MM-DD — the week a Saturday draft run plans for.
export function nextMonday(date = new Date()) {
  const ist = new Date(date.getTime() + IST_OFFSET_MIN * 60000)
  const day = ist.getUTCDay()
  const add = ((8 - day) % 7) || 7
  ist.setUTCDate(ist.getUTCDate() + add)
  return ist.toISOString().slice(0, 10)
}

// Slot (day 0–6, "HH:mm") in the week starting Monday `weekOf` → "YYYY-MM-DDTHH:mm" IST.
export function slotTime(weekOf, slot) {
  const d = new Date(`${weekOf}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + ((slot.day + 6) % 7))
  return `${d.toISOString().slice(0, 10)}T${slot.time}`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const slotLabel = (weekOf, slot) => `${DAYS[slot.day]} ${slotTime(weekOf, slot).replace('T', ' ')} IST`

// Word-level similarity 0..1 (1 = identical) from the longest common subsequence.
export function similarity(a, b) {
  const x = String(a).trim().split(/\s+/).filter(Boolean)
  const y = String(b).trim().split(/\s+/).filter(Boolean)
  if (!x.length && !y.length) return 1
  const prev = new Array(y.length + 1).fill(0)
  for (let i = 1; i <= x.length; i++) {
    let diag = 0
    for (let j = 1; j <= y.length; j++) {
      const tmp = prev[j]
      prev[j] = x[i - 1] === y[j - 1] ? diag + 1 : Math.max(prev[j], prev[j - 1])
      diag = tmp
    }
  }
  return (2 * prev[y.length]) / (x.length + y.length)
}

// The text that gets posted: body, then hashtags on their own line.
export function composeText(post) {
  const tags = [...new Set(post.hashtags.map((t) => t.replace(/^#*/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean))]
  return tags.length ? `${post.text.trim()}\n\n${tags.map((t) => `#${t}`).join(' ')}` : post.text.trim()
}

export const MINOR_EDIT = 0.95 // ≥ this similarity counts as "approved as written"
export const READY_REVIEWED = 15
export const READY_STREAK = 5

// rows: human-reviewed rows (not autopilot), oldest first, each { draft, final, status }.
export function readiness(rows) {
  const reviewed = rows.filter((r) => ['Posted', 'Rejected', 'Approved', 'Publishing', 'Failed'].includes(r.status))
  const clean = (r) => r.status !== 'Rejected' && similarity(r.draft, r.final) >= MINOR_EDIT
  let streak = 0
  for (let i = reviewed.length - 1; i >= 0 && clean(reviewed[i]); i--) streak++
  const last10 = reviewed.slice(-10)
  const editRate = last10.length ? Math.round((last10.filter((r) => !clean(r)).length / last10.length) * 100) : 0
  const ready = reviewed.length >= READY_REVIEWED && streak >= READY_STREAK
  const summary = `${reviewed.length} reviewed · last ${streak} approved without real edits · edited or rejected ${editRate}% of the last ${last10.length} · ${
    ready ? 'READY — Sunil can switch AUTOPILOT to ON' : `not ready yet (needs ${READY_REVIEWED} reviewed and ${READY_STREAK} in a row unchanged)`
  }`
  return { reviewed: reviewed.length, streak, editRate, ready, summary }
}
