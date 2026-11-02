import { site } from '../config'

const tz = site.timezone
const loc = site.locale

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(opts)
  let f = fmtCache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(loc, { timeZone: tz, ...opts })
    fmtCache.set(key, f)
  }
  return f
}

const toDate = (ts: number) => new Date(ts * 1000)

export const nowSeconds = () => Math.floor(Date.now() / 1000)

/** "Sunday, November 1, 2026" */
export function longDate(ts: number): string {
  return fmt({ weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(toDate(ts))
}

// AP style: "Jan.", "Feb.", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."; short months spelled out.
const AP_MONTHS = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']

function apParts(ts: number) {
  const [y, m, d] = dateParts(ts)
  return { year: y, month: AP_MONTHS[Number(m) - 1]!, day: String(Number(d)) }
}

/** "Nov. 1, 2026" */
export function shortDate(ts: number): string {
  const p = apParts(ts)
  return `${p.month} ${p.day}, ${p.year}`
}

/** "6:12 a.m." */
export function apTime(ts: number): string {
  const parts = fmt({ hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(toDate(ts))
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const ampm = get('dayPeriod').toLowerCase().startsWith('p') ? 'p.m.' : 'a.m.'
  return `${get('hour')}:${get('minute')} ${ampm}`
}

/** "Nov. 1, 2026, 6:12 a.m. ET" */
export function dateTimeET(ts: number): string {
  return `${shortDate(ts)}, ${apTime(ts)} ${site.timezoneLabel}`
}

/** "2h ago" under 24 hours, then "Oct. 31" (or "Oct. 31, 2025" in another year). */
export function relativeTime(ts: number, now = nowSeconds()): string {
  const diff = Math.max(0, now - ts)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const p = apParts(ts)
  if (p.year === dateParts(now)[0]) return `${p.month} ${p.day}`
  return shortDate(ts)
}

/** ["2026", "11", "01"] in the site timezone. */
export function dateParts(ts: number): [string, string, string] {
  const parts = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(toDate(ts))
  const get = (t: string) => parts.find((p) => p.type === t)!.value
  return [get('year'), get('month'), get('day')]
}

export function isoDate(ts: number): string {
  return toDate(ts).toISOString()
}

export function rfc822(ts: number): string {
  return toDate(ts).toUTCString()
}
