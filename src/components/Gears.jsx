import { useRef } from 'react'
import { motion, useAnimationFrame, useInView, useReducedMotion, useSpring } from 'motion/react'

// SVG gear path. `missing` teeth are drawn flat — a visibly broken gear.
export function gearPath(cx, cy, teeth, rOuter, rRoot, missing = []) {
  const step = (Math.PI * 2) / teeth
  const pts = []
  for (let i = 0; i < teeth; i++) {
    const a = i * step
    const gone = missing.includes(i)
    const ro = gone ? rRoot : rOuter
    const p = [
      [a - step * 0.5, rRoot],
      [a - step * 0.22, rRoot],
      [a - step * 0.14, ro],
      [a + step * 0.14, ro],
      [a + step * 0.22, rRoot],
    ]
    p.forEach(([ang, r]) => pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]))
  }
  return 'M' + pts.map((p) => p.map((v) => v.toFixed(2)).join(' ')).join('L') + 'Z'
}

/*
  One animated gear. health 0..1 drives: spin speed, colour (ember → pillar colour),
  missing teeth and a wobble when the gear is unhealthy.
*/
export function Gear({ cx, cy, teeth, r, color, health = 1, dir = 1, phase = 0, label, sub, running = true }) {
  const reduced = useReducedMotion()
  const rot = useRef(phase)
  const node = useRef(null)
  const h = useSpring(health, { stiffness: 60, damping: 18 })
  h.set(health)
  const t = useRef(0)
  useAnimationFrame((_, delta) => {
    if (reduced || !running) return
    t.current += delta
    const hv = h.get()
    const speed = 4 + hv * 38 // deg/sec
    const wobble = (1 - hv) * Math.sin(t.current / 90) * 1.6
    rot.current += (dir * speed * delta) / 1000 + wobble * 0.05
    // plain SVG rotate(angle cx cy): pivots exactly on the gear centre in every browser
    node.current?.setAttribute('transform', `rotate(${rot.current.toFixed(2)} ${cx} ${cy})`)
  })
  const missingCount = Math.round((1 - health) * teeth * 0.45)
  const missing = Array.from({ length: missingCount }, (_, i) => Math.floor((i * teeth) / Math.max(missingCount, 1) + 1) % teeth)
  const ember = '#c8573a'
  const fill = health < 0.35 ? ember : color

  return (
    <g>
      <g ref={node} transform={`rotate(${phase} ${cx} ${cy})`}>
        <motion.path
          d={gearPath(cx, cy, teeth, r, r * 0.84, missing)}
          animate={{ fill, fillOpacity: 0.12 + health * 0.2, stroke: fill }}
          transition={{ duration: 0.8 }}
          strokeWidth="1.5"
        />
        <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={fill} strokeOpacity="0.35" strokeDasharray="2 6" />
        {[0, 1, 2, 3, 4].map((k) => {
          const a = (k / 5) * Math.PI * 2
          return (
            <line
              key={k}
              x1={cx + Math.cos(a) * r * 0.22}
              y1={cy + Math.sin(a) * r * 0.22}
              x2={cx + Math.cos(a) * r * 0.6}
              y2={cy + Math.sin(a) * r * 0.6}
              stroke={fill}
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
          )
        })}
        <circle cx={cx} cy={cy} r={r * 0.22} fill="none" stroke={fill} strokeWidth="2" />
      </g>
      {label && (
        <text x={cx} y={cy + r * 0.22 + 18} textAnchor="middle" className="gear-label">
          {label}
        </text>
      )}
      {sub != null && (
        <text x={cx} y={cy + r * 0.22 + 38} textAnchor="middle" className="gear-sub">
          {sub}
        </text>
      )}
    </g>
  )
}

// The three-pillar engine used by the health check.
export function EngineGears({ health = [1, 1, 1], labels = true, values, still = false }) {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '80px' })
  const running = inView && !still
  return (
    <svg ref={ref} viewBox="0 0 520 440" className="engine-gears" role="img" aria-label="Business engine: Systemize, Humanize and Monetize gears">
      <defs>
        <radialGradient id="eg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(95,211,154,0.18)" />
          <stop offset="100%" stopColor="rgba(95,211,154,0)" />
        </radialGradient>
      </defs>
      <circle cx="260" cy="220" r="210" fill="url(#eg-glow)" />
      <Gear cx={200} cy={250} teeth={18} r={128} color="#e3bd5c" health={health[0]} dir={1} running={running} label={labels ? 'SYSTEMIZE' : null} sub={values?.[0]} />
      <Gear cx={372} cy={128} teeth={11} r={80} color="#5fd39a" health={health[1]} dir={-1} phase={9} running={running} label={labels ? 'HUMANIZE' : null} sub={values?.[1]} />
      <Gear cx={388} cy={340} teeth={9} r={66} color="#f0d484" health={health[2]} dir={-1} phase={14} running={running} label={labels ? 'MONETIZE' : null} sub={values?.[2]} />
    </svg>
  )
}
