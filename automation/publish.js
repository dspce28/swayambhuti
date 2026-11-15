// Hourly: post every Approved row whose planned time has passed. At most once per row:
// a row is marked Publishing before the API call, so a crash can never cause a double post.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DRY_RUN } from './lib/config.js'
import { instagramClient } from './lib/instagram.js'
import { linkedinClient } from './lib/linkedin.js'
import { sheetClient } from './lib/sheet.js'
import { istString } from './lib/util.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAX_PER_RUN = 3
const STALE_HOURS = 12 // an approved post more than this late is not posted (the moment has passed) — marked Failed

const hoursBetween = (a, b) => (new Date(`${b}:00Z`) - new Date(`${a}:00Z`)) / 3600000

// Image URLs → local files from this checkout (LinkedIn needs bytes); falls back to downloading.
async function imageBytes(url, fetchImpl) {
  const local = path.join(ROOT, 'public', new URL(url).pathname)
  if (fs.existsSync(local)) return fs.readFileSync(local)
  const res = await fetchImpl(url)
  if (!res.ok) throw new Error(`image ${url}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function isLive(url, fetchImpl) {
  try {
    const res = await fetchImpl(url, { method: 'HEAD' })
    return res.ok && /image\/jpe?g/.test(res.headers.get('content-type') || '')
  } catch {
    return false
  }
}

// Carousel slides → one PDF (LinkedIn shows a document post as a swipeable carousel).
async function slidesPdf(images) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    const imgs = images.map((b) => `<img src="data:image/jpeg;base64,${b.toString('base64')}">`).join('')
    await page.setContent(`<style>@page{size:1080px 1350px;margin:0}body{margin:0}img{display:block;width:1080px;height:1350px;page-break-after:always}</style>${imgs}`)
    return await page.pdf({ width: '1080px', height: '1350px', printBackground: true })
  } finally {
    await browser.close()
  }
}

export async function publishDue({
  sheet = sheetClient(),
  now = new Date(),
  fetchImpl = fetch,
  linkedin = () => linkedinClient(),
  instagram = () => instagramClient(),
  pdf = slidesPdf,
} = {}) {
  const config = await sheet.config()
  await tokenWarnings(sheet, config, now)
  if (String(config.PAUSED).toUpperCase() === 'YES') {
    console.log('[publish] PAUSED = YES in the Config tab — nothing posted.')
    return []
  }

  const nowIst = istString(now)
  const due = (await sheet.list(['Approved']))
    .filter((r) => r.planned && r.planned <= nowIst)
    .sort((a, b) => a.planned.localeCompare(b.planned))
  const results = []

  for (const row of due.slice(0, MAX_PER_RUN)) {
    if (hoursBetween(row.planned, nowIst) > STALE_HOURS) {
      await sheet.update(row.id, { status: 'Failed', error: `Not posted: it was approved but is more than ${STALE_HOURS}h past its planned time. Set a new Planned time and Approved again to post it.` }, 'Approved')
      continue
    }
    const images = row.images.split(/\s+/).filter(Boolean)
    if (row.platform === 'Instagram') {
      const live = await Promise.all(images.map((u) => isLive(u, fetchImpl)))
      if (live.includes(false)) {
        // The website deploy with this week's images hasn't finished yet — try again next hour.
        console.log(`[publish] ${row.id}: images not live yet, will retry`)
        await sheet.update(row.id, { error: 'Waiting for images to go live on the website…' }, 'Approved')
        continue
      }
    }

    if (DRY_RUN) {
      console.log(`[dry-run] would post ${row.id} to ${row.platform}:\n${row.final}\n${images.join('\n')}`)
      results.push({ id: row.id, dryRun: true })
      continue
    }

    try {
      await sheet.update(row.id, { status: 'Publishing', error: '' }, 'Approved')
    } catch (e) {
      console.log(`[publish] ${row.id}: skipped — ${e.message}`) // Sunil changed it in the meantime
      continue
    }

    try {
      let posted
      if (row.platform === 'LinkedIn') {
        const bytes = await Promise.all(images.map((u) => imageBytes(u, fetchImpl)))
        const isCarousel = row.format === 'carousel' && bytes.length > 1
        posted = await linkedin().publish({
          text: row.final,
          images: isCarousel ? [] : bytes,
          pdf: isCarousel ? await pdf(bytes) : undefined,
          title: row.topic,
        })
      } else {
        posted = await instagram().publish({ caption: row.final, imageUrls: images })
      }
      await sheet.update(row.id, { status: 'Posted', postedAt: istString(), postUrl: posted.url, error: '' })
      console.log(`[publish] ${row.id} → ${posted.url}`)
      results.push({ id: row.id, url: posted.url })
    } catch (e) {
      const status = e.ambiguous ? 'Check manually' : 'Failed'
      const help = e.ambiguous ? ' Check the profile: if it is not there, set Status back to Approved.' : ' Fix the cause, then set Status back to Approved to retry.'
      await sheet.update(row.id, { status, error: `${e.message}.${help}` })
      await sheet.notify(`Post ${status === 'Failed' ? 'failed' : 'needs a check'}: ${row.platform} — ${row.topic}`, `${e.message}\n${help}`)
      console.error(`[publish] ${row.id}: ${e.message}`)
      results.push({ id: row.id, error: e.message })
    }
  }
  return results
}

// One email a day when a token expires within 7 days (dates are entered in the Config tab).
async function tokenWarnings(sheet, config, now) {
  const today = istString(now).slice(0, 10)
  if (config.LAST_TOKEN_WARNING === today) return
  const soon = []
  for (const [key, name] of [['LINKEDIN_TOKEN_EXPIRES', 'LinkedIn'], ['INSTAGRAM_TOKEN_EXPIRES', 'Instagram']]) {
    const d = config[key]
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) continue
    const days = Math.round((new Date(`${d}T00:00:00Z`) - new Date(`${today}T00:00:00Z`)) / 86400000)
    if (days <= 7) soon.push(`${name} connection ${days < 0 ? 'EXPIRED' : `expires in ${days} day${days === 1 ? '' : 's'}`} (${d})`)
  }
  if (!soon.length) return
  await sheet.notify('Reconnect social accounts soon', `${soon.join('\n')}\n\nFollow "Reconnecting" in automation/README.md, then update the date in the Config tab.`)
  await sheet.setConfig('LAST_TOKEN_WARNING', today)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  publishDue().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
