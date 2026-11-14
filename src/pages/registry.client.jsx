// Browser: Home is in the main bundle; other pages load on demand (smaller first download).
// preload(path) is awaited before the first render so a prerendered page never flashes empty.
import { lazy } from 'react'
import Home from './Home'

const loaders = {
  HealthCheck: () => import('./HealthCheck'),
  Pages: () => import('./Pages'),
}
const fromPages = (name) => lazy(() => loaders.Pages().then((m) => ({ default: m[name] })))

export const pages = {
  Home,
  HealthCheck: lazy(loaders.HealthCheck),
  About: fromPages('About'),
  Services: fromPages('Services'),
  Engine: fromPages('Engine'),
  Industries: fromPages('Industries'),
  CaseStudies: fromPages('CaseStudies'),
  Training: fromPages('Training'),
  TestimonialsPage: fromPages('TestimonialsPage'),
  Blog: fromPages('Blog'),
  Contact: fromPages('Contact'),
  NotFound: fromPages('NotFound'),
}

export async function preload(path) {
  if (path === '/' || path === '') return
  if (path.startsWith('/health-check')) await loaders.HealthCheck()
  else await loaders.Pages()
}
