// Places furniture (dateline, inline modules) into rendered article HTML at top-level paragraph boundaries.

const BLOCK = /<(\/?)(div|blockquote|ol|ul|figure|section|aside|table|pre|details)\b[^>]*>/gi

/** Character offsets just after each top-level `</p>`, i.e. paragraphs not nested in another block. */
function paragraphEnds(html: string): number[] {
  const ends: number[] = []
  const re = new RegExp(`${BLOCK.source}|</p>`, 'gi')
  let depth = 0
  for (let m: RegExpExecArray | null; (m = re.exec(html)); ) {
    if (m[0].toLowerCase() === '</p>') {
      if (depth === 0) ends.push(m.index + 4)
    } else depth += m[1] ? -1 : 1
  }
  return ends
}

/**
 * Inserts each module after the given paragraph number (1-based), only when the next block is also a
 * paragraph, so modules never sit under a heading or right before an embed.
 */
export function insertAfterParagraphs(html: string, modules: { after: number; html: string }[]): string {
  const ends = paragraphEnds(html)
  const spots: { at: number; html: string }[] = []
  for (const mod of modules) {
    for (let i = mod.after - 1; i < ends.length - 1; i++) {
      const at = ends[i]!
      if (/^\s*<p>/.test(html.slice(at, at + 12)) && !spots.some((s) => s.at === at)) {
        spots.push({ at, html: mod.html })
        break
      }
    }
  }
  spots.sort((a, b) => b.at - a.at)
  for (const s of spots) html = html.slice(0, s.at) + '\n' + s.html + html.slice(s.at)
  return html
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "SAN FRANCISCO — " at the start of the first paragraph. */
export function withDateline(html: string, dateline: string): string {
  if (!dateline || !/^\s*<p>/.test(html)) return html
  return html.replace(/^\s*<p>/, `<p><span class="dateline">${esc(dateline)} —</span> `)
}
