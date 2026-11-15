// This week's news for each pillar, from Google News RSS (India edition). No API key needed.
// The headlines are only hooks for Sunil's point of view — drafts never restate them as his facts.

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim()

const tag = (xml, name) => {
  const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))
  return m ? decode(m[1]) : ''
}

export function parseRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const source = tag(item, 'source')
    let title = tag(item, 'title')
    // Google News appends " - Source" to titles
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3))
    return { title, link: tag(item, 'link'), published: tag(item, 'pubDate'), source }
  })
}

export async function researchTrends(pillars, { fetchImpl = fetch, perQuery = 5, days = 7 } = {}) {
  const out = []
  const seen = new Set()
  for (const p of pillars) {
    for (const q of p.queries) {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:${days}d`)}&hl=en-IN&gl=IN&ceid=IN:en`
      try {
        const res = await fetchImpl(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; content-research)' } })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        for (const item of parseRss(await res.text()).slice(0, perQuery)) {
          const key = item.title.toLowerCase().replace(/\W+/g, ' ').slice(0, 80)
          if (!item.title || seen.has(key)) continue
          seen.add(key)
          out.push({ pillar: p.id, ...item })
        }
      } catch (e) {
        // One failed feed shouldn't stop the week; the drafts can still use evergreen topics.
        console.warn(`[research] "${q}" failed: ${e.message}`)
      }
    }
  }
  return out
}
