// Business Engine Health Check — 12 questions, 4 per pillar.
// Each option scores 0 (broken) → 3 (healthy). Edit wording freely; keep 4 options per question.

export const questions = [
  // SYSTEMIZE
  {
    pillar: 0,
    q: 'If you switched your phone off for two weeks, what would happen to the business?',
    options: ['It would stall completely', 'I’d come back to fires everywhere', 'Mostly fine — a few urgent calls', 'It would run normally'],
    leak: 'Owner dependency',
    fix: 'Delegation architecture and a decision matrix so the business runs without you in every loop.',
  },
  {
    pillar: 0,
    q: 'How are your core processes documented?',
    options: ['They live in my head', 'Some notes — nobody follows them', 'Key SOPs exist, partly followed', 'Documented, trained and followed'],
    leak: 'Undocumented processes',
    fix: 'SOP design for your 5–8 critical workflows, with training and checklists your team actually uses.',
  },
  {
    pillar: 0,
    q: 'How do you know how the business did last week?',
    options: ['Gut feel', 'I check the bank balance', 'Monthly reports from accounts', 'A weekly KPI dashboard'],
    leak: 'Managing by gut feel',
    fix: 'A one-page KPI framework so you manage by numbers every week, not by surprise every quarter.',
  },
  {
    pillar: 0,
    q: 'How many decisions a day still come back to you?',
    options: ['30 or more', '15 to 30', '5 to 15', 'Fewer than 5'],
    leak: 'Decision bottleneck',
    fix: 'Clear decision rights by role, so managers decide and you only handle what truly needs you.',
  },
  // HUMANIZE
  {
    pillar: 1,
    q: 'When a key employee resigns, what happens?',
    options: ['Chaos — the knowledge walks out', 'Months to recover', 'Some disruption, then recovery', 'Handover plan and backup ready'],
    leak: 'Key-person risk',
    fix: 'Role documentation and cross-training so no single resignation can stall the business.',
  },
  {
    pillar: 1,
    q: 'Do your managers solve problems or escalate them to you?',
    options: ['They escalate everything', 'They mostly escalate', 'They solve most themselves', 'They own outcomes end to end'],
    leak: 'Weak management layer',
    fix: 'Leadership coaching that turns problem reporters into problem solvers who own results.',
  },
  {
    pillar: 1,
    q: 'Roughly what share of your team leaves each year?',
    options: ['More than 40%', '25–40%', '10–25%', 'Under 10%'],
    leak: 'High attrition',
    fix: 'Engagement systems — clear goals, rituals and growth paths — that make good people stay.',
  },
  {
    pillar: 1,
    q: 'How consistent is the experience your customers get?',
    options: ['Depends entirely on who serves them', 'Frequent complaints', 'Mostly consistent', 'Standardised and measured'],
    leak: 'Inconsistent customer experience',
    fix: 'Customer journey mapping and service standards that create loyalty and referrals.',
  },
  // MONETIZE
  {
    pillar: 2,
    q: 'How predictable is your monthly revenue?',
    options: ['Swings more than 40%', 'Swings 20–40%', 'Within 10–20% of plan', 'Within 10% of forecast'],
    leak: 'Unpredictable revenue',
    fix: 'A forecastable sales engine with pipeline stages and weekly targets you can plan around.',
  },
  {
    pillar: 2,
    q: 'How does your sales team actually sell?',
    options: ['No process — I close most deals', 'Everyone has their own style', 'Defined stages, loosely tracked', 'Pipeline, scripts and daily accountability'],
    leak: 'No sales system',
    fix: 'Sales system architecture: stages, scripts, follow-up cadence and daily accountability.',
  },
  {
    pillar: 2,
    q: 'Where do new customers come from?',
    options: ['Whoever walks in', 'Referrals, by luck', 'One or two reliable channels', 'Several measured channels, incl. structured referrals'],
    leak: 'Lead flow left to chance',
    fix: 'A structured referral engine plus measured acquisition channels so growth isn’t luck.',
  },
  {
    pillar: 2,
    q: 'When did you last review your pricing and margins by product?',
    options: ['Never', 'More than two years ago', 'In the last year', 'Every quarter'],
    leak: 'Margin leakage',
    fix: 'Pricing and positioning review to recover margin and command premium pricing.',
  },
]

export const pillarNames = ['Systemize', 'Humanize', 'Monetize']
export const pillarColors = ['#e3bd5c', '#5fd39a', '#f0d484']

export const tiers = [
  { min: 0, name: 'Stalled engine', tone: '#e2704f', text: 'The business runs on you, not on systems. Growth will keep costing you more hours until the foundations are rebuilt — this is exactly where the SME Performance Engine starts.' },
  { min: 35, name: 'Sputtering engine', tone: '#e3a14f', text: 'Parts of the engine work, but they depend on effort and memory. You are likely working harder each year for similar results. A few targeted fixes would release a lot of pressure.' },
  { min: 55, name: 'Running, but leaking', tone: '#d4c25a', text: 'You have real foundations. The leaks below are where momentum is quietly lost — fixing them is usually the fastest route to predictable growth.' },
  { min: 75, name: 'Compounding engine', tone: '#5fd39a', text: 'Your business runs on systems and people, not on you. The next gains come from sharpening the revenue levers and scaling what already works.' },
]

export function score(answers) {
  const pillars = [0, 1, 2].map((p) => {
    const qs = questions.map((q, i) => [q, answers[i]]).filter(([q]) => q.pillar === p)
    const got = qs.reduce((s, [, a]) => s + (a ?? 0), 0)
    return Math.round((got / (qs.length * 3)) * 100)
  })
  const total = Math.round(answers.reduce((s, a) => s + (a ?? 0), 0) / (questions.length * 3) * 100)
  const tier = [...tiers].reverse().find((t) => total >= t.min)
  const leaks = questions
    .map((q, i) => ({ ...q, i, a: answers[i] ?? 0 }))
    .filter((x) => x.a <= 1)
    .sort((a, b) => a.a - b.a)
    .slice(0, 3)
  return { pillars, total, tier, leaks }
}

// answers <-> compact URL token, e.g. "012301230123"
export const encode = (answers) => answers.map((a) => (a == null ? '-' : a)).join('')
export const decode = (s) => {
  if (!s || s.length !== questions.length || !/^[0-3]+$/.test(s)) return null
  return s.split('').map(Number)
}
