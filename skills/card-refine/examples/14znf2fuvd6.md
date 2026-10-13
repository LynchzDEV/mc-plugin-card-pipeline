---
card: 14znf2fuvd6
title: "[Army] MoNi – กฎแจ้งเตือน AI ในการตั้งค่า Agent + ตัวกรองแจ้งเตือนในลีด + กดรับทราบ"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 13
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 21:00 owner: cards 1 and 2 edited to 3h (mostly port, extend each), others as drafted"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้ลีด MoNi ของ Army ถูกตรวจแจ้งเตือนหลังสายด้วยกฎกลางอยู่แล้ว แต่ยังปรับกฎในหน้าตั้งค่า Agent ไม่ได้ และคิวลีดยังไม่แสดงแจ้งเตือนครับ

- ตั้งค่า Agent MoNi มีส่วน "การแจ้งเตือนหลังสาย" สวิตช์ทีละกฎและปุ่มปรับแต่งกฎ ทำตามของเดิม (backoffice) ยังไม่ปรับแต่งก็ใช้และเปลี่ยนตามกฎกลาง
- คิวลีดของสเต็ปกรอง "มีแจ้งเตือน" / "รับทราบแล้ว" และชนิดกฎได้ ถ้ายังไม่มีลีดที่มีแจ้งเตือนขึ้นเป็น 0
- ปุ่ม "รับทราบ" ย้ายลีดไปที่รับทราบแล้ว บันทึกคนกดและเวลา แจ้งเตือนอยู่ในคิวลีดเท่านั้น ไม่ส่งไป LINE หรือเสียง เหมือนของเดิม

หน้าแก้กฎกลางอยู่ใน log [\[Super Admin\] MoNi – กฎแจ้งเตือน AI กลาง](https://app.clickup.com/t/3845974/14znf2fuvcz) ส่วน Agent ตัวอื่นไม่เปลี่ยนครับ

---

- Requirement นี้เป็นการทำงานที่ Army (ตั้งค่า Agent MoNi และคิวลีดของสเต็ป) และระบบเดิม (ส่งข้อมูลแจ้งเตือนและกฎกลางให้ Army)
- ตั้งค่า: เพิ่มส่วน alerts ใน config ของ MoNi เก็บ alert_rules ใน call_context แบบของเดิม (ว่าง = ตามกฎกลางสด, เปิดปิดหรือปรับแต่งครั้งแรก = สำเนาของ Agent นั้น ไม่ตามกฎกลางอีก, 4 กฎกลางปิดหรือแก้คำอธิบายได้แต่ลบไม่ได้ กฎที่เพิ่มเองลบได้) อ่านกฎกลางจากระบบเดิม และให้การตรวจแจ้งเตือนหลังสายอ่านกฎจาก version ของ Army ด้วย (ตอนนี้ลีดของ Army ใช้กฎกลางเสมอ)
- คิวลีด: ตัวกรอง ทั้งหมด / มีแจ้งเตือน / รับทราบแล้ว พร้อมจำนวน และเลือกชนิดกฎจากกฎที่เคยเตือน ปุ่มรับทราบในหน้ารายละเอียดลีด กดได้เฉพาะลีดที่มีแจ้งเตือนที่ยังไม่รับทราบ บันทึกเวลาและคนกด ลีดที่โทรรอบใหม่จะล้างแจ้งเตือนเดิมแล้วตรวจใหม่ตามของเดิม ใช้ตัวกรองและการรับทราบของระบบเดิมที่มีอยู่ ต่อผ่านช่องทางใหม่ให้ Army
- **ประมาณการจำนวนชั่วโมง:** 13 ชั่วโมง (ส่วนการแจ้งเตือนในตั้งค่า Agent ตัวกรองและปุ่มรับทราบในคิวลีด และช่องทางส่งข้อมูลแจ้งเตือนจากระบบเดิม) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Army MoNi leads are already checked by the central rules; missing: an alerts section in Agent settings (per-rule switch, customise), lead-queue filters มีแจ้งเตือน / รับทราบแล้ว by rule type with counts (0 when none), and an acknowledge button recording who and when.
- Alerts stay in the lead queue only (no LINE or sound), parity with backoffice; the central-rule editor is the Super Admin card 14znf2fuvcz.
- Two screens plus a new api seam: 13 hours, no subtasks.
