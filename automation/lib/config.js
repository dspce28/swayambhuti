// Everything the automation needs from the environment, in one place.
// Secrets come from GitHub Actions secrets; nothing secret is committed.

export const MODEL = 'claude-opus-5-5'

// Weekly posting plan, IST. Day: 0 = Sunday … 6 = Saturday. Change here to change the rhythm.
export const SLOTS = [
  { platform: 'linkedin', day: 2, time: '09:15' }, // Tue
  { platform: 'linkedin', day: 3, time: '12:30' }, // Wed
  { platform: 'linkedin', day: 4, time: '09:15' }, // Thu
  { platform: 'instagram', day: 1, time: '19:00' }, // Mon
  { platform: 'instagram', day: 3, time: '19:00' }, // Wed
  { platform: 'instagram', day: 5, time: '19:00' }, // Fri
]

// What Sunil talks about. Trend research and drafting both use these.
export const PILLARS = [
  {
    id: 'sme',
    name: 'SME growth & owner dependency',
    audience: 'Indian SME owners and MDs',
    queries: ['MSME India growth', 'small business India owners', 'family business India succession'],
  },
  {
    id: 'bfsi-sales',
    name: 'Sales & financial-services sales training',
    audience: 'bank and NBFC sales leaders, relationship managers, insurance and wealth sales teams',
    queries: ['bank sales targets India', 'BFSI hiring relationship managers', 'mis-selling RBI banks'],
  },
  {
    id: 'campus',
    name: 'Campus to corporate',
    audience: 'MBA colleges, placement officers, final-year students and freshers',
    queries: ['campus placements India MBA', 'freshers hiring India', 'employability graduates India'],
  },
]

export function env(name, { required = true, fallback } = {}) {
  const v = process.env[name]
  if (v !== undefined && v !== '') return v
  if (fallback !== undefined) return fallback
  if (required) throw new Error(`Missing environment variable ${name} — see automation/README.md`)
  return undefined
}

// DRY_RUN=1 → no posting, no Sheet writes; everything is printed instead.
export const DRY_RUN = process.env.DRY_RUN === '1'
