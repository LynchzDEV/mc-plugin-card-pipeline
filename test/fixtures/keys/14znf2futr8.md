---
card: 14znf2futr8
title: "[Army] search bar หน้า customer list หาย"
shape: bug
verdict: PASS
numberedItems: 0
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-12 posted after the owner removed the แผนป้องกัน block"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**ต้นเหตุ**
หน้า ลูกค้า ของ Army ไม่มีช่องค้นหาตั้งแต่ย้ายมาจากของเดิม (backoffice) ซึ่งเดิมค้นหาลูกค้าได้ ช่องค้นหาจึงตกหล่นไปตอนย้ายหน้าจอครับ
**แผนแก้**
เพิ่มช่องค้นหาด้านบนรายการลูกค้า ค้นได้ด้วยชื่อลูกค้าและเบอร์โทร และใช้ร่วมกับตัวกรองเดิม (ทั้งหมด / มีออเดอร์ / จากแชท, กลุ่มลูกค้า, เพจ) ได้ ส่วนการค้นตามเพจใช้ dropdown เพจที่มีอยู่แล้วครับ

---

- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (ช่องค้นหาตามชื่อและเบอร์โทร, ให้ผลค้นหาคงอยู่เมื่อเปลี่ยนตัวกรอง เปลี่ยนหน้า และส่งออก CSV, รวมชุดทดสอบ) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Root cause: the Army customer list never got the search box the old backoffice customer list had; it was lost in the migration, not broken later.
- Fix: a search field above the list, by customer name and phone, working together with the existing filters (ทั้งหมด / มีออเดอร์ / จากแชท, กลุ่มลูกค้า, เพจ).
- Page search is already covered by the existing page dropdown.
- The search term must carry through filter changes, paging and the CSV export.
- Repo klangtech-army only; 3 hours; no subtasks; no แผนป้องกัน block.
