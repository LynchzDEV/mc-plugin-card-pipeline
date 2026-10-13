---
card: 14znf2fuvc8
title: "[Army] VAYU – รายงานการทำงานของ VAYU: ยอดรวมทุกเพจ + เมนูรายงาน + นับตามออเดอร์ให้ตรงกับ backoffice"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 3
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 owner: ok, edit every activity with yours — posted after the owner rejected the first (Codex) drafts as walls of text"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
รายงาน VAYU มีอยู่แล้วระดับเพจ (กดจากสเต็ป VAYU ในฟันเนล) ทำเพิ่มเฉพาะระดับร้าน คือรวมทุกเพจของร้านในรายงานเดียวกันครับ
เพิ่มเมนู "การทำงานของ VAYU" ในหมวดใหม่ "รายงาน" แบบของเดิม (backoffice) ไม่ใช้หน้าภาพรวมเพราะยังเป็นหน้าว่างครับ
ในรายงานมี dropdown เพจ ค่าเริ่มต้นเป็นทุกเพจ คือผลรวมของทุกเพจที่ VAYU คุยในช่วงวันที่ที่เลือก รวมเพจที่ปิด VAYU ไปแล้ว ตัวเลข อัตรา และกราฟคิดใหม่เมื่อเปลี่ยนเพจหรือช่วงวันที่ ถ้ายังไม่มีบทสนทนา ตัวเลขเป็น 0 อัตราเป็น – และกราฟขึ้นว่า ไม่มีบทสนทนาเริ่มในช่วงที่เลือก ครับ
งานนี้คงวิธีนับแบบรายงาน Army เดิม (นับตามบทสนทนา) ตัวเลข Lead และ Vayu ปิด จึงไม่เท่ากับของเดิมที่นับรายคนและรายออเดอร์ ส่วนการนับตามออเดอร์ให้ตรงกับ backoffice ยังไม่มี log ครับ
กดจากสเต็ป VAYU ในฟันเนลยังเปิดรายงานของเพจนั้นเหมือนเดิม รายงานของเอเจนต์ตัวอื่นไม่เปลี่ยนครับ

---

- Requirement นี้เป็นการทำงานที่ Army รายงานการทำงานของ VAYU
- ให้รายงานรายเพจเดิมรับกรณีไม่ระบุเพจเป็นทุกเพจของร้าน เพิ่มหน้าระดับร้านพร้อม dropdown เพจ และเมนูหมวดรายงาน หน้ารายเพจเดิมคงไว้ให้สเต็ปในฟันเนล หมวดรายงานใช้ร่วมกับ [\[Army\] รายงาน – การใช้โทเคน AI (KToken)](https://app.clickup.com/t/3845974/14znf2fuvch)
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (รวมยอดทุกเพจ dropdown เพจ และเมนูรายงาน) ครับ⁣⁣

## Key facts (atomic, for the judge)
- The VAYU report already exists per page (from the funnel VAYU step); this card adds only the seller level: every page in one report.
- New "การทำงานของ VAYU" entry under a new รายงาน section (shared with 14znf2fuvch); not the empty ภาพรวม page.
- Page dropdown, ทุกเพจ by default = sum of pages including pages that turned VAYU off; figures recompute on page or date change; empty state 0 / – / "ไม่มีบทสนทนาเริ่มในช่วงที่เลือก".
- Counting stays conversation-based as today; order-based counting matching backoffice has no card yet.
- Aggregation only: 3 hours, no subtasks.
