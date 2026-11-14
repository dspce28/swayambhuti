import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { Link, useNavigate } from 'react-router-dom'
import { availability, faqs, impact, process, testimonials, values } from '../data/content'
import { questions } from '../data/healthcheck'
import { scenes } from './Scenes'
import { EngineGears } from './Gears'
import Icon from './Icon'
import { Button, ease, Heading, Magnetic, Reveal, SplitText } from './motion'
import { track } from '../lib/marketing'

/* =========================================================
   Health Check teaser — question 1 answered right on the home page
   ========================================================= */
export function HealthTeaser() {
  const navigate = useNavigate()
  const q = questions[0]
  const [picked, setPicked] = useState(null)
  const go = (k) => {
    setPicked(k)
    track('health_check_start', { from: 'home_teaser_q1' })
    setTimeout(() => navigate(`/health-check?a=${k}`), 450)
  }
  return (
    <section className="section teaser">
      <div className="container teaser-grid">
        <div>
          <Heading eyebrow="Free 3-minute diagnostic" title="How healthy is your" em="business engine?" light sub="Answer 12 quick questions. Get a score out of 100, the three leaks costing you the most, and what to fix first. Start right here:" />
          <Reveal className="teaser-card" delay={0.15}>
            <span className="hc-pillar" style={{ color: '#e3bd5c' }}>
              Question 01 / 12 · Systemize
            </span>
            <h3>{q.q}</h3>
            <div className="hc-options">
              {q.options.map((o, k) => (
                <button key={o} className={`hc-option ${picked === k ? 'on' : ''}`} onClick={() => go(k)} data-cursor="hover">
                  <span className="hc-key">{'ABCD'[k]}</span>
                  <span>{o}</span>
                  <span className="hc-meter" aria-hidden="true">
                    {[0, 1, 2].map((d) => (
                      <i key={d} className={d < k ? 'lit' : ''} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </Reveal>
        </div>
        <Reveal className="teaser-visual" delay={0.2}>
          <EngineGears health={picked == null ? [0.55, 0.55, 0.55] : [picked / 3, 0.55, 0.55]} />
        </Reveal>
      </div>
    </section>
  )
}

/* =========================================================
   Impact — cards with self-drawing mini charts (Kelvora-style)
   ========================================================= */
function MiniChart({ type }) {
  const v = { once: true, margin: '-40px' }
  if (type === 'bars')
    return (
      <svg viewBox="0 0 240 110" className="mini">
        {[30, 44, 38, 58, 52, 74, 96].map((h, i) => (
          <motion.rect key={i} x={6 + i * 33} width="24" rx="4" className={i === 6 ? 'hi' : ''} initial={{ y: 104, height: 0 }} whileInView={{ y: 104 - h, height: h }} viewport={v} transition={{ delay: i * 0.08, duration: 0.8, ease }} />
        ))}
        <line x1="0" x2="240" y1="105" y2="105" className="axis" />
      </svg>
    )
  if (type === 'line')
    return (
      <svg viewBox="0 0 240 110" className="mini">
        {[25, 55, 85].map((y) => (
          <line key={y} x1="0" x2="240" y1={y} y2={y} className="grid" />
        ))}
        <motion.path d="M4 96 C 40 92, 60 70, 92 76 S 140 82, 160 58 S 210 26, 232 14" className="ln" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={v} transition={{ duration: 1.6, ease }} />
        <motion.circle cx="232" cy="14" r="5" className="dot" initial={{ scale: 0 }} whileInView={{ scale: [0, 1.4, 1] }} viewport={v} transition={{ delay: 1.5, duration: 0.5 }} />
      </svg>
    )
  if (type === 'donut')
    return (
      <svg viewBox="0 0 240 110" className="mini">
        <circle cx="55" cy="55" r="40" className="ring" />
        <motion.circle cx="55" cy="55" r="40" className="ring-on" initial={{ pathLength: 0 }} whileInView={{ pathLength: 0.78 }} viewport={v} transition={{ duration: 1.6, ease }} style={{ rotate: -90 }} />
        {[34, 56, 78].map((y, i) => (
          <g key={y}>
            <rect x="118" y={y - 4} width="112" height="7" rx="3.5" className="track" />
            <motion.rect x="118" y={y - 4} height="7" rx="3.5" className={i ? 'fill2' : 'fill1'} initial={{ width: 0 }} whileInView={{ width: [96, 66, 48][i] }} viewport={v} transition={{ delay: 0.3 + i * 0.15, duration: 1, ease }} />
          </g>
        ))}
      </svg>
    )
  return (
    <svg viewBox="0 0 240 110" className="mini">
      {[22, 55, 88].map((y, r) => (
        <g key={y}>
          <line x1="10" x2="226" y1={y} y2={y} className="grid" />
          {[0, 1, 2, 3, 4, 5].map((c) => (
            <motion.circle key={c} cx={14 + c * 42} cy={y} r={c === 5 ? 7 : 5} className={c === 5 ? 'dot' : 'dot-off'} initial={{ opacity: 0.25 }} whileInView={{ opacity: 1 }} viewport={v} transition={{ delay: r * 0.15 + c * 0.1, duration: 0.3 }} />
          ))}
        </g>
      ))}
    </svg>
  )
}

export function Impact() {
  return (
    <section className="section impact">
      <div className="container">
        <div className="split-head">
          <Heading eyebrow="Business impact" title="Measure what moves your" em="engine." />
          <Reveal as="p" className="lead side-lead" delay={0.1}>
            Every engagement is run on numbers you can see each week — so progress is visible, not promised.
          </Reveal>
        </div>
        <div className="impact-grid">
          {impact.map((c, i) => (
            <motion.article className="impact-card" key={c.title} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ delay: i * 0.1, duration: 0.8, ease }} whileHover={{ y: -8 }}>
              <MiniChart type={c.chart} />
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </motion.article>
          ))}
        </div>
        <p className="fineprint">Charts are illustrative and do not represent specific client results.</p>
      </div>
    </section>
  )
}

/* =========================================================
   How the work runs — pinned, number rolls, scene wipes (Helena-style)
   ========================================================= */
export function ProcessPinned() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [i, setI] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', (v) => setI(Math.min(process.length - 1, Math.floor(v * process.length))))
  const tilt = useSpring(useTransform(scrollYProgress, [0, 1], [-2.5, 2.5]), { stiffness: 80, damping: 20 })
  const step = process[i]
  const Scene = scenes[step.scene]

  return (
    <section className="process" ref={ref} style={{ height: `${process.length * 90 + 30}vh` }}>
      <div className="process-sticky">
        <div className="container process-grid">
          <div className="process-left">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              How the work runs
            </div>
            <h2 className="h2">
              Four moves, <span className="em">in this</span> order.
            </h2>
            <div className="process-num" aria-hidden="true">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={step.n} initial={{ y: '100%', opacity: 0 }} animate={{ y: '0%', opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.6, ease }}>
                  {step.n}
                </motion.span>
              </AnimatePresence>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={step.n} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <h3 className="process-title">
                  <small>{step.n}</small> {step.title}
                </h3>
                <p className="process-text">{step.text}</p>
              </motion.div>
            </AnimatePresence>
            <div className="process-ticks">
              {process.map((p, k) => (
                <span key={p.n} className={k <= i ? 'on' : ''} />
              ))}
            </div>
          </div>
          <motion.div className="process-frame" style={{ rotate: tilt }}>
            <AnimatePresence initial={false}>
              <motion.div key={step.scene} className="process-scene" initial={{ clipPath: 'inset(100% 0 0 0)' }} animate={{ clipPath: 'inset(0% 0 0 0)' }} exit={{ opacity: 0.4 }} transition={{ duration: 0.8, ease }}>
                <Scene />
              </motion.div>
            </AnimatePresence>
            <span className="process-badge">
              {step.n} / {String(process.length).padStart(2, '0')}
            </span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   Values — 2×2 quadrant that assembles on scroll (Kelvora-style)
   ========================================================= */
function Quad({ i }) {
  return (
    <span className="quad" aria-hidden="true">
      {[0, 1, 2, 3].map((k) => (
        <i key={k} className={k === i ? 'on' : ''} />
      ))}
    </span>
  )
}

export function ValuesQuad({ dark }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 22 })
  const dirs = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ]
  // narrow screens: cards only rise into place (a sideways offset would push text off-screen)
  const spread = typeof window !== 'undefined' && window.innerWidth < 760 ? 0 : 70
  const xs = dirs.map(([dx]) => useTransform(p, [0, 1], [dx * spread, 0])) // eslint-disable-line react-hooks/rules-of-hooks
  const ys = dirs.map(([, dy]) => useTransform(p, [0, 1], [dy * 50, 0])) // eslint-disable-line react-hooks/rules-of-hooks
  const rs = dirs.map(([dx, dy]) => useTransform(p, [0, 1], [dx * dy * 4, 0])) // eslint-disable-line react-hooks/rules-of-hooks
  const emblem = useTransform(p, [0, 1], [0.4, 1])
  const spin = useTransform(p, [0, 1], [-120, 0])

  return (
    <section className={`section values-sec ${dark ? 'dark' : ''}`} ref={ref}>
      <div className="container">
        <div className="split-head">
          <Heading eyebrow="Our values" title="Principles that move" em="SMEs forward." light={dark} />
          <Reveal as="p" className="lead side-lead" delay={0.1}>
            Four choices we make on every engagement — mapped the way a consultant would: as a simple two-by-two.
          </Reveal>
        </div>
        <div className="quad-grid">
          {values.map((v, i) => (
            <motion.article className="quad-card" key={v.name} style={{ x: xs[i], y: ys[i], rotate: rs[i] }} whileHover={{ scale: 1.015 }}>
              <div className="quad-top">
                <span>0{i + 1}</span>
                <Quad i={i} />
              </div>
              <h3>{v.name}</h3>
              <p>{v.text}</p>
            </motion.article>
          ))}
          <motion.div className="quad-emblem" style={{ scale: emblem, rotate: spin }} aria-hidden="true">
            <svg viewBox="0 0 60 60">
              {[26, 18, 10].map((r) => (
                <circle key={r} cx="30" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="1.2" />
              ))}
              <circle cx="30" cy="30" r="3" fill="currentColor" />
              <path d="M30 2v10M30 48v10M2 30h10M48 30h10" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   In their words — stacked sticky cards (Helena-style)
   ========================================================= */
function StackCard({ t, i, total, progress }) {
  const start = i / total
  const scale = useTransform(progress, [start, 1], [1, 1 - (total - i) * 0.04])
  const dim = useTransform(progress, [start, Math.min(1, start + 1 / total)], [0, i === total - 1 ? 0 : 0.82])
  return (
    <div className="stack-slot" style={{ top: `calc(110px + ${i * 22}px)` }}>
      <motion.figure className={`stack-card ${i % 2 ? 'dark' : ''}`} style={{ scale }}>
        <motion.span className="stack-dim" style={{ opacity: dim }} aria-hidden="true" />
        <span className="stack-mark">“</span>
        <blockquote>{t.quote}</blockquote>
        <figcaption>
          <strong>{t.name}</strong>
          <small>{t.role}</small>
        </figcaption>
      </motion.figure>
    </div>
  )
}

export function StackedTestimonials({ items = testimonials.slice(0, 5) }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  return (
    <section className="section stack-sec">
      <div className="container stack-grid" ref={ref}>
        <div className="stack-left">
          <div className="stack-sticky">
            <Heading eyebrow="In their words" title="What owners say when Sunil is" em="not in the room." />
            <Reveal as="p" className="muted">
              Feedback from SME founders and MDs across India.
            </Reveal>
            <Reveal className="stack-count">{String(items.length).padStart(2, '0')} voices</Reveal>
            <Reveal>
              <Link to="/testimonials" className="text-link" data-cursor="hover">
                Read all testimonials <Icon name="arrow" size={16} />
              </Link>
            </Reveal>
          </div>
        </div>
        <div className="stack-right">
          {items.map((t, i) => (
            <StackCard key={t.name} t={t} i={i} total={items.length} progress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   Meet Sunil — arch portrait that expands to full frame (Helena-style)
   ========================================================= */
export function MeetSunil() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 100, damping: 24 })
  const w = useTransform(p, [0, 0.55], ['38%', '92%'])
  const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 700
  const h = useTransform(p, [0, 0.55], [isNarrow ? '56vh' : '68vh', '82vh'])
  const archR = useTransform(p, [0, 0.55], [400, 36])
  const baseR = useTransform(p, [0, 0.55], [20, 36])
  const leftX = useTransform(p, [0, 0.5], ['0%', '-60%'])
  const rightX = useTransform(p, [0, 0.5], ['0%', '60%'])
  const narrow = typeof window !== 'undefined' && window.innerWidth <= 700
  // words fade before the growing portrait can overtake them
  const wordsO = useTransform(p, [0.06, 0.2], [1, 0])
  const capO = useTransform(p, [0.55, 0.75], [0, 1])
  const capY = useTransform(p, [0.55, 0.75], [40, 0])
  const imgScale = useTransform(p, [0, 1], [1.15, 1])
  const wide = typeof window !== 'undefined' && window.innerWidth > 800
  const imgW = useTransform(p, [0, 0.55], ['100%', wide ? '46%' : '100%'])

  return (
    <section className="meet" ref={ref}>
      <div className="meet-sticky">
        <motion.div className="meet-words" style={{ opacity: wordsO }} aria-hidden="true">
          <motion.span style={narrow ? {} : { x: leftX }}>Meet</motion.span>
          <motion.span className="em" style={narrow ? {} : { x: rightX }}>
            Sunil
          </motion.span>
        </motion.div>
        <motion.div className="meet-frame" style={{ width: w, height: h, borderTopLeftRadius: archR, borderTopRightRadius: archR, borderBottomLeftRadius: baseR, borderBottomRightRadius: baseR }}>
          <motion.img src="/img/sunil-bw.webp" alt="Sunil Anandani, founder of Swayambhuti Consultants" style={{ scale: imgScale, width: imgW }} loading="lazy" />
          <div className="meet-shade" />
          <motion.div className="meet-caption" style={{ opacity: capO, y: capY }}>
            <span className="eyebrow light">
              <span className="eyebrow-line" />
              Sunil Anandani — 20+ years inside Indian SMEs
            </span>
            <p>
              “Most SME problems are not strategy problems — they are <span className="em">system problems.</span> I’ve sat in the engine rooms of 150+ businesses. I know
              what a 14-hour day feels like — and I know most of it is fixable.”
            </p>
            <Link to="/about" className="text-link light" data-cursor="hover">
              The story & approach <Icon name="arrow" size={16} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* =========================================================
   FAQ — answer-first (AEO)
   ========================================================= */
export function FAQ({ items = faqs.slice(0, 6), dark }) {
  const [open, setOpen] = useState(0)
  return (
    <section className={`section faq ${dark ? 'dark' : ''}`} id="faq">
      <div className="container faq-grid">
        <div>
          <Heading eyebrow="FAQ" title="The questions owners" em="ask first." light={dark} />
          <Reveal as="p" className="muted">
            Anything else — ask on the free audit call. That is what it is for.
          </Reveal>
          <Reveal delay={0.1} className="btn-row">
            <Button to="/contact" variant="dark">
              Book a free audit
            </Button>
          </Reveal>
        </div>
        <div className="faq-list">
          {items.map((f, i) => (
            <div className={`faq-item ${open === i ? 'open' : ''}`} key={f.q}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} data-cursor="hover">
                <h3>{f.q}</h3>
                <motion.span className="faq-plus" animate={{ rotate: open === i ? 45 : 0 }}>
                  <Icon name="plus" size={18} />
                </motion.span>
              </button>
              {/* kept in the DOM (just collapsed) so search engines & AI crawlers read every answer */}
              <motion.div className="faq-a" initial={false} animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.5, ease }}>
                <p>{f.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================
   Scarcity CTA — diagonal edge, rotating badge (Helena-style)
   ========================================================= */
export function RotatingBadge({ to = '/contact', text = 'BOOK A FREE AUDIT · BOOK A FREE AUDIT · ' }) {
  return (
    <Magnetic strength={0.3}>
      <Link to={to} className="badge" aria-label="Book a free audit" data-cursor="hover" onClick={() => track('cta_click', { cta: 'rotating_badge' })}>
        <svg viewBox="0 0 200 200" className="badge-ring" aria-hidden="true">
          <defs>
            <path id="badge-circle" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" />
          </defs>
          <text>
            <textPath href="#badge-circle">{text}</textPath>
          </text>
        </svg>
        <span className="badge-arrow">
          <Icon name="arrow" size={30} stroke={1.6} />
        </span>
      </Link>
    </Magnetic>
  )
}

export function ScarcityCTA({ title = 'Start with', em = 'sixty minutes.' }) {
  return (
    <section className="scta">
      <div className="scta-bg" aria-hidden="true" />
      <div className="container scta-inner">
        <Reveal className="scta-eyebrow">
          <span className="pulse" /> {availability}
        </Reveal>
        <h2 className="scta-title">
          <SplitText text={title} /> <br />
          <SplitText text={em} className="em" delay={0.15} />
        </h2>
        <div className="scta-row">
          <Reveal as="p" className="lead" delay={0.2}>
            No deck, no pitch. A free 60-minute Business Performance Audit: you talk, Sunil listens, and you leave knowing exactly where your engine is leaking.
          </Reveal>
          <RotatingBadge />
        </div>
        <Reveal className="btn-row" delay={0.3}>
          <Button to="/contact" icon="calendar">
            Book my free audit
          </Button>
          <Button to="/health-check" variant="ghost">
            Or take the 3-minute health check
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
