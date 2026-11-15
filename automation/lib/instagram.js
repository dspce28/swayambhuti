// Posts to Sunil's Instagram professional account through the official Instagram API (content publishing).
// Images must be public JPEG URLs — the draft job commits them to the website under /social/.
import { env } from './config.js'
import { PublishError } from './linkedin.js'

export function instagramClient({
  token = env('INSTAGRAM_ACCESS_TOKEN'),
  userId = env('INSTAGRAM_USER_ID'),
  base = env('INSTAGRAM_API_BASE', { fallback: 'https://graph.instagram.com/v24.0' }),
  fetchImpl = fetch,
  sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
  async function call(path, params = {}, method = 'POST') {
    const qs = new URLSearchParams({ ...params, access_token: token })
    const res = await fetchImpl(`${base}/${path}${method === 'GET' ? `?${qs}` : ''}`, method === 'GET' ? {} : { method, body: qs })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.error) {
      const msg = data.error?.message || `HTTP ${res.status}`
      const expired = data.error?.code === 190 ? ' — the Instagram token has expired; reconnect (automation/README.md)' : ''
      throw new PublishError(`Instagram ${path}: ${msg}${expired}`, { retryable: res.status >= 500 || res.status === 429 })
    }
    return data
  }

  async function waitReady(containerId) {
    for (let i = 0; i < 20; i++) {
      const { status_code: status } = await call(containerId, { fields: 'status_code' }, 'GET')
      if (status === 'FINISHED') return
      if (status === 'ERROR' || status === 'EXPIRED') throw new PublishError(`Instagram media container ${containerId} is ${status}`)
      await sleep(3000)
    }
    throw new PublishError(`Instagram media container ${containerId} not ready after 60s`, { retryable: true })
  }

  return {
    /** post: { caption, imageUrls: string[] } → { id, url } */
    async publish({ caption, imageUrls }) {
      if (!imageUrls.length) throw new PublishError('Instagram posts need at least one image')
      if (imageUrls.length > 10) throw new PublishError('Instagram carousels allow at most 10 images')
      if (caption.length > 2200) throw new PublishError(`Instagram caption is ${caption.length} characters; the limit is 2200`)
      const tags = caption.match(/#[\p{L}\p{N}_]+/gu) || []
      if (tags.length > 30) throw new PublishError(`Instagram allows 30 hashtags; this caption has ${tags.length}`)

      let creationId
      if (imageUrls.length === 1) {
        creationId = (await call(`${userId}/media`, { image_url: imageUrls[0], caption })).id
      } else {
        const children = []
        for (const url of imageUrls) children.push((await call(`${userId}/media`, { image_url: url, is_carousel_item: 'true' })).id)
        for (const c of children) await waitReady(c)
        creationId = (await call(`${userId}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption })).id
      }
      await waitReady(creationId)

      let published
      try {
        published = await call(`${userId}/media_publish`, { creation_id: creationId })
      } catch (e) {
        throw new PublishError(`${e.message} (publish step — check Instagram before retrying)`, { ambiguous: true })
      }
      let url = 'https://www.instagram.com/'
      try {
        url = (await call(published.id, { fields: 'permalink' }, 'GET')).permalink || url
      } catch {
        /* the post is live; the link is a nicety */
      }
      return { id: published.id, url }
    },
  }
}
