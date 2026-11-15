// Branded images for posts: quote cards and carousel slides, 1080×1350 (4:5, Instagram's tallest feed size).
// JPEG, because the Instagram publishing API accepts only JPEG images.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const W = 1080
const H = 1350

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const dataUri = (rel, type) => `data:${type};base64,${fs.readFileSync(path.join(ROOT, rel)).toString('base64')}`

let assets
function brand() {
  assets ??= {
    fraunces: dataUri('public/fonts/fraunces-normal.woff2', 'font/woff2'),
    frauncesItalic: dataUri('public/fonts/fraunces-italic.woff2', 'font/woff2'),
    manrope: dataUri('public/fonts/manrope-normal.woff2', 'font/woff2'),
    logo: dataUri('public/img/logo.webp', 'image/webp'),
    sunil: dataUri('public/img/sunil.webp', 'image/webp'),
  }
  return assets
}

function page(inner, { dark = true } = {}) {
  const a = brand()
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;font-weight:300 700;src:url(${a.fraunces}) format('woff2')}
@font-face{font-family:Fraunces;font-style:italic;font-weight:300 700;src:url(${a.frauncesItalic}) format('woff2')}
@font-face{font-family:Manrope;font-weight:400 700;src:url(${a.manrope}) format('woff2')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${W}px;height:${H}px}
body{font-family:Manrope,sans-serif;position:relative;overflow:hidden;
  background:${dark ? 'radial-gradient(120% 90% at 100% 0%,#173a29 0%,#0a1d14 45%,#06130d 100%)' : '#f5f2ea'};
  color:${dark ? '#f6efe0' : '#11211a'}}
.rays{position:absolute;inset:-30%;background:repeating-conic-gradient(from 0deg at 85% 10%,rgba(212,175,90,.07) 0deg 5deg,transparent 5deg 16deg);pointer-events:none}
.wrap{position:absolute;inset:96px 90px 200px;display:flex;flex-direction:column}
.eyebrow{font-size:26px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${dark ? '#d4af5a' : '#1f6a47'}}
.count{position:absolute;top:96px;right:90px;font-size:26px;font-weight:700;letter-spacing:.1em;color:${dark ? '#d4af5a' : '#8f6b22'}}
.fit{flex:1;display:flex;flex-direction:column;justify-content:center;overflow:hidden}
h1,h2{font-family:Fraunces,serif;font-weight:400;letter-spacing:-.02em;line-height:1.08}
h1{font-size:112px}
h2{font-size:84px;margin-bottom:40px}
h2 em,h1 em{font-style:italic;color:${dark ? '#f0d484' : '#8f6b22'}}
p{font-size:44px;line-height:1.42;color:${dark ? '#d8d2c2' : '#2b3a33'}}
.quote-mark{font-family:Fraunces,serif;font-size:260px;line-height:.6;color:#d4af5a;height:120px}
.foot{position:absolute;left:90px;right:90px;bottom:80px;display:flex;align-items:center;gap:22px;
  padding-top:34px;border-top:2px solid ${dark ? 'rgba(246,239,224,.16)' : 'rgba(17,33,26,.14)'}}
.foot img.me{width:76px;height:76px;border-radius:50%;object-fit:cover;border:3px solid #d4af5a}
.foot b{display:block;font-size:30px}
.foot span{font-size:24px;opacity:.75}
.foot img.logo{width:64px;height:64px;margin-left:auto}
.swipe{position:absolute;right:90px;bottom:190px;font-size:28px;font-weight:700;color:#d4af5a;letter-spacing:.06em}
.bar{position:absolute;left:0;top:0;height:14px;background:linear-gradient(90deg,#5fd39a,#d4af5a)}
</style></head><body><div class="rays"></div>${inner}
<div class="foot"><img class="me" src="${a.sunil}" alt=""><div><b>Sunil Anandani</b><span>Swayambhuti Consultants</span></div><img class="logo" src="${a.logo}" alt=""></div>
</body></html>`
}

// Wrap *words* in <em> for the gold italic accent the website uses.
const accent = (s) => esc(s).replace(/\*([^*]+)\*/g, '<em>$1</em>')

export function quoteHtml({ headline, eyebrow }) {
  return page(`<div class="wrap"><div class="eyebrow">${esc(eyebrow)}</div><div class="fit"><div class="quote-mark">“</div><h1 data-fit>${accent(headline)}</h1></div></div>`)
}

export function slideHtml({ slide, index, total, eyebrow }) {
  const first = index === 0
  const last = index === total - 1
  const dark = first || last
  const bar = `<div class="bar" style="width:${Math.round(((index + 1) / total) * 100)}%"></div>`
  const count = `<div class="count">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>`
  if (first) {
    return page(`${bar}${count}<div class="wrap"><div class="eyebrow">${esc(eyebrow)}</div><div class="fit"><h1 data-fit>${accent(slide.title)}</h1>${slide.body ? `<p style="margin-top:40px">${esc(slide.body)}</p>` : ''}</div></div><div class="swipe">SWIPE →</div>`, { dark })
  }
  return page(`${bar}${count}<div class="wrap"><div class="fit"><h2 data-fit>${accent(slide.title)}</h2><p>${esc(slide.body)}</p></div></div>${last ? '' : '<div class="swipe">→</div>'}`, { dark })
}

// Shrink the headline until the slide's text fits its box (long text never overflows or gets cut).
async function fit(page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    const box = document.querySelector('.fit')
    const head = document.querySelector('[data-fit]')
    const para = box.querySelector('p')
    let size = parseFloat(getComputedStyle(head).fontSize)
    let psize = para ? parseFloat(getComputedStyle(para).fontSize) : 0
    while (box.scrollHeight > box.clientHeight + 1 && size > 40) {
      size -= 4
      head.style.fontSize = `${size}px`
      if (para && psize > 30) {
        psize -= 1.5
        para.style.fontSize = `${psize}px`
      }
    }
  })
}

/**
 * Renders a post's visual. Returns the written file paths (relative to the repo root), or [] for text posts.
 * outDir is relative to the repo root, e.g. "public/social/2026-11-16".
 */
export async function renderVisual(browser, post, { id, outDir, eyebrow }) {
  if (post.format === 'text') return []
  const dir = path.join(ROOT, outDir)
  fs.mkdirSync(dir, { recursive: true })
  const pageObj = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
  const files = []
  try {
    const htmls =
      post.format === 'quote'
        ? [quoteHtml({ headline: post.headline, eyebrow })]
        : post.slides.map((slide, index) => slideHtml({ slide, index, total: post.slides.length, eyebrow }))
    for (const [i, html] of htmls.entries()) {
      await pageObj.setContent(html, { waitUntil: 'load' })
      await fit(pageObj)
      const rel = path.posix.join(outDir, `${id}-${i + 1}.jpg`)
      await pageObj.screenshot({ path: path.join(ROOT, rel), type: 'jpeg', quality: 90 })
      files.push(rel)
    }
  } finally {
    await pageObj.close()
  }
  return files
}
