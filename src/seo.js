// SEO / AEO / GEO — one source of truth for every route's metadata and structured data.
// Used at runtime (useSeo) and at build time (scripts/prerender.mjs writes it into static HTML).
import { useEffect } from 'react'
import { cases, faqs, industries, services, site, stats } from './data/content'

export const SITE_URL = 'https://swayambhuti.com'
export const OG_IMAGE = `${SITE_URL}/og.jpg`

export const keywords = [
  'SME business consultant India',
  'business transformation consultant',
  'SME consulting',
  'business process systemization',
  'SOP consultant',
  'reduce owner dependency',
  'sales system consultant',
  'predictable revenue',
  'leadership coaching for SMEs',
  'business coach India',
  'employee engagement consultant',
  'customer experience consultant',
  'business performance audit',
  'growth consultant for small business',
  'Sunil Anandani',
  'SME Performance Engine',
]

export const routes = {
  '/': {
    title: 'SME Business Transformation Consultant in India | Swayambhuti',
    description:
      'Swayambhuti helps Indian SME owners escape owner dependency and build predictable growth with the SME Performance Engine™ — Systemize, Humanize, Monetize. 20+ years, 150+ businesses. Book a free audit.',
  },
  '/health-check': {
    title: 'Free Business Engine Health Check — 3-Minute SME Diagnostic | Swayambhuti',
    description:
      'Score your business out of 100 across Systemize, Humanize and Monetize. 12 questions, instant results, and the 3 leaks costing your SME the most — with what to fix first.',
  },
  '/about': {
    title: 'About Sunil Anandani — SME Transformation Specialist | Swayambhuti',
    description:
      'Sunil Anandani has spent 20+ years inside Indian SMEs, transforming 150+ businesses and impacting 300,000+ professionals. Most SME problems are system problems, not strategy problems.',
  },
  '/services': {
    title: 'SME Consulting Services: Process, Sales, Leadership | Swayambhuti',
    description:
      'Business transformation, process systemization & SOPs, sales engine development, leadership coaching, employee engagement, customer experience and business performance audits for SMEs.',
  },
  '/engine': {
    title: 'The SME Performance Engine™ — Systemize, Humanize, Monetize',
    description:
      'A three-pillar framework that moves SMEs from owner-run chaos to structured, scalable growth: SOPs and KPIs, leadership and culture, then a forecastable sales system.',
  },
  '/industries': {
    title: 'Industries We Transform — Manufacturing, Retail, Healthcare & More | Swayambhuti',
    description:
      'SME transformation for manufacturing, retail & FMCG, healthcare, education, construction & real estate, professional services, hospitality and technology businesses across India.',
  },
  '/case-studies': {
    title: 'SME Transformation Case Studies — 40% Growth, 3x Referrals | Swayambhuti',
    description:
      'How a Pune manufacturer grew revenue 40% while the founder cut hours 70%, a retail chain tripled referrals, and an education institute grew admissions 62%.',
  },
  '/training': {
    title: 'SME Training Programs & Workshops — Sales, Leadership, SOPs | Swayambhuti',
    description:
      'SME Owner Masterclass, Process & Systems Bootcamp, Sales Performance Program, Leadership Excellence Program and more — customised to your industry and team.',
  },
  '/testimonials': {
    title: 'Client Testimonials — SME Owners on Working with Sunil Anandani',
    description: 'What SME founders and MDs across India say after transforming their business engine with Swayambhuti Consultants.',
  },
  '/blog': {
    title: 'SME Growth Blog — Operations, Sales & Leadership Insights | Swayambhuti',
    description: 'Practical articles on SOPs, sales systems, owner dependency, customer experience and predictable revenue for SME owners.',
  },
  '/contact': {
    title: 'Book a Free Business Performance Audit | Swayambhuti Consultants',
    description: 'Book a free, no-obligation 60-minute Business Performance Audit with Sunil Anandani. Call or WhatsApp +91 99257 78355.',
  },
}

/* ---------- JSON-LD ---------- */
const org = {
  '@type': ['ProfessionalService', 'Organization'],
  '@id': `${SITE_URL}/#org`,
  name: site.name,
  alternateName: 'Swayambhuti',
  slogan: site.tagline,
  url: SITE_URL,
  logo: `${SITE_URL}/img/logo.webp`,
  image: OG_IMAGE,
  telephone: site.phone,
  email: site.email,
  areaServed: { '@type': 'Country', name: 'India' },
  address: { '@type': 'PostalAddress', addressCountry: 'IN' },
  priceRange: '₹₹₹',
  sameAs: [site.linkedin],
  founder: { '@id': `${SITE_URL}/#sunil` },
  knowsAbout: keywords.slice(0, 13),
  description: routes['/'].description,
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'SME transformation services',
    itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, description: s.desc } })),
  },
}

export const person = {
  '@type': 'Person',
  '@id': `${SITE_URL}/#sunil`,
  name: 'Sunil Anandani',
  jobTitle: 'Founder & Chief Consultant',
  description: 'SME business transformation specialist with 20+ years of experience, 150+ businesses transformed and 300,000+ professionals impacted.',
  image: `${SITE_URL}/img/sunil.webp`,
  worksFor: { '@id': `${SITE_URL}/#org` },
  sameAs: [site.linkedin],
  knowsAbout: ['Business transformation', 'Process systemization', 'Sales systems', 'Leadership development', 'SME growth'],
}

const website = { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: site.name, publisher: { '@id': `${SITE_URL}/#org` }, inLanguage: 'en-IN' }

const faqPage = {
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
}

// items: [[name, path], …] after Home. Default: the route's own title.
const crumbs = (path, items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: [['Home', '/'], ...(items || [[routes[path].title.split(/[—|]/)[0].trim(), path]])].map(([name, p], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
    item: SITE_URL + p,
  })),
})

// page (optional): per-page overrides from data/blog.js — { schema: [...], crumbs: [...] }.
export function schemaFor(path, page = {}) {
  const graph = [org, website]
  if (path === '/') graph.push(person, faqPage)
  if (path === '/about') graph.push(person, { '@type': 'AboutPage', url: SITE_URL + path, mainEntity: { '@id': `${SITE_URL}/#sunil` } })
  if (path === '/services') graph.push(...services.map((s) => ({ '@type': 'Service', name: s.name, description: s.desc, provider: { '@id': `${SITE_URL}/#org` }, areaServed: 'India' })))
  if (path === '/engine')
    graph.push({
      '@type': 'HowTo',
      name: 'How to move an SME from owner-dependent chaos to predictable growth',
      step: ['Systemize: document SOPs, KPIs and decision rights', 'Humanize: build leaders, culture and customer experience', 'Monetize: install a forecastable sales system, referrals and pricing'].map((t, i) => ({ '@type': 'HowToStep', position: i + 1, text: t })),
    })
  if (path === '/health-check')
    graph.push({ '@type': 'WebApplication', name: 'Business Engine Health Check', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' }, url: SITE_URL + path })
  if (path === '/case-studies')
    graph.push({ '@type': 'ItemList', itemListElement: cases.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.title, description: c.result })) })
  if (path === '/industries') graph.push({ '@type': 'ItemList', itemListElement: industries.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name })) })
  if (path === '/contact') graph.push({ '@type': 'ContactPage', url: SITE_URL + path })
  if (page.schema) graph.push(...page.schema)
  if (path !== '/') graph.push(crumbs(path, page.crumbs))
  return { '@context': 'https://schema.org', '@graph': graph }
}

// page (optional): { title, description, type, image, published, modified, noindex, schema, crumbs } —
// used for routes that aren't in `routes`, such as blog articles.
export function headTags(path, page) {
  const m = page || routes[path] || routes['/']
  const image = m.image || OG_IMAGE
  const url = SITE_URL + (path === '/' ? '/' : path)
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    `<meta name="keywords" content="${esc(keywords.join(', '))}" />`,
    `<link rel="canonical" href="${url}" />`,
    ...(m.noindex ? ['<meta name="robots" content="noindex, nofollow" />'] : []),
    `<meta property="og:type" content="${m.type || 'website'}" />`,
    ...(m.published ? [`<meta property="article:published_time" content="${m.published}" />`, `<meta property="article:modified_time" content="${m.modified || m.published}" />`, `<meta property="article:author" content="Sunil Anandani" />`] : []),
    `<meta property="og:site_name" content="${site.name}" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    ...(m.image ? [] : ['<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />']),
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<script type="application/ld+json">${JSON.stringify(schemaFor(path, m)).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ')
}

// Runtime: keep title / description / canonical correct during client-side navigation.
// page (optional) overrides routes[path], e.g. an article's own title and description.
export function useSeo(path, page) {
  const m = page || routes[path]
  useEffect(() => {
    if (!m) return
    document.title = m.title
    const set = (sel, attr, val) => {
      let el = document.head.querySelector(sel)
      if (!el) {
        el = document.createElement(sel.startsWith('link') ? 'link' : 'meta')
        const [, k, v] = sel.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/)
        el.setAttribute(k, v)
        document.head.appendChild(el)
      }
      el.setAttribute(attr, val)
    }
    set('meta[name="description"]', 'content', m.description)
    set('meta[property="og:title"]', 'content', m.title)
    set('meta[property="og:description"]', 'content', m.description)
    set('link[rel="canonical"]', 'href', SITE_URL + path)
    const robots = document.head.querySelector('meta[name="robots"]')
    if (m.noindex) set('meta[name="robots"]', 'content', 'noindex, nofollow')
    else if (robots) robots.remove()
  }, [path, m])
}

export const statsLine = stats.map((s) => `${s.value}${s.suffix} ${s.label.toLowerCase()}`).join(', ')
