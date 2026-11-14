// POST /api/lead — server-side lead capture (Vercel serverless function).
//
// Every enquiry (contact form, Health Check) is validated here and forwarded to whichever
// destinations are configured as Vercel environment variables:
//
//   LEAD_WEBHOOK_URL      Google Apps Script web app (writes to a Google Sheet), Zapier, Make, …
//   LEAD_WEBHOOK_SECRET   shared secret sent with each webhook call (the Apps Script checks it)
//   RESEND_API_KEY        email notification via resend.com …
//   LEAD_NOTIFY_EMAIL     … sent to this address (comma-separated for several)
//   LEAD_FROM_EMAIL       optional sender, e.g. "Swayambhuti Leads <leads@swayambhuti.com>"
//
// Responses: 200 delivered to ≥1 destination · 202 accepted but no destination configured ·
// 400 invalid · 405 wrong method · 413 too large · 429 too many · 502 every destination failed.
// The browser always opens WhatsApp as well, so a visitor is never left without a channel.

const MAX_BODY = 12_000
const LIMITS = { name: 80, company: 100, email: 120, phone: 24, industry: 60, challenge: 1000, page: 120 }
const ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'landing_page']
const hits = new Map() // best-effort per-instance rate limit

const clean = (v, max) =>
  typeof v === 'string'
    ? v
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
        .trim()
        .slice(0, max)
    : ''

function rateLimited(ip, now = Date.now()) {
  const list = (hits.get(ip) || []).filter((t) => now - t < 60_000)
  list.push(now)
  hits.set(ip, list)
  if (hits.size > 5000) hits.clear()
  return list.length > 6
}

export function validate(body) {
  if (!body || typeof body !== 'object') return { error: 'Invalid request body' }
  if (body.website) return { spam: true } // honeypot field, invisible to people
  if (typeof body.startedAt === 'number' && Date.now() - body.startedAt < 1500) return { spam: true } // filled faster than a human can

  const type = body.type === 'health_check' ? 'health_check' : body.type === 'contact' ? 'contact' : null
  if (!type) return { error: 'Unknown lead type' }

  const lead = {
    type,
    name: clean(body.name, LIMITS.name),
    company: clean(body.company, LIMITS.company),
    email: clean(body.email, LIMITS.email).toLowerCase(),
    phone: clean(body.phone, LIMITS.phone),
    industry: clean(body.industry, LIMITS.industry),
    challenge: clean(body.challenge, LIMITS.challenge),
    page: clean(body.page, LIMITS.page),
  }
  if (lead.name.length < 2) return { error: 'Please enter your name' }
  const digits = lead.phone.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) return { error: 'Please enter a valid phone number' }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return { error: 'Please enter a valid email' }
  if (type === 'contact' && !lead.email) return { error: 'Please enter your email' }

  if (type === 'health_check') {
    const s = body.score || {}
    const num = (v) => (Number.isFinite(+v) ? Math.max(0, Math.min(100, Math.round(+v))) : null)
    lead.score = {
      total: num(s.total),
      tier: clean(s.tier, 40),
      systemize: num(s.pillars?.[0]),
      humanize: num(s.pillars?.[1]),
      monetize: num(s.pillars?.[2]),
      leaks: Array.isArray(s.leaks) ? s.leaks.slice(0, 3).map((l) => clean(l, 60)).filter(Boolean) : [],
      answers: /^[0-3]{12}$/.test(s.answers || '') ? s.answers : '',
    }
    if (lead.score.total === null) return { error: 'Missing score' }
  }

  const attr = {}
  for (const k of ATTR_KEYS) {
    const v = clean(body.attribution?.[k], 150)
    if (v) attr[k] = v
  }
  lead.attribution = attr
  return { lead }
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function emailFor(lead) {
  const rows = [
    ['Type', lead.type === 'health_check' ? 'Business Engine Health Check' : 'Contact form'],
    ['Name', lead.name],
    ['Company', lead.company],
    ['Phone / WhatsApp', lead.phone],
    ['Email', lead.email],
    ['Industry', lead.industry],
    ['Biggest challenge', lead.challenge],
  ]
  if (lead.score) {
    rows.push(['Score', `${lead.score.total}/100 — ${lead.score.tier}`])
    rows.push(['Pillars', `Systemize ${lead.score.systemize} · Humanize ${lead.score.humanize} · Monetize ${lead.score.monetize}`])
    if (lead.score.leaks.length) rows.push(['Biggest leaks', lead.score.leaks.join(', ')])
  }
  const a = lead.attribution
  if (Object.keys(a).length) rows.push(['Source', Object.entries(a).map(([k, v]) => `${k}=${v}`).join(' · ')])
  rows.push(['Received', lead.receivedAt])
  const html = `<h2 style="font-family:Georgia,serif">New lead: ${esc(lead.name)}</h2><table cellpadding="6" style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="color:#5d6b64;vertical-align:top">${esc(k)}</td><td><strong>${esc(v)}</strong></td></tr>`)
    .join('')}</table>`
  const text = rows
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
  const subject = lead.score ? `Health Check lead: ${lead.name} (${lead.score.total}/100)` : `New audit request: ${lead.name}${lead.company ? ` — ${lead.company}` : ''}`
  return { html, text, subject }
}

async function withTimeout(promise, ms) {
  let t
  return Promise.race([promise, new Promise((_, rej) => (t = setTimeout(() => rej(new Error('timeout')), ms)))]).finally(() => clearTimeout(t))
}

export async function deliver(lead, env = process.env, fetchImpl = fetch) {
  const jobs = []
  if (env.LEAD_WEBHOOK_URL) {
    jobs.push([
      'webhook',
      withTimeout(
        fetchImpl(env.LEAD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...lead, secret: env.LEAD_WEBHOOK_SECRET || undefined }),
          redirect: 'follow',
        }).then((r) => {
          if (!r.ok) throw new Error(`webhook ${r.status}`)
        }),
        8000,
      ),
    ])
  }
  if (env.RESEND_API_KEY && env.LEAD_NOTIFY_EMAIL) {
    const { html, text, subject } = emailFor(lead)
    jobs.push([
      'email',
      withTimeout(
        fetchImpl('https://api.resend.com/emails', {
          method: 'POST',
          headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
          body: JSON.stringify({
            from: env.LEAD_FROM_EMAIL || 'Swayambhuti Website <onboarding@resend.dev>',
            to: env.LEAD_NOTIFY_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
            reply_to: lead.email || undefined,
            subject,
            html,
            text,
          }),
        }).then((r) => {
          if (!r.ok) throw new Error(`email ${r.status}`)
        }),
        8000,
      ),
    ])
  }
  const results = await Promise.allSettled(jobs.map(([, p]) => p))
  return {
    configured: jobs.length,
    delivered: results.filter((r) => r.status === 'fulfilled').length,
    failures: results.map((r, i) => (r.status === 'rejected' ? `${jobs[i][0]}: ${r.reason?.message}` : null)).filter(Boolean),
  }
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }
  // JSON only: cross-site pages cannot send this content type without a CORS preflight, which we never grant
  if (!String(req.headers['content-type'] || '').includes('application/json')) return res.status(400).json({ ok: false, error: 'Expected JSON' })

  let body = req.body
  if (typeof body === 'string' || Buffer.isBuffer(body)) {
    if (body.length > MAX_BODY) return res.status(413).json({ ok: false, error: 'Too large' })
    try {
      body = JSON.parse(body.toString())
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' })
    }
  } else if (JSON.stringify(body || {}).length > MAX_BODY) return res.status(413).json({ ok: false, error: 'Too large' })

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown'
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'Too many requests — please try again in a minute' })

  const v = validate(body)
  if (v.spam) return res.status(200).json({ ok: true, delivered: 1 }) // quietly accept, drop
  if (v.error) return res.status(400).json({ ok: false, error: v.error })

  const lead = { id: `L${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, receivedAt: new Date().toISOString(), ...v.lead }
  const out = await deliver(lead)
  // log the outcome without personal data
  console.log(JSON.stringify({ evt: 'lead', id: lead.id, type: lead.type, configured: out.configured, delivered: out.delivered, failures: out.failures }))

  if (!out.configured) return res.status(202).json({ ok: true, id: lead.id, delivered: 0, configured: false })
  if (!out.delivered) return res.status(502).json({ ok: false, id: lead.id, error: 'Could not store your enquiry right now' })
  return res.status(200).json({ ok: true, id: lead.id, delivered: out.delivered })
}
