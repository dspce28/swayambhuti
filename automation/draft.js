// Weekly: research → Claude drafts next week's posts → images → rows in the approval Sheet.
// Run: node draft.js            (DRY_RUN=1 to print instead of writing; FORCE=1 to redraft a week that exists)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { DRY_RUN, PILLARS, SLOTS, env } from './lib/config.js'
import { claudeClient } from './lib/claude.js'
import { researchTrends } from './lib/research.js'
import { renderVisual } from './lib/render.js'
import { sheetClient } from './lib/sheet.js'
import { composeText, istString, nextMonday, slotLabel, slotTime } from './lib/util.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8')

export async function draftWeek({ sheet = sheetClient(), claude = claudeClient(), now = new Date(), launch = () => chromium.launch(), research = researchTrends, render = renderVisual } = {}) {
  const weekOf = env('WEEK_OF', { required: false }) || nextMonday(now)
  const publicBase = env('PUBLIC_BASE_URL', { fallback: 'https://swayambhuti.com' }).replace(/\/$/, '')
  const [config, rows] = await Promise.all([sheet.config(), sheet.list()])

  if (rows.some((r) => r.id.startsWith(`${weekOf}-`)) && process.env.FORCE !== '1') {
    console.log(`Week of ${weekOf} is already in the Sheet — nothing to do (FORCE=1 to redraft).`)
    return { weekOf, skipped: true }
  }

  const voice = read('voice/voice.md')
  const examples = read('voice/examples.md')
  const trends = await research(PILLARS)
  console.log(`[draft] week of ${weekOf}: ${trends.length} news items`)
  const recentTopics = rows.slice(-30).map((r) => `${r.platform}: ${r.topic}`)
  const slots = SLOTS.map((s) => ({ ...s, when: slotLabel(weekOf, s) }))

  const { posts } = await claude.draftWeek({ voice, examples, slots, pillars: PILLARS, trends, recentTopics, weekOf })

  // Keep exactly one valid post per slot; anything else is dropped with a warning rather than posted wrong.
  const bySlot = new Map()
  for (const p of posts) {
    const slot = slots[p.slot]
    const problem = !slot
      ? 'unknown slot'
      : slot.platform !== p.platform
        ? `slot ${p.slot} is ${slot.platform}`
        : p.platform === 'instagram' && p.format === 'text'
          ? 'Instagram post without a visual'
          : p.format === 'carousel' && (p.slides.length < 3 || p.slides.length > 10)
            ? `carousel with ${p.slides.length} slides`
            : p.format === 'quote' && !p.headline
              ? 'quote card without a headline'
              : bySlot.has(p.slot)
                ? 'duplicate slot'
                : ''
    if (problem) console.warn(`[draft] dropped "${p.topic}": ${problem}`)
    else bySlot.set(p.slot, p)
  }

  const autopilot = String(config.AUTOPILOT).toUpperCase() === 'ON'
  const outDir = `public/social/${weekOf}`
  const browser = await launch()
  const newRows = []
  try {
    for (const [i, slot] of slots.entries()) {
      const post = bySlot.get(i)
      if (!post) continue
      const id = `${weekOf}-${slot.platform === 'linkedin' ? 'li' : 'ig'}-${i}`
      const pillar = PILLARS.find((p) => p.id === post.pillar)
      const files = await render(browser, post, { id, outDir, eyebrow: pillar?.name.split('&')[0].trim() || 'Swayambhuti' })
      const text = composeText(post)

      let status = 'Pending'
      let approvedBy = ''
      let error = ''
      if (autopilot) {
        const verdict = await claude.check({ voice, post: { ...post, text } })
        if (verdict.pass) [status, approvedBy] = ['Approved', 'autopilot']
        else error = `Autopilot held this for review: ${verdict.issues.join('; ')}`
      }
      newRows.push({
        id,
        created: istString(now),
        platform: slot.platform === 'linkedin' ? 'LinkedIn' : 'Instagram',
        format: post.format,
        planned: slotTime(weekOf, slot),
        pillar: pillar?.name || post.pillar,
        topic: post.topic,
        source: post.sourceUrl,
        draft: text,
        final: text,
        images: files.map((f) => `${publicBase}/${f.replace(/^public\//, '')}`).join(' '),
        status,
        notes: '',
        approvedBy,
        error,
      })
    }
  } finally {
    await browser.close()
  }

  const pending = newRows.filter((r) => r.status === 'Pending').length
  const first = newRows.map((r) => r.planned).sort()[0] || ''
  await sheet.append(newRows, {
    subject: pending ? `${pending} posts to review for the week of ${weekOf}` : `Next week's ${newRows.length} posts are scheduled (autopilot)`,
    body: pending
      ? `New drafts are in the Sheet. Edit the "Final" text if you want, then set Status to Approved or Rejected.\nThe first one is planned for ${first.replace('T', ' ')} IST — anything not approved by its planned time is simply not posted.`
      : `Autopilot approved ${newRows.length} posts for the week of ${weekOf}. Set any of them to Rejected before its planned time to stop it.`,
  })
  console.log(`[draft] ${newRows.length} rows (${pending} pending) for week of ${weekOf}${DRY_RUN ? ' [dry-run]' : ''}`)
  return { weekOf, rows: newRows }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  draftWeek().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
