// Blog articles are Markdown files in content/blog/<slug>.md with a front-matter block on top.
// This module is pure (no Vite APIs) so the content pipeline and the tests can use it directly.
//
// ---
// title: The 5 SOPs Every SME Must Document Before Scaling
// description: One or two sentences — used as the excerpt, meta description and social preview.
// date: 2026-11-15            (YYYY-MM-DD; a future date stays hidden until a build on/after that day)
// updated: 2026-11-20         (optional)
// category: Operations
// tags: sops, scaling, owner dependency      (optional, comma separated)
// status: draft               (draft | published — anything not "published" never goes live)
// cover: /img/blog/sops.webp  (optional; site-relative path)
// coverAlt: Flipchart with a process map      (optional)
// ---
// Markdown body…
import { Marked } from 'marked'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE = /^\d{4}-\d{2}-\d{2}$/
const STATUSES = ['draft', 'published']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Only plain web, mail, phone and on-site links survive; javascript:, data: etc. are dropped.
const safeHref = (href) => typeof href === 'string' && /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(href.trim())
const isExternal = (href) => /^https?:\/\//i.test(href) && !/^https?:\/\/(www\.)?swayambhuti\.com(\/|$)/i.test(href)

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;|&#\d+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const md = new Marked({
  gfm: true,
  renderer: {
    // Raw HTML in an article is shown as text, never executed — articles may be machine-written.
    html({ text }) {
      return esc(text)
    },
    // The page already has the title as <h1>, so a "# Heading" in the body is demoted to <h2>.
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens)
      const level = Math.min(Math.max(depth, 2), 4)
      return `<h${level} id="${slugify(inner)}">${inner}</h${level}>\n`
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens)
      if (!safeHref(href)) return inner
      const t = title ? ` title="${esc(title)}"` : ''
      const ext = isExternal(href) ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${esc(href)}"${t}${ext}>${inner}</a>`
    },
    image({ href, title, text }) {
      if (!safeHref(href)) return ''
      const t = title ? ` title="${esc(title)}"` : ''
      return `<img src="${esc(href)}" alt="${esc(text)}"${t} loading="lazy" decoding="async" />`
    },
  },
})

export function parseFrontMatter(raw, file = 'article') {
  const m = String(raw).match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/)
  if (!m) throw new Error(`${file}: missing front matter — the file must start with a --- block`)
  const data = {}
  for (const line of m[1].split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf(':')
    if (i < 1) throw new Error(`${file}: front-matter line is not "key: value" → ${t}`)
    let val = t.slice(i + 1).trim()
    if (val.length >= 2 && /^(["']).*\1$/.test(val)) val = val.slice(1, -1)
    data[t.slice(0, i).trim()] = val
  }
  return { data, body: m[2] }
}

export function formatDate(iso) {
  const [y, mo, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[mo - 1]} ${y}`
}

const validDate = (s) => {
  if (!DATE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

// A broken article fails the build loudly (and the last good deploy stays live) instead of shipping half a page.
export function toArticle(file, raw) {
  const slug = file.split('/').pop().replace(/\.md$/i, '')
  if (!SLUG.test(slug)) throw new Error(`${file}: file name must be lowercase-words-with-hyphens.md`)
  const { data, body } = parseFrontMatter(raw, file)
  for (const k of ['title', 'description', 'date']) if (!data[k]) throw new Error(`${file}: "${k}" is required in front matter`)
  if (!validDate(data.date)) throw new Error(`${file}: date must be a real date as YYYY-MM-DD, got "${data.date}"`)
  if (data.updated && !validDate(data.updated)) throw new Error(`${file}: updated must be YYYY-MM-DD, got "${data.updated}"`)
  const status = (data.status || 'draft').toLowerCase()
  if (!STATUSES.includes(status)) throw new Error(`${file}: status must be draft or published, got "${data.status}"`)
  if (data.cover && !data.cover.startsWith('/')) throw new Error(`${file}: cover must be a site path like /img/blog/x.webp`)
  if (!body.trim()) throw new Error(`${file}: article body is empty`)

  const words = body.replace(/[#>*_`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length
  return {
    slug,
    path: `/blog/${slug}`,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated || '',
    dateLabel: formatDate(data.date),
    category: data.category || 'Insights',
    tags: (data.tags || '').split(',').map((s) => s.trim()).filter(Boolean),
    cover: data.cover || '',
    coverAlt: data.coverAlt || '',
    status,
    words,
    readMins: Math.max(1, Math.round(words / 200)),
    html: md.parse(body),
  }
}

// files: { 'content/blog/x.md': rawText }. Returns visible articles, newest first.
// Published + dated today or earlier are always visible; drafts and future-dated posts only when showDrafts.
export function buildArticles(files, { showDrafts = false, today = new Date().toISOString().slice(0, 10) } = {}) {
  return Object.entries(files)
    .map(([file, raw]) => toArticle(file, raw))
    .map((a) => ({ ...a, draft: a.status !== 'published' || a.date > today }))
    .filter((a) => showDrafts || !a.draft)
    .sort((a, b) => (a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? 1 : -1))
}

// Same category first, then most recent — never the article itself.
export function relatedTo(article, all, n = 3) {
  const others = all.filter((a) => a.slug !== article.slug)
  return [...others.filter((a) => a.category === article.category), ...others.filter((a) => a.category !== article.category)].slice(0, n)
}
