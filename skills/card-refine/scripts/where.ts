#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

export interface SchemaSource {
  repo: string
  schema: string | null
  migrations?: string[]
}

export interface TableMatch {
  table: string
  owner: string
  alsoLoadedIn: string[]
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
const MIGRATION = /^\d+_create_([a-z0-9_]+?)(?:\.([a-z0-9_]+))?\.rb$/

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

export function tableOwner(sources: SchemaSource[], table: string): string | null {
  const repos = sources.map((source) => source.repo)
  const created = sources.flatMap((source) =>
    (source.migrations ?? []).flatMap((file) => {
      const match = MIGRATION.exec(file)
      return match && match[1] === table ? [{ repo: source.repo, engine: match[2] }] : []
    }),
  )
  const plain = created.find((file) => !file.engine)
  if (plain) return plain.repo
  const engine = created[0]?.engine?.replaceAll('_', '-')
  if (!engine) return null
  return [engine, `klangtech-${engine}`].find((name) => repos.includes(name)) ?? engine
}

function matchTable(table: string, columns: Column[], needle: string): Omit<TableMatch, 'table' | 'owner' | 'alsoLoadedIn'> | null {
  const byName = normalise(table).includes(needle)
  const matchedColumns = columns.filter((column) => normalise(column.name).includes(needle)).map((column) => column.name)
  if (!byName && !matchedColumns.length) return null
  return {
    matchedBy: [...(byName ? ['table name'] : []), ...matchedColumns],
    timeColumns: columns.filter((column) => TIME_TYPES.includes(column.type)).map((column) => column.name),
    matchedColumns,
  }
}

export function findTables(sources: SchemaSource[], word: string): WhereResult {
  const needle = normalise(word)
  const loaders = new Map<string, Array<{ repo: string; columns: Column[] }>>()
  const noSchema: string[] = []
  const noMatch: string[] = []
  for (const { repo, schema } of sources) {
    if (schema === null) {
      noSchema.push(repo)
      continue
    }
    const hits = needle ? [...parseTables(schema)].filter(([table, columns]) => matchTable(table, columns, needle)) : []
    if (!hits.length) noMatch.push(repo)
    for (const [table, columns] of hits) loaders.set(table, [...(loaders.get(table) ?? []), { repo, columns }])
  }
  const matches = [...loaders]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([table, loaded]) => {
      const migrated = tableOwner(sources, table)
      const owner = migrated ?? `${loaded[0]!.repo} (by schema)`
      const base = loaded.find((loader) => loader.repo === migrated) ?? loaded[0]!
      return { table, owner, alsoLoadedIn: loaded.map((loader) => loader.repo).filter((repo) => repo !== (migrated ?? loaded[0]!.repo)), ...matchTable(table, base.columns, needle)! }
    })
  return { matches, noSchema, noMatch }
}

export function schemaPath(reposRoot: string, repo: string): string | null {
  return [join(reposRoot, repo, 'db/schema.rb'), join(reposRoot, repo, 'spec/dummy/db/schema.rb')].find((path) => existsSync(path)) ?? null
}

function migrationFiles(reposRoot: string, repo: string): string[] {
  const dir = join(reposRoot, repo, 'db/migrate')
  return existsSync(dir) ? readdirSync(dir) : []
}

export function formatMarkdown(result: WhereResult): string {
  const rows = result.matches.map((match) => `| ${match.table} | ${match.owner} | ${match.alsoLoadedIn.join(', ')} | ${match.matchedBy.join(', ')} | ${match.timeColumns.join(', ')} | ${match.matchedColumns.join(', ')} |`)
  return [
    '| table | owner | also loaded in | matched by | time columns | other matched columns |',
    '|---|---|---|---|---|---|',
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
  const root = values['repos-root']
  const registry = JSON.parse(readFileSync(values.registry, 'utf8')) as { repos: Array<{ name: string; assignable: boolean }> }
  const sources = registry.repos
    .filter((repo) => repo.assignable)
    .map((repo) => {
      const path = schemaPath(root, repo.name)
      return { repo: repo.name, schema: path ? readFileSync(path, 'utf8') : null, migrations: migrationFiles(root, repo.name) }
    })
  const result = findTables(sources, values.word)
  if (values.json) process.stdout.write(`${JSON.stringify({ matches: result.matches, noSchema: result.noSchema }, null, 2)}\n`)
  else process.stdout.write(`${formatMarkdown(result)}\n`)
}

if (import.meta.main) main()
