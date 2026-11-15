// Posts to Sunil's personal LinkedIn profile through LinkedIn's official Posts API ("Share on LinkedIn" product,
// scope w_member_social). Text, a single image, or a carousel (uploaded as a PDF document, which LinkedIn shows
// as a swipeable carousel).
import { env } from './config.js'

const API = 'https://api.linkedin.com'

// LinkedIn's post text uses "little text": these characters must be backslash-escaped or the post is cut short.
// #hashtags become LinkedIn hashtag templates so they still link.
export function toLittleText(text) {
  const parts = String(text).split(/(#[\p{L}\p{N}_]+)/u)
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return `{hashtag|\\#|${part.slice(1)}}`
      return part.replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`)
    })
    .join('')
}

export class PublishError extends Error {
  constructor(message, { ambiguous = false, retryable = false } = {}) {
    super(message)
    this.ambiguous = ambiguous // the post may have gone out; a human must check before retrying
    this.retryable = retryable
  }
}

export function linkedinClient({
  token = env('LINKEDIN_ACCESS_TOKEN'),
  version = env('LINKEDIN_VERSION', { fallback: '202610' }),
  personUrn = process.env.LINKEDIN_PERSON_URN,
  fetchImpl = fetch,
} = {}) {
  const headers = (extra = {}) => ({
    authorization: `Bearer ${token}`,
    'linkedin-version': version,
    'x-restli-protocol-version': '2.0.0',
    ...extra,
  })

  async function json(res, what) {
    const body = await res.text()
    if (!res.ok) {
      const hint = res.status === 401 ? ' — the LinkedIn token has expired or was revoked; reconnect (automation/README.md)' : ''
      throw new PublishError(`LinkedIn ${what}: HTTP ${res.status}${hint} ${body.slice(0, 300)}`, { retryable: res.status >= 500 || res.status === 429 })
    }
    return body ? JSON.parse(body) : {}
  }

  async function author() {
    if (personUrn) return personUrn
    const me = await json(await fetchImpl(`${API}/v2/userinfo`, { headers: { authorization: `Bearer ${token}` } }), 'userinfo')
    if (!me.sub) throw new PublishError('LinkedIn userinfo returned no member id — the token needs the openid and profile scopes, or set LINKEDIN_PERSON_URN')
    personUrn = `urn:li:person:${me.sub}`
    return personUrn
  }

  async function upload(kind, bytes, contentType) {
    const owner = await author()
    const init = await json(
      await fetchImpl(`${API}/rest/${kind}s?action=initializeUpload`, {
        method: 'POST',
        headers: headers({ 'content-type': 'application/json' }),
        body: JSON.stringify({ initializeUploadRequest: { owner } }),
      }),
      `${kind} upload init`,
    )
    const { uploadUrl } = init.value
    const urn = init.value[kind]
    const put = await fetchImpl(uploadUrl, { method: 'PUT', headers: { authorization: `Bearer ${token}`, 'content-type': contentType }, body: bytes })
    if (!put.ok) throw new PublishError(`LinkedIn ${kind} upload: HTTP ${put.status}`, { retryable: true })
    return urn
  }

  return {
    author,
    /** post: { text, images?: Buffer[], pdf?: Buffer, title?, altText? } → { urn, url } */
    async publish({ text, images = [], pdf, title, altText = '' }) {
      if (text.length > 3000) throw new PublishError(`LinkedIn text is ${text.length} characters; the limit is 3000`)
      const owner = await author()
      let content
      if (pdf) content = { media: { title: title || 'Carousel', id: await upload('document', pdf, 'application/pdf') } }
      else if (images.length === 1) content = { media: { id: await upload('image', images[0], 'image/jpeg'), altText } }
      else if (images.length > 1) content = { multiImage: { images: await Promise.all(images.map(async (b) => ({ id: await upload('image', b, 'image/jpeg'), altText }))) } }

      let res
      try {
        res = await fetchImpl(`${API}/rest/posts`, {
          method: 'POST',
          headers: headers({ 'content-type': 'application/json' }),
          body: JSON.stringify({
            author: owner,
            commentary: toLittleText(text),
            visibility: 'PUBLIC',
            distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
            lifecycleState: 'PUBLISHED',
            isReshareDisabledByAuthor: false,
            ...(content ? { content } : {}),
          }),
        })
      } catch (e) {
        throw new PublishError(`LinkedIn post: network error after sending (${e.message})`, { ambiguous: true })
      }
      if (res.status >= 500) throw new PublishError(`LinkedIn post: HTTP ${res.status} — may or may not have posted`, { ambiguous: true })
      await json(res, 'post')
      const urn = res.headers.get('x-restli-id')
      return { urn, url: urn ? `https://www.linkedin.com/feed/update/${urn}/` : 'https://www.linkedin.com/in/me/recent-activity/all/' }
    },
  }
}
