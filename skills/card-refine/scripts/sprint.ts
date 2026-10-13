#!/usr/bin/env bun
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { type PlanningOption, latestAiSprint } from './planning'

function optionsFrom(json: unknown): PlanningOption[] {
  if (Array.isArray(json)) return json as PlanningOption[]
  const record = json as { options?: PlanningOption[]; planning?: { options?: PlanningOption[] } }
  return record.options ?? record.planning?.options ?? []
}

const { values } = parseArgs({ options: { options: { type: 'string' } } })
if (!values.options) {
  process.stderr.write('usage: sprint.ts --options <planning-options.json>\n')
  process.exit(2)
}
const latest = latestAiSprint(optionsFrom(JSON.parse(readFileSync(values.options, 'utf8'))))
if (latest.kind !== 'found') process.stderr.write(`${latest.reason}\n`)
process.stdout.write(`${JSON.stringify(latest.kind === 'found' ? { id: latest.option.id, label: latest.option.label } : null)}\n`)
