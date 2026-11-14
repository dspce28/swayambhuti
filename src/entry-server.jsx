import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'

export { headTags, routes, SITE_URL, keywords, statsLine } from './seo'
export { faqs, services, pillars, cases, industries, site, stats } from './data/content'

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}
