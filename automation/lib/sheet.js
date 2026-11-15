// Client for the Google Sheet web app in integrations/social-queue.gs.
import { DRY_RUN, env } from './config.js'

export function sheetClient({ url = env('SOCIAL_SHEET_URL'), secret = env('SOCIAL_SHEET_SECRET'), fetchImpl = fetch, dryRun = DRY_RUN } = {}) {
  async function call(action, body = {}) {
    const res = await fetchImpl(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret, action, ...body }),
      redirect: 'follow',
    })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(`Sheet ${action}: not JSON (HTTP ${res.status}) — is the web app deployed with access "Anyone"? ${text.slice(0, 200)}`)
    }
    if (!data.ok) throw Object.assign(new Error(`Sheet ${action}: ${data.error}`), { data })
    return data
  }
  const write = (action, body) => (dryRun ? (console.log(`[dry-run] sheet ${action}`, JSON.stringify(body).slice(0, 400)), { ok: true }) : call(action, body))
  return {
    list: async (statuses) => (await call('list', statuses ? { statuses } : {})).rows,
    config: async () => (await call('config')).config,
    append: (rows, notify) => write('append', { rows, notify }),
    update: (id, fields, expectStatus) => write('update', { id, fields, expectStatus }),
    setConfig: (key, value) => write('setConfig', { key, value }),
    notify: (subject, body) => write('notify', { subject, body }),
  }
}
