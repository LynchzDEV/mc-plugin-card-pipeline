---
card: 14znf2futry
title: "[Army] ปรับ uxui ของการวิเคราะห์แชทด้วย AI"
shape: numbered-cr
verdict: PASS
numberedItems: 4
subItems: ["3.1","3.2","3.3","3.4"]
estimate: 8
subtasks: []
sprint: "Sprint 19AI (12/10 - 16/10)"
ownerFacts: "HerMEZ Lite 0.01 บาท/Conversation, HerMEZ Pro 0.15 บาท/Conversation (stated by the owner 2026-10-12; not in the card)"
approved: "2026-10-12 fixed prices, repo labels and the sprint stand. 2026-10-13 the repository split becomes one parent estimate of 8h, the previously approved 5h plus 3h, not two subtasks."
---
## Comment
**log นี้ข้อมูลเพียงพอสำหรับการทำงานแล้วครับ**
**สรุป**
ทำครบข้อ 1–4 ที่หน้า ลูกค้า ของ Army ครับ ข้อ 2 แสดงราคา "HerMEZ Lite : 0.01 บาท/Conversation" และ "HerMEZ Pro : 0.15 บาท/Conversation" ในหน้าต่างวิเคราะห์ พร้อมค่าใช้จ่ายโดยประมาณ = จำนวนแชทที่เลือก × ราคาของวิธีที่เลือกครับ
ข้อ 3 แสดงวันที่ล่าสุดของข้อ 3.1–3.4 เป็นแถบเดียวเหนือตารางลูกค้า และข้อ 4 อธิบายตามสิ่งที่ปุ่มทำอยู่จริงครับ

---

- Requirement นี้เป็นการทำงานที่ Army หน้า ลูกค้า โดยวันที่ของข้อ 3.2 และ 3.4 มาจากระบบเดิม
- ข้อ 1 เปลี่ยนปุ่ม "ให้ AI ช่วย" เป็น "AI วิเคราะห์แชท" / ข้อ 2 แสดงราคาต่อ Conversation ที่แต่ละวิธี และบรรทัดค่าใช้จ่ายโดยประมาณ ที่คำนวณใหม่ทุกครั้งที่เปลี่ยนเพจ ช่วงวันที่ หรือวิธีวิเคราะห์
- ข้อ 3 แถบวันที่: ดึงประวัติแชทล่าสุด / AI วิเคราะห์ล่าสุด / อัปโหลดไฟล์ออเดอร์จาก Eiz ล่าสุด / อัปเดตจาก Vayu ล่าสุด (ถ้ายังไม่เคยให้ขึ้นว่า "ยังไม่เคย") / ข้อ 4 tooltip บนปุ่ม "ดึงประวัติแชท": "ดึงรายชื่อลูกค้าและข้อความจากเพจ Facebook ตามช่วงวันที่ที่เลือก เพื่อให้ AI วิเคราะห์ต่อได้" ครับ
- **ประมาณการจำนวนชั่วโมง:** 8 ชั่วโมง (หน้าลูกค้า ข้อ 1–4 รวมแถบวันที่และวันที่จากระบบเดิม) ครับ⁣⁣

## Key facts (atomic, for the judge)
- ข้อ 1: rename the button "ให้ AI ช่วย" to "AI วิเคราะห์แชท".
- ข้อ 2: show the per-conversation price for each method (Lite 0.01, Pro 0.15 บาท/Conversation, owner-stated) and an estimated cost = selected chats × the chosen method's price, recomputed when page, date range or method changes; no invented average formula.
- ข้อ 3: one strip above the customer table with the four latest dates (3.1 chat history pull, 3.2 AI analysis, 3.3 order file upload from Eiz, 3.4 update from Vayu), "ยังไม่เคย" when never.
- 3.2 and 3.4 are read from the old system (api); 3.1 and 3.3 are readable on the Army side. That ownership is not a separate subtask.
- ข้อ 4: tooltip on "ดึงประวัติแชท" describing what the pull does.
- One business outcome on the customer list. Parent estimate 8h, the previously approved 5h of screen work plus 3h of date reads. Not a repository split, and not a new owner-provided number.
