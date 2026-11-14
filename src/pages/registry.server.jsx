// Server/prerender: every page eager, so the static HTML contains full content.
import Home from './Home'
import HealthCheck from './HealthCheck'
import { About, Blog, CaseStudies, Contact, Engine, Industries, NotFound, Services, TestimonialsPage, Training } from './Pages'

export const pages = { Home, HealthCheck, About, Services, Engine, Industries, CaseStudies, Training, TestimonialsPage, Blog, Contact, NotFound }
export const preload = async () => {}
