import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { decode, encode, pillarColors, pillarNames, questions, score } from '../data/healthcheck'
import { EngineGears } from '../components/Gears'
import { Button, Counter, ease } from '../components/motion'
import Icon from '../components/Icon'
import { track, whatsappLink } from '../lib/marketing'
import { submitLead } from '../lib/leads'
import { site } from '../data/content'
import { useSeo } from '../seo'

const KEY = 'sw-hc'
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null')
  } catch {
    return null
  }
}
const save = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

/* ---------- Question step ---------- */
function Question({ index, value, onAnswer, onBack }) {
  const q = questions[index]
  return (
    <motion.div
      key={index}
      className="hc-question"
      initial={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -40, filter: 'blur(6px)', transition: { duration: 0.22 } }}
      transition={{ duration: 0.45, ease }}
    >
      <div className="hc-meta">
        <span className="hc-pillar" style={{ color: pillarColors[q.pillar] }}>
          {String(q.pillar + 1).padStart(2, '0')} · {pillarNames[q.pillar]}
        </span>
        <span>
          {String(index + 1).padStart(2, '0')} / {questions.length}
        </span>
      </div>
      <h2 className="hc-q">{q.q}</h2>
      <div className="hc-options" role="radiogroup" aria-label={q.q}>
        {q.options.map((o, k) => (
          <motion.button
            key={o}
            role="radio"
            aria-checked={value === k}
            className={`hc-option ${value === k ? 'on' : ''}`}
            onClick={() => onAnswer(k)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + k * 0.06, duration: 0.5, ease }}
            whileTap={{ scale: 0.98 }}
            data-cursor="hover"
          >
            <span className="hc-key">{'ABCD'[k]}</span>
            <span>{o}</span>
            <span className="hc-meter" aria-hidden="true">
              {[0, 1, 2].map((d) => (
                <i key={d} className={d < k ? 'lit' : ''} />
              ))}
            </span>
          </motion.button>
        ))}
      </div>
      <div className="hc-nav">
        {index > 0 ? (
          <button className="text-link light" onClick={onBack}>
            ← Previous
          </button>
        ) : (
          <span />
        )}
        <span className="hc-hint">Tip: press 1–4 or A–D</span>
      </div>
    </motion.div>
  )
}

/* ---------- Results ---------- */
function Results({ answers, onRetake }) {
  const r = useMemo(() => score(answers), [answers])
  const [form, setForm] = useState({ name: '', company: '', phone: '' })
  const [sent, setSent] = useState(false)
  const [delivery, setDelivery] = useState('sending')
  const [error, setError] = useState('')
  const [startedAt] = useState(() => Date.now())
  const [hp, setHp] = useState('')
  const [copied, setCopied] = useState(false)
  const [wa, setWa] = useState('')
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/health-check?r=${encode(answers)}` : ''

  const send = async (e) => {
    e.preventDefault()
    if (form.name.trim().length < 2) return setError('Please enter your name')
    if (form.phone.replace(/\D/g, '').length < 10) return setError('Please enter a valid phone / WhatsApp number')
    setError('')
    const lines = [
      `Hello Sunil, I just took the Business Engine Health Check.`,
      ``,
      `Name: ${form.name}`,
      form.company && `Company: ${form.company}`,
      `Phone: ${form.phone}`,
      ``,
      `Overall score: ${r.total}/100 — ${r.tier.name}`,
      `Systemize ${r.pillars[0]} · Humanize ${r.pillars[1]} · Monetize ${r.pillars[2]}`,
      r.leaks.length ? `Biggest leaks: ${r.leaks.map((l) => l.leak).join(', ')}` : '',
      ``,
      `I'd like my personalised fix plan. Results: ${shareUrl}`,
    ]
    track('generate_lead', { source: 'health_check', score: r.total, tier: r.tier.name })
    setWa(whatsappLink(lines))
    setSent(true)
    setDelivery('sending')
    const res = await submitLead({
      type: 'health_check',
      ...form,
      website: hp,
      startedAt,
      score: { total: r.total, tier: r.tier.name, pillars: r.pillars, leaks: r.leaks.map((l) => l.leak), answers: encode(answers) },
    })
    if (res.state === 'invalid') {
      setSent(false)
      setError(res.error)
      return
    }
    setDelivery(res.state)
  }

  const share = async () => {
    track('health_check_share')
    try {
      if (navigator.share) await navigator.share({ title: 'My Business Engine Health Check', text: `My business engine scored ${r.total}/100. Check yours:`, url: shareUrl })
      else {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <motion.div className="hc-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      <div className="hc-score-card">
        <div className="hc-ring">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="ring-bg" />
            <motion.circle
              cx="60"
              cy="60"
              r="52"
              className="ring-fg"
              style={{ stroke: r.tier.tone }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: r.total / 100 }}
              transition={{ duration: 1.8, ease, delay: 0.3 }}
            />
          </svg>
          <div className="hc-ring-num">
            <strong>
              <Counter value={r.total} duration={1.8} />
            </strong>
            <span>/ 100</span>
          </div>
        </div>
        <div>
          <span className="eyebrow light">
            <span className="eyebrow-line" />
            Your engine diagnosis
          </span>
          <h2 className="h2 light" style={{ color: r.tier.tone }}>
            {r.tier.name}
          </h2>
          <p className="lead">{r.tier.text}</p>
        </div>
      </div>

      <div className="hc-pillars">
        {r.pillars.map((p, i) => (
          <div className="hc-bar" key={i}>
            <div className="hc-bar-head">
              <span>{pillarNames[i]}</span>
              <strong>{p}</strong>
            </div>
            <div className="hc-bar-track">
              <motion.i style={{ background: pillarColors[i] }} initial={{ scaleX: 0 }} animate={{ scaleX: p / 100 }} transition={{ duration: 1.4, ease, delay: 0.5 + i * 0.15 }} />
            </div>
          </div>
        ))}
      </div>

      {r.leaks.length > 0 && (
        <div className="hc-leaks">
          <h3>Where your engine is leaking</h3>
          {r.leaks.map((l, i) => (
            <motion.div className="hc-leak" key={l.i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 + i * 0.15, duration: 0.6, ease }}>
              <span className="hc-leak-num" style={{ color: pillarColors[l.pillar] }}>
                0{i + 1}
              </span>
              <div>
                <h4>
                  {l.leak} <small style={{ color: pillarColors[l.pillar] }}>· {pillarNames[l.pillar]}</small>
                </h4>
                <p>
                  <em>You answered:</em> “{l.options[l.a]}”
                </p>
                <p className="hc-fix">
                  <Icon name="arrow" size={14} stroke={2} /> {l.fix}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="hc-lead">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hc-lead-ok">
              {delivery === 'sending' && <h3>Sending your results…</h3>}
              {delivery === 'delivered' && (
                <>
                  <h3>Received — Sunil has your results.</h3>
                  <p className="lead">His team will call you within 24 hours to schedule your free 60-minute audit, focused on these leaks.</p>
                  <div className="btn-row">
                    <Button href={wa} variant="ghost" icon="arrow">
                      Message on WhatsApp
                    </Button>
                  </div>
                </>
              )}
              {(delivery === 'unconfigured' || delivery === 'queued') && (
                <>
                  <h3>One tap left: send your results on WhatsApp.</h3>
                  <p className="lead">Your score and leaks are already filled in. Sunil’s team replies within 24 hours.</p>
                  <div className="btn-row">
                    <Button href={wa} icon="arrow">
                      Send on WhatsApp
                    </Button>
                  </div>
                </>
              )}
              <button className="text-link light" onClick={() => setSent(false)}>
                Edit details
              </button>
            </motion.div>
          ) : (
            <motion.form key="f" onSubmit={send} exit={{ opacity: 0 }}>
              <h3>
                Get your <span className="em">personalised fix plan</span> — free
              </h3>
              <p className="lead">Send these results to Sunil. You’ll get a 60-minute Business Performance Audit call focused on exactly these leaks. No charge, no obligation.</p>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={hp} onChange={(e) => setHp(e.target.value)} />
              <div className="hc-lead-row">
                <input placeholder="Your name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required aria-label="Your name" />
                <input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Company" />
                <input placeholder="Phone / WhatsApp *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required aria-label="Phone" />
              </div>
              {error && <p className="hc-error" role="alert">{error}</p>}
              <Button type="submit" icon="arrow">
                Send my results to Sunil
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="hc-actions">
        <button className="text-link light" onClick={share}>
          {copied ? 'Link copied ✓' : 'Share or save my results'}
        </button>
        <button className="text-link light" onClick={onRetake}>
          Retake the check
        </button>
        <a className="text-link light" href={`tel:${site.phone.replace(/\s/g, '')}`}>
          Or call {site.phone}
        </a>
      </div>
    </motion.div>
  )
}

/* ---------- Page ---------- */
export default function HealthCheck() {
  useSeo('/health-check')
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const empty = () => Array(questions.length).fill(null)

  const shared = decode(params.get('r'))
  const [answers, setAnswers] = useState(() => shared || empty())
  const [step, setStep] = useState(() => (shared ? 'results' : 'intro'))
  const [index, setIndex] = useState(0)

  // resume an unfinished attempt, or apply a first answer handed over from the home teaser
  useEffect(() => {
    if (shared) return
    const first = params.get('a')
    if (first != null && /^[0-3]$/.test(first)) {
      const a = empty()
      a[0] = Number(first)
      setAnswers(a)
      setIndex(1)
      setStep('quiz')
      track('health_check_start', { from: 'home_teaser' })
      setParams({}, { replace: true })
      return
    }
    const saved = load()
    if (saved?.answers?.some((x) => x != null) && saved.answers.length === questions.length) {
      setAnswers(saved.answers)
      setIndex(Math.min(saved.index ?? 0, questions.length - 1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (step === 'quiz') save({ answers, index })
  }, [answers, index, step])

  const answered = answers.filter((a) => a != null).length
  const health = [0, 1, 2].map((p) => {
    const qs = questions.map((q, i) => [q, answers[i]]).filter(([q, a]) => q.pillar === p && a != null)
    if (!qs.length) return 0.5
    return qs.reduce((s, [, a]) => s + a, 0) / (qs.length * 3)
  })

  const busy = useRef(false)
  const onAnswer = useCallback(
    (k) => {
      if (busy.current) return
      busy.current = true
      const next = [...answers]
      next[index] = k
      setAnswers(next)
      const firstEmpty = next.findIndex((x) => x == null)
      if (firstEmpty === -1) {
        const r = score(next)
        track('health_check_complete', { score: r.total, tier: r.tier.name })
        save(null)
        setStep('results')
        setParams({ r: encode(next) }, { replace: true })
        window.scrollTo({ top: 0 })
        busy.current = false
      } else {
        const target = index < questions.length - 1 && next[index + 1] == null ? index + 1 : firstEmpty
        setTimeout(() => {
          setIndex(target)
          busy.current = false
        }, 320)
      }
    },
    [answers, index, setParams],
  )
  const onBack = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  // one keyboard listener for the whole quiz (exiting questions must not answer too)
  useEffect(() => {
    if (step !== 'quiz') return
    const onKey = (e) => {
      if (e.target.closest?.('input, textarea')) return
      const n = '1234'.indexOf(e.key) + 1 || 'abcd'.indexOf(e.key.toLowerCase()) + 1
      if (n) onAnswer(n - 1)
      if (e.key === 'Backspace') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onAnswer, onBack])

  const start = () => {
    setStep('quiz')
    track('health_check_start', { from: 'page' })
  }
  const retake = () => {
    setAnswers(empty())
    setIndex(0)
    setStep('quiz')
    navigate('/health-check', { replace: true })
  }

  const final = step === 'results' ? score(answers).pillars.map((p) => p / 100) : health

  return (
    <section className="hc">
      <div className="orbs" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="container hc-grid">
        <div className="hc-main">
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div key="intro" className="hc-intro" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
                <div className="eyebrow light">
                  <span className="eyebrow-line" />
                  Free diagnostic · 3 minutes
                </div>
                <h1 className="h1">
                  How healthy is your <span className="em">business engine?</span>
                </h1>
                <p className="lead">
                  12 quick questions across Systemize, Humanize and Monetize — the three pillars of the SME Performance Engine™. Get an instant score, the three
                  leaks costing you the most, and what to fix first.
                </p>
                <ul className="hc-bullets">
                  <li>Instant score out of 100</li>
                  <li>Your top 3 leaks, with fixes</li>
                  <li>No sign-up needed to see results</li>
                </ul>
                <div className="btn-row">
                  <Button onClick={start} icon="arrow">
                    {answered ? 'Continue the check' : 'Start the health check'}
                  </Button>
                </div>
              </motion.div>
            )}
            {step === 'quiz' && (
              <div key="quiz">
                <div className="hc-progress" aria-hidden="true">
                  <motion.i animate={{ scaleX: answered / questions.length }} transition={{ duration: 0.5, ease }} />
                </div>
                <AnimatePresence mode="wait">
                  <Question key={index} index={index} value={answers[index]} onAnswer={onAnswer} onBack={onBack} />
                </AnimatePresence>
              </div>
            )}
            {step === 'results' && <Results key="results" answers={answers} onRetake={retake} />}
          </AnimatePresence>
        </div>
        <div className="hc-visual">
          <EngineGears health={final} values={step === 'results' ? score(answers).pillars : undefined} />
          <p className="hc-visual-cap">{step === 'results' ? 'Your engine, as you described it' : 'Your engine responds to every answer'}</p>
        </div>
      </div>
    </section>
  )
}
