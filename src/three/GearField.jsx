import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

/*
  "Chaos → Engine": thousands of particles start as a drifting, ember-coloured cloud
  and converge into three meshing gears (SYSTEMIZE / HUMANIZE / MONETIZE) that keep
  turning at correct gear ratios. All motion runs in the vertex shader, so the CPU only
  updates a handful of uniforms per frame.
*/

const MODULE = 0.2 // pitch diameter / teeth — identical for all gears so they mesh
const TOOTH_H = 0.2

function buildGears() {
  const g = [
    { N: 18, c: new THREE.Vector2(-0.55, 0.15) },
    { N: 11 },
    { N: 9 },
  ]
  g.forEach((x) => (x.R = (MODULE * x.N) / 2))
  // place gear 1 and 2 so they mesh with gear 0
  const place = (j, i, angle) => {
    const d = g[i].R + g[j].R
    g[j].c = new THREE.Vector2(g[i].c.x + Math.cos(angle) * d, g[i].c.y + Math.sin(angle) * d)
    g[j].contact = { i, a: angle }
  }
  place(1, 0, -0.42)
  place(2, 0, 2.05)
  // speeds: gear 0 drives, meshing gears counter-rotate by tooth ratio
  g[0].w = 0.22
  g[0].phase = 0
  for (const j of [1, 2]) {
    const { i, a } = g[j].contact
    g[j].w = (-g[i].w * g[i].N) / g[j].N
    // align a tooth gap of j with the tooth of i at the contact point
    const s_i = ((a - g[i].phase) * g[i].N) / (Math.PI * 2)
    g[j].phase = a + Math.PI - (Math.PI * 2 * (0.5 - s_i)) / g[j].N
  }
  return g
}

const vertex = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform float uSpeed;
  uniform vec3  uMouse;
  uniform float uBright[3];
  uniform float uPixel;
  uniform vec3  uCenters[3];
  uniform float uOmega[3];
  uniform vec3  uColors[3];

  attribute vec3  aChaos;
  attribute float aGear;
  attribute float aTheta;
  attribute float aRadius;
  attribute float aDelay;
  attribute float aSize;

  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    int gi = int(aGear + 0.5);
    vec3 center = uCenters[0]; float w = uOmega[0]; vec3 col = uColors[0]; float focused = uBright[0];
    if (gi == 1) { center = uCenters[1]; w = uOmega[1]; col = uColors[1]; focused = uBright[1]; }
    if (gi == 2) { center = uCenters[2]; w = uOmega[2]; col = uColors[2]; focused = uBright[2]; }

    float th = aTheta + w * uTime * uSpeed;
    vec3 ordered = center + vec3(cos(th) * aRadius, sin(th) * aRadius, (aDelay - 0.5) * 0.18);

    // chaotic drift
    float t = uTime * 0.25;
    vec3 chaos = aChaos + vec3(
      sin(t + aChaos.y * 0.7) * 0.6,
      cos(t * 0.8 + aChaos.x * 0.6) * 0.6,
      sin(t * 0.6 + aChaos.z) * 0.6);

    float p = smoothstep(aDelay * 0.55, aDelay * 0.55 + 0.45, uProgress);
    vec3 pos = mix(chaos, ordered, p);

    // mouse repulsion (only meaningful once assembled)
    vec3 d = pos - uMouse;
    float dist = length(d.xy);
    float push = smoothstep(1.1, 0.0, dist) * 0.45 * p;
    pos.xy += normalize(d.xy + 1e-4) * push;
    pos.z  += push * 0.8;

    vec3 ember = vec3(0.85, 0.36, 0.22);
    vColor = mix(ember, col, p) * mix(1.0, focused, p);
    vAlpha = mix(0.35, 0.95, p) * mix(1.0, clamp(focused, 0.3, 1.0), p);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixel * (1.0 + push * 2.0) * (26.0 / -mv.z);
  }
`

const fragment = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.0, r);
    a = pow(a, 1.6);
    gl_FragColor = vec4(vColor * (0.6 + a), a * vAlpha);
  }
`

export default function GearField({
  count = 8000,
  progress, // MotionValue or number 0..1 — how assembled the engine is
  speed, // MotionValue or number — rotation multiplier
  focus = -1, // -1 all, 0..2 highlight one pillar
  reduced = false,
  interactive = true,
  layout = 'hero', // 'hero' pushes the engine right on desktop; 'center' keeps it centred
}) {
  const points = useRef()
  const material = useRef()
  const group = useRef()
  const { size, viewport, camera } = useThree()
  const gears = useMemo(buildGears, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const chaos = new Float32Array(count * 3)
    const gear = new Float32Array(count)
    const theta = new Float32Array(count)
    const radius = new Float32Array(count)
    const delay = new Float32Array(count)
    const sz = new Float32Array(count)
    const weights = gears.map((x) => x.R * x.R + 0.15)
    const total = weights.reduce((a, b) => a + b, 0)

    for (let k = 0; k < count; k++) {
      // pick gear proportional to area
      let r = Math.random() * total
      let gi = 0
      while (r > weights[gi]) r -= weights[gi++]
      const G = gears[gi]
      const kind = Math.random()
      let th, rad
      if (kind < 0.62) {
        // rim with teeth
        th = Math.random() * Math.PI * 2
        const tooth = Math.cos(th * G.N) > 0.05 ? 1 : 0 // square-ish tooth profile
        rad = G.R - TOOTH_H * 0.5 + tooth * TOOTH_H - Math.random() * 0.12
      } else if (kind < 0.78) {
        // hub
        th = Math.random() * Math.PI * 2
        rad = G.R * 0.22 + Math.random() * 0.05
      } else if (kind < 0.86) {
        // inner ring
        th = Math.random() * Math.PI * 2
        rad = G.R * 0.72 + Math.random() * 0.04
      } else {
        // spokes
        const spokes = 5
        th = (Math.floor(Math.random() * spokes) / spokes) * Math.PI * 2 + (Math.random() - 0.5) * 0.08
        rad = G.R * (0.24 + Math.random() * 0.5)
      }
      th += G.phase
      gear[k] = gi
      theta[k] = th
      radius[k] = rad
      delay[k] = Math.random()
      sz[k] = 0.6 + Math.random() * 1.2

      // chaos: wide flattened shell
      const u = Math.random() * Math.PI * 2
      const v = Math.acos(2 * Math.random() - 1)
      const R = 3 + Math.random() * 6
      chaos[k * 3] = Math.sin(v) * Math.cos(u) * R * 1.4
      chaos[k * 3 + 1] = Math.sin(v) * Math.sin(u) * R * 0.8
      chaos[k * 3 + 2] = Math.cos(v) * R * 0.6 - 1
    }
    geo.setAttribute('position', new THREE.BufferAttribute(chaos.slice(), 3))
    geo.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3))
    geo.setAttribute('aGear', new THREE.BufferAttribute(gear, 1))
    geo.setAttribute('aTheta', new THREE.BufferAttribute(theta, 1))
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1))
    geo.setAttribute('aDelay', new THREE.BufferAttribute(delay, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20)
    return geo
  }, [count, gears])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uProgress: { value: reduced ? 1 : 0 },
      uSpeed: { value: 1 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uBright: { value: [1, 1, 1] },
      uPixel: { value: Math.min(window.devicePixelRatio, 2) },
      uCenters: { value: gears.map((x) => new THREE.Vector3(x.c.x, x.c.y, 0)) },
      uOmega: { value: gears.map((x) => x.w) },
      uColors: { value: [new THREE.Color('#e3bd5c'), new THREE.Color('#5fd39a'), new THREE.Color('#f6dc8e')] },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gears],
  )

  useEffect(() => () => geometry.dispose(), [geometry])

  const mouse = useRef(new THREE.Vector2(0, 0))
  const pointerActive = useRef(false)
  const focusVal = useRef(focus)
  focusVal.current = focus

  useEffect(() => {
    if (!interactive) return
    const onMove = (e) => {
      pointerActive.current = e.pointerType === 'mouse'
      mouse.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [interactive])

  const tmp = useMemo(() => new THREE.Vector3(), [])
  const read = (v, fallback) => (v == null ? fallback : typeof v === 'number' ? v : v.get())

  useFrame((state, dt) => {
    // R3F may copy the uniforms object onto the material, so always write to the live one
    const u = material.current ? material.current.uniforms : uniforms
    if (!reduced) u.uTime.value += Math.min(dt, 0.05)
    u.uProgress.value = reduced ? 1 : read(progress, 1)
    u.uSpeed.value = reduced ? 0 : read(speed, 1)
    // ease each gear's brightness toward the focused pillar
    const f = focusVal.current
    for (let k = 0; k < 3; k++) {
      const target = f < 0 ? 1 : f === k ? 1.3 : 0.22
      u.uBright.value[k] += (target - u.uBright.value[k]) * 0.06
    }

    // project mouse onto z=0 plane in group space
    if (interactive && !reduced && pointerActive.current && group.current) {
      tmp.set(mouse.current.x, mouse.current.y, 0.5).unproject(camera)
      tmp.sub(camera.position).normalize()
      const dist = -camera.position.z / tmp.z
      const world = camera.position.clone().add(tmp.multiplyScalar(dist))
      group.current.worldToLocal(world)
      u.uMouse.value.lerp(world, 0.15)

      // subtle parallax tilt
      group.current.rotation.y += (mouse.current.x * 0.18 - group.current.rotation.y) * 0.04
      group.current.rotation.x += (-mouse.current.y * 0.12 - group.current.rotation.x) * 0.04
    }
  })

  // keep the engine framed on narrow screens
  const scale = layout === 'hero' ? Math.min(0.66, viewport.width / 9.5) : Math.min(0.78, viewport.width / 7.2)
  const hero = layout === 'hero'
  const offsetX = hero ? viewport.width * (size.width > 900 ? 0.22 : 0.28) : 0
  const offsetY = hero && size.width <= 900 ? viewport.height * 0.3 : 0

  return (
    <group ref={group} position={[offsetX, offsetY, 0]} scale={scale}>
      <points ref={points} geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
