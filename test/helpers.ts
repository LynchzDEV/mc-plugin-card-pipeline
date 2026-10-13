import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const CARDS = ['14znf2fuv78', '14znf2futr8', '14znf2futry', '14znf2futhy'] as const

export interface KeySubtask {
  repo: string
  title: string
  items: string[]
  hours: number | null
}

export interface Key {
  path: string
  card: string
  verdict: string
  numberedItems: number
  subItems: string[]
  estimate: number | 'none'
  subtasks: KeySubtask[]
  sprint: string
  comment: string
}

export function readKeyFixture(card: string): Key {
  const path = `test/fixtures/keys/${card}.md`
  const text = readFileSync(path, 'utf8')
  const [, frontmatter] = /^---\n([\s\S]*?)\n---\n/.exec(text)!
  const meta = Bun.YAML.parse(frontmatter!) as Omit<Key, 'path' | 'comment'>
  const comment = text.slice(text.indexOf('## Comment\n') + 11, text.indexOf('\n## Key facts')).replace(/\n+$/, '')
  return { ...meta, subItems: meta.subItems ?? [], path, comment }
}

export function tempFile(name: string, content: string): string {
  const path = join(mkdtempSync(join(tmpdir(), 'card-refine-')), name)
  writeFileSync(path, content)
  return path
}

export function subtaskLine(subtask: KeySubtask, sprint: string): string {
  return `- [${subtask.repo}] ${subtask.title} — ${subtask.title} — ${subtask.hours ?? 'null'} hours — ${sprint}`
}

export function packageFromKey(key: Key, edits: { verdict?: string; comment?: string; subtasks?: KeySubtask[] } = {}): string {
  const subtasks = edits.subtasks ?? key.subtasks
  return [
    `VERDICT: ${edits.verdict ?? key.verdict}`,
    'CONFIDENCE: HIGH',
    'CHECKS: A yes — card | B yes — code | C yes — screens',
    'RULES: none',
    `PROJECT: ${[...new Set(subtasks.map((subtask) => subtask.repo))].join(', ') || 'klangtech-army'}`,
    'SYSTEM: Army',
    `SPRINT: ${key.sprint}`,
    `ESTIMATE: ${subtasks.length ? 'none' : key.estimate}`,
    'COMMENT:',
    edits.comment ?? key.comment,
    'SUBTASKS:',
    subtasks.length ? subtasks.map((subtask) => subtaskLine(subtask, key.sprint)).join('\n') : 'none',
    'REPORT (for the caller, English):',
    'Built from the answer key.',
    'PROD-QUESTIONS:',
    'none',
    'LINT:',
    'clean',
    '',
  ].join('\n')
}
