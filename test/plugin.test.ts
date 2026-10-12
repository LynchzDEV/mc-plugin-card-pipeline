import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseManifest } from '@mission-control/plugin-sdk/manifest'

const manifest = JSON.parse(readFileSync('mc-plugin.json', 'utf8'))
const contributes = manifest.contributes as { agents: string[]; skills: string[]; flows: string[] }

function filesUnder(path: string): string[] {
  if (statSync(path).isFile()) return [path]
  return readdirSync(path).flatMap((entry) => filesUnder(join(path, entry)))
}

const contributedFiles = [...contributes.agents, ...contributes.skills, ...contributes.flows].flatMap(filesUnder)
const textSettings = new Set((manifest.settings as Array<{ key: string; type: string }>).filter((field) => field.type === 'text').map((field) => field.key))

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
})

describe('placeholders', () => {
  test('every {{setting:…}} is a declared text setting', () => {
    for (const path of contributedFiles) {
      for (const [, key] of readFileSync(path, 'utf8').matchAll(/\{\{setting:([^}]+)\}\}/g)) {
        expect(textSettings.has(key), `${path}: ${key}`).toBe(true)
      }
    }
  })

  test('only known {{mc:…}} values are used', () => {
    for (const path of contributedFiles) {
      for (const [, key] of readFileSync(path, 'utf8').matchAll(/\{\{mc:([^}]+)\}\}/g)) expect(key, path).toBe('mctl')
    }
  })
})

describe('flow', () => {
  const flow = JSON.parse(readFileSync(contributes.flows[0]!, 'utf8')) as {
    entry: string
    nodes: Array<{ id: string }>
    edges: Array<{ source: string; target: string; outcome: string }>
  }
  const ids = new Set(flow.nodes.map((node) => node.id))

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
})

describe('nothing team-private ships', () => {
  test('no team ids, people, hosts or seller codes in the repo files', () => {
    const shipped = ['mc-plugin.json', 'README.md', ...contributedFiles, 'examples/team-knowledge.example.md'].filter((path) => existsSync(path))
    const forbidden = [/S0\d{4}/, /\b\d{7}\b/, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/, /\bb-[0-9a-f]{8}\b/, /klangtech/i, /\/home\/[a-z]/, /prod-kt/, /chatawt/i, /mahamodo/i]
    for (const path of shipped) {
      const text = readFileSync(path, 'utf8')
      for (const pattern of forbidden) expect(text.match(pattern)?.[0] ?? null, `${path}: ${pattern}`).toBeNull()
    }
  })
})
