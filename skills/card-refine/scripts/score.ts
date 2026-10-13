#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { FIBONACCI_HOURS, type Registry, citations, firstLineFits, lintComment, readRegistry } from './lint'

interface DraftSubtask {
  repo: string
  title: string
  hours: number | null
  sprint: string
  items: string[]
}

interface Pack {
  verdict: string
  checks: string
  estimate: number | null
  comment: string
  subtasks: DraftSubtask[]
  malformedSubtasks: string[]
  text: string
}

interface KeySubtask {
  repo: string
  title: string
  items: string[]
  hours: number | null
}

interface ScoreKey {
  verdict: string
  numberedItems: number
  subItems: string[]
  estimate: number | null
  subtasks: KeySubtask[]
  comment: string
  facts: string[]
}

interface CardFields {
  numberedItems: number
  subItems: string[]
  latestAiSprint: string | null
}

interface HardFail {
  code: string
  evidence: string
}

interface JudgeItem {
  id: string
  text: string
}

interface Verdict {
  id: string
  verdict: string
  evidence?: string
}

interface JudgeAnswer {
  items: Verdict[]
  claims: Verdict[]
  hardFails: HardFail[]
  anchor: { row: number | null }
}

interface Dimensions {
  verdict: number | null
  facts: number | null
  coverage: number | null
  subtasks: number | null
  precision: number | null
  estimate: number | null
}

interface Parts {
  count: number
  repos: number
  intent: number | null
}

interface Mechanical {
  dimensions: Dimensions
  parts: Parts
  hardFails: HardFail[]
  empty: string[]
}

interface Judged {
  dimensions: Partial<Dimensions>
  intent: number | null
  hardFails: HardFail[]
  unknowns: string[]
  empty: string[]
  runs: number
}

interface Weights {
  facts: number
  coverage: number | null
  estimate: number | null
}

const LABELS = ['VERDICT', 'CONFIDENCE', 'CHECKS', 'RULES', 'PROJECT', 'SYSTEM', 'SPRINT', 'ESTIMATE', 'COMMENT', 'SUBTASKS', 'REPORT (for the caller, English)', 'PROD-QUESTIONS', 'LINT']
const SUBTASK_LINE = /^- \[([^\]]+)\] (.+?) — (.*) — (\S+) hours — (.+)$/
const NUMBER = /^\d+(?:\.\d+)?/
const BUCKETS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]
const JUDGE_HARD_FAILS = ['fabricated-value', 'dropped-item', 'question-answerable', 'priority-question', 'scope-dropped', 'wrong-repo']
const SEEDS = [1, 2]

export function parsePackage(text: string): Pack {
  const sections = new Map<string, string[]>()
  let current: string[] | null = null
  for (const line of text.split('\n')) {
    const label = LABELS.find((candidate) => line.startsWith(`${candidate}:`))
    if (label) {
      current = [line.slice(label.length + 1).trim()].filter(Boolean)
      sections.set(label, current)
    } else current?.push(line)
  }
  const section = (label: string) => (sections.get(label) ?? []).join('\n').replace(/^\n+|\n+$/g, '')
  const estimate = NUMBER.exec(section('ESTIMATE').trim())?.[0]
  const subtaskLines = section('SUBTASKS').split('\n').map((line) => line.trim()).filter((line) => line && line !== 'none')
  const matches = subtaskLines.map((line) => SUBTASK_LINE.exec(line))
  return {
    verdict: section('VERDICT').trim(),
    checks: section('CHECKS'),
    estimate: estimate === undefined ? null : Number(estimate),
    comment: section('COMMENT'),
    subtasks: matches.filter((match) => match !== null).map((match) => ({
      repo: match[1]!,
      title: match[2]!,
      hours: new RegExp(`${NUMBER.source}$`).test(match[4]!) ? Number(match[4]) : null,
      sprint: match[5]!.trim(),
      items: [],
    })),
    malformedSubtasks: subtaskLines.filter((_, index) => matches[index] === null),
    text,
  }
}

export function readKey(path: string): ScoreKey {
  const text = readFileSync(path, 'utf8')
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  const meta = Bun.YAML.parse(frontmatter) as Partial<ScoreKey> & { estimate?: unknown }
  const factsStart = text.indexOf('## Key facts')
  return {
    verdict: String(meta.verdict),
    ownerFacts: typeof (meta as { ownerFacts?: unknown }).ownerFacts === 'string' ? String((meta as { ownerFacts?: unknown }).ownerFacts) : null,
    numberedItems: Number(meta.numberedItems ?? 0),
    subItems: (meta.subItems ?? []).map(String),
    estimate: typeof meta.estimate === 'number' ? meta.estimate : null,
    subtasks: (meta.subtasks ?? []).map((subtask) => ({ ...subtask, items: (subtask.items ?? []).map(String) })),
    comment: text.slice(text.indexOf('## Comment\n') + 11, factsStart < 0 ? undefined : factsStart).replace(/\n+$/, ''),
    facts: factsStart < 0 ? [] : text.slice(factsStart).split('\n').filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim()),
  }
}

function readFields(cardDir: string): CardFields | null {
  const path = join(cardDir, 'fields.json')
  if (!existsSync(path)) return null
  const fields = JSON.parse(readFileSync(path, 'utf8'))
  return { numberedItems: fields.numberedItems ?? 0, subItems: fields.subItems ?? [], latestAiSprint: fields.planning?.latestAiSprint?.label ?? null }
}

function withPlannedItems(subtasks: DraftSubtask[], cardDir: string): DraftSubtask[] {
  const path = join(cardDir, 'subtasks.json')
  const planned = existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Array<{ items?: string[] }>) : []
  return subtasks.map((subtask, index) => ({ ...subtask, items: (planned[index]?.items ?? []).map(String) }))
}

export function itemTokens(title: string, items: string[] = []): string[] {
  const cited = citations(title).flatMap((citation) => citation.numbers)
  return [...new Set([...cited, ...items])].toSorted()
}

function sameMultiset(left: string[], right: string[]): boolean {
  return JSON.stringify(left.toSorted()) === JSON.stringify(right.toSorted())
}

function bucket(hours: number): number {
  return BUCKETS.reduce((best, value, index) => (Math.abs(value - hours) < Math.abs(BUCKETS[best]! - hours) ? index : best), 0)
}

function bucketPoints(draft: number | null, reference: number): number {
  if (draft === null) return 0
  const distance = Math.abs(bucket(draft) - bucket(reference))
  return distance <= 1 ? 10 : distance === 2 ? 5 : 0
}

function totalHours(subtasks: Array<{ hours: number | null }>, estimate: number | null): number | null {
  if (!subtasks.length) return estimate
  const hours = subtasks.map((subtask) => subtask.hours).filter((value): value is number => value !== null)
  return hours.length ? hours.reduce((sum, value) => sum + value, 0) : null
}

function nonEmptyLines(text: string): number {
  return text.split('\n').filter((line) => line.trim()).length
}

function lintHardFails(pack: Pack, items: number, subItems: string[], registry: Registry): HardFail[] {
  const findings = lintComment(pack.comment, { verdict: pack.verdict, items, subItems, subtasks: pack.subtasks, registry }).filter((finding) => !finding.warning)
  return findings.length ? [{ code: 'lint', evidence: findings.map((finding) => `${finding.code}: ${finding.evidence}`).join('; ') }] : []
}

function subtaskShape(pack: Pack): HardFail[] {
  return pack.malformedSubtasks.map((line) => ({ code: 'subtask-unparseable', evidence: `'${line}' is not '- [<repo>] <title> — <line> — <hours> hours — <sprint>'` }))
}

function verdictConsistency(pack: Pack): HardFail[] {
  const firstLine = pack.comment.split('\n')[0] ?? ''
  return firstLineFits(firstLine, pack.verdict) ? [] : [{ code: 'verdict-inconsistent', evidence: `first line '${firstLine}' does not fit VERDICT ${pack.verdict}` }]
}

function keyWeights(key: ScoreKey): Weights {
  const hasHours = totalHours(key.subtasks, key.estimate) !== null
  const numbered = key.numberedItems > 0
  const spare = hasHours ? 0 : 10
  return { facts: numbered ? 25 : 40 + spare, coverage: numbered ? 15 + spare : null, estimate: hasHours ? 10 : null }
}

function mechanicalWithKey(pack: Pack, key: ScoreKey, registry: Registry): Mechanical {
  const weights = keyWeights(key)
  const hardFails = [
    ...(pack.verdict === key.verdict ? [] : [{ code: 'wrong-verdict', evidence: `VERDICT ${pack.verdict}; the key says ${key.verdict}` }]),
    ...verdictConsistency(pack),
    ...subtaskShape(pack),
    ...lintHardFails(pack, key.numberedItems, key.subItems, registry),
    ...(nonEmptyLines(pack.comment) > 2 * nonEmptyLines(key.comment) ? [{ code: 'too-long', evidence: `${nonEmptyLines(pack.comment)} lines; the key has ${nonEmptyLines(key.comment)}` }] : []),
  ]
  const intent = key.numberedItems > 0
    ? (sameMultiset(pack.subtasks.map((subtask) => itemTokens(subtask.title, subtask.items).join(',')), key.subtasks.map((subtask) => [...subtask.items].toSorted().join(','))) ? 5 : 0)
    : null
  const parts: Parts = {
    count: pack.subtasks.length === key.subtasks.length ? 5 : 0,
    repos: sameMultiset(pack.subtasks.map((subtask) => subtask.repo), key.subtasks.map((subtask) => subtask.repo)) ? 5 : 0,
    intent,
  }
  const keyTotal = totalHours(key.subtasks, key.estimate)
  return {
    dimensions: {
      verdict: hardFails.some((fail) => fail.code === 'wrong-verdict' || fail.code === 'verdict-inconsistent') ? 0 : 25,
      facts: null,
      coverage: null,
      subtasks: parts.count + parts.repos + (intent ?? 0),
      precision: null,
      estimate: keyTotal === null ? null : bucketPoints(totalHours(pack.subtasks, pack.estimate), keyTotal),
    },
    parts,
    hardFails,
    empty: weights.estimate === null ? ['estimate'] : [],
  }
}

function checksAllYes(checks: string): boolean {
  const parts = checks.split('|').map((part) => part.trim())
  return ['A', 'B', 'C'].every((letter) => parts.some((part) => new RegExp(`^${letter}\\b[\\s:=-]*yes\\b`, 'i').test(part)))
}

function noKeySubtaskPoints(pack: Pack, fields: CardFields | null, registry: Registry): number {
  const assignable = new Set(registry.repos.filter((repo) => repo.assignable).map((repo) => repo.name))
  const labels = pack.subtasks.every((subtask) => assignable.has(subtask.repo) && !subtask.title.startsWith('['))
  const hours = pack.subtasks.every((subtask) => subtask.hours !== null && FIBONACCI_HOURS.includes(subtask.hours))
  const sprint = pack.subtasks.every((subtask) => subtask.sprint && (!fields?.latestAiSprint || subtask.sprint === fields.latestAiSprint))
  return (labels ? 4 : 0) + (hours ? 3 : 0) + (sprint ? 3 : 0)
}

function citedShare(comment: string, items: number): number {
  const cited = new Set(comment.split('\n').flatMap((line) => citations(line).flatMap((citation) => citation.numbers)))
  const covered = Array.from({ length: items }, (_, index) => String(index + 1)).filter((item) => cited.has(item) || [...cited].some((number) => number.startsWith(`${item}.`)))
  return covered.length / items
}

function mechanicalWithoutKey(pack: Pack, fields: CardFields | null, registry: Registry): Mechanical {
  const items = fields?.numberedItems ?? 0
  const needsChecks = pack.verdict === 'PASS' || totalHours(pack.subtasks, pack.estimate) !== null
  const hardFails = [
    ...verdictConsistency(pack),
    ...subtaskShape(pack),
    ...(needsChecks && !checksAllYes(pack.checks) ? [{ code: 'confidence-mismatch', evidence: `VERDICT ${pack.verdict} or hours without A, B and C yes: '${pack.checks}'` }] : []),
    ...lintHardFails(pack, items, fields?.subItems ?? [], registry),
  ]
  const subtasks = noKeySubtaskPoints(pack, fields, registry)
  return {
    dimensions: {
      verdict: hardFails.some((fail) => fail.code === 'verdict-inconsistent' || fail.code === 'confidence-mismatch') ? 0 : 25,
      facts: null,
      coverage: items ? 15 * citedShare(pack.comment, items) : null,
      subtasks,
      precision: null,
      estimate: null,
    },
    parts: { count: 0, repos: 0, intent: null },
    hardFails,
    empty: [],
  }
}

function keyItems(key: ScoreKey): JudgeItem[] {
  const facts = key.facts.map((fact, index) => ({ id: `K${index + 1}`, text: `The draft states, with the same meaning: ${fact}` }))
  const coverage = Array.from({ length: key.numberedItems }, (_, index) => ({ id: `I${index + 1}`, text: `ข้อ ${index + 1} is disposed the same way as in the key (work / ไม่ต้องทำ / question).` }))
  const intent = key.numberedItems > 0 ? [] : key.subtasks.map((subtask, index) => ({ id: `S${index + 1}`, text: `Some draft subtask has the same purpose as the key subtask [${subtask.repo}] ${subtask.title}.` }))
  return [...facts, ...coverage, ...intent]
}

function shuffled<T>(values: T[], seed: number): T[] {
  let state = seed
  const random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const copy = [...values]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(random() * (index + 1))
    ;[copy[index], copy[other]] = [copy[other]!, copy[index]!]
  }
  return copy
}

function judgePrompt(pack: Pack, items: JudgeItem[], reference: string, seed: number): string {
  return [
    'You grade a draft refinement for one KlangTech ClickUp card. card.md (the card), facts.md (the code findings) and prod.md (production answers, when present) are in the current directory; read them when a claim needs checking.',
    reference,
    `## Draft package\n${pack.text}`,
    '## Items\nAnswer every item on its own with yes, no or unknown and one line of evidence. A paraphrase with the same meaning is yes. A fact phrased as an absence ("no X", "without X") is yes when the draft indeed contains no X. A fact about the repo, the hours or the number of subtasks is yes when the SUBTASKS or ESTIMATE lines of the package carry it.',
    shuffled(items, seed).map((item) => `- ${item.id}: ${item.text}`).join('\n'),
    '## Claims\nSplit the draft COMMENT and SUBTASKS into atomic claims D1..Dn. A claim is yes when the reference, card.md, the human comments or facts.md supports it, no when nothing does, unknown when you cannot tell.',
    `## Hard fails\nRaise only these codes, each with evidence, only when clearly present: fabricated-value (a price, limit, count, date, policy or formula presented as fact with no source in the card, the owner's words or facts.md; hour estimates, subtask hours, the sprint label (it comes from the card's Planning options in fields.json) and any number from the owner's words are never fabricated-value), dropped-item (a numbered item never disposed), question-answerable (a question that the card, a screenshot or facts.md answers), priority-question (a question about priority or urgency), scope-dropped (requested work written as ไม่ต้องทำ), wrong-repo (a subtask label naming the wrong repo).`,
    '## Output\nOutput only one JSON object and nothing after it:\n{"items":[{"id":"<item id>","verdict":"yes|no|unknown","evidence":"..."}],"claims":[{"id":"D1","text":"...","verdict":"yes|no|unknown","evidence":"..."}],"hardFails":[{"code":"...","evidence":"..."}],"anchor":{"row":null}}',
  ].join('\n\n')
}

function ownerWords(cardDir: string, key: ScoreKey | null): string {
  const path = join(cardDir, 'owner.md')
  const fromCard = existsSync(path) ? readFileSync(path, 'utf8').trim() : ''
  const fromKey = key?.ownerFacts ?? ''
  const text = [fromKey, fromCard].filter(Boolean).join('\n')
  return text ? `## Owner's words (count as the card's own words; a value stated here is never fabricated)\n${text}` : ''
}

function keyReference(key: ScoreKey): string {
  return `## Reference: the owner-approved answer key\n${key.comment}\n\nKey subtasks:\n${key.subtasks.map((subtask) => `- [${subtask.repo}] ${subtask.title} — ${subtask.hours ?? 'unknown'} hours`).join('\n') || 'none'}`
}

function anchorReference(anchors: number[], anchorText: string): string {
  return `## Reference: no answer key\nGround every claim in card.md, facts.md and the human comments. Also name the anchors.md data row (1-based, ${anchors.length} rows) whose subtask is closest in size to the draft's work, as anchor.row, or null.\n\n${anchorText}`
}

export function lastJsonObject(text: string): unknown {
  const objects: string[] = []
  let depth = 0
  let start = -1
  let inString = false
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (inString) {
      if (char === '\\') index += 1
      else if (char === '"') inString = false
    } else if (char === '"' && depth > 0) inString = true
    else if (char === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (char === '}' && depth > 0) {
      depth -= 1
      if (depth === 0) objects.push(text.slice(start, index + 1))
    }
  }
  for (const candidate of objects.toReversed()) {
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') return parsed
    } catch {}
  }
  return null
}

const JUDGE_VERDICTS = ['yes', 'no', 'unknown']

const isText = (value: unknown) => typeof value === 'string' && value.trim() !== ''

function isVerdictList(value: unknown, requiredText: string[]): value is Verdict[] {
  if (!Array.isArray(value)) return false
  const ids = value.map((entry) => entry?.id)
  return new Set(ids).size === ids.length && value.every((entry) =>
    isText(entry?.id) && JUDGE_VERDICTS.includes(entry?.verdict) && requiredText.every((field) => isText(entry[field])))
}

function asAnswer(value: unknown, itemIds: string[]): JudgeAnswer | null {
  const record = value as Partial<JudgeAnswer> | null
  if (!record || !isVerdictList(record.items, ['evidence']) || !isVerdictList(record.claims, ['text', 'evidence']) || !Array.isArray(record.hardFails)) return null
  const answered = new Set(record.items.map((item) => item.id))
  if (!record.claims.length || itemIds.some((id) => !answered.has(id))) return null
  const row = record.anchor?.row
  return {
    items: record.items,
    claims: record.claims,
    hardFails: record.hardFails.filter((fail) => JUDGE_HARD_FAILS.includes(fail.code)),
    anchor: { row: typeof row === 'number' ? row : null },
  }
}

function runJudge(command: string, cardDir: string, prompt: string, seed: number, itemIds: string[]): JudgeAnswer | null {
  const file = `judge-prompt-${seed}-${process.pid}-${Date.now()}.md`
  writeFileSync(join(cardDir, file), prompt)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const run = Bun.spawnSync(['sh', '-c', `${command} "$(cat ${file})"`], { cwd: cardDir, stdout: 'pipe', stderr: 'pipe' })
    const answer = asAnswer(lastJsonObject(run.stdout.toString()), itemIds)
    if (answer) {
      writeFileSync(join(cardDir, file.replace('judge-prompt-', 'judge-answer-').replace(/\.md$/, '.json')), JSON.stringify(answer, null, 2))
      return answer
    }
  }
  return null
}

function share(ids: string[], answers: Verdict[], unknowns: Set<string>): number {
  const yes = ids.filter((id) => {
    const verdict = answers.find((answer) => answer.id === id)?.verdict
    if (verdict !== 'yes' && verdict !== 'no') unknowns.add(id)
    return verdict === 'yes'
  })
  return ids.length ? yes.length / ids.length : 1
}

function readAnchors(path: string): { hours: number[]; text: string } {
  if (!existsSync(path)) return { hours: [], text: 'anchors.md is missing' }
  const text = readFileSync(path, 'utf8')
  const rows = text.split('\n').filter((line) => line.trim().startsWith('|') && !/^\|\s*-/.test(line.trim())).slice(1)
  const numbered = rows.map((row, index) => `${index + 1}. ${row.trim()}`).join('\n')
  return { hours: rows.map((row) => Number(row.split('|')[3]?.trim())), text: numbered }
}

function anchorPoints(row: number | null, anchors: number[], draftTotal: number | null): number {
  const hours = row === null ? undefined : anchors[row - 1]
  if (hours === undefined || Number.isNaN(hours) || draftTotal === null) return 5
  return Math.abs(bucket(draftTotal) - bucket(hours)) <= 1 ? 10 : 0
}

interface RunContext {
  mode: 'key' | 'no-key'
  weights: Weights
  unnumbered: boolean
  anchors: number[]
  draftTotal: number | null
}

interface RunScore {
  facts: number | null
  coverage: number | null
  precision: number | null
  estimate: number | null
  intent: number | null
}

function scoreRun(answer: JudgeAnswer, items: JudgeItem[], context: RunContext, unknowns: Set<string>, empty: Set<string>): RunScore {
  const ids = (prefix: string) => items.filter((item) => item.id.startsWith(prefix)).map((item) => item.id)
  const claimIds = answer.claims.map((claim) => claim.id)
  if (!claimIds.length) empty.add(context.mode === 'key' ? 'precision' : 'facts')
  const claims = share(claimIds, answer.claims, unknowns)
  if (context.mode === 'no-key') {
    return { facts: context.weights.facts * claims, coverage: null, precision: null, estimate: anchorPoints(answer.anchor.row, context.anchors, context.draftTotal), intent: null }
  }
  if (!ids('K').length) empty.add('facts')
  if (context.unnumbered && !ids('S').length) empty.add('subtasks.intent')
  return {
    facts: context.weights.facts * share(ids('K'), answer.items, unknowns),
    coverage: context.weights.coverage === null ? null : context.weights.coverage * share(ids('I'), answer.items, unknowns),
    precision: 10 * claims,
    estimate: null,
    intent: context.unnumbered ? 5 * share(ids('S'), answer.items, unknowns) : null,
  }
}

function average(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null)
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : null
}

function judge(command: string, cardDir: string, prompt: (seed: number) => string, items: JudgeItem[], context: RunContext): Judged {
  const unknowns = new Set<string>()
  const empty = new Set<string>()
  const runs: RunScore[] = []
  const hardFails: HardFail[] = []
  for (const seed of SEEDS) {
    const answer = runJudge(command, cardDir, prompt(seed), seed, items.map((item) => item.id))
    if (!answer) return { dimensions: {}, intent: null, hardFails: [{ code: 'judge-unparseable', evidence: `no complete JSON answer (every item, at least one claim, hardFails) in the judge output for seed ${seed}, after one retry` }], unknowns: [], empty: [], runs: runs.length }
    hardFails.push(...answer.hardFails.filter((fail) => !hardFails.some((known) => known.code === fail.code)))
    runs.push(scoreRun(answer, items, context, unknowns, empty))
  }
  const dimension = (name: keyof RunScore) => average(runs.map((run) => run[name]))
  return {
    dimensions: { facts: dimension('facts'), coverage: dimension('coverage'), precision: dimension('precision'), estimate: dimension('estimate') },
    intent: dimension('intent'),
    hardFails,
    unknowns: [...unknowns].toSorted(),
    empty: [...empty],
    runs: runs.length,
  }
}

function rounded(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100) / 100
}

interface ScoreInput {
  pack: Pack
  cardDir: string
  key: ScoreKey | null
  judgeCommand: string | null
  anchorsPath: string
  registry: Registry
}

export function scorePackage(input: ScoreInput) {
  const { cardDir, key } = input
  const pack = { ...input.pack, subtasks: withPlannedItems(input.pack.subtasks, cardDir) }
  const fields = readFields(cardDir)
  const mechanical = key ? mechanicalWithKey(pack, key, input.registry) : mechanicalWithoutKey(pack, fields, input.registry)
  const anchors = readAnchors(input.anchorsPath)
  const items = key ? keyItems(key) : []
  const weights: Weights = key ? keyWeights(key) : { facts: 40 + (mechanical.dimensions.coverage === null ? 15 : 0), coverage: mechanical.dimensions.coverage, estimate: 10 }
  const reference = [key ? keyReference(key) : anchorReference(anchors.hours, anchors.text), ownerWords(cardDir, key)].filter(Boolean).join('\n\n')
  const context: RunContext = { mode: key ? 'key' : 'no-key', weights, unnumbered: key?.numberedItems === 0, anchors: anchors.hours, draftTotal: totalHours(pack.subtasks, pack.estimate) }
  const judged = input.judgeCommand ? judge(input.judgeCommand, cardDir, (seed) => judgePrompt(pack, items, reference, seed), items, context) : null
  const intent = key && key.numberedItems === 0 ? judged?.intent ?? null : mechanical.parts.intent
  const dimensions: Dimensions = {
    verdict: mechanical.dimensions.verdict,
    facts: judged?.dimensions.facts ?? null,
    coverage: key ? judged?.dimensions.coverage ?? null : mechanical.dimensions.coverage,
    subtasks: key ? mechanical.parts.count + mechanical.parts.repos + (intent ?? 0) : mechanical.dimensions.subtasks,
    precision: key ? judged?.dimensions.precision ?? null : null,
    estimate: key ? mechanical.dimensions.estimate : judged?.dimensions.estimate ?? null,
  }
  const hardFails = [...mechanical.hardFails, ...(judged?.hardFails ?? [])]
  const complete = judged !== null && judged.runs === SEEDS.length
  const total = Object.values(dimensions).reduce<number>((sum, value) => sum + (value ?? 0), 0)
  return {
    score: hardFails.length ? 0 : complete ? Math.round(total) : null,
    hardFails,
    dimensions: Object.fromEntries(Object.entries(dimensions).map(([name, value]) => [name, rounded(value)])),
    parts: key ? { subtasks: { ...mechanical.parts, intent: rounded(intent) } } : null,
    unknowns: judged?.unknowns ?? [],
    empty: [...new Set([...mechanical.empty, ...(judged?.empty ?? [])])],
    judgeRuns: judged?.runs ?? 0,
    mode: key ? 'key' : 'no-key',
  }
}

function main(): void {
  const { values } = parseArgs({
    options: {
      package: { type: 'string' },
      card: { type: 'string' },
      key: { type: 'string' },
      'no-key': { type: 'boolean' },
      judge: { type: 'string' },
      'mechanical-only': { type: 'boolean' },
      out: { type: 'string' },
      anchors: { type: 'string' },
      registry: { type: 'string' },
    },
  })
  const keyChoice = Boolean(values.key) !== Boolean(values['no-key'])
  const judgeChoice = Boolean(values.judge) !== Boolean(values['mechanical-only'])
  if (!values.package || !values.card || !keyChoice || !judgeChoice) {
    process.stderr.write('usage: score.ts --package <package.md> --card <card-dir> (--key <key.md> | --no-key) (--judge "<command>" | --mechanical-only) [--out <score.json>] [--anchors <anchors.md>]\n')
    process.exit(2)
  }
  const result = scorePackage({
    pack: parsePackage(readFileSync(values.package, 'utf8')),
    cardDir: values.card,
    key: values.key ? readKey(values.key) : null,
    judgeCommand: values['mechanical-only'] ? null : values.judge!,
    anchorsPath: values.anchors ?? join(import.meta.dir, '..', 'examples', 'anchors.md'),
    registry: readRegistry(values.registry),
  })
  const json = `${JSON.stringify(result, null, 2)}\n`
  if (values.out) writeFileSync(values.out, json)
  process.stdout.write(json)
}

if (import.meta.main) main()
