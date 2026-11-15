// node --test tests/ — the Markdown article parser the website build and the content pipeline both rely on.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildArticles, parseFrontMatter, relatedTo, toArticle } from '../src/lib/blog-parse.js'

const fm = (o, body = 'Hello **world**.') => `---\n${Object.entries(o).map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}`
const base = { title: 'A title: with a colon', description: 'Desc', date: '2026-11-01', status: 'published', category: 'Sales' }

test('parses front matter, keeping colons in values and stripping quotes', () => {
  const { data, body } = parseFrontMatter(fm({ ...base, title: '"Quoted: yes"' }))
  assert.equal(data.title, 'Quoted: yes')
  assert.equal(body.trim(), 'Hello **world**.')
})

test('builds an article with slug, path, read time and rendered HTML', () => {
  const a = toArticle('/content/blog/my-post.md', fm(base, '# Big\n\nText [in](/health-check) and [out](https://example.com).'))
  assert.equal(a.slug, 'my-post')
  assert.equal(a.path, '/blog/my-post')
  assert.equal(a.dateLabel, '1 November 2026')
  assert.equal(a.readMins, 1)
  assert.match(a.html, /<h2 id="big">Big<\/h2>/, 'body h1 is demoted to h2')
  assert.match(a.html, /<a href="\/health-check">in<\/a>/)
  assert.match(a.html, /<a href="https:\/\/example.com" target="_blank" rel="noopener noreferrer">out<\/a>/)
})

test('raw HTML and unsafe links are neutralised', () => {
  const a = toArticle('x/safe.md', fm(base, '<script>alert(1)</script>\n\n[click](javascript:alert(1)) <img src=x onerror=alert(1)>\n\n![p](javascript:x)'))
  assert.doesNotMatch(a.html, /<script|<img src=x|javascript:/i)
  assert.match(a.html, /&lt;script&gt;/)
})

test('rejects broken files with a clear message', () => {
  assert.throws(() => toArticle('x/Bad Name.md', fm(base)), /file name/)
  assert.throws(() => toArticle('x/a.md', 'no front matter'), /missing front matter/)
  assert.throws(() => toArticle('x/a.md', fm({ ...base, date: '2026-02-30' })), /real date/)
  assert.throws(() => toArticle('x/a.md', fm({ ...base, status: 'live' })), /status/)
  assert.throws(() => toArticle('x/a.md', fm({ ...base, title: '' })), /title/)
  assert.throws(() => toArticle('x/a.md', fm(base, '   ')), /empty/)
})

test('status defaults to draft; drafts and future posts are hidden unless showDrafts', () => {
  const { status, ...noStatus } = base
  void status
  const files = {
    'b/live.md': fm(base),
    'b/no-status.md': fm(noStatus),
    'b/future.md': fm({ ...base, date: '2026-12-31' }),
    'b/newer.md': fm({ ...base, date: '2026-11-10' }),
  }
  const today = '2026-11-15'
  assert.deepEqual(buildArticles(files, { today }).map((a) => a.slug), ['newer', 'live'])
  const all = buildArticles(files, { today, showDrafts: true })
  assert.deepEqual(all.map((a) => a.slug), ['future', 'newer', 'live', 'no-status'])
  assert.deepEqual(all.filter((a) => a.draft).map((a) => a.slug), ['future', 'no-status'])
})

test('related articles prefer the same category and never include the article itself', () => {
  const files = {
    'b/a.md': fm(base),
    'b/b.md': fm({ ...base, category: 'Ops', date: '2026-11-05' }),
    'b/c.md': fm({ ...base, date: '2026-10-01' }),
  }
  const all = buildArticles(files, { today: '2026-11-15' })
  assert.deepEqual(relatedTo(all.find((x) => x.slug === 'a'), all).map((x) => x.slug), ['c', 'b'])
})

test('every article in content/blog parses', async () => {
  const fs = await import('node:fs')
  const dir = new URL('../content/blog/', import.meta.url)
  const files = Object.fromEntries(fs.readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => [f, fs.readFileSync(new URL(f, dir), 'utf8')]))
  assert.ok(Object.keys(files).length > 0)
  assert.doesNotThrow(() => buildArticles(files, { showDrafts: true }))
})
