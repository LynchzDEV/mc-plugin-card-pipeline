import { describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { CARDS, type Key, packageFromKey, readKeyFixture, tempFile } from './helpers'

const SCORE = 'skills/card-refine/scripts/score.ts'
const STUB = `bun ${resolve('test/fixtures/judge-stub.ts')}`
const NUMBERED = new Set(['14znf2futry', '14znf2futhy'])

interface Score {
  score: number | null
  hardFails: Array<{ code: string; evidence: string }>
  dimensions: Record<string, number | null>
  parts: { subtasks: { count: number; repos: number; intent: number | null } }
  unknowns: string[]
  empty: string[]
  judgeRuns: number
  mode: string
}

const cardDirs = new Map<string, string>()

function cardDir(card: string): string {
  if (!cardDirs.has(card)) {
    const out = mkdtempSync(join(tmpdir(), `score-${card}-`))
    const run = Bun.spawnSync(['bun', 'skills/card-refine/scripts/land.ts', '--task', `test/fixtures/${card}.task.json`, '--comments', `test/fixtures/${card}.comments.json`, '--out', out, '--no-download'])
    expect(run.exitCode, run.stderr.toString()).toBe(0)
    cardDirs.set(card, out)
  }
  return cardDirs.get(card)!
}

function score(key: Key, pack: string, flags: string[], env: Record<string, string> = {}): Score {
  const out = join(mkdtempSync(join(tmpdir(), 'score-out-')), 'score.json')
  const args = ['bun', SCORE, '--package', tempFile('package.md', pack), '--card', cardDir(key.card), '--out', out, ...flags]
  const run = Bun.spawnSync(args, { env: { ...process.env, ...env } })
  expect(run.exitCode, run.stderr.toString()).toBe(0)
  const printed = JSON.parse(run.stdout.toString()) as Score
  expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual(printed)
  return printed
}

function mechanical(key: Key, pack = packageFromKey(key)): Score {
  return score(key, pack, ['--key', key.path, '--mechanical-only'])
}

function judged(key: Key, mode: string, pack = packageFromKey(key)): Score {
  return score(key, pack, ['--key', key.path, '--judge', STUB], { JUDGE_STUB_MODE: mode })
}

function codes(result: Score): string[] {
  return result.hardFails.map((fail) => fail.code)
}

describe('mechanical scoring of each key against itself', () => {
  for (const card of CARDS) {
    test(card, () => {
      const result = mechanical(readKeyFixture(card))
      expect(result.hardFails).toEqual([])
      expect(result.dimensions.verdict).toBe(25)
      expect(result.score).toBeNull()
      expect(result.judgeRuns).toBe(0)
      expect(result.mode).toBe('key')
      for (const dimension of ['facts', 'coverage', 'precision']) expect(result.dimensions[dimension]).toBeNull()
      if (card === '14znf2futhy') {
        expect(result.dimensions.estimate).toBeNull()
        expect(result.empty).toContain('estimate')
      } else {
        expect(result.dimensions.estimate).toBe(10)
      }
      if (NUMBERED.has(card)) {
        expect(result.dimensions.subtasks).toBe(15)
      } else {
        expect(result.dimensions.subtasks).toBe(10)
        expect(result.parts.subtasks.intent).toBeNull()
      }
    })
  }
})

describe('mechanical hard fails', () => {
  const futr8 = readKeyFixture('14znf2futr8')
  const futry = readKeyFixture('14znf2futry')
  const futhy = readKeyFixture('14znf2futhy')
  const fuv78 = readKeyFixture('14znf2fuv78')

  test('the futry first draft fails lint', () => {
    const draft = readFileSync('test/fixtures/first-drafts/14znf2futry.md', 'utf8')
    const result = mechanical(futry, packageFromKey(futry, { comment: draft }))
    expect(codes(result)).toContain('lint')
    expect(result.score).toBe(0)
  })

  test('a declared verdict other than the key is wrong-verdict', () => {
    expect(codes(mechanical(futr8, packageFromKey(futr8, { verdict: 'NEEDS-INFO' })))).toContain('wrong-verdict')
  })

  test('a free first line under PASS is verdict-inconsistent', () => {
    const comment = futr8.comment.replace('log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ', 'log นี้ขอเพิ่มช่องค้นหาครับ')
    expect(codes(mechanical(futr8, packageFromKey(futr8, { comment })))).toContain('verdict-inconsistent')
  })

  test('the PASS line under a declared ASK-HUMAN is verdict-inconsistent', () => {
    const comment = futhy.comment.replace('log นี้ข้อมูลพอที่จะเริ่มทำได้เกือบทุกข้อ แต่มีเรื่องที่ Biz ต้องตอบก่อนครับ', 'log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ')
    expect(codes(mechanical(futhy, packageFromKey(futhy, { comment })))).toContain('verdict-inconsistent')
  })

  test('one subtask where the key has two earns no count points', () => {
    const result = mechanical(fuv78, packageFromKey(fuv78, { subtasks: [fuv78.subtasks[0]!] }))
    expect(result.parts.subtasks.count).toBe(0)
    expect(result.parts.subtasks.repos).toBe(0)
  })

  test('a draft twice as long as the key is too-long', () => {
    const extra = Array.from({ length: 20 }, (_, index) => `- รายละเอียดเพิ่มเติมลำดับที่ ${index + 1}`).join('\n')
    const comment = futr8.comment.replace('- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า', `- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า\n${extra}`)
    expect(codes(mechanical(futr8, packageFromKey(futr8, { comment })))).toContain('too-long')
  })

  test('numbered intent compares item sets, not titles', () => {
    const swapped = futry.subtasks.map((subtask, index) => ({ ...subtask, title: index === 0 ? 'หน้าจอ Army (ข้อ 1, 2)' : subtask.title }))
    expect(mechanical(futry, packageFromKey(futry, { subtasks: swapped })).parts.subtasks.intent).toBe(0)
  })

  test('a subtask line without its sprint is subtask-unparseable', () => {
    const pack = packageFromKey(fuv78).replaceAll(` — ${fuv78.sprint}`, '')
    const result = mechanical(fuv78, pack)
    expect(codes(result)).toContain('subtask-unparseable')
    expect(result.score).toBe(0)
  })

  test('3.5 hours on a subtask fails lint', () => {
    const subtasks = fuv78.subtasks.map((subtask, index) => ({ ...subtask, hours: index === 0 ? 3.5 : subtask.hours }))
    expect(codes(mechanical(fuv78, packageFromKey(fuv78, { subtasks })))).toContain('lint')
  })

  test('an estimate two buckets off earns half', () => {
    const comment = futr8.comment.replace('3 ชั่วโมง (', '8 ชั่วโมง (')
    const pack = packageFromKey(futr8, { comment }).replace('ESTIMATE: 3', 'ESTIMATE: 8')
    expect(mechanical(futr8, pack).dimensions.estimate).toBe(5)
  })
})

describe('judged scoring with the stub judge', () => {
  for (const card of CARDS) {
    const key = readKeyFixture(card)

    test(`${card} against its own key scores 100`, () => {
      const result = judged(key, 'all-yes')
      expect(result.hardFails).toEqual([])
      expect(result.score).toBe(100)
      expect(result.judgeRuns).toBe(2)
      expect(result.empty).toEqual({ '14znf2futhy': ['estimate'], '14znf2futr8': ['subtasks.intent'] }[card as string] ?? [])
      expect(existsSync(join(cardDir(card), 'judge-prompt-1.md'))).toBe(true)
      expect(existsSync(join(cardDir(card), 'judge-prompt-2.md'))).toBe(true)
    })

    test(`${card} with every key fact missed loses the facts points`, () => {
      const result = judged(key, 'k-no')
      expect(result.dimensions.facts).toBe(0)
      expect(result.score).toBe(NUMBERED.has(card) ? 75 : 60)
    })
  }

  test('a judge that prints no JSON is judge-unparseable', () => {
    const result = judged(readKeyFixture('14znf2futr8'), 'no-json')
    expect(codes(result)).toContain('judge-unparseable')
    expect(result.score).toBe(0)
  })

  for (const mode of ['items-missing', 'claims-missing', 'duplicate-claim', 'claim-without-text', 'bad-verdict', 'duplicate-item']) {
    test(`a judge answer with ${mode} is judge-unparseable`, () => {
      const result = judged(readKeyFixture('14znf2futr8'), mode)
      expect(codes(result)).toContain('judge-unparseable')
      expect(result.score).toBe(0)
    })
  }

  test('the prompt shuffles items differently per seed', () => {
    const key = readKeyFixture('14znf2futhy')
    judged(key, 'all-yes')
    const order = (seed: number) => [...readFileSync(join(cardDir(key.card), `judge-prompt-${seed}.md`), 'utf8').matchAll(/^- ([KIS]\d+):/gm)].map(([, id]) => id)
    expect(order(1).toSorted()).toEqual(order(2).toSorted())
    expect(order(1)).not.toEqual(order(2))
  })
})

describe('scoring without a key', () => {
  const futr8 = readKeyFixture('14znf2futr8')
  const anchors = tempFile('anchors.md', '| subtask | repo | hours | card |\n|---|---|---|---|\n| search box | klangtech-army | 3 | 14znf2futr8 |\n')

  function noKey(pack: string, mode = 'all-yes'): Score {
    return score(futr8, pack, ['--no-key', '--anchors', anchors, '--judge', STUB], { JUDGE_STUB_MODE: mode })
  }

  test('a grounded, consistent package scores 100', () => {
    const result = noKey(packageFromKey(futr8))
    expect(result.mode).toBe('no-key')
    expect(result.hardFails).toEqual([])
    expect(result.score).toBe(100)
  })

  for (const mode of ['claims-missing', 'duplicate-claim', 'claim-without-text']) {
    test(`a judge answer with ${mode} is judge-unparseable`, () => {
      const result = noKey(packageFromKey(futr8), mode)
      expect(codes(result)).toContain('judge-unparseable')
      expect(result.score).toBe(0)
    })
  }

  test('PASS without all three checks is confidence-mismatch', () => {
    const pack = packageFromKey(futr8).replace('B yes — code', 'B no — code not read')
    expect(codes(noKey(pack))).toContain('confidence-mismatch')
  })

  test('the mechanical part runs without a judge', () => {
    const result = score(futr8, packageFromKey(futr8), ['--no-key', '--anchors', anchors, '--mechanical-only'])
    expect(result.score).toBeNull()
    expect(result.dimensions.verdict).toBe(25)
    expect(result.dimensions.subtasks).toBe(10)
    expect(result.dimensions.facts).toBeNull()
  })
})
