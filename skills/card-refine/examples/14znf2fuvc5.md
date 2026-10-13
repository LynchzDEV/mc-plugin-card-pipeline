---
card: 14znf2fuvc5
title: "[Army] ปรับการ Filter & Display หน้า Customer List"
shape: numbered-cr
verdict: ASK-HUMAN
numberedItems: 4
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 20:05 owner: update each — short shape (one line, bullets without ครับ, one closing line, blank lines between paragraphs) after rejecting two longer drafts the same day"
---
## Comment
**log นี้ข้อมูลพอที่จะทำได้ เหลือความหมายของข้อ 3.2 ที่ Biz ต้องกำหนดก่อนครับ**
**สรุป**
ข้อ 1 มีอยู่แล้ว กรองลูกค้าตามชื่อเพจได้จาก dropdown เพจ ที่ยังขาดคือคอลัมน์ user_id กับวันเวลาของลูกค้า และการเลือกจำนวนแถวต่อหน้าครับ

- ข้อ 2, 3.1, 3.3 ตารางลูกค้ามีคอลัมน์ user_id วันเวลาที่สร้างลูกค้า และวันเวลาที่ลูกค้าทักมาล่าสุด ถ้ายังไม่มีข้อมูลขึ้นว่า "—"
- ข้อ 4 เลือกได้ว่าหน้าละ 10, 25, 50 หรือ 100 แถว เริ่มต้น 25 แถวเท่าเดิม

**คำถาม**
- ข้อ 3.2 "Subscribed Datetime" ยังไม่มีในระบบ หมายถึงวันเวลาของเหตุการณ์ใด รบกวนแจ้งมาด้วยครับ

---

- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า (ตารางลูกค้าและตัวแบ่งหน้า)
- ข้อ 2 แสดงรหัสลูกค้าบน Facebook ของเพจที่เลือก ถ้าดูทุกเพจใช้รหัสล่าสุด เหมือนไฟล์ส่งออก CSV / ข้อ 3.1, 3.3 แสดงวันและเวลาแบบคอลัมน์วันอัปเดต ข้อ 3.3 นับเฉพาะข้อความที่ลูกค้าทักเข้ามาจากทุกเพจ
- ข้อ 4 ใช้ตัวเลือกจำนวนแถวแบบหน้าฟันเนล และจำนวนแถวคงอยู่เมื่อเปลี่ยนหน้า ไฟล์ส่งออกและหน้าอื่นไม่เปลี่ยน
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (คอลัมน์ข้อ 2, 3.1, 3.3 และตัวเลือกจำนวนแถวข้อ 4 รวมการทดสอบ) ครับ⁣⁣

## Key facts (atomic, for the judge)
- ข้อ 1 already exists (page dropdown filters by page); missing today: user_id and customer dates columns, rows per page.
- ข้อ 2, 3.1, 3.3: user_id, created and last-contact columns, "—" when empty. ข้อ 4: 10 / 25 / 50 / 100 rows per page, default 25.
- ข้อ 3.2 Subscribed Datetime has no definition anywhere: one question inside the comment; the other items keep 3 hours.
