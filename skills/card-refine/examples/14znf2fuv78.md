---
card: 14znf2fuv78
title: "[Army] Migrate 1 Kood Queue ยังไม่แสดงที่ Army"
shape: split
verdict: PASS
numberedItems: 0
estimate: none
subtasks:
  - repo: klangtech-army
    title: "หน้า Kood Queue พร้อมปุ่มยกเลิก / ส่งซ้ำ"
    items: []
    hours: 13
  - repo: api
    title: "เตรียมข้อความใหม่และจัดการโควตาเมื่อยกเลิก / ส่งซ้ำ"
    items: []
    hours: 3
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-12 ”go post all and move to 19AI”; owner corrections after posting: labels by repo, subtasks on the sprint"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
แอดมินต้องการเมนู Kood Queue ใน Army เพื่อดูคิวขุดรายลูกค้า สถานะ ผลส่งสำเร็จ / ไม่สำเร็จ และกดยกเลิก / ส่งซ้ำได้ ตอนนี้ Army มีแค่บอร์ดของแต่ละสเต็ปในฟันเนล ยังไม่มีหน้ารวมคิวขุดทั้งร้านครับ
ทำหน้าตา ตัวกรอง และเงื่อนไขปุ่มตามของเดิม (backoffice) ครับ: ยกเลิกได้เฉพาะคิวที่ยังไม่ส่ง ส่งซ้ำได้เฉพาะคิวที่ส่งไม่สำเร็จ และการส่งซ้ำจะหักโควตาใหม่ครับ

---

- Requirement นี้เป็นการทำงานที่ Army และระบบเดิม (ส่วนเตรียมข้อความและโควตา)
- แยกเป็น 2 subtask: [klangtech-army] หน้า Kood Queue พร้อมปุ่มยกเลิก / ส่งซ้ำ 13 ชั่วโมง / [api] เตรียมข้อความใหม่และจัดการโควตาเมื่อยกเลิก / ส่งซ้ำ 3 ชั่วโมง
- หน้า Kood Queue ทั้งร้าน: รายการคิวขุดรายลูกค้า แท็บสถานะ ยอดสำเร็จ / ไม่สำเร็จแยกสาเหตุ ค้นหา กรองเพจ / ช่วงวันที่ / เวลาทำการ ดูข้อความที่ส่ง และเมนู Kood Queue ในแถบเมนู Army (ทำให้ใช้ซ้ำกับ [\[Army] Migrate 1 Care Queue ยังไม่แสดงที่ Army](https://app.clickup.com/t/3845974/14znf2fuv79) ได้)
- ยกเลิก: คิวที่รอส่งและยังไม่มีเครื่องรับไปส่ง ปิดเป็น "ยกเลิก" และคืนโควตาที่จองไว้ / ส่งซ้ำ: คิวที่ส่งไม่สำเร็จกลับเข้าคิว ข้อความขุดจากแชทจะเตรียมใหม่และหักโควตาใหม่ ส่วนข้อความขุดตามกลับส่งข้อความเดิมซ้ำครับ⁣⁣

## Key facts (atomic, for the judge)
- Army has no shop-wide Kood Queue screen; only the per-step HerMEZ board inside a funnel.
- The old screen is the backoffice Kood Queue; its look, filters and button conditions are the reference.
- Cancel applies only to queue rows not yet sent; it returns reserved quota.
- Resend applies only to failed rows; a resend from chat prepares the message again and takes quota again; nudge resend sends the same message.
- The work spans klangtech-army (screen, menu, cancel/resend) and api (re-preparation and quota), 13h + 3h.
- The screen is built to be reused by the Care Queue card 14znf2fuv79.
