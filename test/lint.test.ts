import { describe, expect, test } from 'bun:test'
import { readFileSync, readdirSync } from 'node:fs'
import { type LintSubtask } from '../skills/card-refine/scripts/lint'
import { CARDS, type Key, readKeyFixture, tempFile } from './helpers'

const LINT = 'skills/card-refine/scripts/lint.ts'
const MARKER = '⁣⁣'

interface LintOptions {
  verdict: string
  items?: number
  subitems?: string[]
  subtasks?: LintSubtask[]
}

function lint(comment: string, options: LintOptions) {
  const args = ['bun', LINT, '--comment', tempFile('comment.md', `${comment}\n`), '--verdict', options.verdict, '--items', String(options.items ?? 0)]
  if (options.subitems?.length) args.push('--subitems', options.subitems.join(','))
  if (options.subtasks) args.push('--subtasks', tempFile('subtasks.json', JSON.stringify(options.subtasks)))
  const run = Bun.spawnSync(args)
  const output = run.stdout.toString()
  const codes = output.split('\n').filter((line) => line && !line.startsWith('warn ') && line !== 'clean').map((line) => line.split(':')[0])
  return { exitCode: run.exitCode, output, codes, stderr: run.stderr.toString() }
}

function keyOptions(key: Key): LintOptions {
  return { verdict: key.verdict, items: key.numberedItems, subitems: key.subItems, subtasks: key.subtasks }
}

const futr8 = readKeyFixture('14znf2futr8')
const futhy = readKeyFixture('14znf2futhy')
const fuv78 = readKeyFixture('14znf2fuv78')

function expectCode(comment: string, options: LintOptions, code: string) {
  const result = lint(comment, options)
  expect(result.exitCode, result.output).toBe(1)
  expect(result.codes, result.output).toContain(code)
  return result
}

describe('canonical keys', () => {
  for (const card of CARDS) {
    test(`${card} is clean`, () => {
      const key = readKeyFixture(card)
      const result = lint(key.comment, keyOptions(key))
      expect(result.output.trim().split('\n').at(-1), result.output + result.stderr).toBe('clean')
      expect(result.exitCode).toBe(0)
    })
  }
})

describe('raw first drafts', () => {
  for (const file of readdirSync('test/fixtures/first-drafts')) {
    test(`${file} is not clean`, () => {
      const card = file.replace('.md', '')
      const key = CARDS.includes(card as (typeof CARDS)[number]) ? readKeyFixture(card) : undefined
      const result = lint(readFileSync(`test/fixtures/first-drafts/${file}`, 'utf8'), key ? keyOptions(key) : { verdict: 'PASS' })
      expect(result.exitCode).toBe(1)
      expect(result.codes.length).toBeGreaterThan(0)
    })
  }
})

describe('verdict line', () => {
  test('a reserved line of another verdict fails', () => {
    expectCode(futr8.comment, { ...keyOptions(futr8), verdict: 'NEEDS-INFO' }, 'verdict-line')
  })

  test('a free log นี้ line fails under PASS', () => {
    expectCode(futhy.comment, { ...keyOptions(futhy), verdict: 'PASS' }, 'verdict-line')
  })

  test('a free log นี้ line passes under STOP', () => {
    const comment = futr8.comment.replace('log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ', 'log นี้ซ้ำกับงานที่ปิดไปแล้วครับ')
    expect(lint(comment, { ...keyOptions(futr8), verdict: 'STOP' }).codes).not.toContain('verdict-line')
  })

  test('the exact PASS line fails under ASK-HUMAN', () => {
    const comment = futhy.comment.replace('log นี้ข้อมูลพอที่จะเริ่มทำได้เกือบทุกข้อ แต่มีเรื่องที่ Biz ต้องตอบก่อนครับ', 'log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ')
    expectCode(comment, keyOptions(futhy), 'verdict-line')
  })

  test('a first line that is not bold fails', () => {
    expectCode(futr8.comment.replace('**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**', 'log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ'), keyOptions(futr8), 'layout-first-line')
  })

  test('the verdict is required', () => {
    const run = Bun.spawnSync(['bun', LINT, '--comment', tempFile('comment.md', futr8.comment)])
    expect(run.exitCode).toBe(2)
  })
})

describe('layout', () => {
  test('an unknown bold heading fails', () => {
    expectCode(futr8.comment.replace('**แผนแก้**', '**วิธีแก้**'), keyOptions(futr8), 'business-heading')
  })

  test('three questions fail', () => {
    const question = futhy.comment.split('\n').find((line) => line.startsWith('- ข้อ 14'))!
    expectCode(futhy.comment.replace(question, [question, question, question].join('\n')), keyOptions(futhy), 'question-limit')
  })

  test('a divider without empty lines around it fails', () => {
    expectCode(futr8.comment.replace('\n\n---\n\n', '\n---\n'), keyOptions(futr8), 'layout-divider')
  })

  test('a dev line that is not a bullet fails', () => {
    expectCode(futr8.comment.replace('- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า', '- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า\nต่อบรรทัด'), keyOptions(futr8), 'dev-bullets')
  })

  test('the first dev bullet must name where the work happens', () => {
    expectCode(futr8.comment.replace('- Requirement นี้เป็นการทำงานที่', '- งานนี้อยู่ที่'), keyOptions(futr8), 'dev-bullets')
  })

  test('a business line without ครับ fails', () => {
    expectCode(futr8.comment.replace('ตกหล่นไปตอนย้ายหน้าจอครับ', 'ตกหล่นไปตอนย้ายหน้าจอ'), keyOptions(futr8), 'krap-ending')
  })

  test('the marker must close the comment once', () => {
    expectCode(futr8.comment.replace(MARKER, ''), keyOptions(futr8), 'layout-final-marker')
    expectCode(futr8.comment.replace('**ต้นเหตุ**', `**ต้นเหตุ**${MARKER}`), keyOptions(futr8), 'layout-final-marker')
    expectCode(`${futr8.comment} `, keyOptions(futr8), 'layout-final-marker')
  })

  test('more than 15 lines is a warning only', () => {
    const extra = Array.from({ length: 12 }, (_, index) => `- ข้อสังเกตเพิ่มเติมลำดับที่ ${index + 1}`).join('\n')
    const comment = futr8.comment.replace('- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า', `- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า\n${extra}`)
    const result = lint(comment, keyOptions(futr8))
    expect(result.exitCode, result.output).toBe(0)
    expect(result.output).toContain('warn length:')
  })
})

describe('numbered items', () => {
  test('a missing item fails', () => {
    const result = expectCode(futhy.comment.replace('(ข้อ 4, 6, 9, 10)', '(ข้อ 4, 6, 10)'), keyOptions(futhy), 'numbered-item-missing')
    expect(result.output).toContain('ข้อ 9')
  })

  test('a range cites every item in it', () => {
    const comment = futr8.comment.replace('**ต้นเหตุ**', '**สรุป**\nทำข้อ 1–3 ครบครับ\n**ต้นเหตุ**')
    expect(lint(comment, { ...keyOptions(futr8), items: 3 }).codes).not.toContain('numbered-item-missing')
  })

  test('a sub-item counts as cited through its parent', () => {
    const comment = futr8.comment.replace('**ต้นเหตุ**', '**สรุป**\nทำข้อ 1 และข้อ 2 ครบครับ\n**ต้นเหตุ**')
    expect(lint(comment, { ...keyOptions(futr8), items: 2, subitems: ['2.1', '2.2'] }).codes).toEqual([])
  })

  test('an item both dropped and worked on fails', () => {
    const comment = futhy.comment.replace('ข้อ 13 "เป็นค่าระบบได้ไหม" ไม่ต้องทำ', 'ข้อ 13 และข้อ 12 ไม่ต้องทำ')
    expectCode(comment, keyOptions(futhy), 'numbered-item-conflict')
  })

  test('a question plus a work group is allowed', () => {
    expect(lint(futhy.comment, keyOptions(futhy)).codes).not.toContain('numbered-item-conflict')
  })

  test('descending numbers in one line are a warning only', () => {
    const result = lint(futhy.comment, keyOptions(futhy))
    expect(result.exitCode).toBe(0)
    expect(result.output).toContain('warn numbered-item-order:')
  })
})

describe('subtasks and hours', () => {
  const subtasks = [{ repo: 'klangtech-army', title: 'ช่องค้นหา', items: [], hours: 3 }]
  const child = { repo: 'klangtech-army', title: 'หน้าคิวที่ส่งมอบได้', items: [] as string[], hours: 8 }

  test('a repo outside the registry fails', () => {
    expectCode(fuv78.comment, { ...keyOptions(fuv78), subtasks: [{ ...child, repo: 'Old server' }] }, 'repo-not-in-registry')
  })

  test('a title carrying its own [repo] prefix fails', () => {
    expectCode(fuv78.comment, { ...keyOptions(fuv78), subtasks: [{ ...child, title: '[klangtech-army] หน้า Kood Queue' }] }, 'repo-not-in-registry')
  })

  test('4 hours on a subtask fails', () => {
    expectCode(fuv78.comment, { ...keyOptions(fuv78), subtasks: [{ ...child, hours: 4 }] }, 'hours-not-fibonacci')
  })

  test('4 hours in the estimate line fails', () => {
    expectCode(futr8.comment.replace('3 ชั่วโมง (', '4 ชั่วโมง ('), keyOptions(futr8), 'hours-not-fibonacci')
  })

  test('3.5 hours in the estimate line fails', () => {
    expectCode(futr8.comment.replace('3 ชั่วโมง (', '3.5 ชั่วโมง ('), keyOptions(futr8), 'hours-not-fibonacci')
  })

  test('an estimate line next to subtasks fails', () => {
    expectCode(futr8.comment, { ...keyOptions(futr8), subtasks }, 'parent-hours-with-slices')
  })

  test('a subtask with no hours fails', () => {
    const comment = futr8.comment.replace('- **ประมาณการจำนวนชั่วโมง:**', '- งานอยู่ที่หน้าลูกค้า ชั่วโมงอยู่ที่ subtask ครับ\n- ไม่ใช้บรรทัด')
    expectCode(comment, { ...keyOptions(futr8), subtasks: [{ repo: 'klangtech-army', title: 'ช่องค้นหา', hours: null }] }, 'hours-not-fibonacci')
    expectCode(comment, { ...keyOptions(futr8), subtasks: [{ repo: 'klangtech-army', title: 'ช่องค้นหา' }] }, 'hours-not-fibonacci')
  })

  test('Fibonacci hours on a subtask and no parent estimate pass the hours check', () => {
    const comment = futr8.comment.replace('- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (ช่องค้นหาตามชื่อและเบอร์โทร, ให้ผลค้นหาคงอยู่เมื่อเปลี่ยนตัวกรอง เปลี่ยนหน้า และส่งออก CSV, รวมชุดทดสอบ) ครับ', '- งานของช่องค้นหาอยู่ในการ์ดย่อยครับ')
    const result = lint(comment, { ...keyOptions(futr8), subtasks: [{ repo: 'klangtech-army', title: 'ช่องค้นหา', hours: 3 }] })
    expect(result.codes, result.output).not.toContain('hours-not-fibonacci')
    expect(result.codes, result.output).not.toContain('parent-hours-with-slices')
    expect(result.exitCode, result.output).toBe(0)
  })
})

describe('words and links', () => {
  test('[Old server] in a dev bullet fails', () => {
    expectCode(futr8.comment.replace('ที่ Army หน้า ลูกค้า', 'ที่ [Old server] หน้า ลูกค้า'), keyOptions(futr8), 'forbidden-token')
  })

  test('Domains fails', () => {
    expectCode(futr8.comment.replace('ที่ Army หน้า ลูกค้า', 'ที่ Domains หน้า ลูกค้า'), keyOptions(futr8), 'forbidden-token')
  })

  test('ไม่ต้องพัฒนา fails', () => {
    expectCode(futhy.comment.replace('ไม่ต้องทำ เพราะ', 'ไม่ต้องพัฒนา เพราะ'), keyOptions(futhy), 'forbidden-token')
  })

  test('[Army] as a work label fails, a linked card titled [Army] passes', () => {
    expectCode(fuv78.comment.replace('ที่ Army และระบบเดิม', 'ที่ [Army] และระบบเดิม'), keyOptions(fuv78), 'forbidden-token')
    expect(fuv78.comment).toContain('[\\[Army\\] Migrate 1 Care Queue')
  })

  test('a file path or a type name fails', () => {
    expectCode(futr8.comment.replace('หน้า ลูกค้า\n', 'หน้า ลูกค้า app/views/army/customers.erb\n'), keyOptions(futr8), 'forbidden-token')
    expectCode(futr8.comment.replace('หน้า ลูกค้า\n', 'หน้า ลูกค้า Army::Customer\n'), keyOptions(futr8), 'forbidden-token')
  })

  test('a bare ClickUp URL fails', () => {
    expectCode(futr8.comment.replace('ตกหล่นไปตอนย้ายหน้าจอครับ', 'ตกหล่นไปตอนย้ายหน้าจอ https://app.clickup.com/t/14znf2futr7 ครับ'), keyOptions(futr8), 'bare-card-url')
  })

  test('the same card linked twice fails', () => {
    const link = '[\\[Army\\] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79)'
    expectCode(fuv78.comment.replace('คิวแคร์ไม่เปลี่ยนในการ์ดนี้', `คิวแคร์ไม่เปลี่ยนในการ์ดนี้ ${link}`), keyOptions(fuv78), 'card-linked-twice')
  })

  test('a question about urgency fails', () => {
    expectCode(futhy.comment.replace('มาให้ตั้งแต่แรกใช่ไหมครับ', 'มาให้ตั้งแต่แรกด่วนไหมครับ'), keyOptions(futhy), 'priority-question')
  })

  test('general process advice under แผนป้องกัน fails', () => {
    expectCode(futr8.comment.replace('\n\n---', '\n**แผนป้องกัน**\nทดสอบให้ละเอียดก่อนส่งงานครับ\n\n---'), keyOptions(futr8), 'generic-prevention')
  })

  test('a phone number or an email fails', () => {
    expectCode(futr8.comment.replace('และเบอร์โทร และ', 'และเบอร์โทร เช่น 0812345678 และ'), keyOptions(futr8), 'personal-data')
    expectCode(futr8.comment.replace('และเบอร์โทร และ', 'และเบอร์โทร เช่น someone@example.com และ'), keyOptions(futr8), 'personal-data')
  })

  test('an English comment with Thai framing fails', () => {
    const comment = [
      '**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**',
      '**สรุป**',
      'The customer list lost its search box during the migration and we will add it back above the table ครับ',
      'Search works by name and phone together with the existing filters and the export ครับ',
      '',
      '---',
      '',
      '- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า',
      `- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง ครับ${MARKER}`,
    ].join('\n')
    expectCode(comment, keyOptions(futr8), 'not-thai')
  })
})

describe('scope moved to a sibling card', () => {
  const sibling = '[\\[Army] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79)'
  const withBusinessLine = (line: string) => futr8.comment.replace('ตกหล่นไปตอนย้ายหน้าจอครับ', `ตกหล่นไปตอนย้ายหน้าจอครับ\n${line}`)

  test('ไม่ต้องทำ next to a card link fails', () => {
    const result = expectCode(withBusinessLine(`ส่วนช่องกรองไม่ต้องทำ เพราะ ${sibling} รับไปแล้วครับ`), keyOptions(futr8), 'scope-moved-to-sibling')
    expect(result.output).toContain('work handed to 14znf2fuv79 on line "ส่วนช่องกรองไม่ต้องทำ')
  })

  test('ไปทำใน next to a card link fails', () => {
    expectCode(withBusinessLine(`ส่วนช่องกรองไปทำใน ${sibling} ครับ`), keyOptions(futr8), 'scope-moved-to-sibling')
  })

  test('ไม่รวม next to a card link fails', () => {
    expectCode(withBusinessLine(`งานนี้ไม่รวมช่องกรอง ซึ่งอยู่กับ ${sibling} ครับ`), keyOptions(futr8), 'scope-moved-to-sibling')
  })

  test('it is an error, not a warning', () => {
    const result = lint(withBusinessLine(`ส่วนช่องกรองยกไป ${sibling} ครับ`), keyOptions(futr8))
    expect(result.exitCode, result.output).toBe(1)
    expect(result.output).toMatch(/^scope-moved-to-sibling:/m)
    expect(result.output).not.toContain('warn scope-moved-to-sibling')
  })

  test('ทำร่วมกับ next to a card link passes', () => {
    const result = lint(withBusinessLine(`ช่องค้นหานี้ทำร่วมกับ ${sibling} ครับ`), keyOptions(futr8))
    expect(result.codes, result.output).not.toContain('scope-moved-to-sibling')
    expect(result.exitCode, result.output).toBe(0)
  })

  test('a phrase inside the linked card title alone passes', () => {
    const titled = '[งานที่ไม่รวมช่องกรอง](https://app.clickup.com/t/3845974/14znf2fuv79)'
    expect(lint(withBusinessLine(`ช่องค้นหานี้เกี่ยวข้องกับ ${titled} ครับ`), keyOptions(futr8)).codes).not.toContain('scope-moved-to-sibling')
  })

  test('a phrase without a card link passes', () => {
    expect(lint(withBusinessLine('ส่วนช่องกรองไม่ต้องทำในรอบนี้ครับ'), keyOptions(futr8)).codes).not.toContain('scope-moved-to-sibling')
  })
})

describe('short and tight', () => {
  const head = '**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**\n**สรุป**\n'
  const tail = '\n\n---\n\n- Requirement นี้เป็นการทำงานที่ Army\n- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (งาน) ครับ' + MARKER + '\n'
  const codesFor = (business: string) => lint(head + business + tail, { verdict: 'PASS' }).codes

  test('a business block over 1,000 characters is an error', () => {
    expect(codesFor(Array.from({ length: 6 }, () => 'ทำตามของเดิมครับ '.repeat(12)).join('\n'))).toContain('business-too-long')
  })

  test('a business block over 8 lines is an error', () => {
    expect(codesFor(Array.from({ length: 9 }, (_, index) => `ข้อ ${index + 1} ทำตามของเดิมครับ`).join('\n'))).toContain('business-too-long')
  })

  test('a single line over 360 characters is an error', () => {
    expect(codesFor('ทำตามของเดิมครับ '.repeat(25))).toContain('line-too-long')
  })

  test('a bare ข้อ N ไม่ต้องทำครับ is an error, with a reason it is not', () => {
    expect(codesFor('ข้อ 1 ไม่ต้องทำครับ')).toContain('bare-not-needed')
    expect(codesFor('ข้อ 1 มีอยู่แล้ว ค้นชื่อเพจได้จาก dropdown เพจครับ')).not.toContain('bare-not-needed')
  })

  test('a short approved-size block passes all three', () => {
    const codes = codesFor('ทำตามของเดิม (backoffice) ครับ\nข้อ 1 มีอยู่แล้วครับ')
    expect(codes).not.toContain('business-too-long')
    expect(codes).not.toContain('line-too-long')
    expect(codes).not.toContain('bare-not-needed')
  })
})

describe('one-line STOP', () => {
  const dup = '**log นี้ซ้ำกับ [\\[Army\\] ระบบจัดการ Customer ฝั่ง Army](https://app.clickup.com/t/3845974/86d4caked) ที่ทำอยู่แล้ว ไม่ทำซ้ำครับ**' + MARKER + '\n'

  test('a bold one-line duplicate with the marker passes as STOP', () => {
    const result = lint(dup, { verdict: 'STOP' })
    expect(result.codes).toEqual([])
    expect(result.exitCode).toBe(0)
  })

  test('the same line without bold fails', () => {
    expect(lint(dup.replaceAll('**', ''), { verdict: 'STOP' }).codes).toContain('layout-first-line')
  })

  test('a one-line comment is not accepted for PASS', () => {
    expect(lint(dup, { verdict: 'PASS' }).codes).toContain('layout-divider')
  })
})
