---
card: 14znf2fuvd7
title: "[Army] MoNi – migrate ให้ใช้ product แทนชื่อกับ SKU"
shape: single-outcome
verdict: PASS
numberedItems: 0
estimate: 8
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
approved: "2026-10-13 21:00 owner: cards 1 and 2 edited to 3h (mostly port, extend each), others as drafted"
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ตอนนี้แถวในชุดข้อเสนอของ MoNi ใน Army มีแค่ป้าย "SKU ที่จับได้" ให้ดูอย่างเดียว ยังเลือกหรือยืนยันสินค้าของแต่ละแถวเองไม่ได้ครับ

- ทุกแถวมีป้าย จับคู่แล้ว (รหัสสินค้าและจำนวน) / AI เดา — ตรวจ / ไม่พบสินค้า กดแล้วค้นหาสินค้าของบริษัท เลือกคู่ และตั้งจำนวน เท่ากับ หรือ ตั้งแต่ ทำตามของเดิม (backoffice)
- ด้านบนบอก "ต้องตรวจ N แถว" (ไม่พบสินค้า และ AI เดา ถ้าไม่มีขึ้น 0) กับปุ่ม "จับคู่ใหม่" ที่ลองใหม่เฉพาะแถวเหล่านั้น ไม่ทับแถวที่ seller ยืนยันแล้ว และไม่หักเครดิต
- ออเดอร์ได้ข้อเสนอจากแถวที่จับคู่แล้วเท่านั้น แถว AI เดาใช้ได้หลัง seller ยืนยัน

หน้ารวม SKU ที่ระบบไม่รู้จักระดับบริษัทไม่อยู่ใน log นี้ตามที่ระบุ และยังไม่มี log สำหรับหน้านั้นครับ

---

- Requirement นี้เป็นการทำงานที่ Army (ตั้งค่า Agent MoNi ส่วนชุดข้อเสนอ) และระบบเดิม (ค้นหาสินค้าและการหาข้อเสนอให้ออเดอร์)
- เก็บผลจับคู่ของแต่ละแถว (สถานะ สินค้า จำนวน เท่ากับ / ตั้งแต่ และว่า seller ยืนยันเอง) ให้คงอยู่ตอนบันทึกและเผยแพร่ ใช้รายการสินค้าและการจับคู่ใหม่ชุดเดียวกับของเดิม ซึ่งข้ามแถวที่ยืนยันแล้ว เปิดใช้ตามร้านเหมือนของเดิม
- agent MoNi ที่เผยแพร่จาก Army เปลี่ยนจากให้ AI เดาแถวตอนออเดอร์เข้า เป็นเทียบสินค้าในออเดอร์กับแถวที่จับคู่แล้ว กฎอัปเซลล์ใน backoffice และ agent ตัวอื่นไม่เปลี่ยน
- **ประมาณการจำนวนชั่วโมง:** 8 ชั่วโมง (ป้ายและหน้าต่างเลือกสินค้า ปุ่มจับคู่ใหม่และยอดต้องตรวจ การเก็บผลจับคู่ และการหาข้อเสนอให้ออเดอร์จากแถวที่จับคู่แล้ว) ครับ⁣⁣

## Key facts (atomic, for the judge)
- Each MoNi offer row in Army gets a match badge (matched / AI guess to review / not found) with a product picker and quantity equal / at-least, like backoffice; a "ต้องตรวจ N แถว" count (0 when none) and a rematch button that skips seller-confirmed rows and charges no credit.
- Orders match only confirmed rows; AI-guessed rows count after the seller confirms.
- The company-level unknown-SKU page is out of scope and has no card. 8 hours, no subtasks.
