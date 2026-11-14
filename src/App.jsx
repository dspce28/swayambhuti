import { AnimatePresence } from 'motion/react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Cursor, Footer, Nav, PageTransition, Preloader, ScrollProgress, ScrollToTop, SmoothScroll, WhatsAppFloat } from './components/Layout'
import { useEffect } from 'react'
import Home from './pages/Home'
import HealthCheck from './pages/HealthCheck'
import { captureAttribution, loadTags } from './lib/marketing'
import { About, Blog, CaseStudies, Contact, Engine, Industries, NotFound, Services, TestimonialsPage, Training } from './pages/Pages'

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
  }, [])
  return (
    <>
      <SmoothScroll />
      <Preloader />
      <Cursor />
      <ScrollProgress />
      <Nav />
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <main key={location.pathname}>
          <ScrollToTop />
          <Routes location={location}>
            {routes.map(([path, C]) => (
              <Route key={path} path={path} element={<PageTransition><C /></PageTransition>} />
            ))}
          </Routes>
        </main>
      </AnimatePresence>
      <Footer />
      <WhatsAppFloat />
    </>
  )
}
