import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useScroll, useSpring, useMotionValueEvent } from 'motion/react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import { nav, site, services } from '../data/content'
import Icon from './Icon'
import { ease, Magnetic, SplitText } from './motion'
import { ScarcityCTA } from './Premium'
import { track } from '../lib/marketing'

/* ---------- Smooth scroll (Lenis) ---------- */
export let lenis = null
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    let id
    const raf = (t) => {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    }
    id = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
      lenis = null
    }
  }, [])
  return null
}

export function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/* ---------- Scroll progress hairline ---------- */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return <motion.div className="scroll-progress" style={{ scaleX }} />
}

/* ---------- Custom cursor (fine pointers only) ---------- */
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState('default')
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 700, damping: 40, mass: 0.35 })
  const ry = useSpring(y, { stiffness: 700, damping: 40, mass: 0.35 })

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)')
    setEnabled(mq.matches)
    if (!mq.matches) return
    document.documentElement.classList.add('has-cursor')
    const move = (e) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const t = e.target.closest?.('a, button, [data-cursor], input, textarea, select')
      setState(t ? (t.matches('input, textarea, select') ? 'text' : 'hover') : 'default')
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [x, y])

  if (!enabled) return null
  return (
    <>
      <motion.div className="cursor-dot" style={{ x, y }} />
      <motion.div
        className={`cursor-ring is-${state}`}
        style={{ x: rx, y: ry }}
        animate={{ scale: state === 'hover' ? 1.9 : state === 'text' ? 0.5 : 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      />
    </>
  )
}

/* ---------- Preloader (first visit per session only) ---------- */
export function Preloader() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('sw-loaded')
    } catch {
      return false
    }
  })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!show) return
    let v = 0
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 14))
      setN(v)
      if (v >= 100) {
        clearInterval(id)
        setTimeout(() => {
          setShow(false)
          try {
            sessionStorage.setItem('sw-loaded', '1')
          } catch {
            /* private mode */
          }
        }, 250)
      }
    }, 70)
    return () => clearInterval(id)
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div className="preloader" exit={{ clipPath: 'inset(0 0 100% 0)' }} transition={{ duration: 0.9, ease }}>
          <motion.img
            src="/img/logo.webp"
            alt=""
            className="preloader-logo"
            initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 0.8, ease }}
          />
          <div className="preloader-word">
            {'SWAYAMBHUTI'.split('').map((c, i) => (
              <motion.span key={i} initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ delay: 0.1 + i * 0.035, duration: 0.7, ease }}>
                {c}
              </motion.span>
            ))}
          </div>
          <div className="preloader-bar">
            <motion.span style={{ scaleX: n / 100 }} />
          </div>
          <div className="preloader-count">{String(n).padStart(3, '0')}</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ---------- Page transition curtain ---------- */
export function PageTransition({ children }) {
  return (
    <>
      <motion.div
        className="curtain"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: 0, transition: { duration: 0.8, ease, delay: 0.05 } }}
        exit={{ scaleY: 1, transition: { duration: 0.55, ease } }}
        style={{ originY: 0 }}
      />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease, delay: 0.25 } }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
        {children}
      </motion.div>
    </>
  )
}

/* ---------- Navigation ---------- */
export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const { scrollY } = useScroll()
  const { pathname } = useLocation()

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(v > 40)
    setHidden(v > 400 && v > prev && !open)
  })
  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (lenis) open ? lenis.stop() : lenis.start()
  }, [open])

  return (
    <>
      <motion.header
        className={`nav ${scrolled ? 'is-scrolled' : ''}`}
        animate={hidden ? { y: '-110%', transitionEnd: { visibility: 'hidden' } } : { y: '0%', visibility: 'visible' }}
        transition={{ duration: 0.45, ease }}
      >
        <Link to="/" className="nav-logo" data-cursor="hover">
          <img src="/img/logo.webp" alt="" width="40" height="40" />
          <span>
            <strong>Swayambhuti</strong>
            <small>Consultants</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          {nav.slice(1).map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
              {({ isActive }) => (
                <>
                  {n.label}
                  {isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="nav-right">
          <Link to="/health-check" className="nav-hc" data-cursor="hover" onClick={() => track('cta_click', { cta: 'nav_health_check' })}>
            <span className="pulse" /> Free Health Check
          </Link>
          <Magnetic>
            <Link to="/contact" className="nav-cta" data-cursor="hover" onClick={() => track('cta_click', { cta: 'nav_book_audit' })}>
              Book Audit <Icon name="arrow" size={16} stroke={2} />
            </Link>
          </Magnetic>
          <button className={`burger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="menu"
            initial={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
            animate={{ clipPath: 'circle(150% at calc(100% - 44px) 40px)' }}
            exit={{ clipPath: 'circle(0% at calc(100% - 44px) 40px)' }}
            transition={{ duration: 0.8, ease }}
          >
            <nav className="menu-links">
              {[...nav, { to: '/health-check', label: 'Free Health Check' }, { to: '/contact', label: 'Contact' }].map((n, i) => (
                <motion.div key={n.to} initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.045, duration: 0.7, ease }}>
                  <NavLink to={n.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                    <span className="menu-num">{String(i + 1).padStart(2, '0')}</span>
                    {n.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            <motion.div className="menu-foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ---------- CTA band (inner pages) ---------- */
export function CTA({ title = 'Fix your engine.', em = 'Start with sixty minutes.' }) {
  return <ScarcityCTA title={title} em={em} />
}

/* ---------- Footer ---------- */
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-big" aria-hidden="true">
          <SplitText text="Systemize. Humanize. Monetize." />
        </div>
        <div className="footer-grid">
          <div>
            <Link to="/" className="nav-logo">
              <img src="/img/logo.webp" alt="" width="44" height="44" />
              <span>
                <strong>Swayambhuti</strong>
                <small>Consultants</small>
              </span>
            </Link>
            <p className="muted" style={{ marginTop: 18, maxWidth: 320 }}>
              Helping India's SME owners build structured, scalable, self-sustaining businesses through the SME Performance Engine™.
            </p>
          </div>
          <div>
            <h4>Company</h4>
            {[['/', 'Home'], ['/about', 'About Sunil'], ['/engine', 'SME Engine™'], ['/case-studies', 'Case Studies'], ['/blog', 'Blog'], ['/contact', 'Contact']].map(([to, l]) => (
              <Link key={to} to={to}>
                {l}
              </Link>
            ))}
          </div>
          <div>
            <h4>Services</h4>
            {services.slice(0, 5).map((s) => (
              <Link key={s.name} to="/services">
                {s.name}
              </Link>
            ))}
          </div>
          <div>
            <h4>Talk to us</h4>
            <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Swayambhuti Consultants. All rights reserved.</span>
          <button className="to-top" onClick={() => (lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: 'smooth' }))} data-cursor="hover">
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  )
}

export function WhatsAppFloat() {
  return (
    <motion.a
      href={`https://wa.me/${site.phoneRaw}`}
      className="wa-float"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 2, type: 'spring', stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }}
    >
      <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
        <path d="M17.5 14.4c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5 5.9 5.9 0 0 0 1.2 3.1 13.5 13.5 0 0 0 5.2 4.6c1.9.8 2.7.9 3.6.8a3.1 3.1 0 0 0 2-1.4 2.5 2.5 0 0 0 .2-1.4c-.1-.1-.3-.2-.6-.3ZM12 21.8a9.8 9.8 0 0 1-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 1 1 8.3 4.6ZM20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.2 24l6.4-1.7a11.8 11.8 0 0 0 5.6 1.4A11.8 11.8 0 0 0 20.5 3.5Z" />
      </svg>
    </motion.a>
  )
}
