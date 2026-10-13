---
card: 14znf2fuv78
title: "[Army] Migrate 1 Kood Queue ยังไม่แสดงที่ Army"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 8
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 20:05 owner: update each — short shape (one line, bullets without ครับ, one closing line, blank lines between paragraphs) after rejecting two longer drafts the same day"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้ Army มีแค่บอร์ดคิวของแต่ละสเต็ปในฟันเนล ยังไม่มีหน้ารวมคิวขุดทั้งร้าน และยังกดยกเลิกหรือส่งซ้ำไม่ได้ครับ

- เมนู Kood Queue ใน Army แสดงคิวขุดทั้งร้าน ทำตามของเดิม (backoffice)
- ดูยอดและรายการตามสถานะ ค้นหาชื่อหรือเบอร์โทร กรองเพจ วันที่ และสาเหตุที่ส่งไม่สำเร็จ พร้อมดูข้อความที่ส่ง
- กดยกเลิกและส่งซ้ำได้ในหน้านี้ ทำร่วมกับ log [\[Army\] HerMEZ – คิวขุด/คิวแคร์: ยกเลิก / ส่งซ้ำ / กู้คืน](https://app.clickup.com/t/3845974/14znf2fuvcp)

คิวแคร์ไม่เปลี่ยนใน log นี้ครับ

---

- Requirement นี้เป็นการทำงานที่ Army (หน้า Kood Queue และเมนู) และระบบเดิม (เตรียมข้อความและโควตา)
- หน้า Kood Queue ระดับร้าน อ่านคิวขุดจากแชทและคิวขุดตามกลับของร้านที่เปิดอยู่ ใช้ตัวกรอง ช่องค้นหา (ชื่อหรือเบอร์โทร) และหน้ารายละเอียดของบอร์ดสเต็ป ถ้ายังไม่มีคิวขึ้นว่า ยังไม่มีคิว และยอดทุกสถานะเป็น 0 คิวแคร์ใช้หน้าเดียวกันได้ใน [\[Army\] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79)
- เพิ่มสถานะยกเลิก ยกเลิกได้เฉพาะ pending / ready ที่ยังไม่มีเครื่องรับไปส่ง (คิวจากแชทที่ ready คืนโควตาที่จองไว้ คิวขุดตามกลับไม่ได้จองโควตา) ส่งซ้ำได้เฉพาะ failed รวมโควตาเต็ม (ถ้าโควตายังเต็มแจ้งและไม่ส่ง) คิวจากแชทกลับไป pending เพื่อเตรียมข้อความและหักโควตาใหม่ คิวขุดตามกลับส่งข้อความเดิมซ้ำ ไม่มีปุ่มส่งซ้ำที่ unconfirmed และ no_handle เพื่อกันลูกค้าได้ข้อความซ้ำ ปุ่มกู้คืนเพจของเดิมไม่ได้ขอใน log นี้ คิวเก่าก่อนย้ายระบบใช้ชุดนำเข้าที่มีอยู่แล้ว ไม่นับในชั่วโมงนี้
- **ประมาณการจำนวนชั่วโมง:** 8 ชั่วโมง (หน้า Kood Queue พร้อมเมนูและตัวกรอง ปุ่มยกเลิก / ส่งซ้ำ และการคืน / หักโควตา) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Army has no shop-wide Kood Queue screen and no cancel / resend; build it like the old backoffice screen (counts, status tabs, name/phone search, page / date / failure filters, message view).
- Cancel and resend live in this card, shared with 14znf2fuvcp; the Care queue is unchanged (14znf2fuv79).
- Behaviour rules (which rows can be cancelled or resent, quota) sit in the dev bullets, not the business block.
- One outcome across klangtech-army and api: 8 hours, no subtasks.
