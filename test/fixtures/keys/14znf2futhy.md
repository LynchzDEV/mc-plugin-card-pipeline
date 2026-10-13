---
card: 14znf2futhy
title: "[Army] input vayu new feedback"
shape: numbered-cr
verdict: ASK-HUMAN
numberedItems: 14
estimate: none
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-12 posted by the owner (comment 1301460000010137)"
---
## Comment
**log นี้ข้อมูลพอที่จะเริ่มทำได้เกือบทุกข้อ แต่มีเรื่องที่ Biz ต้องตอบก่อนครับ**
**สรุป**
ข้อ 1 "ตัดออก" จะตัดบรรทัด "แชทด้วย AI · ใช้ใน 4 สเต็ป · เชื่อมกับ 1 เพจ" และการ์ด "ตั้งค่าครบ 3 / 5 ส่วน" ตามกรอบแดงครับ

ข้อ 13 "เป็นค่าระบบได้ไหม" ไม่ต้องทำ เพราะมีตัวแปร "รายการที่สั่ง" ให้แทรกในบทพูดอยู่แล้ว (เอเจนต์ในรูปพิมพ์ชื่อสินค้าเป็นข้อความเอง) ส่วนข้อ 14 รอคำตอบครับ
**คำถาม**
- ข้อ 14 "เพิ่ม ## สอบถามราคา ข้อ 7_1" ต้องการให้ VAYU ที่สร้างใหม่ทุกตัวมีบทพูด "สอบถามราคา" มาให้ตั้งแต่แรกใช่ไหมครับ รบกวนส่งข้อความที่ต้องการให้บอทตอบมาด้วยครับ

---

- Requirement นี้เป็นการทำงานที่ Army หน้าตั้งค่าเอเจนต์ VAYU โดยปรับเฉพาะ VAYU ส่วน HerMEZ / MoNi คงเดิม
- ทำส่วนหัวและการ์ด (ข้อ 1, 5, 7) / รายการสินค้าและกฎอัปเซลล์ (ข้อ 2, 3, 8) / ช่องตัวเลขและช่องที่ยังขาด (ข้อ 4, 6, 9, 10) / หน้าเขียนบทพูด (ข้อ 11, 12) / บทพูดสอบถามราคา (ข้อ 14) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Verdict: enough to start almost everything, but ข้อ 14 needs a business answer (the price-inquiry script text and whether every new VAYU gets it).
- ข้อ 1 removes the header line "แชทด้วย AI · ใช้ใน 4 สเต็ป · เชื่อมกับ 1 เพจ" and the "ตั้งค่าครบ 3 / 5 ส่วน" card (red boxes in the screenshots).
- ข้อ 13 is ไม่ต้องทำ because the "รายการที่สั่ง" variable already exists for inserting into the script.
- Scope is the VAYU agent settings page in Army only; HerMEZ / MoNi untouched.
- Item groups stay in the comment and are not subtasks: (1,5,7) header and cards; (2,3,8) product rows and upsell rules; (4,6,9,10) numeric fields and missing-field marking; (11,12) script-writing page; (14) price-inquiry script, pending the answer.
- No hour estimate, because the verdict is ASK-HUMAN. The open question does not create a child.
- Every one of the 14 items has exactly one disposition; ข้อ 14 is the only question; no priority question.
