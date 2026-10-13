import { describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function sprint(options: unknown) {
  const path = join(mkdtempSync(join(tmpdir(), 'sprint-')), 'options.json')
  writeFileSync(path, JSON.stringify(options))
  const run = Bun.spawnSync(['bun', 'skills/card-refine/scripts/sprint.ts', '--options', path])
  expect(run.exitCode, run.stderr.toString()).toBe(0)
  return { result: JSON.parse(run.stdout.toString()), reason: run.stderr.toString() }
}

describe('sprint', () => {
  test('picks the highest AI sprint, with or without the space', () => {
    const options = [
      { id: 'a', label: 'Sprint 18 AI (5/10 - 9/10)' },
      { id: 'b', label: 'Sprint 19 (12/10-16/10)' },
      { id: 'c', label: 'Sprint 19AI (12/10 - 16/10)' },
      { id: 'd', label: 'Refinement Plan' },
    ]
    expect(sprint(options).result).toEqual({ id: 'c', label: 'Sprint 19AI (12/10 - 16/10)' })
  })

  test('reads the options from a fields.json', () => {
    expect(sprint({ planning: { options: [{ id: 'x', label: 'Sprint 2AI' }] } }).result).toEqual({ id: 'x', label: 'Sprint 2AI' })
  })

  test('prints null with a reason when no AI sprint exists', () => {
    const { result, reason } = sprint([{ id: 'a', label: 'Sprint 19 (12/10-16/10)' }])
    expect(result).toBeNull()
    expect(reason).toContain('Sprint <n>AI')
  })

  test('prints null with a reason when two options share the highest number', () => {
    const { result, reason } = sprint([{ id: 'a', label: 'Sprint 19AI' }, { id: 'b', label: 'Sprint 19 AI' }])
    expect(result).toBeNull()
    expect(reason).toContain('several options')
  })
})
