// Weekly: learn from Sunil's edits, rejections and notes → update voice/voice.md and voice/examples.md,
// and write the autopilot READINESS line to the Config tab.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DRY_RUN } from './lib/config.js'
import { claudeClient } from './lib/claude.js'
import { sheetClient } from './lib/sheet.js'
import { readiness, similarity } from './lib/util.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = (f) => path.join(here, 'voice', f)
const KEEP_EXAMPLES = 12

export async function learn({ sheet = sheetClient(), claude = claudeClient() } = {}) {
  const [config, rows] = await Promise.all([sheet.config(), sheet.list()])
  const human = rows.filter((r) => r.approvedBy !== 'autopilot').sort((a, b) => a.created.localeCompare(b.created))
  const fresh = human.filter((r) => ['Posted', 'Rejected'].includes(r.status) && r.learned !== 'yes')

  if (fresh.length) {
    const reviews = fresh.map((r) => ({
      platform: r.platform,
      format: r.format,
      topic: r.topic,
      status: r.status,
      changed: r.status === 'Rejected' ? 'rejected' : similarity(r.draft, r.final) >= 0.95 ? 'no real change' : 'edited',
      draft: r.draft,
      final: r.final,
      notes: r.notes,
    }))
    const voice = fs.readFileSync(file('voice.md'), 'utf8')
    const update = await claude.updateVoice({ voice, reviews })
    console.log(`[learn] voice guide changes:\n- ${update.changes.join('\n- ')}`)

    const approved = fresh.filter((r) => r.status === 'Posted').reverse()
    const old = fs.readFileSync(file('examples.md'), 'utf8').split(/\n(?=### )/).filter((b) => b.startsWith('### '))
    const added = approved.map((r) => `### ${r.platform} · ${r.format} · ${r.topic}\n\n${r.final.trim()}\n`)
    const examples = `<!-- Posts Sunil approved, newest first. The learning job keeps the latest ${KEEP_EXAMPLES}. -->\n\n${[...added, ...old].slice(0, KEEP_EXAMPLES).join('\n')}`

    if (DRY_RUN) console.log('[dry-run] would write voice.md and examples.md')
    else {
      fs.writeFileSync(file('voice.md'), update.voice.trim() + '\n')
      fs.writeFileSync(file('examples.md'), examples.trim() + '\n')
    }
    for (const r of fresh) await sheet.update(r.id, { learned: 'yes' })
  } else {
    console.log('[learn] no newly reviewed posts since last run')
  }

  const r = readiness(human)
  await sheet.setConfig('READINESS', r.summary)
  if (r.ready && String(config.AUTOPILOT).toUpperCase() !== 'ON' && config.READY_NOTIFIED !== 'YES') {
    await sheet.notify(
      'Drafts now match Sunil’s style — autopilot can be switched on',
      `${r.summary}\n\nIf Sunil agrees, set AUTOPILOT to ON in the Config tab. Drafts will then be approved automatically after a quality check, and he can still reject any of them before its planned time.`,
    )
    await sheet.setConfig('READY_NOTIFIED', 'YES')
  }
  console.log(`[learn] ${r.summary}`)
  return r
}

if (import.meta.url === `file://${process.argv[1]}`) {
  learn().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
