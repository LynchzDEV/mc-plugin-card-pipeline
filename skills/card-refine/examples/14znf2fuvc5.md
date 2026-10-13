---
card: 14znf2fuvc5
title: "[Army] ปรับการ Filter & Display หน้า Customer List"
shape: numbered-cr
verdict: ASK-HUMAN
numberedItems: 4
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 owner: ok, edit every activity with yours — posted after the owner rejected the first (Codex) drafts as walls of text"
---
## Comment
**log นี้ข้อมูลพอที่จะทำได้ เหลือความหมายของข้อ 3.2 ที่ Biz ต้องกำหนดก่อนครับ**
**สรุป**
ข้อ 1 มีอยู่แล้ว เลือกชื่อเพจจาก dropdown เพจเพื่อกรองรายชื่อลูกค้าตามเพจได้ครับ
ข้อ 2, 3.1 และ 3.3 เพิ่มคอลัมน์ user_id วันเวลาที่สร้างลูกค้า และวันเวลาที่ลูกค้าทักมาล่าสุด ในตารางลูกค้าของ Army ถ้ายังไม่มีข้อมูลให้ขึ้นว่า "—" ครับ
ข้อ 3.2 ยังไม่มีวันเวลานี้ในระบบ จึงรอ Biz ยืนยันความหมายก่อน ข้ออื่นทำได้เลยครับ
ข้อ 4 เลือกจำนวนแถวต่อหน้าได้ 10, 25, 50 หรือ 100 แถว ค่าเริ่มต้นยังเป็น 25 แถวเท่าเดิมครับ
**คำถาม**
- ข้อ 3.2 "Subscribed Datetime" หมายถึงวันเวลาของเหตุการณ์ใด รบกวนแจ้งมาด้วยครับ

---

- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า (ตารางลูกค้าและตัวแบ่งหน้า)
- ข้อ 2 แสดงรหัสลูกค้าบน Facebook ของเพจที่เลือก ถ้าดูทุกเพจใช้รหัสล่าสุด เหมือนไฟล์ส่งออก CSV / ข้อ 3.1, 3.3 แสดงวันและเวลาแบบคอลัมน์วันอัปเดต ข้อ 3.3 นับเฉพาะข้อความที่ลูกค้าทักเข้ามาจากทุกเพจ / ข้อ 4 ใช้ตัวเลือกจำนวนแถวแบบหน้าฟันเนล และจำนวนแถวคงอยู่เมื่อเปลี่ยนหน้า ไฟล์ส่งออกและหน้าอื่นไม่เปลี่ยน
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (คอลัมน์ข้อ 2, 3.1, 3.3 และตัวเลือกจำนวนแถวข้อ 4 รวมการทดสอบ) ครับ⁣⁣

## Key facts (atomic, for the judge)
- ข้อ 1 already exists: the page dropdown filters the customer list by page.
- ข้อ 2, 3.1, 3.3: user_id, created and last-contact columns on the Army customer table, "—" when empty.
- ข้อ 3.2 Subscribed Datetime has no definition anywhere: one question inside the comment; the other items keep their hours.
- ข้อ 4: rows per page 10 / 25 / 50 / 100, default 25.
- 3 hours for ข้อ 2, 3.1, 3.3, 4; no subtasks.
