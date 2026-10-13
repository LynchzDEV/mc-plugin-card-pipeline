---
card: 14znf2fuvd2
title: "[Army] MoNi – รายงานทั้งหมดของ MoNi"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 21:00 owner: cards 1 and 2 edited to 3h (mostly port, extend each), others as drafted"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้รายงานการใช้คู่สายของ MoNi มีแค่ในของเดิม (backoffice) ส่วน Army ยังไม่มีหน้านี้ จึงทำตามของเดิมครับ

- หน้า "รายงานการใช้คู่สาย" อยู่ในเมนูรายงานของ Army ไม่ใช้หน้าภาพรวมที่ยังว่าง
- ตัวเลขสรุป กราฟ ตารางพื้นฐาน / ละเอียด กรองเพจและสินค้า และค่า AI นาทีละ 2.99 บาทที่ seller เห็น ใช้สูตรเดียวกับของเดิม
- กราฟเพิ่มแบบปิดการขาย และ Export CSV ได้ตามตารางที่เปิดอยู่ ซึ่งของเดิมได้แค่ตารางละเอียด

ยอดโทร ลูกค้า ปิดได้ และค่า AI ยังนับแบบของเดิม คือไม่รวมสายที่ไม่มีลีดในระบบเดิม การนับสายเหล่านั้นยังไม่มี log ครับ

---

- Requirement นี้เป็นการทำงานที่ Army เมนูรายงาน และระบบเดิม (ส่วนอ่านตัวเลขการใช้คู่สายของร้าน)
- เพิ่มช่องทางให้ Army อ่านตัวเลขการใช้คู่สายรายวันของร้านจากชุดคำนวณที่ backoffice ใช้อยู่ ตามช่วงวันที่ เพจ และสินค้า ไม่เขียนสูตรใหม่ / หน้า Army มีปุ่มวันนี้ 7 วัน เดือนนี้ และช่วงวันที่ กล่องยอดเพิ่มเทียบค่า AI การ์ดสรุป 4 ตัว กราฟ 4 แบบ ตาราง 2 แบบกดหัวคอลัมน์เรียงได้ (วันที่ไม่มีข้อมูลเวลาอยู่ท้าย) Calling Time ต่อท้าย (ประมาณ) หรือ (บางส่วนประมาณ) เวลาที่ใช้โทรในตารางพื้นฐานแสดงเป็นนาที
- ทุกตัวเลขคำนวณใหม่เมื่อเปลี่ยนช่วงวันที่ เพจ หรือสินค้า ช่วงที่ไม่มีการโทร ตัวเลขเป็น 0 และค่า AI ขึ้น – แบบของเดิม เมื่อกรองเพจหรือสินค้าแสดงหมายเหตุว่าเวลาคู่สายไม่แยกตามเพจ / CSV ตารางละเอียดใช้ไฟล์ของเดิม ตารางพื้นฐานใช้คอลัมน์ของตาราง / เมนูรายงานใช้ร่วมกับ [\[Army\] VAYU – รายงานการทำงานของ VAYU: ยอดรวมทุกเพจ + เมนูรายงาน + นับตามออเดอร์ให้ตรงกับ backoffice](https://app.clickup.com/t/3845974/14znf2fuvc8) รายงานอื่นของ MoNi ไม่เปลี่ยน
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (หน้ารายงานพร้อมเมนู ตัวกรอง Export CSV และช่องทางอ่านตัวเลขจากระบบเดิม) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Port the backoffice line-usage report into the Army รายงาน menu, reusing the existing api calculation: summary, charts, basic/detailed tables, page and product filters, AI cost 2.99 บาท/นาที, CSV export by open table.
- Counting stays as the old system (calls without an old-system lead excluded); no card covers counting them yet.
- 3 hours (owner: a ported report on an existing calculation is one 3h piece), no subtasks.
