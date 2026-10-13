import { describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const LAND = 'skills/card-refine/scripts/land.ts'
const MARKER = '⁣⁣'

function land(taskPath: string, commentsPath?: string) {
  const out = mkdtempSync(join(tmpdir(), 'land-'))
  const args = ['bun', LAND, '--task', taskPath, '--out', out, '--no-download']
  if (commentsPath) args.push('--comments', commentsPath)
  const run = Bun.spawnSync(args)
  expect(run.exitCode, run.stderr.toString()).toBe(0)
  return {
    card: readFileSync(join(out, 'card.md'), 'utf8'),
    fields: JSON.parse(readFileSync(join(out, 'fields.json'), 'utf8')),
  }
}

function fixture(id: string) {
  return land(`test/fixtures/${id}.task.json`, `test/fixtures/${id}.comments.json`)
}

function section(card: string, heading: string): string {
  const start = card.indexOf(`## ${heading}\n`)
  if (start < 0) return ''
  const rest = card.slice(start + heading.length + 4)
  const end = rest.indexOf('\n## ')
  return end < 0 ? rest : rest.slice(0, end)
}

function commentsFile(comments: Array<{ text: string; user?: string; date?: string }>): string {
  const dir = mkdtempSync(join(tmpdir(), 'comments-'))
  const path = join(dir, 'comments.json')
  const body = comments.map((comment, index) => ({
    id: String(index),
    comment_text: comment.text,
    user: { username: comment.user ?? 'Nut' },
    date: comment.date ?? String(1791000000000 + index),
  }))
  writeFileSync(path, JSON.stringify({ comments: body, count: body.length }))
  return path
}

describe('land 14znf2futhy (14 numbered items)', () => {
  const { card, fields } = fixture('14znf2futhy')

  test('reads the fields', () => {
    expect(fields.id).toBe('14znf2futhy')
    expect(fields.numberedItems).toBe(14)
    expect(fields.subItems).toEqual([])
    expect(fields.logType).toBe('CR')
    expect(fields.planning.current).toBe('Sprint 19AI (12/10 - 16/10)')
    expect(fields.planning.latestAiSprint).toEqual({ id: '137cd763-95a9-4479-a10f-e5b702f8f2f6', label: 'Sprint 19AI (12/10 - 16/10)' })
    expect(fields.planning.options.length).toBe(23)
    expect(fields.parent).toBeNull()
    expect(fields.subtasks).toEqual([])
  })

  test('keeps the numbering of the description', () => {
    const description = section(card, 'Description')
    expect(description).toContain('1. ตัดออก')
    expect(description).toContain('14. เพิ่ม ## สอบถามราคา ข้อ 7\\_1')
  })

  test('names every description image by its item, in description order', () => {
    const names = [...section(card, 'Description').matchAll(/!\[shots\/(\d+-\d+)\.png\]\(shots\/(\d+-\d+)\.png\)/g)].map(([, alt, path]) => {
      expect(alt).toBe(path)
      return alt
    })
    expect(names).toEqual(['1-1', '1-2', '2-1', '3-1', '4-1', '5-1', '6-1', '7-1', '8-1', '9-1', '10-1', '11-1', '12-1', '13-1', '14-1'])
    expect(section(card, 'Description')).not.toContain('clickup-attachments.com')
  })

  test('lists the one attachment that the description does not show, by title', () => {
    const lines = section(card, 'Attachments not in description').split('\n').filter((line) => line.startsWith('- '))
    expect(lines).toEqual(['- image.png (67c98e91-4d13-41b1-a7d0-e30e6eedf4a2.png)'])
  })

  test('keeps the human comment and drops our own marked comment', () => {
    const comments = section(card, 'Comments')
    expect(comments).toContain('- **Fixture User 2** (2026-10-13): @Fixture User 3 แก้ไขขึ้น prod')
    expect(comments).not.toContain('Fixture User 4')
    expect(comments).not.toContain('⁣')
  })

  test('writes the sections in contract order', () => {
    const order = ['# [Army] input vayu new feedback (14znf2futhy)', '## Fields', '## Description', '## Comments', '## Attachments not in description'].map((part) => card.indexOf(part))
    expect(order.every((position) => position >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(section(card, 'Fields')).toContain('- Log Type: CR➕')
    expect(section(card, 'Fields')).toContain('- Planning: Sprint 19AI (12/10 - 16/10)')
    expect(section(card, 'Fields')).toContain('- Tags: migrate-1')
  })
})

describe('land the other reference cards', () => {
  test('14znf2futry keeps sub-items and puts the loose image under item 1', () => {
    const { card, fields } = fixture('14znf2futry')
    expect(fields.numberedItems).toBe(4)
    expect(fields.subItems).toEqual(['3.1', '3.2', '3.3', '3.4'])
    expect(section(card, 'Description')).toContain('![shots/1-1.png](shots/1-1.png)')
    expect(fields.parent).toBe('14znf2futr7')
    expect(card).not.toContain('## Attachments not in description')
  })

  test('14znf2fuv78 has no numbered items and sits on Refinement Plan', () => {
    const { card, fields } = fixture('14znf2fuv78')
    expect(fields.numberedItems).toBe(0)
    expect(fields.planning.current).toBe('Refinement Plan')
    expect(fields.parent).toBeNull()
    expect(fields.logType).toBe('CR')
    expect(section(card, 'Comments')).toContain('**Fixture User 1**')
  })

  test('14znf2futr8 is a bug and a subtask of 14znf2futr7', () => {
    const { card, fields } = fixture('14znf2futr8')
    expect(fields.parent).toBe('14znf2futr7')
    expect(fields.logType).toBe('Bug')
    expect(section(card, 'Description')).toContain('![shots/0-1.png](shots/0-1.png)')
    expect(section(card, 'Fields')).toContain('- Parent: 14znf2futr7')
  })
})

describe('comment filter', () => {
  const task = 'test/fixtures/14znf2futr8.task.json'
  const human = 'ช่องค้นหาหายไปจริงครับ'

  function landedComments(texts: string[]): string {
    return section(land(task, commentsFile(texts.map((text) => ({ text })))).card, 'Comments')
  }

  test('drops a comment with two separated U+2063 characters', () => {
    expect(landedComments(['ร่าง⁣ ครับ⁣', human])).not.toContain('ร่าง')
  })

  test('drops the old visible footers', () => {
    const comments = landedComments(['ร่างเก่า\n[🤖 Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]', 'ร่างเก่ากว่า\n[🌚Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]', human])
    expect(comments).not.toContain('ร่างเก่า')
    expect(comments).toContain(human)
  })

  test('drops a comment whose first line flags it as AI', () => {
    expect(landedComments(['⚠️ ความคิดเห็นนี้สร้างโดย AI\nสรุปงาน', human])).not.toContain('สรุปงาน')
  })

  test('drops the AI triage shape with พร้อมทำได้เลย:', () => {
    expect(landedComments(['พร้อมทำได้เลย: ใช่\nเหตุผล: มีรูปครบ', human])).not.toContain('มีรูปครบ')
  })

  test('drops the AI triage shape with พร้อมพัฒนา:', () => {
    expect(landedComments(['พร้อมพัฒนา: ใช่\nเหตุผล ข้อมูลครบ', human])).not.toContain('ข้อมูลครบ')
  })

  test('keeps a human comment that only says พร้อมพัฒนา', () => {
    expect(landedComments(['พร้อมพัฒนา: ใช่ ลุยได้เลย'])).toContain('ลุยได้เลย')
  })

  test('lists human comments oldest first', () => {
    const path = commentsFile([{ text: 'ใหม่กว่า', date: '1791900000000' }, { text: 'เก่ากว่า', date: '1791000000000' }])
    const comments = section(land(task, path).card, 'Comments')
    expect(comments.indexOf('เก่ากว่า')).toBeLessThan(comments.indexOf('ใหม่กว่า'))
  })

  test('writes none when no human comment is left', () => {
    expect(landedComments([`ร่างครับ${MARKER}`]).trim()).toBe('none')
  })
})

describe('downloads', () => {
  test('writes a .missing file and keeps the reference when an image cannot be fetched', () => {
    const dir = mkdtempSync(join(tmpdir(), 'task-'))
    const source = JSON.parse(readFileSync('test/fixtures/14znf2futr8.task.json', 'utf8'))
    const taskPath = join(dir, 'task.json')
    writeFileSync(taskPath, JSON.stringify({ ...source, markdown_description: 'ดูรูป\n![](http://127.0.0.1:9/missing.png)' }))
    const out = mkdtempSync(join(tmpdir(), 'land-'))
    const run = Bun.spawnSync(['bun', LAND, '--task', taskPath, '--out', out])
    expect(run.exitCode, run.stderr.toString()).toBe(0)
    expect(readFileSync(join(out, 'shots', '0-1.missing'), 'utf8')).toContain('http://127.0.0.1:9/missing.png')
    expect(readFileSync(join(out, 'card.md'), 'utf8')).toContain('![shots/0-1.png](shots/0-1.png)')
  })
})
