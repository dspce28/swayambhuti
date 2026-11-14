// Marketing plumbing: analytics events (GTM / GA4 / Meta-ready) and UTM attribution.
// Set VITE_GTM_ID (e.g. GTM-XXXXXXX) and/or VITE_META_PIXEL_ID in Vercel env vars to activate tags.
import { site } from '../data/content'

const isBrowser = typeof window !== 'undefined'

export function track(event, params = {}) {
  if (!isBrowser) return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params, ...getAttribution() })
  if (typeof window.fbq === 'function' && (event === 'generate_lead' || event === 'health_check_complete')) {
    window.fbq('track', event === 'generate_lead' ? 'Lead' : 'CompleteRegistration', params)
  }
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']

export function captureAttribution() {
  if (!isBrowser) return
  try {
    const p = new URLSearchParams(window.location.search)
    const found = {}
    UTM_KEYS.forEach((k) => p.get(k) && (found[k] = p.get(k)))
    if (Object.keys(found).length) {
      found.landing_page = window.location.pathname
      localStorage.setItem('sw-attr', JSON.stringify(found))
    }
  } catch {
    /* storage blocked */
  }
}

export function getAttribution() {
  try {
    return JSON.parse(localStorage.getItem('sw-attr') || '{}')
  } catch {
    return {}
  }
}

// Build a WhatsApp deep link; attribution is appended so leads can be traced to campaigns.
export function whatsappLink(lines) {
  const attr = getAttribution()
  const src = attr.utm_source ? [`(via ${[attr.utm_source, attr.utm_campaign].filter(Boolean).join(' / ')})`] : []
  const text = [...lines, ...src].filter(Boolean).join('\n')
  return `https://wa.me/${site.phoneRaw}?text=${encodeURIComponent(text)}`
}

export function loadTags() {
  if (!isBrowser) return
  const gtm = import.meta.env.VITE_GTM_ID
  if (gtm && !window.google_tag_manager) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
    const s = document.createElement('script')
    s.async = true
    s.src = `https://www.googletagmanager.com/gtm.js?id=${gtm}`
    document.head.appendChild(s)
  }
  const px = import.meta.env.VITE_META_PIXEL_ID
  if (px && !window.fbq) {
    /* eslint-disable */
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments) }
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    /* eslint-enable */
    window.fbq('init', px)
    window.fbq('track', 'PageView')
  }
}
