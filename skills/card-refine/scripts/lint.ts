#!/usr/bin/env bun
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

export interface Finding {
  code: string
  evidence: string
  warning?: true
}

export interface LintSubtask {
  repo: string
  title: string
  hours?: number | null
}

export interface Registry {
  repos: Array<{ name: string; assignable: boolean }>
}

export interface LintOptions {
  verdict: string
  items: number
  subItems: string[]
  subtasks?: LintSubtask[]
  registry: Registry
}

interface Layout {
  firstLine: string
  business: string[]
  dev: string[]
  hasDivider: boolean
}

interface Citation {
  numbers: string[]
  index: number
  end: number
}

export const FIBONACCI_HOURS = [1, 2, 3, 5, 8, 13]
export const MARKER = '⁣'
export const RESERVED_FIRST_LINES: Record<string, string> = {
  PASS: 'log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ',
  'NEEDS-INFO': 'log นี้ต้องการข้อมูลเพิ่มเติมครับ',
  'NEEDS-INVESTIGATION': 'log นี้ต้องตรวจสอบในระบบจริงก่อน จึงยังไม่ประมาณการจำนวนชั่วโมงครับ',
}
const ALLOWED_HEADINGS = ['สรุป', 'ต้นเหตุ', 'แผนแก้', 'แผนป้องกัน', 'คำถาม']
const DIVIDER = '\n\n---\n\n'
const FIRST_DEV_BULLET = '- Requirement นี้เป็นการทำงานที่'
const ESTIMATE_LINE = 'ประมาณการจำนวนชั่วโมง'
const FORBIDDEN_WORDS = ['ไม่ต้องพัฒนา', 'Old server', 'Domains', '[Army]', '[ระบบเดิม]']
const PATH_TOKEN = /(?:[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.[A-Za-z]{2,4})/
const TYPE_NAME = /[A-Za-z]+::[A-Za-z]+/
const GENERIC_PREVENTION_PHRASES = ['ระวังมากขึ้น', 'ทดสอบให้ละเอียด', 'ไล่เทียบทีละช่อง', 'ตรวจสอบให้ครบถ้วนก่อนส่งงาน']
const PRIORITY_QUESTION = /(เร่งด่วน|ด่วน|urgent|priority|ลำดับความสำคัญ|ก่อนหรือหลัง)/i
const THAI_PHONE = /\b0\d{8,9}\b/
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/
const MARKDOWN_LINK = /\[((?:\\\[[^\]\n]*\]|\\.|[^[\]\\\n])*)\]\(([^)\s]+)\)/g
const CARD_URL = /https:\/\/app\.clickup\.com\/t\/(?:\d+\/)?([a-z0-9]+)/
const NUMBER = String.raw`\d+(?:\.\d+)?`
const RANGE_SEPARATORS = ['–', '-', 'ถึง']
const CITATION = new RegExp(String.raw`ข้อ\s*(${NUMBER}(?:\s*(?:,|และ|–|-|ถึง)\s*${NUMBER})*)`, 'g')
const MAX_LINES = 15
const HANDOFF_PHRASES = ['ไม่ต้องทำ', 'ไปทำใน', 'ทำใน', 'อยู่ในการ์ด', 'ไปทำที่', 'ให้การ์ด', 'รวมอยู่ใน', 'ตามการ์ด', 'ไม่รวม', 'ยกไป', 'ทำที่การ์ด']
const THAI_SHARE = 0.6

export function withoutLinks(text: string): string {
  return text.replace(MARKDOWN_LINK, '').replace(/https?:\/\/\S+/g, '')
}

function plain(line: string): string {
  return line.trim().replace(/^\*\*/, '').replace(/\*\*$/, '').trim()
}

function isHeading(line: string): boolean {
  return /^\*\*[^*]+\*\*$/.test(line.trim())
}

export function firstLineClass(line: string): string {
  const text = plain(line)
  const reserved = Object.entries(RESERVED_FIRST_LINES).find(([, first]) => first === text)
  if (reserved) return reserved[0]
  return text.startsWith('log นี้') && text.endsWith('ครับ') ? 'free' : 'none'
}

export function firstLineFits(line: string, verdict: string): boolean {
  const lineClass = firstLineClass(line)
  if (lineClass === 'none') return false
  if (lineClass === 'free') return verdict === 'ASK-HUMAN' || verdict === 'STOP'
  return lineClass === verdict
}

function layout(comment: string): Layout {
  const index = comment.indexOf(DIVIDER)
  const loose = index >= 0 ? null : /\n---\n/.exec(comment)
  const cut = index >= 0 ? index : loose ? loose.index : comment.length
  const after = index >= 0 ? comment.slice(index + DIVIDER.length) : loose ? comment.slice(loose.index + loose[0].length) : ''
  const [firstLine = '', ...business] = comment.slice(0, cut).split('\n')
  return {
    firstLine,
    business: business.filter((line) => line.trim()),
    dev: after.split('\n').filter((line) => line.trim()),
    hasDivider: index >= 0,
  }
}

function headingFindings(view: Layout): Finding[] {
  const findings: Finding[] = []
  if (!/^\*\*.+ครับ\*\*$/.test(view.firstLine.trim())) {
    findings.push({ code: 'layout-first-line', evidence: `the first line must be bold and end with ครับ: '${view.firstLine}'` })
  }
  for (const line of view.business.filter(isHeading)) {
    if (!ALLOWED_HEADINGS.includes(plain(line))) findings.push({ code: 'business-heading', evidence: `heading '${line.trim()}' is not one of ${ALLOWED_HEADINGS.join(' / ')}` })
  }
  return findings
}

function questionLines(view: Layout): string[] {
  const start = view.business.findIndex((line) => isHeading(line) && plain(line) === 'คำถาม')
  if (start < 0) return []
  const rest = view.business.slice(start + 1)
  const end = rest.findIndex(isHeading)
  return (end < 0 ? rest : rest.slice(0, end)).filter((line) => line.trim().startsWith('- '))
}

function questionFindings(view: Layout): Finding[] {
  const questions = questionLines(view)
  const findings: Finding[] = questions
    .filter((line) => PRIORITY_QUESTION.test(line))
    .map((line) => ({ code: 'priority-question', evidence: `question touches priority or urgency: '${line.trim()}'` }))
  if (questions.length > 2) findings.push({ code: 'question-limit', evidence: `${questions.length} questions under คำถาม; at most 2` })
  return findings
}

function endingFindings(view: Layout): Finding[] {
  const findings: Finding[] = view.business
    .filter((line) => !isHeading(line) && !line.trim().endsWith('ครับ'))
    .map((line) => ({ code: 'krap-ending', evidence: `line does not end with ครับ: '${line.trim()}'` }))
  const lastDev = (view.dev.at(-1) ?? '').replaceAll(MARKER, '').trim()
  if (view.dev.length && !lastDev.endsWith('ครับ')) findings.push({ code: 'krap-ending', evidence: `the last dev bullet does not end with ครับ: '${lastDev}'` })
  return findings
}

function devFindings(view: Layout): Finding[] {
  if (!view.hasDivider) return [{ code: 'layout-divider', evidence: 'the --- divider needs an empty line above and below' }]
  const findings: Finding[] = view.dev
    .filter((line) => !line.startsWith('- '))
    .map((line) => ({ code: 'dev-bullets', evidence: `dev line is not a bullet: '${line.trim()}'` }))
  if (!view.dev[0]?.startsWith(FIRST_DEV_BULLET)) findings.push({ code: 'dev-bullets', evidence: `the first dev bullet must start '${FIRST_DEV_BULLET}'` })
  return findings
}

function markerFindings(comment: string): Finding[] {
  const count = comment.split(MARKER).length - 1
  if (comment.endsWith(`ครับ${MARKER}${MARKER}`) && count === 2) return []
  return [{ code: 'layout-final-marker', evidence: `the comment must end with ครับ and exactly two U+2063 characters, nothing after (found ${count})` }]
}

export function compareItems(a: string, b: string): number {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? -1) - (right[index] ?? -1)
    if (diff) return diff
  }
  return 0
}

function expandRange(from: string, to: string): string[] {
  const [fromTop, fromSub] = from.split('.').map(Number)
  const [toTop, toSub] = to.split('.').map(Number)
  if (fromSub === undefined && toSub === undefined && toTop! > fromTop!) {
    return Array.from({ length: toTop! - fromTop! + 1 }, (_, index) => String(fromTop! + index))
  }
  if (fromSub !== undefined && toSub !== undefined && fromTop === toTop && toSub > fromSub) {
    return Array.from({ length: toSub - fromSub + 1 }, (_, index) => `${fromTop}.${fromSub + index}`)
  }
  return [from, to]
}

export function citationNumbers(group: string): string[] {
  const parts = group.split(/\s*(,|และ|–|-|ถึง)\s*/)
  const numbers: string[] = [parts[0]!]
  for (let index = 1; index < parts.length; index += 2) {
    const next = parts[index + 1]!
    if (RANGE_SEPARATORS.includes(parts[index]!)) numbers.push(...expandRange(numbers.pop()!, next))
    else numbers.push(next)
  }
  return numbers
}

export function citations(line: string): Citation[] {
  return [...line.matchAll(CITATION)].map((match) => ({ numbers: citationNumbers(match[1]!), index: match.index, end: match.index + match[0].length }))
}

function droppedItems(line: string): string[] {
  const cited = citations(line)
  const dropped: string[] = []
  let clauseStart = 0
  for (const match of line.matchAll(/ไม่ต้องทำ/g)) {
    const before = line.slice(0, match.index)
    const krap = before.lastIndexOf('ครับ')
    const start = Math.max(clauseStart, krap < 0 ? 0 : krap + 'ครับ'.length, before.lastIndexOf('ส่วน'))
    const inClause = cited.filter((citation) => citation.index >= start && citation.end <= match.index)
    const after = cited.find((citation) => citation.index >= match.index)
    dropped.push(...(inClause.length ? inClause : after ? [after] : []).flatMap((citation) => citation.numbers))
    clauseStart = match.index + match[0].length
  }
  return dropped
}

function workItems(line: string): string[] {
  return citations(line)
    .filter((citation) => /\(\s*$/.test(line.slice(0, citation.index)) || line.slice(0, citation.index).endsWith('ทำ'))
    .flatMap((citation) => citation.numbers)
}

function numberedFindings(comment: string, items: number, subItems: string[]): Finding[] {
  const lines = comment.split('\n')
  const cited = new Set(lines.flatMap((line) => citations(line).flatMap((citation) => citation.numbers)))
  const findings: Finding[] = []
  for (let item = 1; item <= items; item += 1) {
    const covered = cited.has(String(item)) || [...cited].some((number) => number.startsWith(`${item}.`))
    if (!covered) findings.push({ code: 'numbered-item-missing', evidence: `ข้อ ${item} is never cited` })
  }
  for (const sub of subItems) {
    if (!cited.has(sub) && !cited.has(sub.split('.')[0]!)) findings.push({ code: 'numbered-item-missing', evidence: `ข้อ ${sub} is never cited, nor its parent` })
  }
  const dropped = new Set(lines.flatMap(droppedItems))
  const worked = new Set(lines.flatMap(workItems))
  for (const number of [...dropped].filter((item) => worked.has(item))) {
    findings.push({ code: 'numbered-item-conflict', evidence: `ข้อ ${number} is both ไม่ต้องทำ and inside a work group` })
  }
  for (const line of lines) {
    const sequence = citations(line).flatMap((citation) => citation.numbers)
    if (sequence.some((number, index) => index > 0 && compareItems(number, sequence[index - 1]!) < 0)) {
      findings.push({ code: 'numbered-item-order', evidence: `cited numbers descend inside one line: ${sequence.join(', ')}`, warning: true })
    }
  }
  return findings
}

function hoursFindings(comment: string, subtasks: LintSubtask[]): Finding[] {
  const findings: Finding[] = subtasks.flatMap((subtask): Finding[] => {
    if (subtask.hours === null || subtask.hours === undefined) {
      return [{ code: 'hours-not-fibonacci', evidence: `subtask '${subtask.title}' has no hours; every subtask is 1/2/3/5/8/13` }]
    }
    if (!FIBONACCI_HOURS.includes(subtask.hours)) {
      return [{ code: 'hours-not-fibonacci', evidence: `subtask '${subtask.title}' has ${subtask.hours}h; hours are 1/2/3/5/8/13` }]
    }
    return []
  })
  const estimate = comment.split('\n').find((line) => line.includes(ESTIMATE_LINE))
  const hours = estimate ? /(\d+(?:\.\d+)?)\s*ชั่วโมง/.exec(estimate.slice(estimate.indexOf(ESTIMATE_LINE) + ESTIMATE_LINE.length)) : null
  if (hours && !FIBONACCI_HOURS.includes(Number(hours[1]))) findings.push({ code: 'hours-not-fibonacci', evidence: `the estimate line says ${hours[1]} hours; hours are 1/2/3/5/8/13` })
  if (subtasks.length && estimate) findings.push({ code: 'parent-hours-with-slices', evidence: 'the comment carries an estimate line while hours live on the subtasks' })
  return findings
}

function repoFindings(subtasks: LintSubtask[], registry: Registry): Finding[] {
  const assignable = new Set(registry.repos.filter((repo) => repo.assignable).map((repo) => repo.name))
  return subtasks.flatMap((subtask): Finding[] => {
    if (!assignable.has(subtask.repo)) return [{ code: 'repo-not-in-registry', evidence: `repo '${subtask.repo}' is not assignable in the registry` }]
    if (subtask.title.trim().startsWith('[')) return [{ code: 'repo-not-in-registry', evidence: `title '${subtask.title}' carries its own [label]; the renderer adds [${subtask.repo}]` }]
    return []
  })
}

function wordFindings(comment: string): Finding[] {
  const text = withoutLinks(comment)
  const findings: Finding[] = FORBIDDEN_WORDS.filter((word) => text.includes(word)).map((word) => ({ code: 'forbidden-token', evidence: `'${word}'` }))
  const path = PATH_TOKEN.exec(text)
  if (path) findings.push({ code: 'forbidden-token', evidence: `file path '${path[0]}'` })
  const type = TYPE_NAME.exec(text)
  if (type) findings.push({ code: 'forbidden-token', evidence: `type name '${type[0]}'` })
  if (text.includes('แผนป้องกัน')) {
    for (const phrase of GENERIC_PREVENTION_PHRASES.filter((candidate) => text.includes(candidate))) {
      findings.push({ code: 'generic-prevention', evidence: `แผนป้องกัน is general process advice: '${phrase}'` })
    }
  }
  if (THAI_PHONE.test(text)) findings.push({ code: 'personal-data', evidence: 'a phone-number-like string' })
  if (EMAIL.test(text)) findings.push({ code: 'personal-data', evidence: 'an email address' })
  return findings
}

function linkFindings(comment: string): Finding[] {
  const counts = new Map<string, number>()
  for (const [, , url] of comment.matchAll(MARKDOWN_LINK)) {
    const card = CARD_URL.exec(url!)?.[1]
    if (card) counts.set(card, (counts.get(card) ?? 0) + 1)
  }
  const findings: Finding[] = [...counts].filter(([, count]) => count > 1).map(([card, count]) => ({ code: 'card-linked-twice', evidence: `card ${card} is linked ${count} times` }))
  if (comment.replace(MARKDOWN_LINK, '').includes('app.clickup.com/t/')) findings.push({ code: 'bare-card-url', evidence: 'a ClickUp URL outside a named link' })
  return findings
}

function siblingFindings(view: Layout): Finding[] {
  return view.business.flatMap((line): Finding[] => {
    const card = CARD_URL.exec(line)?.[1]
    const text = withoutLinks(line)
    if (!card || !HANDOFF_PHRASES.some((phrase) => text.includes(phrase))) return []
    return [{ code: 'scope-moved-to-sibling', evidence: `work handed to ${card} on line "${line.trim().slice(0, 60)}"` }]
  })
}

function thaiFindings(view: Layout): Finding[] {
  const letters = view.business.filter((line) => !isHeading(line)).join('').match(/[\p{L}\p{M}]/gu) ?? []
  const thai = letters.filter((letter) => /[฀-๿]/.test(letter)).length
  if (!letters.length || thai / letters.length >= THAI_SHARE) return []
  return [{ code: 'not-thai', evidence: `${Math.round((100 * thai) / letters.length)}% of the business letters are Thai; at least 60%` }]
}

function lengthFindings(comment: string): Finding[] {
  const lines = comment.split('\n').filter((line) => line.trim()).length
  return lines > MAX_LINES ? [{ code: 'length', evidence: `${lines} non-empty lines; aim for at most ${MAX_LINES}`, warning: true }] : []
}

const MAX_BUSINESS_LINES = 8
const MAX_BUSINESS_CHARS = 1000
const MAX_LINE_CHARS = 360
const BARE_NOT_NEEDED = /^\s*(?:ข้อ\s*[\d.,\s]+(?:และ\s*[\d.]+\s*)?)?ไม่ต้องทำ\s*(?:ครับ)?\s*$/u

function businessLengthFindings(view: Layout): Finding[] {
  const lines = view.business.filter((line) => line.trim())
  const chars = lines.join('\n').length
  const findings: Finding[] = []
  if (lines.length > MAX_BUSINESS_LINES || chars > MAX_BUSINESS_CHARS) findings.push({ code: 'business-too-long', evidence: `${lines.length} lines / ${chars} characters in the business block; at most ${MAX_BUSINESS_LINES} lines and ${MAX_BUSINESS_CHARS} characters` })
  for (const line of lines) if (line.length > MAX_LINE_CHARS) findings.push({ code: 'line-too-long', evidence: `${line.length} characters on line "${line.trim().slice(0, 40)}…"; at most ${MAX_LINE_CHARS}` })
  for (const line of lines) if (BARE_NOT_NEEDED.test(line)) findings.push({ code: 'bare-not-needed', evidence: `"${line.trim()}" says ไม่ต้องทำ without the business reason (มีอยู่แล้ว…, อยู่ใน log…, รอ Biz ยืนยัน…)` })
  return findings
}

const ONE_LINE_STOP = new RegExp(`^\\*\\*log นี้.+ครับ\\*\\*${MARKER}${MARKER}$`, 'u')

function oneLineStop(comment: string, verdict: string): Finding[] | null {
  const lines = comment.split('\n').filter((line) => line.trim())
  if (verdict !== 'STOP' || lines.length !== 1) return null
  const line = lines[0]!.trim()
  if (ONE_LINE_STOP.test(line)) return []
  return [{ code: 'layout-first-line', evidence: `a one-line STOP comment is one bold line "**log นี้…ครับ**" followed by exactly two U+2063 characters: '${line}'` }]
}

export function lintComment(comment: string, options: LintOptions): Finding[] {
  const view = layout(comment)
  const oneLine = oneLineStop(comment, options.verdict)
  if (oneLine) return [...oneLine, ...wordFindings(comment), ...linkFindings(comment), ...siblingFindings(view)]
  const subtasks = options.subtasks ?? []
  const verdict: Finding[] = firstLineFits(view.firstLine, options.verdict)
    ? []
    : [{ code: 'verdict-line', evidence: `first line '${plain(view.firstLine)}' (${firstLineClass(view.firstLine)}) does not fit the declared verdict ${options.verdict}` }]
  return [
    ...verdict,
    ...headingFindings(view),
    ...businessLengthFindings(view),
    ...questionFindings(view),
    ...endingFindings(view),
    ...devFindings(view),
    ...markerFindings(comment),
    ...numberedFindings(comment, options.items, options.subItems),
    ...repoFindings(subtasks, options.registry),
    ...hoursFindings(comment, subtasks),
    ...wordFindings(comment),
    ...linkFindings(comment),
    ...siblingFindings(view),
    ...thaiFindings(view),
    ...lengthFindings(comment),
  ]
}

export function formatFindings(findings: Finding[]): string {
  const lines = findings.map((finding) => `${finding.warning ? 'warn ' : ''}${finding.code}: ${finding.evidence}`)
  return [...lines, ...(findings.some((finding) => !finding.warning) ? [] : ['clean'])].join('\n')
}

export function readComment(path: string): string {
  return readFileSync(path, 'utf8').replace(/\n+$/, '')
}

export function readRegistry(path = join(import.meta.dir, 'repo-registry.json')): Registry {
  return JSON.parse(readFileSync(path, 'utf8')) as Registry
}

function main(): void {
  const { values } = parseArgs({
    options: {
      comment: { type: 'string' },
      verdict: { type: 'string' },
      items: { type: 'string', default: '0' },
      subitems: { type: 'string' },
      subtasks: { type: 'string' },
      registry: { type: 'string' },
    },
  })
  if (!values.comment || !values.verdict) {
    process.stderr.write('usage: lint.ts --comment <comment.md> --verdict <declared> --items <n> [--subitems 3.1,3.2] [--subtasks <subtasks.json>] [--registry <repo-registry.json>]\n')
    process.exit(2)
  }
  const findings = lintComment(readComment(values.comment), {
    verdict: values.verdict,
    items: Number(values.items),
    subItems: values.subitems ? values.subitems.split(',').map((item) => item.trim()).filter(Boolean) : [],
    subtasks: values.subtasks ? (JSON.parse(readFileSync(values.subtasks, 'utf8')) as LintSubtask[]) : undefined,
    registry: readRegistry(values.registry),
  })
  process.stdout.write(`${formatFindings(findings)}\n`)
  process.exit(findings.some((finding) => !finding.warning) ? 1 : 0)
}

if (import.meta.main) main()
