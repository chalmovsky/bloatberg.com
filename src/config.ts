// The only place the publication's names live. Change them here.
export const site = {
  name: 'Bloatberg',
  newsletter: 'The Weekly Bloat',
  tagline: 'Mission-critical news.',
  founded: 2026,
  description:
    'Bloatberg covers the companies, people and products shaping technology, from AI and startups to hardware, policy, culture and the visionaries behind it all.',
  privacyEmail: 'privacy@bloatberg.com',
  timezone: 'America/New_York',
  timezoneLabel: 'ET',
  locale: 'en-US',
  themeColor: '#c8102e',
  /** `desk`: the author slug the CMS suggests as byline for that section. */
  sections: [
    { slug: 'ai', name: 'AI', long: 'Artificial Intelligence', blurb: 'AI models, labs and the companies building them.', desk: 'mara-okafor' },
    { slug: 'startups', name: 'Startups', long: 'Startups & Venture', blurb: 'Founders, funding and venture capital.', desk: 'nadia-farouk' },
    { slug: 'dev', name: 'Dev', long: 'Software Development', blurb: 'Programming, open source and developer tools.', desk: 'theo-lindqvist' },
    { slug: 'hardware', name: 'Hardware', long: 'Hardware & Devices', blurb: 'Phones, laptops, chips and gadgets.', desk: 'ben-hartley' },
    { slug: 'policy', name: 'Policy', long: 'Policy & Regulation', blurb: 'Tech regulation, law and government.', desk: 'celeste-moreau' },
    { slug: 'culture', name: 'Culture', long: 'Work & Culture', blurb: 'How the tech industry works.', desk: 'jonah-pike' },
    { slug: 'reviews', name: 'Reviews', long: 'Reviews', blurb: 'Reviews of phones, laptops, apps and gadgets.', desk: 'ben-hartley' },
    { slug: 'visionaries', name: 'Visionaries', long: 'Visionaries', blurb: 'The people who run tech.', desk: 'clementine-ashby' },
  ],
} as const

export type SectionSlug = (typeof site.sections)[number]['slug']

export function sectionName(slug: string): string {
  return site.sections.find((s) => s.slug === slug)?.name ?? 'Tech'
}

export function sectionInfo(slug: string) {
  return site.sections.find((s) => s.slug === slug)
}

export function isSection(slug: string): slug is SectionSlug {
  return site.sections.some((s) => s.slug === slug)
}

/** Story labels shown above the headline. Empty means none. */
export const LABELS = ['', 'Exclusive', 'Scoop', 'Analysis', 'Investigation', 'Explainer', 'Review', 'Interview', 'Opinion'] as const
export type StoryLabel = (typeof LABELS)[number]
export const isLabel = (v: unknown): v is StoryLabel => typeof v === 'string' && (LABELS as readonly string[]).includes(v)

/**
 * A ticker instrument. Values drift from these bases through the day (see lib/markets.ts).
 * `flat` instruments never move; `up` ones only ever go up.
 */
export interface Instrument {
  name: string
  base: number
  unit?: 'pct' | 'usdm' | 'wks' | 'yrs' | 'count' | 'mb' | 'gb'
  vol: number // max daily move, as a fraction
  trend?: 'up' | 'flat'
  note?: string // replaces the change column
}

/** A countdown-style ticker item: "time since the last X", where X happens at random intervals. */
export interface Incident {
  name: string
  minGap: number // minutes between incidents, at least
  maxGap: number // ...and at most
  detail: (r: () => number) => string // what the change column says about the latest one
}

/** The Bloatberg Terminal: the strip under the masthead. The first one also sits beside the nameplate. */
export const MARKETS: (Instrument | Incident)[] = [
  { name: 'Bloat Index', base: 1834.27, vol: 0.012, trend: 'up' },
  {
    name: 'Since last CVE 9.0+', minGap: 2, maxGap: 41,
    detail: (r) => `CVSS ${(9 + Math.floor(r() * 11) / 10).toFixed(1)}`,
  },
  { name: 'Electron app median', base: 412, unit: 'mb', vol: 0.03, trend: 'up' },
  { name: 'node_modules avg', base: 1.31, unit: 'gb', vol: 0.02, trend: 'up' },
  { name: 'AI Hype', base: 4812.06, vol: 0.03 },
  { name: 'AGI ETA', base: 2, unit: 'yrs', vol: 0, trend: 'flat', note: 'unch. since 2015' },
  {
    name: 'Since last “X is a scam” post', minGap: 6, maxGap: 70,
    detail: (r) => `re: ${['the cloud', 'TypeScript', 'chairs', 'Tuesdays', 'your stack', 'microservices', 'gravity', 'meetings'][Math.floor(r() * 8)]}`,
  },
  { name: 'Chat app RAM', base: 2.4, unit: 'gb', vol: 0.04, trend: 'up' },
  { name: 'Series A median', base: 41.2, unit: 'usdm', vol: 0.02 },
  { name: 'GPU wait', base: 14, unit: 'wks', vol: 0.08, trend: 'up' },
  {
    name: 'Since last outage blamed on DNS', minGap: 9, maxGap: 95,
    detail: (r) => (r() < 0.85 ? 'it was DNS' : 'it was not DNS (it was DNS)'),
  },
  { name: 'Hello World (React)', base: 84, unit: 'mb', vol: 0.01, trend: 'up' },
  { name: 'Vibes', base: 61.4, vol: 0.06 },
  { name: 'Layoffs YTD', base: 212904, unit: 'count', vol: 0.01, trend: 'up' },
  { name: 'Rust rewrites', base: 3311, unit: 'count', vol: 0.02, trend: 'up' },
  { name: 'JS frameworks', base: 9.4, unit: 'count', vol: 0.05, note: 'per week' },
]

/** "By the numbers" on the front page. Four are shown, rotating daily. */
export const NUMBERS: { figure: string; text: string }[] = [
  { figure: '14 wks', text: 'Average wait for a high-end GPU, up from “lol” in January' },
  { figure: '71%', text: 'Share of meetings now attended entirely by AI agents' },
  { figure: '$0', text: 'Revenue of the year’s best-funded startup, according to its pitch deck' },
  { figure: '3,311', text: 'Open-source projects currently being rewritten in Rust' },
  { figure: '9', text: 'Months since a major platform promised to “double down on creators”' },
  { figure: '1 in 4', text: 'Developers who say they understand the code they shipped last week' },
  { figure: '40', text: 'Cookie banners required by the latest proposed EU rule, per page' },
  { figure: '0', text: 'Decisions produced by the 1.2 million meetings scheduled by agents' },
  { figure: '11', text: 'Years the industry’s longest-running “temporary fix” has been in production' },
  { figure: '6.1B', text: 'Valuation, in dollars, of a company whose product attends meetings' },
]

/** The /masthead page. Real bylines come from the authors table; these are the people above them. */
export const MASTHEAD: { group: string; people: { name: string; title: string }[] }[] = [
  {
    group: 'Leadership',
    people: [
      { name: 'Eleanor Vance-Whitfield', title: 'Editor in Chief' },
      { name: 'Marcus Adeyemi', title: 'Executive Editor' },
      { name: 'Helen Achterberg', title: 'Managing Editor' },
    ],
  },
  {
    group: 'Editors',
    people: [
      { name: 'Tomás Reyes', title: 'Deputy Managing Editor, News' },
      { name: 'Ruth Calloway', title: 'Standards Editor' },
      { name: 'Ji-woo Han', title: 'Features Editor' },
      { name: 'Oliver Strand', title: 'Head of Visuals' },
      { name: 'Anaïs Duret', title: 'Copy Chief' },
    ],
  },
  {
    group: 'Business',
    people: [
      { name: 'Graham Pell', title: 'Publisher' },
      { name: 'Natasha Ibarra', title: 'Chief Revenue Officer' },
      { name: 'Dev Kulkarni', title: 'Vice President, Synergy' },
      { name: 'Lauren Mbeki', title: 'Head of Audience' },
      { name: 'Unfilled', title: 'Head of Profit' },
    ],
  },
  {
    group: 'Operations',
    people: [
      { name: 'Paul Osei', title: 'Director of Fact-Checking (Satire Desk)' },
      { name: 'Margaret Lindqvist', title: 'Corrections Editor' },
      { name: 'Biscuit', title: 'Office Dog, Emeritus' },
    ],
  },
]
