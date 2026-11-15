# Social automation: LinkedIn + Instagram

Every week this drafts Sunil's posts from the week's news in his niche. Sunil approves or edits them in a Google
Sheet, and the approved posts go out on schedule. It learns his taste from his edits. Once his drafts stop needing
edits, he can switch on **autopilot** and posting becomes hands-off.

```
Sat 10:00 IST   draft.js    news (Google News, India) → Claude writes 3 LinkedIn + 3 Instagram posts
                            → branded images → rows in the Sheet (Status = Pending) → email to Sunil
Any time        Sunil       edits "Final (edit this)", sets Status = Approved / Rejected, adds "Notes for Claude"
At each slot    publish.js  posts Approved rows whose planned time has passed → Status = Posted + link
Fri 18:00 IST   learn.js    reads his edits, rejections and notes → updates voice/voice.md → readiness score
```

Default slots (change them in `lib/config.js` → `SLOTS`, and update the times in `.github/workflows/social-publish.yml`):
LinkedIn Tue 09:15, Wed 12:30, Thu 09:15 · Instagram Mon, Wed, Fri 19:00 (IST).

## What Sunil does

1. Open the email "N posts to review", then open the Sheet.
2. For each row: read **Final (edit this)** and the **Preview** image. Edit the text in place if needed.
3. Set **Status** to **Approved** or **Rejected**. Optionally say why in **Notes for Claude**, for example
   "too salesy" or "never mention competitors". Those notes are what it learns from.
4. Nothing is posted unless it is Approved. Anything not approved by its planned time is skipped, not posted late.
   A post approved more than 12 hours late is marked Failed. To post it anyway, change Planned and approve again.

**Emergency stop:** Config tab → `PAUSED` = `YES`.

## Autopilot (zero-touch)

The weekly learning job writes a line to Config → `READINESS`, for example:

> 16 reviewed · last 5 approved without real edits · edited or rejected 20% of the last 10 · READY

"Ready" means at least 15 posts reviewed **and** the last 5 approved with no real edits (95%+ of words
unchanged). When it gets there, Sunil gets an email. **Only when he says yes**, set `AUTOPILOT` = `ON`.

On autopilot, each draft goes through a second, strict Claude review before it is approved automatically. That
review fails posts with made-up facts, a misread source, generic AI copy or off-brand tone, and those posts stay
Pending for a human. Sunil still gets the weekly email and can reject any post before its planned time.

## One-time setup

### 1. Google Sheet (approval queue)
Follow the steps at the top of `integrations/social-queue.gs`. It gives you `SOCIAL_SHEET_URL` and
`SOCIAL_SHEET_SECRET`. Share the Sheet with Sunil and put his email in Config → `NOTIFY_EMAIL`.

### 2. Claude API key
Create a key at platform.claude.com and save it as `ANTHROPIC_API_KEY`. Expected cost is a few dollars a month:
one drafting call and one learning call a week, plus six review calls a week on autopilot.

### 3. LinkedIn (Sunil's personal profile)
- **LinkedIn only lets you create a developer app if it is linked to a LinkedIn Company Page.** Create the
  Swayambhuti page first. A basic one is enough, and Sunil must be an admin.
- At linkedin.com/developers, create an app linked to that page. Under **Products**, add
  **Share on LinkedIn** and **Sign In with LinkedIn using OpenID Connect**.
- **Auth → OAuth 2.0 tools → Create token**, logged in **as Sunil**, with scopes `openid profile w_member_social`.
  Save the token as `LINKEDIN_ACCESS_TOKEN`.
- In Config, set `LINKEDIN_TOKEN_EXPIRES` to the date 60 days from today. You get an email 7 days before it expires.
- LinkedIn API versions retire after about a year. If posts fail with a version error, set the repository
  variable `LINKEDIN_VERSION` to a recent month, such as `202611`.

### 4. Instagram
- Sunil's Instagram must be a **Professional** account (Business or Creator). Settings → Account type.
- At developers.facebook.com, create an app with the Instagram use case (API setup with Instagram login). Add
  Sunil's account, then **Generate token** while logged in as that account.
- Save the token as `INSTAGRAM_ACCESS_TOKEN`, and the Instagram user ID shown there as the variable
  `INSTAGRAM_USER_ID`.
- In Config, set `INSTAGRAM_TOKEN_EXPIRES` to the date 60 days from today.
- Instagram downloads post images from public URLs. The draft job commits them to `public/social/`, so they are
  served by the website at `https://swayambhuti.com/social/...`. **The branch these workflows commit to must be
  the branch the live site deploys from.**

### 5. GitHub settings
Repo → Settings → Secrets and variables → Actions:

| Secrets | Variables |
|---|---|
| `ANTHROPIC_API_KEY` | `PUBLIC_BASE_URL` = `https://swayambhuti.com` |
| `SOCIAL_SHEET_URL`, `SOCIAL_SHEET_SECRET` | `INSTAGRAM_USER_ID` |
| `LINKEDIN_ACCESS_TOKEN` | `LINKEDIN_VERSION` (optional), `LINKEDIN_PERSON_URN` (optional) |
| `INSTAGRAM_ACCESS_TOKEN` | `INSTAGRAM_API_BASE` (optional, default `https://graph.instagram.com/v24.0`) |

Scheduled workflows run only from the repository's **default branch**, so these files must be merged there.

### 6. First run
Actions → **Social — draft next week** → Run workflow, with **dry run** ticked. It prints the drafts without
writing anything. Then run it without dry run, approve one post in the Sheet with a Planned time a few minutes
from now, and run **Social — publish due posts**.

## Reconnecting (every ~60 days)
Repeat the "create/generate token" step for the platform, replace the GitHub secret, and update the expiry
date in Config.

## Teaching it faster
- Paste 5–10 posts Sunil wrote himself and likes into `voice/examples.md`. This helps more than anything else.
- Edit `voice/voice.md` directly. It is plain text: facts he has published, beliefs, tone, and phrases to avoid.
  Drafts may state only facts listed there.

## Local commands
```bash
cd automation && npm ci && npx playwright install chromium
DRY_RUN=1 node draft.js     # needs ANTHROPIC_API_KEY, SOCIAL_SHEET_URL, SOCIAL_SHEET_SECRET
DRY_RUN=1 node publish.js
npm test                     # all APIs faked; no keys needed
```

## Not automated (yet)
- **Reels.** Video still needs Sunil on camera: record short clips and post them by hand. Reel scripts can be added to the weekly drafts next.
- **Replying to comments.** Engagement on his posts is his. It builds the relationships the posts are for.
