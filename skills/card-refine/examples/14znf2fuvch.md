---
card: 14znf2fuvch
title: "[Army] รายงาน – การใช้โทเคน AI (KToken)"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 5
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 owner: ok, edit every activity with yours — posted after the owner rejected the first (Codex) drafts as walls of text"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
แอดมินของร้านจะดูการใช้ K-Token ของร้านตัวเองใน Army ได้ครับ ตอนนี้มีแค่ในของเดิม (backoffice) หน้า การใช้โทเคน AI ส่วน Army ยังไม่มีเมนูรายงานครับ
ทำตามของเดิมครับ ด้านบนเป็นจำนวน K-Token ที่ใช้ไปตามตัวกรองที่เลือก ไม่เลือกวันที่คือยอดทั้งหมดของร้าน ไม่มีรายการเป็น 0 ตารางมีเวลา เหตุการณ์ ช่องทาง ชื่อเพจ ชื่อลูกค้า จำนวน K-Token และลิงก์ไปแชท กรองวันที่ เพจ ช่องทาง เหตุการณ์ได้แบบหน้ารายการออเดอร์ของ Army เรียงและแบ่งหน้าได้ ใช้ข้อมูลชุดเดียวกับของเดิมจึงตรงกันครับ
ชื่อลูกค้ากดไปหน้าลูกค้าของ Army ได้เมื่อร้านมีลูกค้าคนนั้น ไม่มีก็เป็นข้อความธรรมดา ไม่มีชื่อขึ้น - ไม่มีลิงก์แชทช่องว่างครับ การย้ายข้อมูลเดิมอยู่ใน log [\[Army\] Migrate Data จาก backoffice ไป Army](https://app.clickup.com/t/3845974/14znf2fuver) ครับ
**คำถาม**
- ยอด K-Token คงเหลือไม่มีในของเดิมและยังไม่มีข้อมูลนี้ มีแค่ยอดเครดิตในหน้าเติมเครดิตของ Admin ต้องการให้แสดงยอดเครดิตนั้นในหน้านี้ใช่ไหมครับ
- ของเดิมไม่มีปุ่มดาวน์โหลดรายงานเป็นไฟล์ ต้องการให้เพิ่มในหน้านี้ด้วยใช่ไหมครับ

---

- Requirement นี้เป็นการทำงานที่ Army เมนูรายงาน และระบบเดิม (ส่วนอ่านรายการ K-Token ของร้าน)
- หน้ารายงานใหม่อ่านรายการ K-Token ตาม seller ของร้านผ่านช่องอ่านใหม่ในระบบเดิม ยอดรวมคิดจากทุกรายการที่ผ่านตัวกรอง หัวข้อเมนูรายงานใช้ร่วมกับ [\[Army\] VAYU – รายงานการทำงานของ VAYU: ยอดรวมทุกเพจ + เมนูรายงาน + นับตามออเดอร์ให้ตรงกับ backoffice](https://app.clickup.com/t/3845974/14znf2fuvc8) หน้า Super Admin การเปลี่ยนวิธีคิด K-Token และการปิดหน้าของเดิมไม่อยู่ในงานนี้ตามที่ log ระบุ
- **ประมาณการจำนวนชั่วโมง:** 5 ชั่วโมง (หน้ารายงาน ตัวกรอง ยอดรวม และเมนู ไม่รวมยอดคงเหลือและปุ่มดาวน์โหลด) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Port the backoffice K-Token usage report into a new Army รายงาน menu: filtered total, table (time, event, channel, page, customer, K-Token, chat link), filters like the Army orders list, sort and paging; same data as the old screen.
- Customer name links to the Army customer page when the shop has that customer, plain text otherwise; "-" when no name; blank chat link when none.
- Remaining K-Token balance and file download are asked inside the comment, not estimated.
- Data migration is named with its card (14znf2fuver).
- One ported report page = 5 hours (owner cap); no subtasks.
