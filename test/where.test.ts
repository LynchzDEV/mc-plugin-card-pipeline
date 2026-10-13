import { describe, expect, test } from 'bun:test'
import { findTables } from '../skills/card-refine/scripts/where'

const VAYU = `  create_table "army_vayu_deliveries", id: :uuid, force: :cascade do |t|
    t.datetime "closed_at"
    t.string "closed_by"
    t.uuid "company_id", null: false
    t.timestamps
    t.index ["company_id"], name: "index_army_vayu_deliveries_on_company_id"
  end
`

const ARMY = `ActiveRecord::Schema[8.0].define(version: 2026_10_01_000000) do
${VAYU}
  create_table "army_customers", force: :cascade do |t|
    t.string "name"
    t.timestamptz "last_seen_at"
  end
end
`

const CORE = `ActiveRecord::Schema[8.0].define(version: 2026_10_01_000000) do
  create_table "core_orders", force: :cascade do |t|
    t.string "vayu_order_id"
    t.date "ordered_on"
    t.decimal "total"
    t.index "lower(vayu_order_id)", name: "index_core_orders_on_lower_vayu"
  end

  create_table "core_order_imports", force: :cascade do |t|
    t.string "file_name"
    t.timestamptz "imported_at"
  end
end
`

const API = `ActiveRecord::Schema[8.0].define(version: 2026_10_01_000000) do
${VAYU}
  create_table "vayu_rebuild_requests", force: :cascade do |t|
    t.timestamps
  end
end
`

const sources = [
  { repo: 'klangtech-core', schema: CORE, migrations: [] },
  { repo: 'klangtech-army', schema: ARMY, migrations: ['20261002015824_create_army_vayu_deliveries.rb', '20261002015825_create_army_customers.rb'] },
  { repo: 'api', schema: API, migrations: ['20261002033424_create_army_vayu_deliveries.army.rb', '20261002033425_create_vayu_rebuild_requests.rb'] },
  { repo: 'backoffice', schema: null, migrations: [] },
]

describe('findTables', () => {
  test('an engine table copied into the host is one row owned by the engine, also loaded in the host', () => {
    const match = findTables(sources, 'vayu').matches.find((row) => row.table === 'army_vayu_deliveries')
    expect(match).toEqual({
      table: 'army_vayu_deliveries',
      owner: 'klangtech-army',
      alsoLoadedIn: ['api'],
      matchedBy: ['table name'],
      timeColumns: ['closed_at', 'created_at', 'updated_at'],
      matchedColumns: [],
    })
  })

  test('the engine suffix alone names the owner when the engine repo has no plain migration', () => {
    const hostOnly = sources.map((source) => (source.repo === 'klangtech-army' ? { ...source, migrations: [] } : source))
    expect(findTables(hostOnly, 'vayu').matches.find((row) => row.table === 'army_vayu_deliveries')!.owner).toBe('klangtech-army')
  })

  test('a table with a plain migration only in api is owned by api', () => {
    const match = findTables(sources, 'rebuild').matches
    expect(match.map((row) => [row.table, row.owner, row.alsoLoadedIn])).toEqual([['vayu_rebuild_requests', 'api', []]])
  })

  test('a table with no migration anywhere is owned by the first schema that has it, marked by schema', () => {
    const match = findTables(sources, 'vayu').matches.find((row) => row.table === 'core_orders')
    expect(match).toEqual({ table: 'core_orders', owner: 'klangtech-core (by schema)', alsoLoadedIn: [], matchedBy: ['vayu_order_id'], timeColumns: ['ordered_on'], matchedColumns: ['vayu_order_id'] })
  })

  test('a word with no hits returns no matches and lists every schema repo as no match', () => {
    const result = findTables(sources, 'hermez')
    expect(result.matches).toEqual([])
    expect(result.noMatch).toEqual(['klangtech-core', 'klangtech-army', 'api'])
  })

  test('a repo without a schema lands in noSchema', () => {
    expect(findTables(sources, 'vayu').noSchema).toEqual(['backoffice'])
  })

  test('underscores and hyphens in the word match as spaces', () => {
    for (const word of ['order_import', 'order-import', 'order import']) {
      expect(findTables(sources, word).matches.map((row) => row.table)).toEqual(['core_order_imports'])
    }
  })

  test('timestamptz columns count as time columns', () => {
    expect(findTables(sources, 'order_import').matches[0]!.timeColumns).toEqual(['imported_at'])
  })

  test('one row per table, tables alphabetical', () => {
    expect(findTables(sources, 'vayu').matches.map((row) => row.table)).toEqual(['army_vayu_deliveries', 'core_orders', 'vayu_rebuild_requests'])
  })
})
