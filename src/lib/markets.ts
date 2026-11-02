import { MARKETS, NUMBERS, site, type Incident, type Instrument } from '../config'
import { dateParts } from './dates'

/** Small deterministic PRNG, so every reader sees the same "market" at the same moment. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

const dayKey = (ts: number) => dateParts(ts).join('')

export interface Quote {
  name: string
  value: string
  change: string // "+1.42%" / "−0.80%" / a note
  dir: 'up' | 'down' | 'flat' | 'alert'
}

function fmtValue(i: Instrument, v: number) {
  switch (i.unit) {
    case 'usdm': return `$${v.toFixed(1)}M`
    case 'mb': return `${Math.round(v)} MB`
    case 'gb': return `${v.toFixed(2)} GB`
    case 'wks': return `${Math.round(v)} wks`
    case 'yrs': return `${Math.round(v)} yrs`
    case 'pct': return `${v.toFixed(1)}%`
    case 'count': return v >= 1000 ? Math.round(v).toLocaleString('en-US') : v.toFixed(1)
    default: return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
}

/** Minutes since midnight in the site timezone. */
function minuteOfDay(ts: number) {
  const [h, m] = new Intl.DateTimeFormat('en-US', { timeZone: site.timezone, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
    .formatToParts(new Date(ts * 1000))
    .filter((p) => p.type === 'hour' || p.type === 'minute')
    .map((p) => Number(p.value))
  return h! * 60 + m!
}

/**
 * An instrument trades all day: the day's move unfolds gradually from the open, with a little
 * minute-by-minute noise on top, so every refresh looks live while staying the same for everyone.
 */
function quoteInstrument(i: Instrument, ts: number): Quote {
  if (i.trend === 'flat') return { name: i.name, value: fmtValue(i, i.base), change: i.note ?? 'unch.', dir: 'flat' }
  const day = dayKey(ts)
  const minute = minuteOfDay(ts)
  const r = rng(hash(day + i.name))
  const level = i.base * (1 + (r() - 0.5) * i.vol * 4) // yesterday's close
  let move = (r() - 0.45) * 2 * i.vol // where today is heading
  if (i.trend === 'up') move = Math.abs(move) + 0.001
  const progress = Math.min(1, minute / 1440)
  const n = rng(hash(`${day}${i.name}${minute}`))
  let noise = (n() - 0.5) * i.vol * 0.25
  if (i.trend === 'up') noise = Math.abs(noise) * 0.2
  const pct = (move * (0.15 + 0.85 * progress) + noise) * 100
  const sign = pct >= 0 ? '+' : '−'
  return {
    name: i.name,
    value: fmtValue(i, level * (1 + pct / 100)),
    change: i.note ?? `${sign}${Math.abs(pct).toFixed(2)}%`,
    dir: pct >= 0 ? 'up' : 'down',
  }
}

/**
 * Incidents happen at random minutes (about one per average gap, and never more than `maxGap` apart).
 * Each minute is decided by a hash, so the timer counts up between refreshes and resets when one hits.
 */
function quoteIncident(i: Incident, ts: number): Quote {
  const nowMin = Math.floor(ts / 60)
  const p = 2 / (i.minGap + i.maxGap)
  const hit = (m: number) => m % i.maxGap === 0 || rng(hash(`${i.name}:${m}`))() < p
  let last = nowMin
  while (!hit(last)) last--
  const ago = nowMin - last
  const value = ago < 1 ? 'just now' : ago < 60 ? `${ago} min` : `${Math.floor(ago / 60)} hr ${ago % 60} min`
  return { name: i.name, value, change: i.detail(rng(hash(`${i.name}#${last}`))), dir: 'alert' }
}

export function quotes(ts: number): Quote[] {
  return MARKETS.map((i) => ('minGap' in i ? quoteIncident(i, ts) : quoteInstrument(i, ts)))
}

/** Four "By the numbers" items, rotating daily. */
export function todaysNumbers(ts: number, count = 4) {
  const r = rng(hash('numbers' + dayKey(ts)))
  const pool = [...NUMBERS]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j]!, pool[i]!]
  }
  return pool.slice(0, count)
}
