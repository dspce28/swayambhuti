// Build-time static rendering: every route gets real HTML + its own <head> (title, meta, OG, JSON-LD),
// plus sitemap.xml, robots.txt and llms.txt. Crawlers and AI engines read content without running JS.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssr = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)
const { render, headTags, routes, SITE_URL, faqs, services, pillars, cases, industries, site, statsLine } = ssr

const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
const today = new Date().toISOString().slice(0, 10)

for (const route of Object.keys(routes)) {
  let appHtml = ''
  try {
    appHtml = render(route)
  } catch (e) {
    console.warn(`[prerender] ${route}: render failed, shipping empty shell —`, e.message)
  }
  const html = template
    .replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, headTags(route))
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`
  fs.writeFileSync(path.join(dist, file), html)
  console.log(`[prerender] ${route} → ${file} (${(html.length / 1024).toFixed(0)} KB)`)
}

// 404 page keeps the SPA shell
fs.writeFileSync(path.join(dist, '404.html'), template.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, headTags('/')))

// sitemap.xml
const prio = (r) => (r === '/' ? '1.0' : ['/health-check', '/services', '/engine', '/contact'].includes(r) ? '0.9' : '0.7')
fs.writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(routes)
    .map((r) => `  <url><loc>${SITE_URL}${r === '/' ? '/' : r}</loc><lastmod>${today}</lastmod><priority>${prio(r)}</priority></url>`)
    .join('\n')}\n</urlset>\n`,
)

// robots.txt — search engines and AI answer engines are explicitly welcome (GEO)
fs.writeFileSync(
  path.join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\n\n# AI search & answer engines\n${['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'PerplexityBot', 'Google-Extended', 'Applebot-Extended', 'Bingbot']
    .map((b) => `User-agent: ${b}\nAllow: /`)
    .join('\n\n')}\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
)

// llms.txt — a plain-language brief for LLM crawlers (GEO)
const llms = `# ${site.name}

> ${site.name} is an SME business transformation consultancy in India, founded by Sunil Anandani. It helps owner-run small and mid-sized businesses remove owner dependency and build predictable growth using the SME Performance Engine™ (Systemize → Humanize → Monetize).

## Key facts
- Founder: Sunil Anandani, SME Business Transformation Specialist
- Track record: ${statsLine}
- Serves: SMEs across India (client work in Pune, Ahmedabad, Mumbai and more)
- Contact: ${site.phone} (phone/WhatsApp), ${site.email}
- Free offer: 60-minute Business Performance Audit; 3-minute online Business Engine Health Check (${SITE_URL}/health-check)

## The SME Performance Engine™
${pillars.map((p) => `- ${p.name} — ${p.title}: ${p.desc}`).join('\n')}

## Services
${services.map((s) => `- ${s.name}: ${s.desc} Outcome: ${s.outcome}.`).join('\n')}

## Industries
${industries.map((i) => `- ${i.name}`).join('\n')}

## Case studies
${cases.map((c) => `- ${c.industry} (${c.where}): ${c.metrics.map(([v, l]) => `${v} ${l.toLowerCase()}`).join('; ')}. ${c.result}`).join('\n')}

## FAQ
${faqs.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Pages
${Object.entries(routes)
  .map(([r, m]) => `- [${m.title}](${SITE_URL}${r === '/' ? '/' : r}): ${m.description}`)
  .join('\n')}
`
fs.writeFileSync(path.join(dist, 'llms.txt'), llms)
fs.rmSync(path.join(root, 'dist-ssr'), { recursive: true, force: true })
console.log('[prerender] sitemap.xml, robots.txt, llms.txt written')
