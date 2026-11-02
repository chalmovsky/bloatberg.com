import { sectionName } from '../../../config'
import type { Story } from '../../../db/articles'
import { articlePath } from '../../../db/articles'
import type { Author } from '../../../db/authors'
import type { TopRow } from '../../../db/views'
import { shortDate } from '../../../lib/dates'
import { AdminLayout } from '../../AdminLayout'

export const RANGES = [7, 30, 90] as const
export type Range = (typeof RANGES)[number]

const fmt = (n: number) => n.toLocaleString('en-US')
const AP = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.']
/** "2026-11-01" -> "Nov. 1" */
const dayLabel = (d: string) => `${AP[Number(d.slice(5, 7)) - 1]} ${Number(d.slice(8, 10))}`

export interface Kpis {
  today: number
  yesterday: number
  range: number
  prevRange: number
  allTime: number
}

interface Daily { day: string; views: number }
interface Source { source: string; views: number }

// ---------- Pieces ----------

function Delta({ now, before, label }: { now: number; before: number; label: string }) {
  if (before === 0) return <p class="kpi-delta">{now > 0 ? `New vs ${label}` : `— vs ${label}`}</p>
  const pct = Math.round(((now - before) / before) * 100)
  const dir = pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat'
  return (
    <p class={`kpi-delta kpi-${dir}`}>
      <span aria-hidden="true">{dir === 'up' ? '▲' : dir === 'down' ? '▼' : '■'}</span> {pct > 0 ? '+' : ''}{pct}% vs {label}
    </p>
  )
}

function KpiRow({ k, range, top }: { k: Kpis; range: Range; top?: Source }) {
  const total = k.range
  return (
    <div class="kpis">
      <div class="kpi">
        <p class="kpi-label">Today so far</p>
        <p class="kpi-value">{fmt(k.today)}</p>
        <Delta now={k.today} before={k.yesterday} label="all of yesterday" />
      </div>
      <div class="kpi">
        <p class="kpi-label">Last {range} days</p>
        <p class="kpi-value">{fmt(k.range)}</p>
        <Delta now={k.range} before={k.prevRange} label={`previous ${range}`} />
      </div>
      <div class="kpi">
        <p class="kpi-label">All time</p>
        <p class="kpi-value">{fmt(k.allTime)}</p>
        <p class="kpi-delta">Since counting began</p>
      </div>
      <div class="kpi">
        <p class="kpi-label">Top source, {range} days</p>
        <p class="kpi-value kpi-value-text">{top ? top.source : '—'}</p>
        <p class="kpi-delta">{top && total ? `${Math.round((top.views / total) * 100)}% of views` : 'No views yet'}</p>
      </div>
    </div>
  )
}

/** Round up to a 1/2/5 × 10ⁿ number so gridlines land on clean values. */
function niceMax(v: number) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  return ([1, 2, 2.5, 5, 10].find((m) => m * p >= v) ?? 10) * p
}

/** Daily views as columns. Single series, so no legend; the title names it. Hover/focus a column for its value. */
function ColumnChart({ daily, title }: { daily: Daily[]; title: string }) {
  const max = niceMax(Math.max(...daily.map((d) => d.views)))
  const ticks = [max, max / 2, 0]
  const last = daily.length - 1
  const step = daily.length > 45 ? 14 : daily.length > 14 ? 7 : 1
  const peak = daily.reduce((a, b) => (b.views > a.views ? b : a), daily[0]!)
  return (
    <figure class="chart">
      <figcaption class="chart-head">
        <span class="chart-title">{title}</span>
        {peak.views > 0 && <span class="chart-note">Peak: {fmt(peak.views)} on {dayLabel(peak.day)}</span>}
      </figcaption>
      <div class="chart-plot" style={`--n:${daily.length}`} role="img" aria-label={`${title}. ${daily.map((d) => `${dayLabel(d.day)}: ${d.views}`).join('; ')}`}>
        <div class="chart-grid" aria-hidden="true">
          {ticks.map((t) => (
            <div class="chart-gl"><span>{fmt(t)}</span></div>
          ))}
        </div>
        <div class="chart-cols">
          {daily.map((d, i) => (
            <div class={`col${i === last ? ' col-today' : ''}`} data-tip={`${dayLabel(d.day)}${i === last ? ' (so far)' : ''}: ${fmt(d.views)} ${d.views === 1 ? 'view' : 'views'}`}>
              <span class="col-bar" style={`height:${(d.views / max) * 100}%`}></span>
            </div>
          ))}
        </div>
        <div class="chart-x" aria-hidden="true">
          {daily.map((d, i) => (
            <span>{i === last ? 'Today' : (last - i) % step === 0 && last - i >= step / 2 ? dayLabel(d.day) : ''}</span>
          ))}
        </div>
      </div>
      <details class="chart-table">
        <summary>Show as table</summary>
        <table class="admin-table">
          <thead><tr><th>Day</th><th class="num">Views</th></tr></thead>
          <tbody>
            {[...daily].reverse().map((d) => (
              <tr><td>{dayLabel(d.day)}, {d.day.slice(0, 4)}</td><td class="num">{fmt(d.views)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/** 14-day sparkline: de-emphasized line, today's point in the chart color. */
function Sparkline({ values }: { values: number[] }) {
  const w = 112, h = 28, pad = 3
  const max = Math.max(1, ...values)
  const x = (i: number) => pad + (i * (w - pad * 2)) / (values.length - 1)
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const li = values.length - 1
  return (
    <svg class="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img"
      aria-label={`Last ${values.length} days: ${values.join(', ')}`}>
      <polyline points={pts} fill="none" />
      <circle cx={x(li)} cy={y(values[li]!)} r="3" />
    </svg>
  )
}

function SourceBars({ sources, total }: { sources: Source[]; total: number }) {
  if (!sources.length) return <p class="muted">No views yet.</p>
  const max = sources[0]!.views
  return (
    <ol class="sources">
      {sources.map((s) => (
        <li data-tip={`${s.source}: ${fmt(s.views)} views (${total ? Math.round((s.views / total) * 100) : 0}%)`}>
          <span class="src-name">{s.source}</span>
          <span class="src-track"><span class="src-bar" style={`width:${(s.views / max) * 100}%`}></span></span>
          <span class="src-val">{fmt(s.views)}</span>
        </li>
      ))}
    </ol>
  )
}

function RangeTabs({ range, base }: { range: Range; base: string }) {
  return (
    <nav class="range-tabs" aria-label="Date range">
      {RANGES.map((r) => (
        <a href={`${base}?range=${r}`} class={r === range ? 'active' : undefined} aria-current={r === range ? 'true' : undefined}>
          {r} days
        </a>
      ))}
    </nav>
  )
}

// ---------- Pages ----------

export function StatsOverview(p: {
  author: Author
  range: Range
  kpis: Kpis
  daily: Daily[]
  top: (TopRow & { series: number[] })[]
  sources: Source[]
  /** Front-page visits: where people arrive before clicking into stories. */
  home: { today: number; range: number; sources: Source[] }
}) {
  return (
    <AdminLayout title="Stats" author={p.author} active="stats">
      <div class="admin-head">
        <div>
          <h1>Stats</h1>
          <p class="admin-sub">Anonymous article views and front page visits. Bots, link previews and signed-in editors are not counted.</p>
        </div>
        <div class="stats-actions">
          <RangeTabs range={p.range} base="/admin/stats" />
          <a class="btn btn-secondary" href={`/admin/stats.csv?range=${p.range}`}>Download CSV</a>
        </div>
      </div>
      <KpiRow k={p.kpis} range={p.range} top={p.sources[0]} />
      <div class="stats-grid">
        <section class="panel">
          <ColumnChart daily={p.daily} title={`Views per day, last ${p.range} days`} />
        </section>
        <section class="panel">
          <h2 class="panel-h">Where readers came from</h2>
          <SourceBars sources={p.sources} total={p.kpis.range} />
        </section>
      </div>
      <section class="panel">
        <h2 class="panel-h">Front page visits</h2>
        <p class="muted stats-home-k">
          <strong>{fmt(p.home.today)}</strong> today · <strong>{fmt(p.home.range)}</strong> in the last {p.range} days
        </p>
        {p.home.sources.length === 0 ? (
          <p class="muted">No front page visits counted yet.</p>
        ) : (
          <SourceBars sources={p.home.sources} total={p.home.range} />
        )}
      </section>
      <section class="panel">
        <h2 class="panel-h">Top articles, last {p.range} days</h2>
        {p.top.length === 0 ? (
          <p class="muted">No views in this period yet.</p>
        ) : (
          <div class="table-wrap table-flat">
            <table class="admin-table">
              <thead>
                <tr>
                  <th class="num">#</th>
                  <th>Headline</th>
                  <th>Section</th>
                  <th class="num">Views</th>
                  <th class="num">Share</th>
                  <th>Last 14 days</th>
                </tr>
              </thead>
              <tbody>
                {p.top.map((a, i) => (
                  <tr>
                    <td class="num muted">{i + 1}</td>
                    <td class="col-title">
                      <a href={`/admin/stats/${a.id}?range=${p.range}`}>{a.title}</a>
                      <span class="muted stats-meta">{a.author_name}{a.published_at ? ` · ${shortDate(a.published_at)}` : ''}</span>
                    </td>
                    <td>{sectionName(a.section)}</td>
                    <td class="num">{fmt(a.views)}</td>
                    <td class="num muted">{p.kpis.range ? `${Math.round((a.views / p.kpis.range) * 100)}%` : '—'}</td>
                    <td><Sparkline values={a.series} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminLayout>
  )
}

export function StatsArticle(p: { author: Author; article: Story; range: Range; kpis: Kpis; daily: Daily[]; sources: Source[] }) {
  const a = p.article
  return (
    <AdminLayout title={`Stats: ${a.title}`} author={p.author} active="stats">
      <p class="crumbs"><a href={`/admin/stats?range=${p.range}`}>← All stats</a></p>
      <div class="admin-head">
        <div>
          <h1 class="stats-title">{a.title}</h1>
          <p class="admin-sub">
            {a.author_name} · {sectionName(a.section)}
            {a.published_at && <> · Published {shortDate(a.published_at)} · <a href={articlePath(a)} target="_blank">View article</a></>}
            {' · '}<a href={`/admin/edit/${a.id}`}>Edit</a>
          </p>
        </div>
        <RangeTabs range={p.range} base={`/admin/stats/${a.id}`} />
      </div>
      <KpiRow k={p.kpis} range={p.range} top={p.sources[0]} />
      <div class="stats-grid">
        <section class="panel">
          <ColumnChart daily={p.daily} title={`Views per day, last ${p.range} days`} />
        </section>
        <section class="panel">
          <h2 class="panel-h">Where readers came from</h2>
          <SourceBars sources={p.sources} total={p.kpis.range} />
        </section>
      </div>
    </AdminLayout>
  )
}
