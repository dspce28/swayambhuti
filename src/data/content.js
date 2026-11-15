// All site copy lives here so the client can edit text without touching components.
// Source: https://swayambhuti.com (Nov 2026 snapshot).

export const site = {
  name: 'Swayambhuti Consultants',
  tagline: 'Fixing Broken Business Engines',
  phone: '+91 99257 78355',
  phoneRaw: '919925778355',
  email: 'Contact@swayambhuti.com',
  linkedin: 'https://www.linkedin.com/in/sunilanandani',
  location: 'India — serving businesses nationally',
}

export const nav = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/engine', label: 'SME Engine' },
  { to: '/industries', label: 'Industries' },
  { to: '/case-studies', label: 'Case Studies' },
  { to: '/training', label: 'Training' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/blog', label: 'Blog' },
]

export const stats = [
  { value: 300, suffix: 'K+', label: 'Professionals impacted' },
  { value: 20, suffix: '+', label: 'Years of expertise' },
  { value: 150, suffix: '+', label: 'Businesses transformed' },
  { value: 7, suffix: '+', label: 'Industries served' },
  { value: 98, suffix: '%', label: 'Client satisfaction' },
]

export const painTicker = [
  'Owner doing everything himself',
  'No systems, only firefighting',
  'Inconsistent sales performance',
  'High employee turnover',
  'Unpredictable monthly revenue',
  'Growth plateau despite effort',
  'Team not aligned to goals',
  'No documented processes',
  'Poor customer retention',
  'Reactive decision-making',
]

export const pains = [
  { title: 'Owner Dependency', text: 'Your business cannot function without you making every decision, every day.' },
  { title: 'Revenue Unpredictability', text: 'No consistent sales system means revenue swings wildly month to month.' },
  { title: 'Operational Chaos', text: 'No documented processes — every task depends on individual memory, not systems.' },
  { title: 'Team Misalignment', text: 'Employees are not accountable, not engaged, and not performing to potential.' },
]

export const services = [
  { icon: 'transform', name: 'Business Transformation', desc: 'A comprehensive re-architecture of your business — strategy, structure, and systems — built to create a self-sustaining, scalable growth engine.', outcome: 'Total business overhaul: from reactive to proactive', core: true },
  { icon: 'process', name: 'Process Systemization', desc: 'Document, standardize, and optimize every critical business process. Create SOPs that allow your business to operate consistently at scale.', outcome: '70% reduction in owner dependency within 90 days', core: true },
  { icon: 'cx', name: 'Customer Experience', desc: 'Map and redesign every customer interaction from first contact to long-term retention. Build a referral engine through exceptional service design.', outcome: 'Higher retention, more referrals, premium positioning', core: true },
  { icon: 'sales', name: 'Sales Engine Development', desc: 'Build a structured, predictable sales system: pipeline design, prospecting methodology, conversion scripts, and performance accountability.', outcome: 'Predictable, forecastable revenue month on month', core: true },
  { icon: 'lead', name: 'Leadership Coaching', desc: 'Develop the next layer of leadership in your organization. Build managers who drive performance, resolve problems, and execute with accountability.', outcome: 'A leadership bench ready to scale with the business', core: true },
  { icon: 'people', name: 'Employee Engagement', desc: 'Design a culture of accountability and performance. Reduce attrition, improve alignment, and make your team your strongest competitive advantage.', outcome: 'High-performance culture with measurable output', core: true },
  { icon: 'audit', name: 'Business Performance Audit', desc: 'A structured, diagnostic deep-dive into every aspect of your business — operations, sales, people, and strategy — to identify your biggest leverage points.', outcome: 'Clear roadmap with prioritized action items' },
  { icon: 'growth', name: 'Growth Strategy Design', desc: 'Market analysis, growth opportunity identification, and a structured 12-month roadmap to move your business from current state to target performance.', outcome: 'Strategic clarity and execution confidence' },
  { icon: 'impl', name: 'Implementation Support', desc: 'On-the-ground support to ensure strategies are implemented correctly, teams are trained, and systems are functioning as designed — not just planned.', outcome: 'Strategy that actually gets executed' },
]

export const pillars = [
  {
    key: 'systemize',
    num: '01',
    name: 'SYSTEMIZE',
    title: 'Build the Backbone',
    short: 'Build the operational backbone',
    color: '#d4b25a',
    desc: 'Before you can grow, your business must be able to run. We start by building the operational infrastructure that creates consistency, reduces chaos, and removes owner dependency.',
    steps: [
      ['1.1', 'Business Diagnostic', 'A full audit of current processes, bottlenecks, and systems gaps to create a clear picture of where the business is broken.'],
      ['1.2', 'SOP Design & Documentation', 'Create clear, role-specific Standard Operating Procedures for every critical business function.'],
      ['1.3', 'KPI Framework', 'Define and implement performance metrics at every level so the business can be managed by data, not intuition.'],
      ['1.4', 'Quality Control Systems', 'Build checkpoints and accountability mechanisms that maintain standards without owner supervision.'],
      ['1.5', 'Delegation Architecture', 'Design a clear decision-making matrix that empowers teams and eliminates unnecessary owner involvement.'],
    ],
  },
  {
    key: 'humanize',
    num: '02',
    name: 'HUMANIZE',
    title: 'Develop Your People',
    short: 'Develop people & culture',
    color: '#6fcf9b',
    desc: "Systems alone don't grow businesses — people do. We develop the leadership capabilities, team culture, and customer experience that fuel sustainable performance.",
    steps: [
      ['2.1', 'Leadership Development', 'Build the management layer that drives accountability, resolves problems, and executes strategy without constant escalation.'],
      ['2.2', 'Culture Architecture', 'Design the values, rituals, and communication frameworks that create a high-performance, aligned team culture.'],
      ['2.3', 'Customer Journey Mapping', 'Redesign every customer touchpoint to create consistent, premium experiences that drive loyalty and referrals.'],
      ['2.4', 'Employee Engagement Systems', 'Implement engagement frameworks that reduce attrition and align individual performance with business goals.'],
    ],
  },
  {
    key: 'monetize',
    num: '03',
    name: 'MONETIZE',
    title: 'Activate Revenue',
    short: 'Activate revenue levers',
    color: '#f0d484',
    desc: 'With a structured operational backbone and high-performing team in place, we activate the commercial levers that convert your capabilities into compounding revenue and profit.',
    steps: [
      ['3.1', 'Sales System Architecture', 'Design a structured, repeatable sales process with clear stages, scripts, and accountability metrics.'],
      ['3.2', 'Revenue Diversification', 'Identify and activate new revenue streams that reduce risk and accelerate growth beyond existing channels.'],
      ['3.3', 'Pricing & Positioning Strategy', 'Optimize pricing architecture and market positioning to improve margins and command premium pricing.'],
      ['3.4', 'Growth Roadmap Execution', 'Structured 90-day sprints with clear milestones, accountability check-ins, and performance reviews.'],
    ],
  },
]

export const industries = [
  { name: 'Manufacturing', icon: 'factory', desc: 'From production floor SOPs to supply chain optimization and sales team accountability — we help manufacturers build predictable output and profitable growth.' },
  { name: 'Retail & FMCG', icon: 'retail', desc: 'Customer experience redesign, inventory systems, sales team performance, and franchise standardization for retail businesses ready to scale.' },
  { name: 'Healthcare & Wellness', icon: 'health', desc: 'Patient experience improvement, clinic operations, team training, and revenue stream development for healthcare providers and wellness businesses.' },
  { name: 'Education & EdTech', icon: 'edu', desc: 'Student experience systems, admissions process design, faculty performance frameworks, and growth strategy for education institutions and EdTech companies.' },
  { name: 'Construction & Real Estate', icon: 'build', desc: 'Project management systems, client communication frameworks, team accountability, and sales process design for construction and real estate businesses.' },
  { name: 'Professional Services', icon: 'pro', desc: 'Client acquisition systems, service delivery standardization, team performance, and revenue growth for consulting, legal, and financial service firms.' },
  { name: 'Hospitality & F&B', icon: 'hotel', desc: 'Guest experience design, operations systemization, team training, and revenue optimization for hotels, restaurants, and hospitality businesses.' },
  { name: 'Technology & SaaS', icon: 'tech', desc: 'Sales process development, customer success systems, team scaling, and growth strategy for technology companies and SaaS businesses.' },
]

export const cases = [
  {
    industry: 'Manufacturing',
    where: 'SME · Pune',
    title: 'From Owner-Operated Chaos to a Self-Running Manufacturing Business',
    metrics: [['40%', 'Revenue growth (6 months)'], ['70%', 'Reduction in owner hours'], ['8 SOPs', 'Documented & deployed']],
    challenge: 'A 12-year-old manufacturing business with ₹4Cr annual revenue was completely owner-dependent. The founder was working 14+ hour days, there were zero documented processes, and the sales team had no structure or accountability. Revenue was inconsistent and growth had plateaued.',
    approach: 'We deployed the full SME Performance Engine — beginning with an operational audit, followed by 8 critical SOP deployments, a sales accountability system, and a leadership coaching program for 3 key managers. Within 6 months, the founder had reduced his daily working hours by 70% while revenue grew 40%.',
    result: 'The business now runs on systems — not the founder. Month-on-month revenue is consistently hitting targets for the first time in 5 years.',
  },
  {
    industry: 'Retail Chain',
    where: 'SME · Ahmedabad',
    title: 'Building a Referral Machine for a Multi-Location Retail Chain',
    metrics: [['55%', 'Sales conversion improvement'], ['3x', 'Customer referral rate'], ['28%', 'Margin improvement']],
    challenge: 'A retail chain with 6 locations was struggling with inconsistent customer experience, low conversion rates from walk-in traffic, and zero referral generation. Each store operated differently — no standardized processes, no training framework.',
    approach: 'We mapped the complete customer journey, redesigned the in-store experience, implemented a structured sales process across all 6 locations, and trained all 42 staff members. Within 4 months, conversion rates had improved 55% and the referral rate had tripled.',
    result: 'The chain now has a consistent, premium customer experience across all locations — and customers are actively referring friends and family.',
  },
  {
    industry: 'Education',
    where: 'Institute · Mumbai',
    title: 'Transforming an Education Institute into a High-Performance Learning Organization',
    metrics: [['62%', 'Admissions growth'], ['45%', 'Reduction in faculty turnover'], ['4.8★', 'Student satisfaction score']],
    challenge: 'An education institute with high faculty turnover, inconsistent teaching quality, and a struggling admissions process was losing market share to newer competitors. The founder was managing everything personally — from admissions to academic quality to operations.',
    approach: 'We redesigned the admissions process into a structured funnel, implemented a faculty performance framework, standardized curriculum delivery, and built a student experience system. The results within 8 months were transformational.',
    result: 'Admissions grew 62%, faculty retention improved dramatically, and the institute is now known as one of the highest-rated in its category.',
  },
]

export const trainings = [
  { icon: 'trophy', name: 'SME Owner Masterclass', desc: 'A full-day intensive for SME owners — covering business systemization, delegation, and the mindset shift from operator to CEO.', format: 'Full Day · In-Person' },
  { icon: 'process', name: 'Process & Systems Bootcamp', desc: 'Hands-on workshop for leadership teams to document, design, and deploy business SOPs in a structured, facilitated environment.', format: '2 Days · In-Person' },
  { icon: 'sales', name: 'Sales Performance Program', desc: 'A structured sales training for B2B and B2C sales teams — covering pipeline management, conversion techniques, and accountability.', format: '3 Modules · Hybrid' },
  { icon: 'lead', name: 'Leadership Excellence Program', desc: 'A 4-week program for emerging and mid-level managers covering performance management, communication, and decision-making.', format: '4 Weeks · Hybrid' },
  { icon: 'cx', name: 'Customer Experience Workshop', desc: 'Map and redesign your customer journey in a collaborative workshop format. Build a premium experience framework your team can execute.', format: 'Half Day · In-Person' },
  { icon: 'people', name: 'Team Engagement Sprint', desc: 'A structured team engagement program covering culture, communication, goal alignment, and accountability frameworks.', format: '2 Days · In-Person' },
]

export const testimonials = [
  { name: 'Rajiv Mehta', role: 'MD, Manufacturing SME · Pune', quote: 'The SYSTEMIZE phase alone was transformational. We had zero documentation before. Now our business runs on process. My team knows exactly what to do — and revenue has become predictable for the first time.' },
  { name: 'Priya Sharma', role: 'Founder, EdTech Startup · Mumbai', quote: "Sunil doesn't just consult — he works alongside you. He identified problems we didn't even know existed and fixed them systematically. Sales grew 40% in Q1 after engagement." },
  { name: 'Anil Desai', role: 'CEO, Retail Chain · Ahmedabad', quote: 'We were growing but completely chaotic. Sunil brought structured thinking to every department. Now our team is accountable, our processes are documented, and I can actually take a holiday.' },
  { name: 'Sunita Kapoor', role: 'Director, Healthcare Clinic · Delhi', quote: 'The sales engine Sunil built for our team is remarkable. Clear pipeline, scripted conversation frameworks, daily accountability — our conversion rate improved 55% within 4 months.' },
  { name: 'Vikram Patel', role: 'Founder, Construction Company · Surat', quote: 'What I valued most was the honesty. Sunil told us exactly what was broken and exactly how to fix it — no sugarcoating, no vague recommendations. Pure, actionable insight.' },
  { name: 'Meena Joshi', role: 'MD, Education Institute · Bangalore', quote: 'The leadership coaching program transformed my management team. They went from reactive problem reporters to proactive problem solvers. The culture shift was visible within weeks.' },
]

export const values = [
  { name: 'Results First', text: 'We measure success by the business outcomes our clients achieve — not by the hours we bill or the reports we deliver.' },
  { name: 'Diagnostic Depth', text: 'We go deep before we prescribe. Every engagement begins with an honest diagnosis of where your business is genuinely broken.' },
  { name: 'Embedded Partnership', text: "We don't deliver decks and disappear. We work alongside your team until the systems are built and performing." },
  { name: 'Structured Thinking', text: 'Every recommendation is systematic, documented, and built to be sustainable without our involvement over time.' },
]

// Blog articles live in content/blog/*.md (see README → Blog).

// ⚠️ Scarcity line used in the final CTA. It must be TRUE — confirm the number with Sunil before launch.
export const availability = 'Accepting 5 new SME engagements — Q1 2027'

// "How the work runs" — the engagement path (pinned section on Home).
export const process = [
  { n: '01', title: 'Diagnose', scene: 'diagnose', text: 'A Business Performance Audit across operations, people, sales and numbers. You get an honest map of where the engine is broken — and what it costs you each month.' },
  { n: '02', title: 'Systemize', scene: 'systemize', text: 'We document and install the 5–8 processes your business can’t run without, plus a weekly KPI dashboard. The business stops depending on your memory.' },
  { n: '03', title: 'Humanize', scene: 'humanize', text: 'We build the management layer, culture rituals and customer journey so your people own outcomes — and customers come back and refer.' },
  { n: '04', title: 'Monetize', scene: 'monetize', text: 'With the engine stable, we switch on the revenue levers: a forecastable sales system, structured referrals and pricing that protects margin.' },
]

// "Measure what moves you" — illustrative mini-charts (not client data).
export const impact = [
  { chart: 'bars', title: 'Owner hours released', text: 'Track the hours you get back as decisions move to systems and managers.' },
  { chart: 'line', title: 'Revenue predictability', text: 'Narrow the gap between forecast and actual, month after month.' },
  { chart: 'donut', title: 'Process coverage', text: 'See how much of the business runs on documented, trained SOPs.' },
  { chart: 'dots', title: 'Team alignment', text: 'Connect every role to weekly targets and clear accountability.' },
]

// FAQ — written answer-first for search snippets and AI answer engines (AEO / GEO).
export const faqs = [
  { q: 'What does an SME business transformation consultant do?', a: 'An SME business transformation consultant diagnoses why a small or mid-sized business depends on its owner, then installs the systems, management layer and sales process that let it grow predictably. Swayambhuti does this through the SME Performance Engine™: Systemize, Humanize, Monetize.' },
  { q: 'What is the SME Performance Engine™?', a: 'The SME Performance Engine™ is Swayambhuti’s three-pillar framework. SYSTEMIZE builds SOPs, KPIs and delegation; HUMANIZE develops leaders, culture and customer experience; MONETIZE installs a forecastable sales system, referrals and pricing discipline. It has been applied across 150+ Indian SMEs.' },
  { q: 'How do I reduce owner dependency in my business?', a: 'Reduce owner dependency in three moves: document the 5–8 critical processes as SOPs, define decision rights so managers decide without escalating, and run the business on a weekly KPI dashboard instead of daily check-ins. Swayambhuti clients typically target a 70% reduction in owner involvement within 90 days.' },
  { q: 'How long does a business transformation engagement take?', a: 'Most engagements show measurable change within 90 days and run 4–8 months in total. The published case studies saw 40% revenue growth in 6 months (manufacturing), 55% better conversion in 4 months (retail) and 62% admissions growth in 8 months (education).' },
  { q: 'What is a Business Performance Audit and is it really free?', a: 'It is a structured 60-minute call with Sunil Anandani that reviews operations, people, sales and numbers to find your biggest leverage points. It is free and carries no obligation. You can start with the 3-minute online Business Engine Health Check.' },
  { q: 'Which industries does Swayambhuti work with?', a: 'Manufacturing, retail and FMCG, healthcare and wellness, education and EdTech, construction and real estate, professional services, hospitality and F&B, and technology/SaaS — SMEs across India.' },
  { q: 'Do you work only in one city?', a: 'No. Swayambhuti serves SMEs across India, with client work in cities including Pune, Ahmedabad and Mumbai. Engagements combine on-site workshops with remote follow-through.' },
  { q: 'Who is Sunil Anandani?', a: 'Sunil Anandani is the founder and chief consultant of Swayambhuti Consultants — an SME business transformation specialist with 20+ years of experience, 150+ businesses transformed and 300,000+ professionals impacted through consulting and training.' },
]

// Real photos from Sunil's sessions (public/img/work). Captions describe only what is visible.
// ⚠️ Attendees are identifiable in some photos — confirm the organisers are happy for them to be public.
export const gallery = [
  { src: '/img/work/session-hands.webp', w: 960, h: 720, caption: 'Corporate training session' },
  { src: '/img/work/venue-mic.webp', w: 960, h: 640, caption: 'Interactive workshop' },
  { src: '/img/work/team-outdoor.webp', w: 960, h: 640, caption: 'Team engagement activity' },
  { src: '/img/work/event-mic.webp', w: 960, h: 638, caption: 'Business forum' },
  { src: '/img/work/hotel.webp', w: 604, h: 1280, caption: 'Team training' },
  { src: '/img/work/flipchart.webp', w: 960, h: 639, caption: 'Facilitating a session' },
  { src: '/img/work/venue-wide.webp', w: 960, h: 640, caption: 'Workshop in session' },
  { src: '/img/work/network-mic.webp', w: 724, h: 1086, caption: 'Business network meet' },
  { src: '/img/work/screen.webp', w: 960, h: 720, caption: 'Training session' },
  { src: '/img/work/stage.webp', w: 864, h: 1152, caption: 'Keynote session' },
]
