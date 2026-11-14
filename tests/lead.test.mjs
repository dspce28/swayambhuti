// node --test tests/  — exercises api/lead.js end to end with a real local webhook receiver.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import handler, { deliver, validate } from '../api/lead.js'

let server, received = [], fail = false, url
before(async () => {
  server = http.createServer((req, res) => {
    let b = ''
    req.on('data', (c) => (b += c))
    req.on('end', () => {
      received.push(JSON.parse(b))
      res.writeHead(fail ? 500 : 200, { 'content-type': 'application/json' }).end('{"ok":true}')
    })
  })
  await new Promise((r) => server.listen(0, r))
  url = `http://127.0.0.1:${server.address().port}/hook`
})
after(() => server.close())

let ipCounter = 0
function call(body, { method = 'POST', ctype = 'application/json', ip } = {}) {
  return new Promise((resolve) => {
    const req = { method, headers: { 'content-type': ctype, 'x-forwarded-for': ip || `10.0.0.${++ipCounter}` }, body }
    const res = {
      headers: {},
      statusCode: 200,
      setHeader(k, v) { this.headers[k] = v },
      status(c) { this.statusCode = c; return this },
      json(o) { resolve({ status: this.statusCode, body: o }) },
    }
    handler(req, res)
  })
}
const old = () => Date.now() - 10_000
const contact = (extra = {}) => ({ type: 'contact', name: 'Asha Rao', company: 'Rao Textiles', email: 'asha@example.com', phone: '+91 98765 43210', startedAt: old(), ...extra })
const hc = (extra = {}) => ({ type: 'health_check', name: 'Vik', phone: '9876543210', startedAt: old(), score: { total: 44, tier: 'Sputtering engine', pillars: [50, 33, 50], leaks: ['Owner dependency'], answers: '012301230123' }, ...extra })
const env = (o) => { for (const k of ['LEAD_WEBHOOK_URL', 'LEAD_WEBHOOK_SECRET', 'RESEND_API_KEY', 'LEAD_NOTIFY_EMAIL']) delete process.env[k]; Object.assign(process.env, o) }

test('rejects wrong method and non-JSON', async () => {
  assert.equal((await call(contact(), { method: 'GET' })).status, 405)
  assert.equal((await call('name=x', { ctype: 'application/x-www-form-urlencoded' })).status, 400)
})

test('validates fields with human-readable errors', async () => {
  env({})
  assert.match((await call(contact({ name: '' }))).body.error, /name/)
  assert.match((await call(contact({ phone: '12345' }))).body.error, /phone/)
  assert.match((await call(contact({ email: '' }))).body.error, /email/)
  assert.match((await call(contact({ email: 'not-an-email' }))).body.error, /email/)
  assert.equal((await call(contact({ type: 'evil' }))).status, 400)
  assert.equal((await call(hc({ score: {} }))).status, 400)
})

test('no destination configured → 202, nothing lost silently', async () => {
  env({})
  const r = await call(contact())
  assert.equal(r.status, 202)
  assert.equal(r.body.configured, false)
})

test('delivers a sanitised lead to the webhook with the shared secret', async () => {
  env({ LEAD_WEBHOOK_URL: url, LEAD_WEBHOOK_SECRET: 's3cret' })
  received = []
  const r = await call(contact({ name: 'Asha\u0000 Rao', challenge: 'x'.repeat(5000), attribution: { utm_source: 'linkedin', evil: 'drop me' } }))
  assert.equal(r.status, 200)
  assert.equal(received.length, 1)
  const d = received[0]
  assert.equal(d.secret, 's3cret')
  assert.equal(d.name, 'Asha Rao')
  assert.equal(d.challenge.length, 1000)
  assert.deepEqual(d.attribution, { utm_source: 'linkedin' })
  assert.match(d.id, /^L/)
})

test('health check lead carries clamped scores', async () => {
  env({ LEAD_WEBHOOK_URL: url })
  received = []
  const r = await call(hc({ score: { total: 250, tier: 'x', pillars: [50, 'abc', -4], leaks: ['a', 'b', 'c', 'd'], answers: 'bad' } }))
  assert.equal(r.status, 200)
  const s = received[0].score
  assert.equal(s.total, 100)
  assert.equal(s.humanize, null)
  assert.equal(s.monetize, 0)
  assert.equal(s.leaks.length, 3)
  assert.equal(s.answers, '')
})

test('every destination failing → 502 (browser then queues and offers WhatsApp)', async () => {
  env({ LEAD_WEBHOOK_URL: url })
  fail = true
  const r = await call(contact())
  fail = false
  assert.equal(r.status, 502)
})

test('honeypot and too-fast submissions are accepted quietly but never delivered', async () => {
  env({ LEAD_WEBHOOK_URL: url })
  received = []
  assert.equal((await call(contact({ website: 'http://spam' }))).status, 200)
  assert.equal((await call(contact({ startedAt: Date.now() }))).status, 200)
  assert.equal(received.length, 0)
})

test('rate limit and size limit', async () => {
  env({})
  const ip = '203.0.113.9'
  const codes = []
  for (let i = 0; i < 8; i++) codes.push((await call(contact(), { ip })).status)
  assert.ok(codes.slice(0, 6).every((c) => c === 202))
  assert.equal(codes[7], 429)
  assert.equal((await call(JSON.stringify(contact({ challenge: 'y'.repeat(20000) })))).status, 413)
})

test('email notification escapes HTML and sets reply-to', async () => {
  const calls = []
  const fakeFetch = async (u, init) => { calls.push([u, JSON.parse(init.body)]); return { ok: true, status: 200 } }
  const v = validate(contact({ name: '<script>alert(1)</script>' }))
  const out = await deliver({ ...v.lead, id: 'L1', receivedAt: 'now' }, { RESEND_API_KEY: 'k', LEAD_NOTIFY_EMAIL: 'a@x.com, b@x.com' }, fakeFetch)
  assert.equal(out.delivered, 1)
  const [u, body] = calls[0]
  assert.equal(u, 'https://api.resend.com/emails')
  assert.deepEqual(body.to, ['a@x.com', 'b@x.com'])
  assert.equal(body.reply_to, 'asha@example.com')
  assert.ok(!body.html.includes('<script>'))
  assert.ok(body.html.includes('&lt;script&gt;'))
})
