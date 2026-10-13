---
card: 14znf2fuv78
title: "[Army] Migrate 1 Kood Queue ยังไม่แสดงที่ Army"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 8
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 agent reassessment to 8h after the owner rejected 16h; the owner did not provide 8. No subtasks: one business outcome across klangtech-army and api."
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
แอดมินต้องการเมนู Kood Queue ใน Army เพื่อดูคิวขุดรายลูกค้า สถานะ ผลส่งสำเร็จ / ไม่สำเร็จ และกดยกเลิก / ส่งซ้ำได้ ตอนนี้ Army มีแค่บอร์ดของแต่ละสเต็ปในฟันเนล ยังไม่มีหน้ารวมคิวขุดทั้งร้านครับ
ทำตามของเดิม (backoffice) ครับ ช่องค้นหาใช้ชื่อหรือเบอร์โทรแบบหน้ารายชื่อลูกค้าของ Army และช่วงวันที่กับเวลาทำการใช้แบบบอร์ดสเต็ป ถ้ายังไม่มีคิว รายการขึ้นว่า ยังไม่มีคิว และยอดสำเร็จ / ไม่สำเร็จเป็น 0 ปุ่มยกเลิกและส่งซ้ำอยู่ในงานนี้ ทำร่วมกับ [\[Army\] HerMEZ – คิวขุด/คิวแคร์: ยกเลิก / ส่งซ้ำ / กู้คืน](https://app.clickup.com/t/3845974/14znf2fuvcp) ครับ
ยกเลิกได้เฉพาะคิวที่รอส่งและยังไม่มีเครื่องรับไปส่ง ปิดเป็น "ยกเลิก" คิวจากแชทที่จองโควตาไว้ได้โควตากลับ คิวขุดตามกลับไม่ได้จองโควตารายวัน ส่งซ้ำได้เฉพาะคิวที่ส่งไม่สำเร็จ ถ้าโควต้ายังเต็มให้แจ้งว่าโควต้าเต็ม คิวจากแชทเตรียมข้อความใหม่และหักโควตาใหม่ คิวขุดตามกลับส่งข้อความเดิมซ้ำครับ
ปุ่มกู้คืนเพจ หน้าตรวจของทีม และการกดหลายคิวพร้อมกันไม่ต้องทำครับ

---

- Requirement นี้เป็นการทำงานที่ Army และระบบเดิม (ส่วนเตรียมข้อความและโควตา)
- หน้า Kood Queue ทั้งร้านของร้านที่เปิดอยู่: รายการคิวขุดรายลูกค้า แท็บสถานะ ยอดสำเร็จ / ไม่สำเร็จแยกสาเหตุ กรองเพจ ดูข้อความที่ส่ง และเมนู Kood Queue ในแถบเมนู Army คิวแคร์ไม่เปลี่ยนในการ์ดนี้ และทำให้ใช้ซ้ำกับ [\[Army\] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79) ได้
- **ประมาณการจำนวนชั่วโมง:** 8 ชั่วโมง รวมหน้าคิว ตัวกรอง ปุ่มยกเลิก / ส่งซ้ำ การจัดการโควตา และการทดสอบ โดยใช้ส่วนแสดงผลและส่วนเตรียมข้อความที่มีอยู่แล้วร่วมกันครับ⁣⁣

## Key facts (atomic, for the judge)
- Army has no shop-wide Kood Queue screen; only the per-step HerMEZ board inside a funnel.
- Parity with the old screen (backoffice): search by name or phone like the Army customer list; date range and business hours like the step board; an empty queue shows "ยังไม่มีคิว" and the success and failure totals are 0.
- Cancel applies only to rows waiting to send that no worker has taken; the status becomes "ยกเลิก". A chat-queued row that reserved quota gets it back. A nudge row did not reserve a daily quota.
- Resend applies only to failed rows. When quota is full, say so. A chat-sourced row prepares the message again and takes quota again. A nudge row sends the same message again.
- Page recovery, the team debug view, and multi-row actions are ไม่ต้องทำ.
- Cancel and resend stay on this card, shared with 14znf2fuvcp. The screen can be reused by Care Queue 14znf2fuv79. Care Queue behavior does not change on this card.
- One business outcome across klangtech-army and api. No subtasks. The parent estimate is 8h, the agent's reassessment after the owner rejected 16h. The owner did not specify 8. 8h is not an owner-provided number.
- Queue screen, cancel and resend, message preparation and quota stay technical notes on the parent comment and the report. They are not children.
