// node --test tests/ — every external API is faked; nothing is posted and no keys are needed.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toLittleText, linkedinClient } from '../lib/linkedin.js'
import { instagramClient } from '../lib/instagram.js'
import { parseRss } from '../lib/research.js'
import { composeText, nextMonday, readiness, similarity, slotTime } from '../lib/util.js'
import { publishDue } from '../publish.js'
import { learn } from '../learn.js'
import { draftWeek } from '../draft.js'
import { jsonSchema, Week } from '../lib/claude.js'

// ---------- helpers ----------
function fakeSheet(rows = [], config = {}) {
  const calls = []
  return {
    calls,
    rows,
    config: async () => ({ AUTOPILOT: 'OFF', PAUSED: 'NO', ...config }),
    list: async (statuses) => rows.filter((r) => !statuses || statuses.includes(r.status)).map((r) => ({ ...r })),
    append: async (newRows, notify) => calls.push(['append', newRows, notify]),
    update: async (id, fields, expectStatus) => {
      const r = rows.find((x) => x.id === id)
      if (expectStatus && r.status !== expectStatus) throw new Error('status changed')
      Object.assign(r, fields)
      calls.push(['update', id, fields])
    },
    setConfig: async (k, v) => calls.push(['setConfig', k, v]),
    notify: async (s, b) => calls.push(['notify', s, b]),
  }
}
const row = (o) => ({ id: 'w-li-1', platform: 'LinkedIn', format: 'text', planned: '2026-11-17T09:15', status: 'Approved', images: '', final: 'Hello', topic: 'T', approvedBy: '', draft: 'Hello', notes: '', created: '2026-11-14T10:00', ...o })
const at = (ist) => new Date(new Date(`${ist}:00Z`).getTime() - 330 * 60000) // IST string → Date

// ---------- util ----------
test('week planning uses IST and Monday-start weeks', () => {
  assert.equal(nextMonday(at('2026-11-14T10:00')), '2026-11-16') // Saturday
  assert.equal(nextMonday(at('2026-11-16T00:30')), '2026-11-23') // already Monday IST
  assert.equal(slotTime('2026-11-16', { day: 2, time: '09:15' }), '2026-11-17T09:15')
  assert.equal(slotTime('2026-11-16', { day: 0, time: '10:00' }), '2026-11-22T10:00')
})

test('composeText puts clean, de-duplicated hashtags on their own line', () => {
  assert.equal(composeText({ text: 'Body ', hashtags: ['#SME', 'SME', 'sales growth!'] }), 'Body\n\n#SME #salesgrowth')
  assert.equal(composeText({ text: 'Body', hashtags: [] }), 'Body')
})

test('readiness needs enough reviews and a streak of unedited approvals', () => {
  const same = (n) => Array.from({ length: n }, () => ({ status: 'Posted', draft: 'a b c d e f g h i j k l m n o p q r s t', final: 'a b c d e f g h i j k l m n o p q r s t' }))
  const edited = { status: 'Posted', draft: 'one two three', final: 'completely different words here' }
  assert.equal(readiness([...same(10), edited, ...same(4)]).ready, false) // streak 4
  assert.equal(readiness([...same(10), edited, ...same(5)]).ready, true)
  assert.equal(readiness(same(6)).ready, false) // not enough reviewed
  assert.equal(readiness([...same(15), { ...same(1)[0], status: 'Rejected' }]).streak, 0)
  assert.ok(similarity('a b c', 'a b c') === 1 && similarity('a b c', 'x y z') === 0)
})

// ---------- research ----------
test('parses Google News RSS and strips the source suffix', () => {
  const xml = `<rss><channel><item><title><![CDATA[Banks push RM targets - Economic Times]]></title><link>https://n/1</link><pubDate>Fri, 13 Nov 2026</pubDate><source url="x">Economic Times</source></item></channel></rss>`
  assert.deepEqual(parseRss(xml), [{ title: 'Banks push RM targets', link: 'https://n/1', published: 'Fri, 13 Nov 2026', source: 'Economic Times' }])
})

// ---------- claude schema ----------
test('structured-output schema forbids extra keys and drops unsupported limits', () => {
  const s = JSON.stringify(jsonSchema(Week))
  assert.doesNotMatch(s, /minLength|minimum|\$schema/)
  assert.match(s, /"additionalProperties":false/)
})

// ---------- linkedin ----------
test('LinkedIn text escapes reserved characters and keeps hashtags linked', () => {
  assert.equal(toLittleText('Sales (really) @team_lead #SME'), 'Sales \\(really\\) \\@team\\_lead {hashtag|\\#|SME}')
})

test('LinkedIn: uploads an image, then posts with the member as author', async () => {
  const seen = []
  const fetchImpl = async (url, opts = {}) => {
    seen.push([opts.method || 'GET', url])
    if (url.endsWith('/v2/userinfo')) return new Response(JSON.stringify({ sub: 'abc' }))
    if (url.includes('images?action=initializeUpload')) return new Response(JSON.stringify({ value: { uploadUrl: 'https://up/1', image: 'urn:li:image:1' } }))
    if (url === 'https://up/1') return new Response('', { status: 201 })
    if (url.endsWith('/rest/posts')) {
      const body = JSON.parse(opts.body)
      assert.equal(body.author, 'urn:li:person:abc')
      assert.deepEqual(body.content, { media: { id: 'urn:li:image:1', altText: '' } })
      assert.equal(opts.headers['linkedin-version'], '202610')
      return new Response('', { status: 201, headers: { 'x-restli-id': 'urn:li:share:9' } })
    }
    throw new Error(`unexpected ${url}`)
  }
  const li = linkedinClient({ token: 't', fetchImpl })
  const out = await li.publish({ text: 'Hi', images: [Buffer.from('jpg')] })
  assert.equal(out.url, 'https://www.linkedin.com/feed/update/urn:li:share:9/')
  assert.equal(seen.filter(([, u]) => u.endsWith('/rest/posts')).length, 1)
})

test('LinkedIn: a 5xx on the post call is reported as ambiguous (never auto-retried)', async () => {
  const fetchImpl = async (url) => (url.endsWith('/rest/posts') ? new Response('oops', { status: 502 }) : new Response('{}'))
  await assert.rejects(linkedinClient({ token: 't', personUrn: 'urn:li:person:x', fetchImpl }).publish({ text: 'Hi' }), (e) => e.ambiguous === true)
})

// ---------- instagram ----------
test('Instagram: carousel creates children, waits until ready, then publishes once', async () => {
  const calls = []
  let n = 0
  const fetchImpl = async (url, opts = {}) => {
    const u = new URL(url)
    const params = opts.body ? Object.fromEntries(new URLSearchParams(opts.body)) : Object.fromEntries(u.searchParams)
    calls.push([u.pathname, params])
    if (u.pathname.endsWith('/123/media')) return Response.json({ id: `c${++n}` })
    if (u.pathname.endsWith('/123/media_publish')) return Response.json({ id: 'm1' })
    if (params.fields === 'status_code') return Response.json({ status_code: 'FINISHED' })
    if (params.fields === 'permalink') return Response.json({ permalink: 'https://instagram.com/p/x' })
    throw new Error(url)
  }
  const ig = instagramClient({ token: 't', userId: '123', fetchImpl, sleep: async () => {} })
  const out = await ig.publish({ caption: 'Cap #SME', imageUrls: ['https://s/1.jpg', 'https://s/2.jpg'] })
  assert.equal(out.url, 'https://instagram.com/p/x')
  const parent = calls.find(([, p]) => p.media_type === 'CAROUSEL')[1]
  assert.equal(parent.children, 'c1,c2')
  assert.equal(calls.filter(([p]) => p.endsWith('/media_publish')).length, 1)
})

test('Instagram rejects captions over the hashtag limit before calling the API', async () => {
  const ig = instagramClient({ token: 't', userId: '1', fetchImpl: async () => assert.fail('no call') })
  const caption = Array.from({ length: 31 }, (_, i) => `#t${i}`).join(' ')
  await assert.rejects(ig.publish({ caption, imageUrls: ['https://s/1.jpg'] }), /30 hashtags/)
})

// ---------- publish job ----------
test('publish: posts only approved, due rows; marks Publishing first, then Posted', async () => {
  const rows = [row({ id: 'due' }), row({ id: 'later', planned: '2026-11-18T09:15' }), row({ id: 'pending', status: 'Pending' })]
  const sheet = fakeSheet(rows)
  const posted = []
  const linkedin = () => ({
    publish: async (p) => {
      assert.equal(rows.find((r) => r.id === 'due').status, 'Publishing') // claimed before the API call
      posted.push(p.text)
      return { url: 'https://li/1' }
    },
  })
  await publishDue({ sheet, now: at('2026-11-17T09:30'), linkedin })
  assert.deepEqual(posted, ['Hello'])
  assert.equal(rows[0].status, 'Posted')
  assert.equal(rows[0].postUrl, 'https://li/1')
  assert.equal(rows[1].status, 'Approved')
})

test('publish: PAUSED stops everything', async () => {
  const sheet = fakeSheet([row({})], { PAUSED: 'YES' })
  await publishDue({ sheet, now: at('2026-11-17T10:00'), linkedin: () => assert.fail('posted while paused') })
  assert.equal(sheet.rows[0].status, 'Approved')
})

test('publish: an ambiguous failure becomes "Check manually" and emails, never retries itself', async () => {
  const sheet = fakeSheet([row({})])
  const linkedin = () => ({ publish: async () => Promise.reject(Object.assign(new Error('502'), { ambiguous: true })) })
  await publishDue({ sheet, now: at('2026-11-17T09:20'), linkedin })
  assert.equal(sheet.rows[0].status, 'Check manually')
  assert.ok(sheet.calls.some(([k]) => k === 'notify'))
})

test('publish: stale approvals are not posted late', async () => {
  const sheet = fakeSheet([row({})])
  await publishDue({ sheet, now: at('2026-11-18T09:20'), linkedin: () => assert.fail('posted a stale row') })
  assert.equal(sheet.rows[0].status, 'Failed')
})

test('publish: Instagram waits while images are not live yet', async () => {
  const sheet = fakeSheet([row({ platform: 'Instagram', format: 'quote', images: 'https://site/social/x.jpg' })])
  const fetchImpl = async () => new Response('', { status: 404 })
  await publishDue({ sheet, now: at('2026-11-17T09:20'), fetchImpl, instagram: () => assert.fail('posted without images') })
  assert.equal(sheet.rows[0].status, 'Approved')
  assert.match(sheet.rows[0].error, /Waiting for images/)
})

test('publish: warns once a day before a token expires', async () => {
  const sheet = fakeSheet([], { LINKEDIN_TOKEN_EXPIRES: '2026-11-20' })
  await publishDue({ sheet, now: at('2026-11-17T09:00') })
  assert.ok(sheet.calls.some(([k, s]) => k === 'notify' && /Reconnect/.test(s)))
  assert.ok(sheet.calls.some(([k, key]) => k === 'setConfig' && key === 'LAST_TOKEN_WARNING'))
  const quiet = fakeSheet([], { LINKEDIN_TOKEN_EXPIRES: '2026-11-20', LAST_TOKEN_WARNING: '2026-11-17' })
  await publishDue({ sheet: quiet, now: at('2026-11-17T10:00') })
  assert.ok(!quiet.calls.some(([k]) => k === 'notify'))
})

// ---------- draft job ----------
const fakePost = (slot, platform, extra = {}) => ({
  slot, platform, format: platform === 'instagram' ? 'quote' : 'text', pillar: 'sme', topic: `Topic ${slot}`, sourceUrl: '',
  text: 'A sufficiently long post body that says something useful for owners.', hashtags: ['SME'], headline: platform === 'instagram' ? 'Systems beat heroics.' : '', slides: [], altText: '', ...extra,
})
const fakeBrowser = { close: async () => {} }

test('draft: one row per valid slot, invalid posts dropped, Pending unless autopilot', async () => {
  const { SLOTS } = await import('../lib/config.js')
  const posts = SLOTS.map((s, i) => fakePost(i, s.platform))
  posts.push(fakePost(0, 'linkedin')) // duplicate slot
  posts[3] = { ...posts[3], format: 'text' } // Instagram without a visual → dropped
  const sheet = fakeSheet([])
  const out = await draftWeek({
    sheet,
    claude: { draftWeek: async () => ({ posts }) },
    now: at('2026-11-14T10:00'),
    launch: async () => fakeBrowser,
    render: async (_b, p, { id, outDir }) => (p.format === 'text' ? [] : [`${outDir}/${id}-1.jpg`]),
    research: async () => [],
  })
  const ig = out.rows.find((r) => r.platform === 'Instagram')
  assert.equal(ig.images, `https://swayambhuti.com/social/2026-11-16/${ig.id}-1.jpg`)
  assert.equal(out.weekOf, '2026-11-16')
  assert.equal(out.rows.length, SLOTS.length - 1)
  assert.ok(out.rows.every((r) => r.status === 'Pending' && r.final === r.draft))
  assert.equal(out.rows[0].planned, '2026-11-17T09:15')
  assert.match(sheet.calls[0][2].subject, /to review/)
})

test('draft: never redrafts a week that is already in the Sheet', async () => {
  const sheet = fakeSheet([row({ id: '2026-11-16-li-0' })])
  const out = await draftWeek({ sheet, claude: { draftWeek: () => assert.fail('called Claude') }, now: at('2026-11-14T10:00'), research: async () => [] })
  assert.equal(out.skipped, true)
})

test('draft: autopilot pre-approves posts that pass the check and holds the rest', async () => {
  const { SLOTS } = await import('../lib/config.js')
  const posts = SLOTS.map((s, i) => fakePost(i, s.platform, { format: 'text', headline: '' })).filter((p) => p.platform === 'linkedin')
  const sheet = fakeSheet([], { AUTOPILOT: 'ON' })
  let n = 0
  const out = await draftWeek({
    sheet,
    claude: { draftWeek: async () => ({ posts }), check: async () => (n++ === 0 ? { pass: false, issues: ['made-up number'] } : { pass: true, issues: [] }) },
    now: at('2026-11-14T10:00'),
    launch: async () => fakeBrowser,
    research: async () => [],
  })
  assert.deepEqual(out.rows.map((r) => r.status), ['Pending', 'Approved', 'Approved'])
  assert.match(out.rows[0].error, /made-up number/)
  assert.equal(out.rows[1].approvedBy, 'autopilot')
})

// ---------- learn job ----------
test('learn: only human-reviewed, not-yet-learned rows feed the voice update', async (t) => {
  const fs = await import('node:fs')
  t.mock.method(fs.default, 'writeFileSync', () => {})
  const rows = [
    row({ id: 'a', status: 'Posted', draft: 'x y z', final: 'x y z' }),
    row({ id: 'b', status: 'Rejected', notes: 'Too salesy' }),
    row({ id: 'c', status: 'Posted', approvedBy: 'autopilot' }),
    row({ id: 'd', status: 'Posted', learned: 'yes' }),
    row({ id: 'e', status: 'Pending' }),
  ]
  const sheet = fakeSheet(rows)
  let got
  await learn({ sheet, claude: { updateVoice: async ({ reviews }) => ((got = reviews), { voice: '# Voice\n' + 'x'.repeat(300), changes: ['c'] }) } })
  assert.deepEqual(got.map((r) => r.status), ['Posted', 'Rejected'])
  assert.equal(got[1].notes, 'Too salesy')
  assert.equal(rows.find((r) => r.id === 'a').learned, 'yes')
  assert.ok(sheet.calls.some(([k, key]) => k === 'setConfig' && key === 'READINESS'))
})
