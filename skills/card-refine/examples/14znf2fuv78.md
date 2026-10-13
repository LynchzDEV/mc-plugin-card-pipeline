---
card: 14znf2fuv78
title: "[Army] Migrate 1 Kood Queue ยังไม่แสดงที่ Army"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 8
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 owner: ok, edit every activity with yours — posted after the owner rejected the first (Codex) drafts as walls of text"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้ Army มีแค่บอร์ดคิวของแต่ละสเต็ปในฟันเนล ยังไม่มีหน้ารวมคิวขุดทั้งร้าน และยังกดยกเลิกหรือส่งซ้ำไม่ได้ครับ

จะเพิ่มเมนู Kood Queue ทำตามของเดิม (backoffice) ครับ

มียอดและแท็บตามสถานะ ตัวกรองเพจ วันที่ และสาเหตุที่ส่งไม่สำเร็จ พร้อมดูข้อความที่ส่งครับ

ช่องค้นหาใช้ชื่อหรือเบอร์โทรแบบบอร์ดสเต็ปของ Army ครับ

ถ้ายังไม่มีคิว ให้ขึ้นว่า ยังไม่มีคิว และยอดทุกสถานะเป็น 0 ครับ

ยกเลิกได้เฉพาะคิวที่รอส่งและยังไม่มีเครื่องรับไปส่งครับ

คิวจากแชทได้โควตาที่จองไว้คืน ส่วนคิวขุดตามกลับไม่ได้จองโควตาครับ

ส่งซ้ำได้เฉพาะคิวที่ส่งไม่สำเร็จ ถ้าโควตาเต็มจะแจ้งและไม่ส่งครับ

คิวจากแชทเตรียมข้อความใหม่และหักโควตาใหม่ ส่วนคิวขุดตามกลับส่งข้อความเดิมซ้ำครับ

คิวที่ไม่รู้ว่าถึงลูกค้าแล้วหรือยังจะไม่มีปุ่มส่งซ้ำ เพื่อกันลูกค้าได้ข้อความซ้ำครับ

ปุ่มกู้คืนเพจไม่ได้ขอใน log นี้จึงไม่ต้องทำครับ

ปุ่มยกเลิกและส่งซ้ำอยู่ในงานนี้ และใช้ร่วมกับ log [\[Army\] HerMEZ – คิวขุด/คิวแคร์: ยกเลิก / ส่งซ้ำ / กู้คืน](https://app.clickup.com/t/3845974/14znf2fuvcp) ครับ

คิวแคร์ไม่เปลี่ยนใน log นี้ครับ

---

- Requirement นี้เป็นการทำงานที่ Army (หน้า Kood Queue และเมนู) และระบบเดิม (เตรียมข้อความและโควตา)
- หน้า Kood Queue ระดับร้าน อ่านคิวขุดจากแชทและคิวขุดตามกลับของร้านที่เปิดอยู่ ใช้ตัวกรองและหน้ารายละเอียดของบอร์ดสเต็ปที่มีอยู่ คิวแคร์ใช้หน้าเดียวกันได้ใน [\[Army\] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79)
- เพิ่มสถานะยกเลิก ยกเลิกได้ที่ pending / ready (ready คืนโควตา) ส่งซ้ำได้ที่ failed รวมโควตาเต็ม คิวจากแชทกลับไป pending เพื่อเตรียมและจองโควตาใหม่ คิวขุดตามกลับส่งแถวเดิมซ้ำ ไม่รวม unconfirmed และ no_handle คิวเก่าก่อนย้ายระบบใช้ชุดนำเข้าที่มีอยู่แล้ว ไม่นับในชั่วโมงนี้
- **ประมาณการจำนวนชั่วโมง:** 8 ชั่วโมง (หน้า Kood Queue พร้อมเมนูและตัวกรอง ปุ่มยกเลิก / ส่งซ้ำ และการคืน / หักโควตา) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Army has no shop-wide Kood Queue screen and no cancel / resend; the old backoffice screen sets parity (counts, tabs, page / date / failure filters, message view).
- Search by name or phone like the Army step board; empty state "ยังไม่มีคิว" with all counts 0.
- Cancel only queued rows no device has taken; chat-origin rows get their reserved quota back; nudge rows reserved none.
- Resend only failed rows; quota full is reported and nothing is sent; chat-origin rows re-prepare and re-reserve, nudge rows resend the same message; unconfirmed rows get no resend button.
- Recover is not asked here; the Care queue is unchanged (14znf2fuv79). Cancel / resend are shared with 14znf2fuvcp.
- One outcome across klangtech-army and api: 8 hours, no subtasks.
