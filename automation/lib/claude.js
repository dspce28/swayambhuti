// All Claude calls: draft the week, check a draft before autopilot posts it, and update the voice file.
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { MODEL } from './config.js'

// Structured output: the API returns JSON matching this schema; zod re-checks it before we trust it.
const Slide = z.object({ title: z.string(), body: z.string() })
export const Post = z.object({
  slot: z.number().int(),
  platform: z.enum(['linkedin', 'instagram']),
  format: z.enum(['text', 'quote', 'carousel']),
  pillar: z.string(),
  topic: z.string(),
  sourceUrl: z.string(),
  text: z.string().min(40),
  hashtags: z.array(z.string()),
  headline: z.string(),
  slides: z.array(Slide),
  altText: z.string(),
})
export const Week = z.object({ posts: z.array(Post) })
const Check = z.object({ pass: z.boolean(), issues: z.array(z.string()) })
const VoiceUpdate = z.object({ voice: z.string().min(200), changes: z.array(z.string()) })

// The structured-output schema keeps only what the API constrains on (types, enums, required, no extra keys);
// length and range limits are enforced by zod after parsing instead.
export function jsonSchema(schema) {
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip)
    if (!node || typeof node !== 'object') return node
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      if (['$schema', 'minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems', 'exclusiveMinimum', 'exclusiveMaximum'].includes(k)) continue
      out[k] = strip(v)
    }
    if (out.type === 'object') out.additionalProperties = false
    return out
  }
  return strip(z.toJSONSchema(schema, { target: 'draft-2020-12' }))
}

export function claudeClient({ client = new Anthropic() } = {}) {
  async function ask({ system, user, schema, effort = 'high' }) {
    const msg = await client.beta.messages
      .stream({
        model: MODEL,
        max_tokens: 64000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default', // a safety decline is retried on Anthropic's recommended fallback model
        output_config: { effort, format: { type: 'json_schema', schema: jsonSchema(schema) } },
        system,
        messages: [{ role: 'user', content: user }],
      })
      .finalMessage()
    if (msg.stop_reason === 'refusal') throw new Error(`Claude declined (${msg.stop_details?.category ?? 'no category'}): ${msg.stop_details?.explanation ?? ''}`)
    if (msg.stop_reason === 'max_tokens') throw new Error('Claude ran out of output tokens — reduce the number of posts per run')
    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
    return schema.parse(JSON.parse(text))
  }

  return {
    draftWeek: ({ voice, examples, slots, pillars, trends, recentTopics, weekOf }) =>
      ask({
        system: draftSystem(voice, examples),
        user: draftRequest({ slots, pillars, trends, recentTopics, weekOf }),
        schema: Week,
      }),

    check: ({ voice, post }) =>
      ask({
        effort: 'medium',
        system: `You review social posts before they are published automatically under Sunil Anandani's name. Be strict: anything you would not be comfortable seeing on his profile without a human reading it fails.\n\n<voice_guide>\n${voice}\n</voice_guide>`,
        user: `Check this ${post.platform} post. Fail it if it: states a number, client result, name, quote or story that is not in the voice guide or clearly attributed to the linked source; misstates the source; contradicts the voice guide; reads as generic AI copy; could embarrass a consultant who trains bank sales teams and MBA students; or has spelling/grammar errors. List each concrete issue.\n\n<post>\n${JSON.stringify(post, null, 2)}\n</post>`,
        schema: Check,
      }),

    updateVoice: ({ voice, reviews }) =>
      ask({
        system:
          "You maintain the voice guide that drafts Sunil Anandani's social posts. You learn only from his own edits, rejections and notes. Keep everything in the guide that his feedback does not contradict. Write concrete, checkable rules (phrases he uses, phrases he removes, length, tone, topics he likes or rejects), not adjectives. Keep the section headings. Never add facts about him that he did not write himself.",
        user: `<current_voice_guide>\n${voice}\n</current_voice_guide>\n\nHere is what happened to recent drafts. "draft" is what the AI wrote, "final" is what Sunil approved (identical means he changed nothing), "status" Rejected means he refused it, "notes" are his own words.\n\n<reviews>\n${JSON.stringify(reviews, null, 2)}\n</reviews>\n\nReturn the complete updated voice guide and a short list of what you changed and why.`,
        schema: VoiceUpdate,
      }),
  }
}

function draftSystem(voice, examples) {
  return `You write LinkedIn and Instagram posts in the first person as Sunil Anandani, founder of Swayambhuti Consultants (India). He fixes "broken business engines" for SMEs and trains sales teams — especially in banks and financial services — and runs campus-to-corporate programmes for MBA colleges.

Follow the voice guide exactly. Posts he approved are examples of what he likes.

<voice_guide>
${voice}
</voice_guide>

<approved_examples>
${examples || '(none yet — rely on the voice guide)'}
</approved_examples>

Hard rules — a post that breaks one is unusable:
- Never invent facts about Sunil or his clients: no numbers, client names, results, quotes, anecdotes or events unless they appear in the voice guide or examples. Opinions, frameworks and practical advice are fine.
- A news item is only a hook. Attribute it ("a report this week…", "<Source> reported…") and never add details the headline doesn't support. If a headline is unclear, don't use it.
- Indian English and Indian context (₹, lakh/crore, Indian roles and institutions).
- No clichés like "In today's fast-paced world", "game-changer", "unlock", "delve", "leverage synergies". No em-dash overload.

LinkedIn (format "text", or "carousel"/"quote" for at most one post a week):
- First line is the hook: under 12 words, makes the right reader stop.
- 120–220 words, short paragraphs (1–2 lines), white space between them.
- End with a specific question or a clear takeaway. 0–3 hashtags, in "hashtags", not in "text". No links in the text.

Instagram (format "carousel" or "quote" — every Instagram post has a visual):
- "text" is the caption: hook first line, 60–150 words, ends with a call to action (save, share, follow, or DM a keyword).
- 10–15 hashtags in "hashtags" (mix broad and niche, India-relevant), without the # sign inside "text".
- Carousel: 5–7 slides. Slide 1 title is the hook (max 8 words). Each slide body max 25 words. Last slide: the takeaway plus "Follow @swayambhuti" style CTA.
- Quote: one strong line in "headline" (max 18 words), "slides" empty.

For "text" posts set "headline" to "" and "slides" to []. "altText" describes the visual for screen readers ("" for text posts).`
}

function draftRequest({ slots, pillars, trends, recentTopics, weekOf }) {
  return `Plan and write next week's posts (week starting ${weekOf}). Write exactly one post per slot, using the slot's index as "slot" and its platform as "platform".

<slots>
${slots.map((s, i) => `${i}: ${s.platform} on ${s.when}`).join('\n')}
</slots>

<pillars>
${pillars.map((p) => `- ${p.id}: ${p.name} — for ${p.audience}`).join('\n')}
</pillars>
Cover every pillar at least once on each platform where there are enough slots. Use pillar ids in "pillar".

<this_weeks_news>
${trends.length ? trends.map((t) => `- [${t.pillar}] ${t.title} (${t.source}, ${t.published}) ${t.link}`).join('\n') : '(no news fetched — write evergreen posts)'}
</this_weeks_news>
Use news where it gives a timely hook; put that item's link in "sourceUrl", otherwise "".

<recently_posted_topics>
${recentTopics.length ? recentTopics.map((t) => `- ${t}`).join('\n') : '(none)'}
</recently_posted_topics>
Don't repeat these angles.`
}
