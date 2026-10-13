#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

export interface SchemaSource {
  repo: string
  schema: string | null
}

export interface TableMatch {
  repo: string
  table: string
  matchedBy: string[]
  timeColumns: string[]
  matchedColumns: string[]
}

export interface WhereResult {
  matches: TableMatch[]
  noSchema: string[]
  noMatch: string[]
}

interface Column {
  name: string
  type: string
}

const COLUMN_TYPES = ['string', 'text', 'integer', 'bigint', 'datetime', 'date', 'boolean', 'decimal', 'jsonb', 'json', 'uuid', 'references', 'float', 'timestamptz', 'timestamp']
const TIME_TYPES = ['datetime', 'date', 'timestamptz', 'timestamp']
const COLUMN = new RegExp(String.raw`^\s*t\.(${COLUMN_TYPES.join('|')})\s+"([^"]+)"`)
const TABLE = /^\s*create_table\s+"([^"]+)".*do\s*\|t\|/

function normalise(text: string): string {
  return text.toLowerCase().replace(/[_-]+/g, ' ').trim()
}

export function parseTables(schema: string): Map<string, Column[]> {
  const tables = new Map<string, Column[]>()
  let current: Column[] | null = null
  for (const line of schema.split('\n')) {
    const table = TABLE.exec(line)
    if (table) tables.set(table[1]!, (current = []))
    else if (current && line.trim() === 'end') current = null
    else if (current && /^\s*t\.timestamps\b/.test(line)) current.push({ name: 'created_at', type: 'datetime' }, { name: 'updated_at', type: 'datetime' })
    else if (current) {
      const column = COLUMN.exec(line)
      if (column) current.push({ name: column[2]!, type: column[1]! })
    }
  }
  return tables
}

export function findTables(schemas: SchemaSource[], word: string): WhereResult {
  const needle = normalise(word)
  const result: WhereResult = { matches: [], noSchema: [], noMatch: [] }
  for (const { repo, schema } of schemas) {
    if (schema === null) {
      result.noSchema.push(repo)
      continue
    }
    const before = result.matches.length
    const tables = [...parseTables(schema)].sort(([a], [b]) => a.localeCompare(b))
    for (const [table, columns] of tables) {
      const byName = needle !== '' && normalise(table).includes(needle)
      const matchedColumns = needle === '' ? [] : columns.filter((column) => normalise(column.name).includes(needle)).map((column) => column.name)
      if (!byName && !matchedColumns.length) continue
      result.matches.push({
        repo,
        table,
        matchedBy: [...(byName ? ['table name'] : []), ...matchedColumns],
        timeColumns: columns.filter((column) => TIME_TYPES.includes(column.type)).map((column) => column.name),
        matchedColumns,
      })
    }
    if (result.matches.length === before) result.noMatch.push(repo)
  }
  return result
}

export function schemaPath(reposRoot: string, repo: string): string | null {
  return [join(reposRoot, repo, 'db/schema.rb'), join(reposRoot, repo, 'spec/dummy/db/schema.rb')].find((path) => existsSync(path)) ?? null
}

export function formatMarkdown(result: WhereResult): string {
  const rows = result.matches.map((match) => `| ${match.repo} | ${match.table} | ${match.matchedBy.join(', ')} | ${match.timeColumns.join(', ')} | ${match.matchedColumns.join(', ')} |`)
  return [
    '| repo | table | matched by | time columns | other matched columns |',
    '|---|---|---|---|---|',
    ...rows,
    '',
    `no schema: ${result.noSchema.join(', ')}`,
    `no match: ${result.noMatch.join(', ')}`,
  ].join('\n')
}

function main(): void {
  const { values } = parseArgs({ options: { word: { type: 'string' }, 'repos-root': { type: 'string' }, registry: { type: 'string' }, json: { type: 'boolean', default: false } } })
  if (!values.word || !values['repos-root'] || !values.registry) {
    process.stderr.write('usage: where.ts --word <text> --repos-root <dir> --registry <repo-registry.json> [--json]\n')
    process.exit(2)
  }
  const registry = JSON.parse(readFileSync(values.registry, 'utf8')) as { repos: Array<{ name: string; assignable: boolean }> }
  const schemas = registry.repos
    .filter((repo) => repo.assignable)
    .map((repo) => {
      const path = schemaPath(values['repos-root']!, repo.name)
      return { repo: repo.name, schema: path ? readFileSync(path, 'utf8') : null }
    })
  const result = findTables(schemas, values.word)
  if (values.json) process.stdout.write(`${JSON.stringify({ matches: result.matches, noSchema: result.noSchema }, null, 2)}\n`)
  else process.stdout.write(`${formatMarkdown(result)}\n`)
}

if (import.meta.main) main()
