import { motion } from 'motion/react'
import { gearPath } from './Gears'

// Hand-built animated illustrations for "How the work runs". Pure SVG: crisp, tiny, on-brand.
const gold = '#e3bd5c'
const mint = '#5fd39a'
const cream = '#f6efe0'
const ember = '#e2704f'
const loop = { repeat: Infinity, repeatType: 'loop' }

function Diagnose() {
  const leaks = [
    [150, 150],
    [300, 110],
    [250, 260],
  ]
  return (
    <svg viewBox="0 0 400 360" className="scene-svg">
      <g opacity="0.55">
        <path d={gearPath(200, 190, 16, 110, 94, [2, 3, 9, 13])} fill="none" stroke={cream} strokeWidth="1.5" />
        <circle cx="200" cy="190" r="26" fill="none" stroke={cream} strokeWidth="1.5" />
      </g>
      {leaks.map(([x, y], i) => (
        <g key={i}>
          <motion.circle cx={x} cy={y} r="6" fill={ember} animate={{ opacity: [0, 1, 1, 0] }} transition={{ ...loop, duration: 4, delay: 0.8 + i * 0.9 }} />
          <motion.circle cx={x} cy={y} r="6" fill="none" stroke={ember} animate={{ r: [6, 22], opacity: [0.8, 0] }} transition={{ ...loop, duration: 1.6, delay: 0.8 + i * 0.9 }} />
        </g>
      ))}
      <motion.g animate={{ x: [-60, 80, 20, -60], y: [-30, -60, 70, -30] }} transition={{ ...loop, duration: 7, ease: 'easeInOut' }}>
        <circle cx="200" cy="190" r="48" fill="rgba(246,239,224,0.06)" stroke={gold} strokeWidth="3" />
        <line x1="234" y1="224" x2="272" y2="262" stroke={gold} strokeWidth="8" strokeLinecap="round" />
        <motion.line x1="160" x2="240" y1="190" y2="190" stroke={gold} strokeOpacity="0.7" animate={{ y1: [150, 230, 150], y2: [150, 230, 150] }} transition={{ ...loop, duration: 2, ease: 'easeInOut' }} />
      </motion.g>
      <text x="24" y="340" className="scene-cap">
        3 LEAKS FOUND
      </text>
    </svg>
  )
}

function Systemize() {
  const cells = Array.from({ length: 9 }, (_, i) => [70 + (i % 3) * 92, 60 + Math.floor(i / 3) * 86])
  return (
    <svg viewBox="0 0 400 360" className="scene-svg">
      {cells.map(([x, y], i) => (
        <motion.g
          key={i}
          initial={{ x: (i % 2 ? 1 : -1) * (80 + i * 14), y: (i % 3 - 1) * 90, rotate: (i % 2 ? 1 : -1) * (15 + i * 4), opacity: 0 }}
          animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.09, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <rect x={x} y={y} width="76" height="68" rx="8" fill="rgba(246,239,224,0.07)" stroke={i === 4 ? gold : 'rgba(246,239,224,0.35)'} />
          <rect x={x + 12} y={y + 14} width="40" height="4" rx="2" fill={cream} opacity="0.5" />
          <rect x={x + 12} y={y + 26} width="52" height="4" rx="2" fill={cream} opacity="0.25" />
          <rect x={x + 12} y={y + 36} width="30" height="4" rx="2" fill={cream} opacity="0.25" />
          <motion.path
            d={`M${x + 50} ${y + 52} l6 6 l12 -14`}
            fill="none"
            stroke={mint}
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 1.2 + i * 0.12, duration: 0.4 }}
          />
        </motion.g>
      ))}
      <text x="24" y="340" className="scene-cap">
        9 SOPs · DOCUMENTED · TRAINED
      </text>
    </svg>
  )
}

function Humanize() {
  const nodes = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2
    return [200 + Math.cos(a) * 130, 175 + Math.sin(a) * 120]
  })
  return (
    <svg viewBox="0 0 400 360" className="scene-svg">
      {nodes.map(([x, y], i) => (
        <g key={i}>
          <motion.line x1="200" y1="175" x2={x} y2={y} stroke={mint} strokeOpacity="0.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.2 + i * 0.12, duration: 0.6 }} />
          <motion.circle r="4" fill={gold} animate={{ cx: [200, x], cy: [175, y], opacity: [0, 1, 0] }} transition={{ ...loop, duration: 2.2, delay: 1 + i * 0.3 }} />
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 200 }}>
            <circle cx={x} cy={y} r="20" fill="#10291d" stroke={mint} strokeWidth="1.5" />
            <circle cx={x} cy={y - 5} r="6" fill={cream} opacity="0.8" />
            <path d={`M${x - 10} ${y + 12} a10 9 0 0 1 20 0`} fill={cream} opacity="0.8" />
          </motion.g>
        </g>
      ))}
      <motion.circle cx="200" cy="175" r="34" fill="#10291d" stroke={gold} strokeWidth="2" animate={{ scale: [1, 1.06, 1] }} transition={{ ...loop, duration: 2.4 }} />
      <text x="200" y="180" textAnchor="middle" className="scene-mid">
        TEAM
      </text>
      <text x="24" y="340" className="scene-cap">
        OWNERSHIP · CULTURE · CUSTOMER JOURNEY
      </text>
    </svg>
  )
}

function Monetize() {
  const bars = [60, 85, 78, 120, 150, 190, 230]
  const line = bars.map((h, i) => `${i ? 'L' : 'M'}${60 + i * 46} ${300 - h}`).join(' ')
  return (
    <svg viewBox="0 0 400 360" className="scene-svg">
      {[100, 160, 220, 280].map((y) => (
        <line key={y} x1="40" x2="370" y1={y} y2={y} stroke="rgba(246,239,224,0.08)" />
      ))}
      {bars.map((h, i) => (
        <motion.rect
          key={i}
          x={46 + i * 46}
          width="28"
          rx="5"
          fill={i === bars.length - 1 ? gold : 'rgba(246,239,224,0.18)'}
          initial={{ y: 300, height: 0 }}
          animate={{ y: 300 - h, height: h }}
          transition={{ delay: 0.15 + i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
      <motion.path d={line} fill="none" stroke={mint} strokeWidth="2.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.6, duration: 1.4 }} />
      <motion.g initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.8, type: 'spring' }}>
        <circle cx="336" cy="70" r="26" fill={gold} />
        <text x="336" y="79" textAnchor="middle" className="scene-coin">
          ₹
        </text>
      </motion.g>
      <text x="24" y="340" className="scene-cap">
        FORECASTABLE · MONTH ON MONTH
      </text>
    </svg>
  )
}

export const scenes = { diagnose: Diagnose, systemize: Systemize, humanize: Humanize, monetize: Monetize }
