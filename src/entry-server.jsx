import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'

import { headTags, routes } from './seo'
import { articles, articleSeo, blogSeo } from './data/blog'

export { headTags, routes, SITE_URL, keywords, statsLine } from './seo'
export { faqs, services, pillars, cases, industries, site, stats } from './data/content'
export { articles } from './data/blog'

// Every URL to prerender: the fixed routes plus one page per visible article.
export const pagePaths = [...Object.keys(routes), ...articles.map((a) => a.path)]

export function headFor(path) {
  const a = articles.find((x) => x.path === path)
  if (a) return headTags(path, articleSeo(a))
  if (path === '/blog') return headTags(path, blogSeo())
  return headTags(path)
}

export function render(url) {
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>,
  )
}
