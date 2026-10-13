---
card: 14znf2fuvc8
title: "[Army] VAYU – รายงานการทำงานของ VAYU: ยอดรวมทุกเพจ + เมนูรายงาน + นับตามออเดอร์ให้ตรงกับ backoffice"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 20:05 owner: update each — short shape (one line, bullets without ครับ, one closing line, blank lines between paragraphs) after rejecting two longer drafts the same day"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้รายงาน VAYU ใน Army ดูได้ทีละเพจ และเปิดได้จากสเต็ป VAYU ในฟันเนลเท่านั้นครับ

- เมนูใหม่ "รายงาน > การทำงานของ VAYU" แบบของเดิม (backoffice) ส่วนสเต็ป VAYU ในฟันเนลยังเปิดรายงานของเพจนั้นได้เหมือนเดิม
- dropdown เพจ ค่าเริ่มต้นเป็นทุกเพจ คือยอดรวมทุกเพจของร้านที่ VAYU คุยในช่วงวันที่ที่เลือก รวมเพจที่ปิด VAYU ไปแล้ว
- ตัวเลข อัตรา กราฟ และช่วงวันที่ ใช้ได้เหมือนรายงานรายเพจ

ตัวเลขยังนับตามบทสนทนาแบบ Army เดิม ส่วนการนับตามออเดอร์ให้ตรงกับ backoffice ยังไม่มี log ครับ

---

- Requirement นี้เป็นการทำงานที่ Army รายงานการทำงานของ VAYU
- ให้รายงานรายเพจเดิมรับกรณีไม่ระบุเพจเป็นทุกเพจของร้าน (ยอดรวมจึงเท่ากับผลรวมรายเพจ) เพิ่ม dropdown เพจ (แสดงเพจที่มีบทสนทนา VAYU ของร้าน) และเมนูหมวดรายงาน ไม่ใช้หน้าภาพรวมที่ยังว่าง หน้ารายเพจเดิมคงไว้ให้สเต็ปในฟันเนล หมวดรายงานใช้ร่วมกับ [\[Army\] รายงาน – การใช้โทเคน AI (KToken)](https://app.clickup.com/t/3845974/14znf2fuvch)
- ช่วงที่ไม่มีบทสนทนา ตัวเลขเป็น 0 อัตราเป็น – และกราฟขึ้นข้อความว่างแบบรายงานรายเพจ รายงานของเอเจนต์ตัวอื่นไม่เปลี่ยน
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (รวมยอดทุกเพจ dropdown เพจ และเมนูรายงาน) ครับ⁣⁣

## Key facts (atomic, for the judge)
- The VAYU report exists per page today; this card adds the seller level only: รายงาน > การทำงานของ VAYU menu, page dropdown with ทุกเพจ default (sum of pages, including pages that turned VAYU off), same figures, rates, charts and date range.
- Counting stays conversation-based; order-based counting matching backoffice has no card yet.
- Aggregation only: 3 hours, no subtasks.
