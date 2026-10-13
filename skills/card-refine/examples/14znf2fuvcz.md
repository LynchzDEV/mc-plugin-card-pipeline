---
card: 14znf2fuvcz
title: "[Super Admin] MoNi – กฎแจ้งเตือน AI กลาง (ค่าเริ่มต้นทุกบริษัท)"
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
ตอนนี้กฎแจ้งเตือนกลางของ MoNi แก้ได้แค่ในของเดิม (backoffice) ส่วนหน้าตั้งค่าการโทร MoNi ใน Super Admin ยังไม่มีส่วนนี้ครับ

- ส่วน "กฎแจ้งเตือนเริ่มต้น" ต่อจากบทพูด เบอร์โทร และชื่อ ใช้กฎชุดเดียวกับ backoffice เห็นเฉพาะ user ที่เข้า Super Admin ได้
- ตารางกฎละแถว มีชื่อกฎ คำอธิบาย เปิด/ปิด เพิ่ม ลบ และบันทึกทั้งตาราง ช่องว่างขึ้นข้อความผิดพลาด ไม่มีกฎขึ้นว่า ยังไม่มีกฎแจ้งเตือน
- แก้กฎกลางมีผลทันทีกับกฎอัปเซลที่ยังใช้ค่ากลาง กฎอัปเซลที่มีชุดกฎของตัวเองไม่ถูกเขียนทับ และไม่เก็บประวัติผู้แก้ เหมือนของเดิม

กฎแจ้งเตือนรายบริษัทใน Army อยู่ใน log [\[Army\] MoNi – กฎแจ้งเตือน AI ในการตั้งค่า Agent + ตัวกรองแจ้งเตือนในลีด + กดรับทราบ](https://app.clickup.com/t/3845974/14znf2fuvd6) ครับ

---

- Requirement นี้เป็นการทำงานที่ Super Admin หน้าตั้งค่าการโทร MoNi
- เพิ่มการ์ดที่ 4 ในหน้าตั้งค่าการโทร อ่านและบันทึกกฎกลางชุดเดิมของระบบเดิมแบบเดียวกับการ์ดบทพูด เบอร์โทร ชื่อ เพิ่ม/ลบแถวแบบกฎเบอร์โทร กฎใหม่ได้รหัสอัตโนมัติแบบของเดิม ใช้การตรวจชื่อกฎและคำอธิบายที่มีอยู่แล้ว ระบบเดิมไม่ต้องแก้
- กฎอัปเซลที่สร้างใหม่ยังได้สำเนากฎกลางตอนสร้าง (บริษัทปิดหรือแก้คำอธิบายได้ ลบไม่ได้) ลบกฎกลางมีผลเฉพาะกฎอัปเซลที่ยังใช้ค่ากลาง สำเนาเดิมยังมีกฎนั้นอยู่ ปิดทุกกฎคือไม่มีแจ้งเตือนจากกฎกลาง หน้า backoffice ยังแก้ได้ตามเดิม
- **ประมาณการจำนวนชั่วโมง:** 3 ชั่วโมง (ส่วนกฎแจ้งเตือนเริ่มต้นในหน้าตั้งค่าการโทร MoNi ของ Super Admin) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Add a fourth card to the Super Admin MoNi call-settings page editing the same master alert-rules row backoffice edits: table of rules, on/off, add, remove, save; empty state "ยังไม่มีกฎแจ้งเตือน".
- Edits apply live to upsell rules still following the master list; rules with their own copy are untouched; no edit history (parity).
- Per-company rules in Army are the sibling card 14znf2fuvd6. 3 hours (owner: a port that extends existing cards), no subtasks.
