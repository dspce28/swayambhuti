import { useEffect, useRef, useState } from 'react'
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useAnimationFrame,
} from 'motion/react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

export const ease = [0.16, 1, 0.3, 1]

/* ---------- Reveal: fade + rise when scrolled into view ---------- */
export function Reveal({ children, delay = 0, y = 40, className, as = 'div', ...rest }) {
  const M = motion[as]
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, ease, delay }}
      {...rest}
    >
      {children}
    </M>
  )
}

/* ---------- Stagger container ---------- */
export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
export const rise = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
}

export function Stagger({ children, className, as = 'div' }) {
  const M = motion[as]
  return (
    <M className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      {children}
    </M>
  )
}

/* ---------- SplitText: masked word-by-word reveal ---------- */
export function SplitText({ text, className, delay = 0, as = 'span', italicWords = [] }) {
  const words = text.split(' ')
  const M = motion[as]
  return (
    <M
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="split-mask" aria-hidden="true">
          <motion.span
            className={`split-word${italicWords.includes(w) ? ' em' : ''}`}
            variants={{ hidden: { y: '110%', rotate: 4 }, show: { y: '0%', rotate: 0, transition: { duration: 1, ease } } }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </M>
  )
}

/* ---------- Counter: counts up when visible ---------- */
export function Counter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduced = useReducedMotion()
  const [n, setN] = useState(reduced ? value : 0)
  useEffect(() => {
    if (!inView || reduced) return
    const c = animate(0, value, { duration, ease, onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [inView, value, duration, reduced])
  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  )
}

/* ---------- Magnetic: element drifts toward the cursor ---------- */
export function Magnetic({ children, strength = 0.35, className }) {
  const ref = useRef(null)
  const x = useSpring(0, { stiffness: 200, damping: 15, mass: 0.3 })
  const y = useSpring(0, { stiffness: 200, damping: 15, mass: 0.3 })
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * strength)
    y.set((e.clientY - (r.top + r.height / 2)) * strength)
  }
  const reset = () => {
    x.set(0)
    y.set(0)
  }
  return (
    <motion.div ref={ref} className={className} style={{ x, y, display: 'inline-block' }} onPointerMove={onMove} onPointerLeave={reset}>
      {children}
    </motion.div>
  )
}

/* ---------- Button: magnetic pill with a fill sweep ---------- */
export function Button({ to, href, children, variant = 'gold', icon = 'arrow', onClick, type, className = '' }) {
  const inner = (
    <>
      <span className="btn-fill" />
      <span className="btn-label">{children}</span>
      {icon && (
        <span className="btn-icon">
          <Icon name={icon} size={18} stroke={2} />
        </span>
      )}
    </>
  )
  const cls = `btn btn-${variant} ${className}`
  let el
  if (to) el = <Link to={to} className={cls} data-cursor="hover">{inner}</Link>
  else if (href) el = <a href={href} className={cls} target="_blank" rel="noopener noreferrer" data-cursor="hover">{inner}</a>
  else el = <button type={type || 'button'} className={cls} onClick={onClick} data-cursor="hover">{inner}</button>
  return <Magnetic strength={0.25}>{el}</Magnetic>
}

/* ---------- TiltCard: 3D tilt with moving glare ---------- */
export function TiltCard({ children, className, max = 10, ...rest }) {
  const ref = useRef(null)
  const rx = useSpring(0, { stiffness: 150, damping: 18 })
  const ry = useSpring(0, { stiffness: 150, damping: 18 })
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const glare = useTransform([gx, gy], ([a, b]) => `radial-gradient(circle at ${a}% ${b}%, rgba(240,212,132,0.22), transparent 55%)`)
  const onMove = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = ref.current.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    ry.set((px - 0.5) * max * 2)
    rx.set(-(py - 0.5) * max * 2)
    gx.set(px * 100)
    gy.set(py * 100)
  }
  const reset = () => {
    rx.set(0)
    ry.set(0)
  }
  return (
    <motion.div
      ref={ref}
      className={`tilt ${className || ''}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={onMove}
      onPointerLeave={reset}
      {...rest}
    >
      {children}
      <motion.span className="tilt-glare" style={{ background: glare }} />
    </motion.div>
  )
}

/* ---------- Marquee: infinite ticker that skews & speeds with scroll velocity ---------- */
export function Marquee({ items, baseVelocity = -2, className }) {
  const x = useMotionValue(0)
  const { scrollY } = useScroll()
  const vel = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const factor = useTransform(vel, [-1000, 0, 1000], [-4, 0, 4], { clamp: false })
  const skew = useTransform(vel, [-2000, 2000], [8, -8])
  const dir = useRef(1)
  const reduced = useReducedMotion()
  const wrapped = useTransform(x, (v) => `${((((v % 50) + 50) % 50) - 50).toFixed(3)}%`)

  useAnimationFrame((_, delta) => {
    if (reduced) return
    let move = dir.current * baseVelocity * (delta / 1000)
    const f = factor.get()
    if (f < 0) dir.current = -1
    else if (f > 0) dir.current = 1
    move += dir.current * move * Math.abs(f)
    x.set(x.get() + move)
  })

  return (
    <div className={`marquee ${className || ''}`}>
      <motion.div className="marquee-track" style={{ x: wrapped, skewX: skew }}>
        {[0, 1].map((k) => (
          <div className="marquee-group" key={k} aria-hidden={k === 1}>
            {items.map((t, i) => (
              <span className="marquee-item" key={i}>
                <span className="marquee-dot" />
                {t}
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  )
}

/* ---------- Section heading ---------- */
export function Heading({ eyebrow, title, em, sub, light, center }) {
  return (
    <div className={`heading ${center ? 'center' : ''} ${light ? 'light' : ''}`}>
      {eyebrow && (
        <Reveal className="eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </Reveal>
      )}
      <h2 className="h2">
        <SplitText text={title} />
        {em && (
          <>
            {' '}
            <SplitText text={em} className="em" delay={0.15} />
          </>
        )}
      </h2>
      {sub && (
        <Reveal delay={0.2} as="p" className="lead">
          {sub}
        </Reveal>
      )}
    </div>
  )
}
