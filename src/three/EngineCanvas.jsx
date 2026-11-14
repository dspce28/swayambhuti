import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import GearField from './GearField'

// Loaded lazily (React.lazy) so three.js never blocks first paint.
export default function EngineCanvas({ className, ...props }) {
  const wrap = useRef(null)
  const [visible, setVisible] = useState(true)
  const narrow = typeof window !== 'undefined' && window.innerWidth < 760
  const lowPower =
    typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency || 8) <= 4 || navigator.deviceMemory <= 4)
  const count = narrow ? 2600 : lowPower ? 4000 : 9000

  // stop rendering when off-screen — saves battery on the phones most SME owners use
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' })
    if (wrap.current) io.observe(wrap.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={wrap} className={className} aria-hidden="true">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, narrow ? 1.5 : 1.75]}
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <GearField count={count} {...props} />
      </Canvas>
    </div>
  )
}
