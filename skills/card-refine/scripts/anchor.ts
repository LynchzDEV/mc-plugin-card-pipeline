#!/usr/bin/env bun
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

export interface AnchorRow {
  label: string
  repo: string
  hours: number
  source: string
}

export interface ScoredRow extends AnchorRow {
  score: number
}

export const BUCKETS = [1, 2, 3, 5, 8, 13, 21]
const REPO_BONUS = 0.1
const BUCKET_SAMPLE = 3

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
}

function toHours(text: string | undefined): number | null {
  return text !== undefined && /^\d+(?:\.\d+)?$/.test(text) ? Number(text) : null
}

function toRow(header: string[], values: string[]): AnchorRow | null {
  const cell = (name: string) => values[header.indexOf(name)]
  if (header.includes('subtask')) {
    const hours = toHours(cell('hours'))
    return hours === null ? null : { label: cell('subtask')!, repo: cell('repo')!, hours, source: cell('card')! }
  }
  const hours = toHours(cell('tracked h')) ?? toHours(cell('estimated h'))
  return hours === null ? null : { label: cell('card')!, repo: cell('system')!, hours, source: cell('id')! }
}

export function parseAnchors(markdown: string): AnchorRow[] {
  const rows: AnchorRow[] = []
  let header: string[] | null = null
  for (const line of markdown.split('\n')) {
    if (!line.trim().startsWith('|')) header = null
    else if (!header) header = cells(line)
    else if (!/^\|[\s|:-]+\|$/.test(line.trim())) {
      const row = toRow(header, cells(line))
      if (row) rows.push(row)
    }
  }
  return rows
}

export function tokens(text: string): Set<string> {
  const lower = text.toLowerCase()
  const words = lower.split(/[\s\p{P}\p{S}]+/u).filter(Boolean)
  const grams = (lower.match(/[฀-๿]+/g) ?? []).flatMap((run) => Array.from({ length: Math.max(run.length - 2, 0) }, (_, index) => run.slice(index, index + 3)))
  return new Set([...words, ...grams])
}

function jaccard(left: Set<string>, right: Set<string>): number {
  const shared = [...left].filter((token) => right.has(token)).length
  const union = new Set([...left, ...right]).size
  return union ? shared / union : 0
}

export function nearestAnchors(rows: AnchorRow[], title: string, repo?: string, top = 5): ScoredRow[] {
  const wanted = tokens(title)
  return rows
    .map((row, index) => ({ row: { ...row, score: jaccard(wanted, tokens(row.label)) + (repo && row.repo.toLowerCase() === repo.toLowerCase() ? REPO_BONUS : 0) }, index }))
    .sort((a, b) => b.row.score - a.row.score || a.row.hours - b.row.hours || a.index - b.index)
    .slice(0, top)
    .map(({ row }) => row)
}

export function fibonacciBucket(hours: number): number {
  return BUCKETS.reduce((best, bucket) => (Math.abs(bucket - hours) < Math.abs(best - hours) ? bucket : best))
}

export function weightedHours(rows: ScoredRow[]): number {
  const sample = rows.slice(0, BUCKET_SAMPLE)
  const weight = sample.reduce((sum, row) => sum + row.score, 0)
  if (!weight) return sample.reduce((sum, row) => sum + row.hours, 0) / (sample.length || 1)
  return sample.reduce((sum, row) => sum + row.score * row.hours, 0) / weight
}

export function formatAnchors(rows: ScoredRow[]): string {
  if (!rows.some((row) => row.score > 0)) return 'no anchor\nbucket: none'
  return [
    '| score | label | repo | hours | source |',
    '|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.score.toFixed(2)} | ${row.label} | ${row.repo} | ${row.hours} | ${row.source} |`),
    '',
    `bucket: ${fibonacciBucket(weightedHours(rows))}`,
  ].join('\n')
}

function main(): void {
  const { values } = parseArgs({ options: { anchors: { type: 'string' }, title: { type: 'string' }, repo: { type: 'string' }, top: { type: 'string', default: '5' } } })
  if (!values.anchors || !values.title) {
    process.stderr.write('usage: anchor.ts --anchors <anchors.md> --title "<subtask title or summary>" [--repo <name>] [--top 5]\n')
    process.exit(2)
  }
  const rows = nearestAnchors(parseAnchors(readFileSync(values.anchors, 'utf8')), values.title, values.repo, Number(values.top))
  process.stdout.write(`${formatAnchors(rows)}\n`)
}

if (import.meta.main) main()
