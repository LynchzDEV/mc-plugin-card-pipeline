#!/usr/bin/env bun
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { PLANNING_FIELD_ID, type PlanningOption, latestAiSprintOption } from './planning'

interface CustomField {
  id: string
  name: string
  type: string
  value?: unknown
  type_config?: { options?: Array<{ id: string; name?: string; label?: string; orderindex?: number }> }
}

interface Task {
  id: string
  name: string
  markdown_description?: string | null
  status?: string | { status?: string }
  tags?: Array<{ name: string }>
  parent?: string | null
  custom_fields?: CustomField[]
  attachments?: Array<{ id: string; title: string }>
  subtasks?: Array<{ id: string; name: string }>
  linked_tasks?: Array<{ task_id?: string; link_id?: string; name?: string; status?: string | { status?: string } }>
  dependencies?: Array<{ task_id?: string; depends_on?: string; name?: string; status?: string | { status?: string } }>
}

interface RawComment {
  comment_text: string
  user?: { username?: string }
  date: string | number
}

interface Shot {
  name: string
  url: string
}

interface Description {
  text: string
  shots: Shot[]
  numberedItems: number
  subItems: string[]
}

const LOG_TYPES = ['Bug', 'SuperBug', 'CR', 'Question', 'Issue', 'Function', 'BizTask']
const OWN_FOOTERS = ['[🤖 Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]', '[🌚Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]']
const AI_FIRST_LINE = '⚠️ ความคิดเห็นนี้สร้างโดย AI'
const IMAGE = /!\[[^\]]*\]\(([^)\s]+)\)/g
const TOP_ITEM = /^(\d+)\. /
const SUB_ITEM = /^\s+(\d+)\. (.*)$/

export function landDescription(markdown: string): Description {
  const shots: Shot[] = []
  const perItem = new Map<number, number>()
  const subItems: string[] = []
  let item = 0
  let numberedItems = 0
  const lines = markdown.split('\n').map((line) => {
    const top = TOP_ITEM.exec(line)
    if (top) {
      item = Number(top[1])
      numberedItems += 1
    }
    const sub = SUB_ITEM.exec(line)
    if (sub && item > 0 && sub[2]!.replace(IMAGE, '').trim()) subItems.push(`${item}.${sub[1]}`)
    return line.replace(IMAGE, (_match, url: string) => {
      const n = (perItem.get(item) ?? 0) + 1
      perItem.set(item, n)
      const name = `${item}-${n}`
      shots.push({ name, url })
      return `![shots/${name}.png](shots/${name}.png)`
    })
  })
  return { text: lines.join('\n'), shots, numberedItems, subItems }
}

function field(task: Task, match: (field: CustomField) => boolean): CustomField | undefined {
  return (task.custom_fields ?? []).find(match)
}

function logTypeLabel(task: Task): string | null {
  const logField = field(task, (f) => f.name === 'Log Type' && f.type === 'labels')
  const ids = Array.isArray(logField?.value) ? (logField!.value as string[]) : []
  const labels = ids.map((id) => logField?.type_config?.options?.find((option) => option.id === id)?.label).filter(Boolean)
  return (labels[0] as string | undefined) ?? null
}

export function logType(label: string | null): string | null {
  const letters = (label ?? '').replace(/[^A-Za-z]/g, '')
  return LOG_TYPES.includes(letters) ? letters : null
}

export function planning(task: Task): { current: string | null; latestAiSprint: PlanningOption | null; options: PlanningOption[] } {
  const planningField = field(task, (f) => f.id === PLANNING_FIELD_ID)
  const raw = planningField?.type_config?.options ?? []
  const options = raw.map((option) => ({ id: option.id, label: option.name ?? option.label ?? '' }))
  const value = planningField?.value
  const chosen = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))
    ? raw.find((option) => option.orderindex === Number(value))
    : raw.find((option) => option.id === value)
  return { current: chosen ? chosen.name ?? chosen.label ?? null : null, latestAiSprint: latestAiSprintOption(options), options }
}

function sellerCodes(task: Task): string[] {
  const value = field(task, (f) => f.name === 'SELLER ID')?.value
  if (typeof value !== 'string' || !value.trim()) return []
  const codes = value.match(/\bS\d{5,}\b/g)
  return codes ? [...codes] : [value.trim()]
}

export function isOwnOrBotComment(text: string): boolean {
  if ((text.match(/⁣/g) ?? []).length >= 2) return true
  if (OWN_FOOTERS.some((footer) => text.includes(footer))) return true
  if (text.trimStart().split('\n')[0]!.trim() === AI_FIRST_LINE) return true
  return (text.includes('พร้อมทำได้เลย:') || text.includes('พร้อมพัฒนา:')) && text.includes('เหตุผล')
}

function bangkokDate(ms: string | number): string {
  return new Date(Number(ms)).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
}

export function humanComments(comments: RawComment[]): string[] {
  return comments
    .filter((comment) => !isOwnOrBotComment(comment.comment_text))
    .toSorted((a, b) => Number(a.date) - Number(b.date))
    .map((comment) => {
      const text = comment.comment_text.trim().replace(/\n/g, '\n  ')
      return `- **${comment.user?.username ?? 'unknown'}** (${bangkokDate(comment.date)}): ${text}`
    })
}

function statusText(status: Task['status']): string {
  return typeof status === 'string' ? status : status?.status ?? 'unknown'
}

function linkedCards(task: Task): string[] {
  const links = [...(task.linked_tasks ?? []), ...(task.dependencies ?? [])]
  return links.map((link) => {
    const id = ('task_id' in link && link.task_id !== task.id ? link.task_id : undefined)
      ?? ('link_id' in link ? link.link_id : undefined)
      ?? ('depends_on' in link ? link.depends_on : undefined)
      ?? 'unknown'
    return `- ${link.name ?? 'unnamed'} (${id}) — ${link.status ? statusText(link.status) : 'unknown'}`
  })
}

function unreferencedAttachments(task: Task, description: string): string[] {
  return (task.attachments ?? [])
    .filter((attachment) => !description.includes(attachment.id.replace(/\.[^.]+$/, '')))
    .map((attachment) => `- ${attachment.title} (${attachment.id})`)
}

function fieldLines(task: Task, label: string | null, current: string | null, sellers: string[]): string[] {
  return [
    `- Log Type: ${label ?? 'none'}`,
    `- Status: ${statusText(task.status)}`,
    `- Tags: ${(task.tags ?? []).map((tag) => tag.name).join(', ') || 'none'}`,
    `- Planning: ${current ?? 'none'}`,
    ...(sellers.length ? [`- SELLER ID: ${sellers.join(', ')}`] : []),
    ...(task.parent ? [`- Parent: ${task.parent}`] : []),
  ]
}

export function renderCard(task: Task, comments: RawComment[]): { card: string; fields: Record<string, unknown>; shots: Shot[] } {
  const markdown = task.markdown_description ?? ''
  const description = landDescription(markdown)
  const label = logTypeLabel(task)
  const plan = planning(task)
  const sellers = sellerCodes(task)
  const human = humanComments(comments)
  const linked = linkedCards(task)
  const attachments = unreferencedAttachments(task, markdown)
  const blocks = [
    `# ${task.name} (${task.id})`,
    `## Fields\n${fieldLines(task, label, plan.current, sellers).join('\n')}`,
    `## Description\n${description.text}`,
    `## Comments\n${human.length ? human.join('\n') : 'none'}`,
    ...(linked.length ? [`## Linked cards\n${linked.join('\n')}`] : []),
    ...(attachments.length ? [`## Attachments not in description\n${attachments.join('\n')}`] : []),
  ]
  const fields = {
    id: task.id,
    title: task.name,
    logType: logType(label),
    numberedItems: description.numberedItems,
    subItems: description.subItems,
    planning: plan,
    sellerCodes: sellers,
    parent: task.parent ?? null,
    subtasks: (task.subtasks ?? []).map((subtask) => ({ id: subtask.id, name: subtask.name })),
  }
  return { card: `${blocks.join('\n\n')}\n`, fields, shots: description.shots }
}

async function fetchOnce(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.arrayBuffer()
}

async function download(shots: Shot[], dir: string): Promise<void> {
  mkdirSync(dir, { recursive: true })
  const fetched = new Map<string, Promise<ArrayBuffer>>()
  for (const shot of shots) {
    const bytes = fetched.get(shot.url) ?? fetchOnce(shot.url).catch(() => fetchOnce(shot.url))
    fetched.set(shot.url, bytes)
    try {
      writeFileSync(join(dir, `${shot.name}.png`), new Uint8Array(await bytes))
    } catch (error) {
      writeFileSync(join(dir, `${shot.name}.missing`), `${shot.url}\n${error instanceof Error ? error.message : String(error)}\n`)
    }
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { task: { type: 'string' }, out: { type: 'string' }, comments: { type: 'string' }, 'no-download': { type: 'boolean' } },
  })
  if (!values.task || !values.out) {
    process.stderr.write('usage: land.ts --task <task.json> --out <card-dir> [--comments <comments.json>] [--no-download]\n')
    process.exit(2)
  }
  const task = JSON.parse(readFileSync(values.task, 'utf8')) as Task
  const comments = values.comments ? (JSON.parse(readFileSync(values.comments, 'utf8')).comments as RawComment[]) : []
  const { card, fields, shots } = renderCard(task, comments)
  mkdirSync(values.out, { recursive: true })
  writeFileSync(join(values.out, 'card.md'), card)
  writeFileSync(join(values.out, 'fields.json'), `${JSON.stringify(fields, null, 2)}\n`)
  if (!values['no-download']) await download(shots, join(values.out, 'shots'))
  process.stdout.write(`${values.out}\n`)
}

if (import.meta.main) await main()
