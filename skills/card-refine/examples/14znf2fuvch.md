---
card: 14znf2fuvch
title: "[Army] รายงาน – การใช้โทเคน AI (KToken)"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 5
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 20:05 owner: update each — short shape (one line, bullets without ครับ, one closing line, blank lines between paragraphs) after rejecting two longer drafts the same day"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้รายงานการใช้ K-Token มีแค่ในของเดิม (backoffice) ส่วน Army ยังไม่มีหน้านี้ จึงทำตามของเดิมครับ

- เมนูรายงานของ Army มีหน้า "รายงานการใช้ K-Token" เห็นเฉพาะข้อมูลร้านตัวเอง พร้อมยอด K-Token ที่ใช้ไปตามช่วงวันที่ที่เลือก
- ตารางรายการมีเวลา เหตุการณ์ ช่องทาง เพจ ลูกค้า จำนวน K-Token และลิงก์ไปแชท กรอง เรียง และแบ่งหน้าได้ ตัวเลขตรงกับของเดิม

**คำถาม**
- ยอด K-Token คงเหลือยังไม่มีข้อมูลนี้ มีแค่ยอดเครดิตในหน้าเติมเครดิตของ Admin ต้องการให้แสดงยอดเครดิตนั้นในหน้านี้ใช่ไหมครับ
- ของเดิมไม่มีปุ่มดาวน์โหลดรายงานเป็นไฟล์ ต้องการให้เพิ่มในหน้านี้ด้วยใช่ไหมครับ

---

- Requirement นี้เป็นการทำงานที่ Army เมนูรายงาน และระบบเดิม (ส่วนอ่านรายการ K-Token ของร้าน)
- ยอดรวมคิดจากทุกรายการที่ผ่านตัวกรอง ไม่เลือกวันที่คือยอดทั้งหมดของร้าน ไม่มีรายการเป็น 0 / ตัวกรองใช้แบบหน้ารายการออเดอร์ของ Army เรียงล่าสุดก่อน / ชื่อลูกค้ากดไปหน้าลูกค้าของ Army เมื่อร้านมีลูกค้าคนนั้น ไม่มีเป็นข้อความธรรมดา ชื่อว่างขึ้น - ลิงก์แชทว่างเว้นว่าง
- ข้อมูลเดิมย้ายมาใน log [\[Army\] Migrate Data จาก backoffice ไป Army](https://app.clickup.com/t/3845974/14znf2fuver) / หัวข้อเมนูรายงานใช้ร่วมกับ [\[Army\] VAYU – รายงานการทำงานของ VAYU: ยอดรวมทุกเพจ + เมนูรายงาน + นับตามออเดอร์ให้ตรงกับ backoffice](https://app.clickup.com/t/3845974/14znf2fuvc8) / หน้า Super Admin การเปลี่ยนวิธีคิด K-Token และการปิดหน้าของเดิมไม่อยู่ในงานนี้ตามที่ log ระบุ
- **ประมาณการจำนวนชั่วโมง:** 5 ชั่วโมง (หน้ารายงาน ตัวกรอง ยอดรวม และเมนู ไม่รวมยอดคงเหลือและปุ่มดาวน์โหลด) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Port the backoffice K-Token usage report into the Army รายงาน menu: own-shop data, filtered total, table (time, event, channel, page, customer, K-Token, chat link), filter / sort / paging, same numbers as the old screen.
- Remaining balance and file download are asked inside the comment, not estimated.
- Migration card and the shared รายงาน heading are linked in the dev bullets. 5 hours (owner cap for a ported report page), no subtasks.
