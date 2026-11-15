// Loads every article in content/blog/*.md at build time.
// Drafts (and future-dated posts) are visible in `npm run dev` and in builds with VITE_SHOW_DRAFTS=1
// (set that on Vercel *Preview* deployments only, so the client can review before anything goes live).
import { buildArticles, relatedTo } from '../lib/blog-parse'
import { person, routes, SITE_URL } from '../seo'

const files = import.meta.glob('/content/blog/*.md', { query: '?raw', import: 'default', eager: true })

export const showDrafts = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === '1'
export const articles = buildArticles(files, { showDrafts })
export const publicArticles = articles.filter((a) => !a.draft)

export const getArticle = (slug) => articles.find((a) => a.slug === slug)
export const related = (a, n) => relatedTo(a, articles, n)

const abs = (p) => (p ? SITE_URL + p : undefined)

// Page metadata for one article: <head> tags, BlogPosting + breadcrumb JSON-LD.
export function articleSeo(a) {
  const url = SITE_URL + a.path
  return {
    title: `${a.title} | Swayambhuti`,
    description: a.description,
    type: 'article',
    image: abs(a.cover),
    published: a.date,
    modified: a.updated || a.date,
    noindex: a.draft,
    crumbs: [
      ['Blog', '/blog'],
      [a.title, a.path],
    ],
    schema: [
      person,
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: a.title,
        description: a.description,
        datePublished: a.date,
        dateModified: a.updated || a.date,
        author: { '@id': `${SITE_URL}/#sunil` },
        publisher: { '@id': `${SITE_URL}/#org` },
        mainEntityOfPage: url,
        url,
        image: abs(a.cover) || `${SITE_URL}/og.jpg`,
        articleSection: a.category,
        keywords: a.tags.join(', ') || undefined,
        wordCount: a.words,
        inLanguage: 'en-IN',
      },
    ],
  }
}

export function blogSeo() {
  return {
    ...routes['/blog'],
    schema: [
      {
        '@type': 'Blog',
        '@id': `${SITE_URL}/blog#blog`,
        name: 'SME Growth Blog',
        url: `${SITE_URL}/blog`,
        publisher: { '@id': `${SITE_URL}/#org` },
        blogPost: publicArticles.map((a) => ({
          '@type': 'BlogPosting',
          headline: a.title,
          description: a.description,
          datePublished: a.date,
          url: SITE_URL + a.path,
          author: { '@id': `${SITE_URL}/#sunil` },
        })),
      },
    ],
  }
}
