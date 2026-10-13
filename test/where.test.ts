import { describe, expect, test } from 'bun:test'
import { findTables } from '../skills/card-refine/scripts/where'

const ARMY = `ActiveRecord::Schema[8.0].define(version: 2026_10_01_000000) do
  create_table "army_vayu_deliveries", id: :uuid, force: :cascade do |t|
    t.datetime "closed_at"
    t.string "closed_by"
    t.uuid "company_id", null: false
    t.timestamps
    t.index ["company_id"], name: "index_army_vayu_deliveries_on_company_id"
  end

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

const schemas = [
  { repo: 'klangtech-army', schema: ARMY },
  { repo: 'klangtech-core', schema: CORE },
  { repo: 'backoffice', schema: null },
]

describe('findTables', () => {
  test('a table whose name holds the word reports its time columns, t.timestamps included', () => {
    const match = findTables(schemas, 'vayu').matches.find((row) => row.table === 'army_vayu_deliveries')
    expect(match).toEqual({ repo: 'klangtech-army', table: 'army_vayu_deliveries', matchedBy: ['table name'], timeColumns: ['closed_at', 'created_at', 'updated_at'], matchedColumns: [] })
  })

  test('a column holding the word matches its table in another repo, ignoring index lines', () => {
    const match = findTables(schemas, 'VAYU').matches.find((row) => row.repo === 'klangtech-core')
    expect(match).toEqual({ repo: 'klangtech-core', table: 'core_orders', matchedBy: ['vayu_order_id'], timeColumns: ['ordered_on'], matchedColumns: ['vayu_order_id'] })
  })

  test('a word with no hits returns no matches and lists every schema repo as no match', () => {
    const result = findTables(schemas, 'hermez')
    expect(result.matches).toEqual([])
    expect(result.noMatch).toEqual(['klangtech-army', 'klangtech-core'])
  })

  test('a repo without a schema lands in noSchema', () => {
    expect(findTables(schemas, 'vayu').noSchema).toEqual(['backoffice'])
  })

  test('underscores and hyphens in the word match as spaces', () => {
    for (const word of ['order_import', 'order-import', 'order import']) {
      expect(findTables(schemas, word).matches.map((row) => row.table)).toEqual(['core_order_imports'])
    }
  })

  test('timestamptz columns count as time columns', () => {
    expect(findTables(schemas, 'order_import').matches[0]!.timeColumns).toEqual(['imported_at'])
  })

  test('tables come out in registry order, then alphabetically', () => {
    const result = findTables(schemas, 'a')
    expect(result.matches.map((row) => `${row.repo}/${row.table}`)).toEqual([
      'klangtech-army/army_customers',
      'klangtech-army/army_vayu_deliveries',
      'klangtech-core/core_order_imports',
      'klangtech-core/core_orders',
    ])
  })
})
