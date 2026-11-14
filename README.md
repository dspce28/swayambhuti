# Swayambhuti Consultants — website

React 19 + Vite, Three.js via React Three Fiber, Motion (Framer Motion), Lenis smooth scroll.

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Where things live

| Path | What |
| --- | --- |
| `src/data/content.js` | **All site copy** — services, case studies, testimonials, blog, contact details. Edit text here. |
| `src/three/GearField.jsx` | The hero 3D scene: particles assemble from chaos into three meshing gears (Systemize / Humanize / Monetize). |
| `src/three/EngineCanvas.jsx` | Lazy-loaded canvas wrapper; lowers particle count on phones / low-memory devices and pauses when off-screen. |
| `src/components/motion.jsx` | Animation primitives: split-text reveals, counters, magnetic buttons, tilt cards, velocity marquee. |
| `src/components/Layout.jsx` | Nav, menu, preloader, cursor, page transitions, CTA band, footer. |
| `src/pages/` | Home and the inner pages. |

## Conversion features

- **Business Engine Health Check** (`/health-check`, `src/pages/HealthCheck.jsx`, questions in `src/data/healthcheck.js`):
  12 questions → score /100, per-pillar scores, top-3 leaks with fixes. Results are shareable (`?r=` link) and sent to
  Sunil on WhatsApp with the lead's details. The home page asks question 1 inline and hands the answer over.
- Scarcity line in the final CTA comes from `availability` in `src/data/content.js` — **keep it true**.

## SEO / AEO / GEO

- `npm run build` prerenders every route to static HTML (`scripts/prerender.mjs`) so Google, Bing and AI crawlers
  read full content without JavaScript. Each page gets its own title, description, canonical, Open Graph/Twitter tags
  and JSON-LD (`src/seo.js`: ProfessionalService, Person, FAQPage, Service, HowTo, WebApplication, Breadcrumbs).
- Generated at build: `sitemap.xml`, `robots.txt` (AI answer engines explicitly allowed), `llms.txt` (plain-language
  brief for LLMs). FAQ answers are written answer-first for featured snippets and AI answers.
- `SITE_URL` in `src/seo.js` is `https://swayambhuti.com` — change it if the domain differs.
- After launch: submit the sitemap in Google Search Console and Bing Webmaster Tools.

## Marketing hooks

- Set `VITE_GTM_ID` (Google Tag Manager) and/or `VITE_META_PIXEL_ID` as Vercel environment variables; tags load automatically.
- Events pushed to `dataLayer`: `cta_click`, `health_check_start`, `health_check_complete`, `health_check_share`, `generate_lead`.
- UTM parameters and click IDs (`gclid`, `fbclid`) are stored on landing and appended to WhatsApp leads, so every
  enquiry shows which campaign it came from.

## Deploying

`npm run build` and upload `dist/` to the web root. `public/.htaccess` (Apache/LiteSpeed, e.g. Hostinger) and
`vercel.json` route every path to `index.html` so client-side routes like `/engine` work on refresh.

## Lead capture

Every enquiry (contact form and Health Check) is POSTed to `api/lead.js`, a Vercel serverless function that
validates it, filters bots (hidden honeypot field, minimum fill time, rate limit) and forwards it to whichever
destinations are configured in **Vercel → Settings → Environment Variables**:

| Variable | Purpose |
| --- | --- |
| `LEAD_WEBHOOK_URL` | Google Sheet (via `integrations/google-sheets-lead-webhook.gs`), or a Zapier/Make webhook |
| `LEAD_WEBHOOK_SECRET` | Shared secret the Apps Script checks |
| `RESEND_API_KEY` + `LEAD_NOTIFY_EMAIL` | Email notification via resend.com (`LEAD_FROM_EMAIL` optional) |

- Stored → the visitor sees "Received"; WhatsApp is offered as an optional extra.
- No destination configured, or delivery failed → the visitor gets a one-tap pre-filled WhatsApp button, and the
  lead is queued in their browser and retried on their next visit. Nothing fails silently.
- Campaign attribution (UTM, gclid, fbclid, landing page) travels with every lead.
- `npm test` runs the endpoint tests.

## Performance

- Fonts are self-hosted (latin subset) and preloaded; no third-party request blocks first paint.
- The hero text is visible in the first paint (no preloader, no page curtain on first arrival).
- three.js loads only after the page is idle (desktop: or on first mouse move); low-end phones keep a lightweight
  SVG gear outline. Below-the-fold home sections mount progressively; off-screen animations pause.
- Inner pages are split from the home bundle and preloaded before the first render.

## Known gaps

- Blog cards have no article pages yet.
- Accessibility: `prefers-reduced-motion` freezes the 3D scene, smooth scroll and decorative animation.
