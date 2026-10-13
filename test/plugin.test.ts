import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseManifest } from '@mission-control/plugin-sdk/manifest'

const manifest = JSON.parse(readFileSync('mc-plugin.json', 'utf8'))
const contributes = manifest.contributes as { agents: string[]; skills: string[]; flows: string[] }
const AGENTS = ['agents/project-manager.md', 'agents/code-architect.md', 'agents/production-investigator.md']
const agentsReady = AGENTS.every((path) => existsSync(path))
const releaseReady = manifest.version === '0.5.2'
const whenAgents = agentsReady ? test : test.todo
const whenRelease = releaseReady ? test : test.todo

function filesUnder(path: string): string[] {
  if (statSync(path).isFile()) return [path]
  return readdirSync(path).flatMap((entry) => filesUnder(join(path, entry)))
}

const contributedFiles = [...contributes.agents, ...contributes.skills, ...contributes.flows].flatMap(filesUnder)

function frontmatterValue(raw: string): unknown {
  const value = raw.trim()
  if (value.startsWith('[')) return JSON.parse(value)
  if (value === 'true' || value === 'false') return value === 'true'
  if (/^\d+$/.test(value)) return Number(value)
  return value.replace(/^(["'])(.*)\1$/, '$2')
}

function frontmatter(text: string): Record<string, unknown> {
  const block = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  return Object.fromEntries(block.split('\n').map((line) => /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line)).filter((match) => match !== null).map(([, key, value]) => [key, frontmatterValue(value!)]))
}

function body(text: string): string {
  return text.replace(/^---\n[\s\S]*?\n---\n/, '')
}

function read(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}

describe('manifest', () => {
  test('passes the SDK check', () => {
    const result = parseManifest(manifest)
    expect(result.ok ? [] : result.errors).toEqual([])
  })

  test('every contributed path exists', () => {
    for (const path of contributes.agents) expect(existsSync(path), path).toBe(true)
    for (const path of contributes.skills) expect(existsSync(join(path, 'SKILL.md')), path).toBe(true)
    for (const path of contributes.flows) expect(existsSync(path), path).toBe(true)
  })

  test('every agent and skill has a name in its frontmatter', () => {
    const named = [...contributes.agents, ...contributes.skills.map((skill) => join(skill, 'SKILL.md'))]
    for (const path of named) expect(readFileSync(path, 'utf8'), path).toMatch(/^---\n(?:.*\n)*?name: [a-z0-9-]+\n(?:.*\n)*?---\n/)
  })

  whenAgents('contributes the three agents in order and no longer ships biz-gate', () => {
    expect(contributes.agents).toEqual(AGENTS)
    expect(existsSync('agents/biz-gate.md')).toBe(false)
  })

  whenRelease('package.json carries the same version', () => {
    expect(JSON.parse(readFileSync('package.json', 'utf8')).version).toBe('0.5.2')
  })
})

describe('ready to use', () => {
  test('declares no settings and fills nothing but the mctl command', () => {
    expect(manifest.settings).toBeUndefined()
    for (const path of contributedFiles) {
      expect(readFileSync(path, 'utf8'), path).not.toMatch(/\{\{setting:/)
      for (const [, key] of readFileSync(path, 'utf8').matchAll(/\{\{mc:([^}]+)\}\}/g)) expect(key, path).toBe('mctl')
    }
  })

  test('ships no bun.lock, so any bun version can install it', () => {
    expect(existsSync('bun.lock')).toBe(false)
  })

  test('no path that only exists on one machine', () => {
    for (const path of contributedFiles) expect(readFileSync(path, 'utf8'), path).not.toMatch(/\/home\/[a-z]/)
  })
})

describe('project-manager agent', () => {
  const text = read('agents/project-manager.md')

  whenAgents('frontmatter names it, runs on opus and may call other agents', () => {
    const meta = frontmatter(text)
    expect(meta.name).toBe('project-manager')
    expect(meta.model).toBe('opus')
    expect(meta.tools).toContain('Agent')
    expect(String(meta.description).length).toBeGreaterThan(0)
  })

  whenAgents('the protocol names every file, script and input it relies on', () => {
    for (const part of ['code-architect', 'prod-questions.md', 'facts.md', 'subtasks.json', 'lint.ts', 'examples', 'latestAiSprint', '--architect', 'ข้อ']) expect(body(text), part).toContain(part)
  })

  whenAgents('Old server and Domains appear only in a never rule', () => {
    for (const line of text.split('\n').filter((candidate) => candidate.includes('Old server') || candidate.includes('Domains'))) expect(line).toContain('never')
  })

  whenAgents('names no machine path', () => {
    expect(text).not.toContain('/home/')
  })

  whenAgents('splits only on an independently useful business outcome', () => {
    expect(text).toContain('independently useful business outcome')
    expect(text).not.toContain('one subtask per repo')
    expect(text).not.toContain('Subtasks exist only when the work splits across repos')
  })
})

describe('code-architect agent', () => {
  const text = read('agents/code-architect.md')

  whenAgents('frontmatter runs it on opus without CLAUDE.md and caps its turns', () => {
    const meta = frontmatter(text)
    expect(meta.name).toBe('code-architect')
    expect(meta.model).toBe('opus')
    expect(meta.omitClaudeMd).toBe(true)
    expect(meta.maxTurns).toBe(80)
  })

  whenAgents('answers with evidence or UNKNOWN and reads backoffice for old behavior', () => {
    expect(body(text)).toContain('UNKNOWN')
    expect(body(text)).toMatch(/file:line|evidence/)
    expect(body(text)).toContain('backoffice')
  })
})

describe('production-investigator agent', () => {
  const text = read('agents/production-investigator.md')

  whenAgents('frontmatter runs it on sonnet with the inv-prod skill', () => {
    const meta = frontmatter(text)
    expect(meta.name).toBe('production-investigator')
    expect(meta.model).toBe('sonnet')
    expect(meta.skills).toContain('inv-prod')
    expect(meta.omitClaudeMd).toBe(true)
    expect(meta.maxTurns).toBe(40)
  })

  whenAgents('reads only, with a timeout, and reports a status per question', () => {
    for (const word of ['OK', 'FAILED', 'UNKNOWN', 'statement_timeout', 'SELECT']) expect(body(text), word).toContain(word)
  })
})

describe('card-refine skill', () => {
  const text = read(join(contributes.skills[0]!, 'SKILL.md'))
  const headings = text.split('\n').filter((line) => line.startsWith('#')).join('\n')

  whenRelease('is the session manual for every step of the flow', () => {
    expect(frontmatter(text).name).toBe('card-refine')
    for (const section of ['Prerequisites', 'LANDS', 'PROJECT-MANAGER', 'PROD-LOOKUPS', 'APPROVE', 'SEND', 'REHEARSAL', 'Report']) expect(headings, section).toContain(section)
  })

  whenRelease('calls mctl through the placeholder and names no machine path', () => {
    expect(text).toContain('{{mc:mctl}}')
    expect(text).not.toContain('/home/')
  })

  whenRelease('SEND creates subtasks before it sets Planning, so new subtasks get the sprint', () => {
    const send = text.slice(text.indexOf('## 6. SEND'), text.indexOf('## 7.')).split('\n')
    const createStep = send.findIndex((line) => line.includes('create only the missing ones'))
    expect(createStep).toBeGreaterThan(-1)
    expect(send.findIndex((line) => line.includes('set Planning'))).toBeGreaterThan(createStep)
  })

  whenRelease('SEND checks each child outcome and does not delete existing subtasks', () => {
    const send = text.slice(text.indexOf('## 6. SEND'), text.indexOf('## 7.'))
    expect(send).toContain('independently useful business outcome')
    expect(send).toContain('Do not delete subtasks already on the card')
  })
})

interface FlowNode {
  id: string
  kind: string
  agent: { role: string; engine: string; model?: string }
  maxVisits?: number
  skills?: unknown[]
  checks?: unknown
  setup?: unknown
  mcpServers?: unknown
}

describe('flow', () => {
  const flow = JSON.parse(readFileSync(contributes.flows[0]!, 'utf8')) as {
    entry: string
    nodes: FlowNode[]
    edges: Array<{ source: string; target: string; outcome: string }>
  }
  const ids = new Set(flow.nodes.map((node) => node.id))
  const node = (id: string) => flow.nodes.find((candidate) => candidate.id === id)
  const outgoing = (id: string, outcome: string) => flow.edges.filter((edge) => edge.source === id && edge.outcome === outcome)

  test('node ids are unique and the entry exists', () => {
    expect(ids.size).toBe(flow.nodes.length)
    expect(ids.has(flow.entry)).toBe(true)
  })

  test('every edge joins two known nodes with a known outcome', () => {
    for (const edge of flow.edges) {
      expect(ids.has(edge.source), edge.source).toBe(true)
      expect(ids.has(edge.target), edge.target).toBe(true)
      expect(['pass', 'fail', 'blocked']).toContain(edge.outcome)
    }
  })

  whenRelease('has the six project-manager steps, all tasks, entered at lands', () => {
    expect([...ids].toSorted()).toEqual(['approve', 'lands', 'prod-lookups', 'project-manager', 'refinement-advisor', 'send'])
    expect(flow.entry).toBe('lands')
    for (const step of flow.nodes) expect(step.kind, step.id).toBe('task')
  })

  whenRelease('never forks: one pass edge and at most one fail or blocked edge per node', () => {
    for (const id of ids) {
      expect(outgoing(id, 'pass').length, id).toBeLessThanOrEqual(1)
      expect(outgoing(id, 'fail').length, id).toBeLessThanOrEqual(1)
      expect(outgoing(id, 'blocked').length, id).toBeLessThanOrEqual(1)
    }
  })

  whenRelease('reaches every node from lands', () => {
    const seen = new Set(['lands'])
    const queue = ['lands']
    while (queue.length) {
      const source = queue.shift()
      for (const edge of flow.edges.filter((candidate) => candidate.source === source)) {
        if (!seen.has(edge.target)) {
          seen.add(edge.target)
          queue.push(edge.target)
        }
      }
    }
    expect([...seen].toSorted()).toEqual([...ids].toSorted())
  })

  whenRelease('runs the expected engines', () => {
    for (const id of ['lands', 'prod-lookups', 'approve', 'send']) expect(node(id)!.agent, id).toEqual({ role: 'plan', engine: 'session' })
    expect(node('project-manager')!.agent).toEqual({ role: 'execute', engine: 'claude', model: 'opus' })
    expect(node('project-manager')!.maxVisits).toBe(3)
    expect(node('refinement-advisor')!.agent.engine).toBe('codex')
    expect(node('refinement-advisor')!.agent.role).toBe('review')
  })

  whenRelease('sends new production facts back to the project-manager', () => {
    expect(outgoing('prod-lookups', 'fail').map((edge) => edge.target)).toEqual(['project-manager'])
    expect(outgoing('prod-lookups', 'pass').map((edge) => edge.target)).toEqual(['refinement-advisor'])
  })

  whenRelease('carries no checks, setup, MCP servers or skill paths', () => {
    for (const step of flow.nodes) {
      expect(step.checks, step.id).toBeUndefined()
      expect(step.setup, step.id).toBeUndefined()
      expect(step.mcpServers, step.id).toBeUndefined()
      expect(step.skills, step.id).toEqual([])
    }
  })
})
