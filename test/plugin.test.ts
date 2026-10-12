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
