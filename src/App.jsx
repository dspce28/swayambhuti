import { Suspense, useEffect } from 'react'
import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Cursor, Footer, Nav, PageTransition, ScrollProgress, ScrollToTop, SmoothScroll, WhatsAppFloat } from './components/Layout'
import { captureAttribution, loadTags } from './lib/marketing'
import { flushLeadQueue } from './lib/leads'
import { pages } from '@pages'

const { Home, HealthCheck, About, Blog, CaseStudies, Contact, Engine, Industries, NotFound, Services, TestimonialsPage, Training } = pages

const routes = [
  ['/', Home],
  ['/health-check', HealthCheck],
  ['/about', About],
  ['/services', Services],
  ['/engine', Engine],
  ['/industries', Industries],
  ['/case-studies', CaseStudies],
  ['/training', Training],
  ['/testimonials', TestimonialsPage],
  ['/blog', Blog],
  ['/contact', Contact],
  ['*', NotFound],
]

export default function App() {
  const location = useLocation()
  useEffect(() => {
    captureAttribution()
    loadTags()
    flushLeadQueue()
  }, [])
  return (
    <>
      <SmoothScroll />
      <Cursor />
      <ScrollProgress />
      <Nav />
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <main key={location.pathname}>
          <ScrollToTop />
          <Suspense fallback={<div className="route-loading" />}>
            <Routes location={location}>
              {routes.map(([path, C]) => (
                <Route key={path} path={path} element={<PageTransition><C /></PageTransition>} />
              ))}
            </Routes>
          </Suspense>
        </main>
      </AnimatePresence>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
