import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { cases, industries, pillars, posts, services, site, stats, testimonials, trainings, values } from '../data/content'
import Icon from '../components/Icon'
import { Button, Counter, ease, Heading, Reveal, rise, SplitText, Stagger, TiltCard } from '../components/motion'
import { CTA } from '../components/Layout'
import { Testimonials as TestiCarousel } from './Home'

const EngineCanvas = lazy(() => import('../three/EngineCanvas'))

/* ---------- shared page hero ---------- */
function PageHero({ eyebrow, title, em, sub }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const o = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  return (
    <section className="page-hero" ref={ref}>
      <div className="orbs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="grid-lines" aria-hidden="true" />
      <motion.div className="container page-hero-inner" style={{ y, opacity: o }}>
        <motion.div className="eyebrow light" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.8, ease }}>
          <span className="eyebrow-line" />
          {eyebrow}
        </motion.div>
        <h1 className="h1">
          <SplitText text={title} delay={0.45} /> {em && <SplitText text={em} className="em" delay={0.6} />}
        </h1>
        {sub && (
          <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.9, ease }}>
            {sub}
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}

/* ================= ABOUT ================= */
export function About() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Turning two decades of experience into"
        em="your growth."
        sub="Sunil Anandani has spent 20+ years inside the engine rooms of Indian SMEs — not as an external observer, but as an embedded transformation partner who delivers measurable results."
      />
      <section className="section">
        <div className="container founder-grid">
          <div className="portrait-wrap">
            <motion.div className="portrait" initial={{ clipPath: 'inset(0 100% 0 0 round 28px)' }} whileInView={{ clipPath: 'inset(0 0% 0 0 round 28px)' }} viewport={{ once: true }} transition={{ duration: 1.4, ease }}>
              <img src="/img/sunil.webp" alt="Sunil Anandani" loading="lazy" />
            </motion.div>
          </div>
          <div className="prose">
            <Heading eyebrow="Founder" title="Sunil" em="Anandani" sub="SME Business Transformation Specialist" />
            <Reveal as="p">
              Sunil Anandani is an SME transformation consultant with a track record spanning 20+ years, 150+ businesses transformed, and over 300,000
              professionals directly impacted through his work.
            </Reveal>
            <Reveal as="p" delay={0.1}>
              His methodology is built on a single conviction: <strong>most SME problems are not strategy problems — they are system problems.</strong> Chaotic
              operations, owner dependency, and inconsistent revenue are symptoms of missing infrastructure, not missing ambition.
            </Reveal>
            <Reveal as="blockquote" className="founder-quote" delay={0.2}>
              “I partner with growth-stage SMEs ready to transition from reactive operations to structured, scalable performance — to reduce chaos, remove owner
              dependency, and achieve stable month-on-month growth.”
            </Reveal>
            <Stagger className="metric-row">
              {[stats[0], stats[2], stats[4]].map((s) => (
                <motion.div variants={rise} className="metric" key={s.label}>
                  <strong>
                    <Counter value={s.value} suffix={s.suffix} />
                  </strong>
                  <span>{s.label}</span>
                </motion.div>
              ))}
            </Stagger>
            <Button to="/contact" variant="dark">
              Work with Sunil
            </Button>
          </div>
        </div>
      </section>
      <section className="section dark">
        <div className="container">
          <Heading eyebrow="Our core values" title="What we" em="stand for" light />
          <Stagger className="values-grid">
            {values.map((v, i) => (
              <motion.div variants={rise} className="value" key={v.name}>
                <span className="value-num">0{i + 1}</span>
                <h3>{v.name}</h3>
                <p>{v.text}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>
      <CTA title="Start your" em="transformation." sub="Book a free Business Performance Audit with Sunil to identify your biggest leverage points." />
    </>
  )
}

/* ================= SERVICES ================= */
export function Services() {
  return (
    <>
      <PageHero
        eyebrow="What we offer"
        title="Transformation"
        em="services."
        sub="Each service addresses a specific broken component of your business engine — from operations and culture to sales and profitability."
      />
      <section className="section">
        <Stagger className="container card-grid">
          {services.map((s, i) => (
            <motion.div variants={rise} key={s.name}>
              <TiltCard className="svc-card">
                <div className="svc-top">
                  <span className="svc-icon">
                    <Icon name={s.icon} size={26} />
                  </span>
                  <span className="svc-idx">{String(i + 1).padStart(2, '0')}</span>
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
      </section>
      <CTA title="Not sure which service" em="you need?" sub="Book a free Business Performance Audit. We'll identify exactly what your business needs." />
    </>
  )
}

/* ================= ENGINE: sticky 3D + scroll-linked pillar focus ================= */
function PillarBlock({ p, i, onActive }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' })
  useEffect(() => {
    if (inView) onActive(i)
  }, [inView, i, onActive])
  return (
    <div ref={ref} className="pillar-block" style={{ '--c': p.color }}>
      <Reveal className="pillar-tag">
        Pillar {p.num}
      </Reveal>
      <h2 className="h2 light">
        <SplitText text={p.name} /> <span className="pillar-sub">— {p.title}</span>
      </h2>
      <Reveal as="p" className="lead">
        {p.desc}
      </Reveal>
      <Stagger className="pillar-steps">
        {p.steps.map(([n, t, d]) => (
          <motion.div variants={rise} className="pillar-step" key={n}>
            <span>{n}</span>
            <div>
              <h4>{t}</h4>
              <p>{d}</p>
            </div>
          </motion.div>
        ))}
      </Stagger>
    </div>
  )
}

export function Engine() {
  const [active, setActive] = useState(-1)
  const reduced = useReducedMotion()
  return (
    <>
      <PageHero
        eyebrow="Proprietary framework"
        title="The SME Performance"
        em="Engine™"
        sub="A proven three-pillar methodology that has transformed 150+ businesses from operational chaos to structured, scalable growth."
      />
      <section className="engine-page">
        <div className="engine-3d">
          <Suspense fallback={null}>
            <EngineCanvas progress={1} speed={1} focus={active} layout="center" reduced={!!reduced} className="canvas-fill" />
          </Suspense>
          <div className="engine-3d-label">
            <AnimatePresence mode="wait">
              <motion.span key={active} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {active < 0 ? 'Three gears. One engine.' : `${pillars[active].num} — ${pillars[active].name}`}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <div className="engine-content">
          {pillars.map((p, i) => (
            <PillarBlock key={p.key} p={p} i={i} onActive={setActive} />
          ))}
        </div>
      </section>
      <CTA title="Ready to start" em="the engine?" sub="Begin with a Business Performance Audit to identify which pillar to activate first." />
    </>
  )
}

/* ================= INDUSTRIES ================= */
export function Industries() {
  return (
    <>
      <PageHero
        eyebrow="Domain expertise"
        title="Industries we"
        em="transform."
        sub="Deep operational knowledge across India's most dynamic and growth-hungry sectors — enabling targeted, relevant transformation strategies."
      />
      <section className="section">
        <Stagger className="container ind-grid">
          {industries.map((ind, i) => (
            <motion.div variants={rise} key={ind.name}>
              <TiltCard className="ind-card" max={6}>
                <span className="ind-card-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="svc-icon">
                  <Icon name={ind.icon} size={28} />
                </span>
                <h3>{ind.name}</h3>
                <p>{ind.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </Stagger>
      </section>
      <CTA />
    </>
  )
}

/* ================= CASE STUDIES ================= */
function CaseCard({ c, i }) {
  const [open, setOpen] = useState(i === 0)
  return (
    <motion.article layout className={`case ${open ? 'open' : ''}`} transition={{ layout: { duration: 0.6, ease } }}>
      <motion.button layout="position" className="case-head" onClick={() => setOpen((o) => !o)} aria-expanded={open} data-cursor="hover">
        <span className="case-meta">
          <span className="case-ind">{c.industry}</span>
          <span>{c.where}</span>
        </span>
        <h3>{c.title}</h3>
        <motion.span className="case-toggle" animate={{ rotate: open ? 45 : 0 }}>
          <Icon name="plus" size={22} />
        </motion.span>
      </motion.button>
      <motion.div layout="position" className="case-metrics">
        {c.metrics.map(([v, l]) => (
          <div key={l}>
            <strong>{v}</strong>
            <span>{l}</span>
          </div>
        ))}
      </motion.div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="case-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.6, ease }}>
            <div className="case-cols">
              <div>
                <h4>The challenge</h4>
                <p>{c.challenge}</p>
              </div>
              <div>
                <h4>What we did</h4>
                <p>{c.approach}</p>
              </div>
              <div>
                <h4>The result</h4>
                <p>{c.result}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}

export function CaseStudies() {
  return (
    <>
      <PageHero eyebrow="Proven results" title="Transformation" em="case studies." sub="Real businesses. Real problems. Measurable results delivered through the SME Performance Engine™." />
      <section className="section">
        <div className="container case-list">
          {cases.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <CaseCard c={c} i={i} />
            </Reveal>
          ))}
        </div>
      </section>
      <CTA />
    </>
  )
}

/* ================= TRAINING ================= */
export function Training() {
  return (
    <>
      <PageHero eyebrow="Workshops & programs" title="Training &" em="development." sub="High-impact workshops for SME owners, leadership teams, and sales professionals ready to perform at the next level." />
      <section className="section">
        <Stagger className="container card-grid">
          {trainings.map((t) => (
            <motion.div variants={rise} key={t.name}>
              <TiltCard className="svc-card">
                <div className="svc-top">
                  <span className="svc-icon">
                    <Icon name={t.icon} size={26} />
                  </span>
                  <span className="chip">{t.format}</span>
                </div>
                <h3>{t.name}</h3>
                <p>{t.desc}</p>
              </TiltCard>
            </motion.div>
          ))}
        </Stagger>
      </section>
      <CTA title="Book a" em="training program." sub="All programs can be customized for your industry and team size. Get in touch to discuss your requirements." />
    </>
  )
}

/* ================= TESTIMONIALS ================= */
export function TestimonialsPage() {
  return (
    <>
      <PageHero eyebrow="Client voices" title="What our clients" em="say." sub="Feedback from SME owners and leadership teams who have been through the transformation journey with Sunil Anandani." />
      <TestiCarousel items={testimonials} />
      <section className="section tight">
        <Stagger className="container testi-grid">
          {testimonials.map((t) => (
            <motion.figure variants={rise} className="testi-card" key={t.name}>
              <div className="stars" aria-label="5 out of 5">
                ★★★★★
              </div>
              <blockquote>{t.quote}</blockquote>
              <figcaption>
                <span className="avatar">{t.name[0]}</span>
                <span>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </Stagger>
      </section>
      <CTA />
    </>
  )
}

/* ================= BLOG ================= */
export function Blog() {
  return (
    <>
      <PageHero eyebrow="Insights & ideas" title="Business growth" em="blog." sub="Practical insights on SME transformation, operational excellence, sales performance, and leadership — from 20+ years of front-line experience." />
      <section className="section">
        <Stagger className="container blog-grid">
          {posts.map((p, i) => (
            <motion.article variants={rise} className={`post ${i === 0 ? 'post-feature' : ''}`} key={p.title} data-cursor="hover">
              <div className="post-art" aria-hidden="true">
                <span>{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div className="post-body">
                <span className="chip">{p.cat}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="post-meta">
                  <span>{p.date}</span>
                  <span>{p.read} read</span>
                </div>
              </div>
            </motion.article>
          ))}
        </Stagger>
      </section>
    </>
  )
}

/* ================= CONTACT ================= */
const industryOptions = ['Manufacturing', 'Retail & FMCG', 'Healthcare', 'Education', 'Construction & Real Estate', 'Technology', 'Hospitality', 'Professional Services', 'Other']

export function Contact() {
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', industry: '', challenge: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Please enter your name'
    if (!form.company.trim()) e.company = 'Please enter your company'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Please enter a valid email'
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'Please enter a valid phone number'
    setErrors(e)
    return !Object.keys(e).length
  }

  const message = () =>
    `Hello Sunil, I'd like to book a Business Performance Audit.%0A%0A` +
    [
      `Name: ${form.name}`,
      `Company: ${form.company}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      form.industry && `Industry: ${form.industry}`,
      form.challenge && `Biggest challenge: ${form.challenge}`,
    ]
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('%0A')

  // No backend yet: the enquiry is handed to WhatsApp (primary channel for Indian SMEs).
  const submit = (e) => {
    e.preventDefault()
    if (!validate()) return
    window.open(`https://wa.me/${site.phoneRaw}?text=${message()}`, '_blank', 'noopener')
    setSent(true)
  }

  const field = (k, label, type = 'text', req = true) => (
    <label className={`field ${errors[k] ? 'has-error' : ''} ${form[k] ? 'filled' : ''}`}>
      <input type={type} value={form[k]} onChange={set(k)} placeholder=" " required={req} aria-invalid={!!errors[k]} />
      <span>
        {label}
        {req && ' *'}
      </span>
      <AnimatePresence>
        {errors[k] && (
          <motion.em initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {errors[k]}
          </motion.em>
        )}
      </AnimatePresence>
    </label>
  )

  return (
    <>
      <PageHero eyebrow="Get in touch" title="Book your free" em="Business Performance Audit." sub="A structured, no-obligation conversation to identify your biggest bottlenecks and map a clear path to predictable, scalable growth." />
      <section className="section">
        <div className="container contact-grid">
          <div>
            <Heading eyebrow="Contact information" title="Let's start a" em="conversation." />
            <Stagger className="contact-list">
              {[
                ['pin', 'Location', site.location],
                ['phone', 'Phone / WhatsApp', site.phone, `tel:${site.phone.replace(/\s/g, '')}`],
                ['mail', 'Email', site.email, `mailto:${site.email}`],
                ['linkedin', 'LinkedIn', 'linkedin.com/in/sunilanandani', site.linkedin],
              ].map(([icon, l, v, href]) => (
                <motion.div variants={rise} className="contact-item" key={l}>
                  <span className="svc-icon">
                    <Icon name={icon} size={22} />
                  </span>
                  <span>
                    <small>{l}</small>
                    {href ? (
                      <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                        {v}
                      </a>
                    ) : (
                      <strong>{v}</strong>
                    )}
                  </span>
                </motion.div>
              ))}
            </Stagger>
            <Reveal className="next-box">
              <h4>What happens next</h4>
              <p>Sunil's team will reach out within 24 hours to schedule a 60-minute Business Performance Audit call — at no charge, with no obligation.</p>
            </Reveal>
          </div>

          <Reveal className="form-card" delay={0.15}>
            <AnimatePresence mode="wait">
              {sent ? (
                <motion.div key="ok" className="form-ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease }}>
                  <svg viewBox="0 0 52 52" width="76" height="76" aria-hidden="true">
                    <motion.circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8 }} />
                    <motion.path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 0.5 }} />
                  </svg>
                  <h3>Almost done, {form.name.split(' ')[0]}.</h3>
                  <p>We opened WhatsApp with your details pre-filled — just hit send. Prefer email?</p>
                  <div className="btn-row center">
                    <Button href={`mailto:${site.email}?subject=${encodeURIComponent('Business Performance Audit — ' + form.company)}&body=${message()}`} icon="mail" variant="dark">
                      Send by email instead
                    </Button>
                  </div>
                  <button className="text-link" onClick={() => setSent(false)}>
                    Edit details
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} noValidate exit={{ opacity: 0, y: -10 }}>
                  <h3>Book free audit session</h3>
                  <p className="muted">Fill in your details and we'll be in touch within 24 hours.</p>
                  <div className="form-row">
                    {field('name', 'Full name')}
                    {field('company', 'Company name')}
                  </div>
                  <div className="form-row">
                    {field('email', 'Email address', 'email')}
                    {field('phone', 'Phone number', 'tel')}
                  </div>
                  <label className={`field ${form.industry ? 'filled' : ''}`}>
                    <select value={form.industry} onChange={set('industry')}>
                      <option value="" />
                      {industryOptions.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                    <span>Industry / business type</span>
                  </label>
                  <label className={`field ${form.challenge ? 'filled' : ''}`}>
                    <textarea rows={4} value={form.challenge} onChange={set('challenge')} placeholder=" " />
                    <span>What's your biggest challenge right now?</span>
                  </label>
                  <Button type="submit" icon="calendar" className="btn-block">
                    Book free consultation
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </section>
    </>
  )
}

export function NotFound() {
  return <PageHero eyebrow="404" title="This page has" em="stalled." sub="The page you were looking for doesn't exist. Head back home to restart the engine." />
}
