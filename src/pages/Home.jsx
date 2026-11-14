import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { Link } from 'react-router-dom'
import { industries, painTicker, pains, pillars, services, stats, testimonials } from '../data/content'
import Icon from '../components/Icon'
import { Button, Counter, ease, Heading, Marquee, Reveal, rise, SplitText, Stagger, TiltCard } from '../components/motion'
import { FAQ, HealthTeaser, Impact, MeetSunil, ProcessPinned, ScarcityCTA, StackedTestimonials, ValuesQuad } from '../components/Premium'
import { useSeo } from '../seo'

const EngineCanvas = lazy(() => import('../three/EngineCanvas'))

/* ================= HERO ================= */
function Hero() {
  const ref = useRef(null)
  const reduced = useReducedMotion()
  const progress = useMotionValue(0)
  const { scrollY, scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const vel = useVelocity(scrollY)
  const speed = useSpring(useTransform(vel, (v) => 1 + Math.min(Math.abs(v) / 250, 8)), { stiffness: 60, damping: 20 })
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 160])
  const contentO = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const canvasScale = useTransform(scrollYProgress, [0, 1], [1, 1.25])

  useEffect(() => {
    if (reduced) {
      progress.set(1)
      return
    }
    const c = animate(progress, 1, { duration: 3.2, ease: [0.65, 0, 0.35, 1], delay: 0.6 })
    return () => c.stop()
  }, [progress, reduced])

  return (
    <section className="hero" ref={ref}>
      <div className="hero-bg" />
      <motion.div className="hero-canvas" style={{ scale: canvasScale }}>
        <Suspense fallback={null}>
          <EngineCanvas progress={progress} speed={speed} reduced={!!reduced} className="canvas-fill" />
        </Suspense>
      </motion.div>
      <div className="hero-vignette" />

      <motion.div className="container hero-content" style={{ y: contentY, opacity: contentO }}>
        <motion.div className="pill" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease }}>
          <span className="pulse" /> 20+ Years · 300,000+ Professionals Impacted
        </motion.div>
        <h1 className="display">
          <SplitText text="Fix your" delay={0.5} />
          <br />
          <SplitText text="business engine." delay={0.65} className="em" />
          <br />
          <SplitText text="Build predictable growth." delay={0.8} className="display-sm" />
        </h1>
        <motion.p className="lead hero-lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.9, ease }}>
          We help SME owners move from reactive chaos to structured, scalable performance — eliminating operational inefficiencies, elevating customer
          experience, and building disciplined sales engines.
        </motion.p>
        <motion.div className="btn-row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.9, ease }}>
          <Button to="/contact" icon="calendar">
            Book Business Performance Audit
          </Button>
          <Button to="/services" variant="ghost">
            Explore Services
          </Button>
        </motion.div>
      </motion.div>

      <motion.div className="hero-legend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4, duration: 1 }}>
        <span className="legend-title">The SME Performance Engine™</span>
        {pillars.map((p) => (
          <span key={p.key} className="legend-item">
            <i style={{ background: p.color }} />
            {p.num} {p.name}
          </span>
        ))}
      </motion.div>

      <div className="hero-stats container">
        {stats.slice(0, 4).map((s, i) => (
          <motion.div key={s.label} className="hero-stat" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.6 + i * 0.1, duration: 0.8, ease }}>
            <strong>
              <Counter value={s.value} suffix={s.suffix} />
            </strong>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </div>

    </section>
  )
}

/* ================= PROBLEM: scroll-scrubbed quote ================= */
function ScrubWord({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const color = useTransform(progress, range, ['#6b7f74', '#f6efe0'])
  return (
    <motion.span style={{ opacity, color }} className="scrub-word">
      {children}{' '}
    </motion.span>
  )
}

function Problem() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.2'] })
  const quote = '“I work 14 hours a day but the business barely runs without me.”'.split(' ')
  return (
    <section className="section problem">
      <div className="container">
        <Reveal className="eyebrow light">
          <span className="eyebrow-line" />
          Sound familiar?
        </Reveal>
        <p className="scrub" ref={ref}>
          {quote.map((w, i) => (
            <ScrubWord key={i} progress={scrollYProgress} range={[i / quote.length, (i + 1) / quote.length]}>
              {w}
            </ScrubWord>
          ))}
        </p>

        <div className="problem-grid">
          <div>
            <Heading eyebrow="The Problem" title="Is your business" em="running you?" light sub="Most SME owners are trapped in an endless cycle — doing everything themselves, unable to step back, watching growth stall." />
            <Reveal delay={0.2}>
              <Button to="/contact">Let's fix this together</Button>
            </Reveal>
          </div>
          <Stagger className="pain-list">
            {pains.map((p, i) => (
              <motion.div variants={rise} className="pain" key={p.title}>
                <span className="pain-num">0{i + 1}</span>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  )
}

/* ================= FOUNDER ================= */
function Founder() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])
  const badgeY = useTransform(scrollYProgress, [0, 1], [60, -60])
  return (
    <section className="section founder" ref={ref}>
      <div className="container founder-grid">
        <div className="portrait-wrap">
          <motion.div
            className="portrait"
            initial={{ clipPath: 'inset(100% 0 0 0 round 28px)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0 round 28px)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.4, ease }}
          >
            <motion.img src="/img/sunil.webp" alt="Sunil Anandani, Founder & Chief Consultant" style={{ y: imgY, scale: 1.18 }} loading="lazy" />
          </motion.div>
          <motion.div className="portrait-badge" style={{ y: badgeY }}>
            <strong>
              <Counter value={20} suffix="+" />
            </strong>
            <span>Years of
              <br />
              experience</span>
          </motion.div>
        </div>
        <div>
          <Heading eyebrow="Founder & Chief Consultant" title="Sunil" em="Anandani" sub="SME Business Transformation Specialist" />
          <Reveal as="blockquote" className="founder-quote" delay={0.1}>
            “I partner with growth-stage SMEs ready to transition from reactive operations to structured, scalable performance. By eliminating
            inefficiencies, elevating customer experience, and architecting disciplined sales engines — I help owners achieve Strategic Clarity, Operational
            Control, and Sustained Predictable Growth.”
          </Reveal>
          <Stagger className="metric-row">
            {[stats[0], stats[2], stats[3]].map((s) => (
              <motion.div variants={rise} className="metric" key={s.label}>
                <strong>
                  <Counter value={s.value} suffix={s.suffix} />
                </strong>
                <span>{s.label}</span>
              </motion.div>
            ))}
          </Stagger>
          <Reveal delay={0.2}>
            <Button to="/about" variant="dark">
              Our story & approach
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ================= SERVICES ================= */
function Services() {
  return (
    <section className="section services-sec">
      <div className="container">
        <div className="split-head">
          <Heading eyebrow="What we do" title="Business transformation" em="services" sub="Consulting designed to fix every broken part of your business engine — from operations to sales to leadership." />
          <Reveal delay={0.2}>
            <Button to="/services" variant="dark">
              View all services
            </Button>
          </Reveal>
        </div>
        <Stagger className="card-grid">
          {services
            .filter((s) => s.core)
            .map((s, i) => (
              <motion.div variants={rise} key={s.name}>
                <TiltCard className="svc-card">
                  <div className="svc-top">
                    <span className="svc-icon">
                      <Icon name={s.icon} size={26} />
                    </span>
                    <span className="svc-idx">0{i + 1}</span>
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                  <div className="svc-outcome">
                    <Icon name="arrow" size={16} stroke={2} /> {s.outcome}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
        </Stagger>
      </div>
    </section>
  )
}

/* ================= ENGINE: pinned horizontal scroll ================= */
function EngineScroller() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-66.666%'])
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])
  const [active, setActive] = useState(0)
  useEffect(() => scrollYProgress.on('change', (v) => setActive(Math.min(2, Math.floor(v * 3)))), [scrollYProgress])

  return (
    <section className="engine-scroll" ref={ref}>
      <div className="engine-sticky">
        <div className="container engine-head">
          <div>
            <div className="eyebrow light">
              <span className="eyebrow-line" />
              Proprietary framework
            </div>
            <h2 className="h2 light">
              The SME Performance <span className="em">Engine™</span>
            </h2>
          </div>
          <div className="engine-steps">
            {pillars.map((p, i) => (
              <span key={p.key} className={i === active ? 'on' : ''}>
                {p.num}
              </span>
            ))}
            <div className="engine-bar">
              <motion.i style={{ scaleX: bar }} />
            </div>
          </div>
        </div>
        <motion.div className="engine-track" style={{ x }}>
          {pillars.map((p) => (
            <article className="engine-panel" key={p.key} style={{ '--c': p.color }}>
              <div className="engine-num">{p.num}</div>
              <div className="engine-body">
                <span className="engine-step">Step {p.num}</span>
                <h3>{p.name}</h3>
                <p className="engine-title">{p.title}</p>
                <p>{p.desc}</p>
                <ul>
                  {p.steps.slice(0, 4).map(([n, t]) => (
                    <li key={n}>
                      <span>{n}</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </motion.div>
        <div className="container">
          <Link to="/engine" className="text-link light" data-cursor="hover">
            Explore the full engine framework <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ================= STATS BAND ================= */
function StatsBand() {
  return (
    <section className="stats-band">
      <Stagger className="container stats-grid">
        {stats.map((s) => (
          <motion.div variants={rise} key={s.label} className="stat">
            <strong>
              <Counter value={s.value} suffix={s.suffix} />
            </strong>
            <span>{s.label}</span>
          </motion.div>
        ))}
      </Stagger>
    </section>
  )
}

/* ================= INDUSTRIES: hover list ================= */
function Industries() {
  const [hover, setHover] = useState(null)
  return (
    <section className="section industries-sec">
      <div className="container">
        <Heading eyebrow="Our expertise" title="Industries" em="we serve" sub="Deep domain knowledge across the industries that power India's growing economy." />
        <div className="ind-list" onPointerLeave={() => setHover(null)}>
          {industries.map((ind, i) => (
            <Reveal key={ind.name} delay={i * 0.04}>
              <Link to="/industries" className={`ind-row ${hover === i ? 'on' : ''}`} onPointerEnter={() => setHover(i)} data-cursor="hover">
                <span className="ind-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="ind-name">{ind.name}</span>
                <span className="ind-icon">
                  <Icon name={ind.icon} size={30} />
                </span>
                <AnimatePresence>
                  {hover === i && (
                    <motion.span className="ind-desc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.35, ease }}>
                      {ind.desc}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ================= TESTIMONIALS carousel ================= */
export function Testimonials({ items = testimonials.slice(0, 4) }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const id = setTimeout(() => setI((v) => (v + 1) % items.length), 6500)
    return () => clearTimeout(id)
  }, [i, paused, items.length])
  const t = items[i]
  return (
    <section className="section testi" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
      <div className="container">
        <Heading eyebrow="What clients say" title="Results that" em="speak" center />
        <div className="testi-stage">
          <Icon name="quote" size={64} className="testi-mark" stroke={1} />
          <AnimatePresence mode="wait">
            <motion.figure key={i} initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }} transition={{ duration: 0.7, ease }}>
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <span className="avatar">{t.name[0]}</span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </span>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
          <div className="testi-dots">
            {items.map((x, k) => (
              <button key={x.name} onClick={() => setI(k)} className={k === i ? 'on' : ''} aria-label={`Show testimonial from ${x.name}`}>
                {k === i && !paused && <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 6.5, ease: 'linear' }} />}
                {k === i && paused && <i style={{ transform: 'scaleX(1)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  useSeo('/')
  return (
    <>
      <Hero />
      <Marquee items={painTicker} className="marquee-pain" />
      <Problem />
      <HealthTeaser />
      <MeetSunil />
      <Services />
      <EngineScroller />
      <Impact />
      <ProcessPinned />
      <StatsBand />
      <ValuesQuad dark />
      <Industries />
      <StackedTestimonials />
      <FAQ />
      <ScarcityCTA />
    </>
  )
}
