import { describe, expect, test } from 'bun:test'
import { type AnchorRow, fibonacciBucket, formatAnchors, nearestAnchors, parseAnchors, weightedHours } from '../skills/card-refine/scripts/anchor'
import { tempFile } from './helpers'

const ANCHOR = 'skills/card-refine/scripts/anchor.ts'

const FIRST_TABLE = `# Anchors

| subtask | repo | hours | card |
|---|---|---|---|
| search box by name + phone with filters and CSV passthrough | klangtech-army | 3 | 14znf2futr8 |
| agent list page + sidebar entry | klangtech-army | 5 | 86d4cxz32 |
| Kood Queue shop-wide page + menu + query | klangtech-army | 8 | 14znf2fuv78 |
| cancel / resend model steps + buttons | klangtech-army | 5 | 14znf2fuv78 |
| api hook: re-prepare message + quota on resend / cancel | api | 3 | 14znf2fuv78 |
| button rename + price line + date strip + tooltip | klangtech-army | 5 | 14znf2futry |
| two company-scoped date reads for Army | api | 3 | 14znf2futry |
`

const SECOND_TABLE = `## Sprint 16–17 actuals

| system | kind | card | id | estimated h | tracked h |
|---|---|---|---|---|---|
| Army | bug | [Army] Bug เริ่มเข้าหน้าตั้งค่า | 86d4cd3gc | 2 | 0.3 |
| HerMEZ | feature/CR | [Hermez] S01755 extension มีปัญหา | 86d4cmq91 | — | 0 |
| MoniHuman | feature/CR | [Moni-Human] แก้ UI ตาม feedback | 86d449vw6 | 3 | — |
| หมอดู | bug | [หมอดู-BUG] Seers : ข้อความติดตาม | 86d4bz19a | 2 | — |
| MoNi | bug | [MONI] ออเดอร์ที่ปิดโดย AI DETECT | 86d4cxmt4 | — | 6 |
| VAYU | bug | [Vayu] แกะรูปผิด | 86d4c52my | — | — |
`

describe('parseAnchors', () => {
  test('the first table reads subtask, repo, hours and card', () => {
    expect(parseAnchors(FIRST_TABLE)[0]).toEqual({ label: 'search box by name + phone with filters and CSV passthrough', repo: 'klangtech-army', hours: 3, source: '14znf2futr8' })
    expect(parseAnchors(FIRST_TABLE)).toHaveLength(7)
  })

  test('the second table takes tracked hours over estimated, falls back on —, and skips rows with neither', () => {
    expect(parseAnchors(SECOND_TABLE).map((row) => [row.source, row.repo, row.hours])).toEqual([
      ['86d4cd3gc', 'Army', 0.3],
      ['86d4cmq91', 'HerMEZ', 0],
      ['86d449vw6', 'MoniHuman', 3],
      ['86d4bz19a', 'หมอดู', 2],
      ['86d4cxmt4', 'MoNi', 6],
    ])
  })
})

describe('nearestAnchors', () => {
  test('the Thai search-box title ranks the search box row first (all scores tie at 0; hours asc then file order decide)', () => {
    const rows = nearestAnchors(parseAnchors(FIRST_TABLE), 'ช่องค้นหาตามชื่อลูกค้าและเบอร์โทร')
    expect(rows[0]!.label).toBe('search box by name + phone with filters and CSV passthrough')
  })

  test('shared English words rank the closest label first', () => {
    const rows = nearestAnchors(parseAnchors(FIRST_TABLE), 'search box by phone')
    expect(rows[0]!.source).toBe('14znf2futr8')
    expect(rows[0]!.score).toBeGreaterThan(rows[1]!.score)
  })

  test('Thai trigrams match inside unspaced Thai text', () => {
    const rows = nearestAnchors(parseAnchors(SECOND_TABLE), 'หน้าตั้งค่าใหม่')
    expect(rows[0]!.source).toBe('86d4cd3gc')
    expect(rows[0]!.score).toBeGreaterThan(0)
  })

  test('the --repo bonus reorders two equal-score rows', () => {
    const rows: AnchorRow[] = [
      { label: 'export button', repo: 'api', hours: 2, source: 'a' },
      { label: 'export button', repo: 'klangtech-army', hours: 3, source: 'b' },
    ]
    expect(nearestAnchors(rows, 'export button').map((row) => row.source)).toEqual(['a', 'b'])
    expect(nearestAnchors(rows, 'export button', 'KLANGTECH-ARMY').map((row) => row.source)).toEqual(['b', 'a'])
  })

  test('top limits the rows returned', () => {
    expect(nearestAnchors(parseAnchors(FIRST_TABLE), 'page', undefined, 2)).toHaveLength(2)
  })
})

describe('fibonacciBucket', () => {
  test('picks the nearest of 1/2/3/5/8/13/21, ties go down', () => {
    expect(fibonacciBucket(4.2)).toBe(5)
    expect(fibonacciBucket(2.4)).toBe(2)
    expect(fibonacciBucket(0.3)).toBe(1)
    expect(fibonacciBucket(10)).toBe(8)
    expect(fibonacciBucket(4)).toBe(3)
    expect(fibonacciBucket(40)).toBe(21)
  })

  test('the bucket comes from the score-weighted hours of the top 3 rows', () => {
    const rows = [
      { label: 'a', repo: 'api', hours: 8, source: 'a', score: 0.6 },
      { label: 'b', repo: 'api', hours: 2, source: 'b', score: 0.2 },
      { label: 'c', repo: 'api', hours: 2, source: 'c', score: 0.2 },
      { label: 'd', repo: 'api', hours: 21, source: 'd', score: 0.1 },
    ]
    expect(weightedHours(rows)).toBeCloseTo(5.6)
    expect(formatAnchors(rows).split('\n').at(-1)).toBe('bucket: 5')
  })
})

describe('CLI', () => {
  test('prints the table and a bucket', () => {
    const run = Bun.spawnSync(['bun', ANCHOR, '--anchors', tempFile('anchors.md', FIRST_TABLE), '--title', 'search box by name and phone', '--repo', 'klangtech-army', '--top', '3'])
    const output = run.stdout.toString()
    expect(run.exitCode).toBe(0)
    expect(output).toContain('| score | label | repo | hours | source |')
    expect(output).toContain('14znf2futr8')
    expect(output.trim().split('\n').at(-1)).toMatch(/^bucket: \d+$/)
  })

  test('no row above 0 prints no anchor and exits 0', () => {
    const run = Bun.spawnSync(['bun', ANCHOR, '--anchors', tempFile('anchors.md', FIRST_TABLE), '--title', 'ช่องค้นหา'])
    expect(run.exitCode).toBe(0)
    expect(run.stdout.toString()).toBe('no anchor\nbucket: none\n')
  })
})
