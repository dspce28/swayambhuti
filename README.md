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

## Deploying

`npm run build` and upload `dist/` to the web root. `public/.htaccess` (Apache/LiteSpeed, e.g. Hostinger) and
`vercel.json` route every path to `index.html` so client-side routes like `/engine` work on refresh.

## Known gaps

- **Contact form has no backend.** It validates, then opens WhatsApp with the enquiry pre-filled (email fallback offered).
  To capture leads silently, wire `submit` in `src/pages/Pages.jsx` to a form service (Formspree, Web3Forms) or your CRM.
- Blog cards have no article pages yet.
- Accessibility: `prefers-reduced-motion` freezes the 3D scene, smooth scroll and decorative animation.
