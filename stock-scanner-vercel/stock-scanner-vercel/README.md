# Stock Scanner Pro

เว็บสแกนหุ้นรายวันสำหรับเปิดบน Browser ผ่าน Vercel

## ใช้ในเครื่อง
```bash
npm install
npm run dev
```
เปิด http://localhost:3000

## Deploy บน Vercel
1. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub
2. เข้า Vercel > Add New Project > Import GitHub repo
3. กด Deploy
4. ได้ลิงก์เว็บ เช่น https://your-project.vercel.app

## หมายเหตุข้อมูล
โปรเจกต์นี้ใช้ Yahoo Finance unofficial endpoint ผ่าน server-side API route ของ Next.js จึงไม่ต้องใส่ API key แต่ข้อมูลอาจดีเลย์/ขาดช่วง/เปลี่ยนแปลงได้ เหมาะสำหรับสแกนเบื้องต้น ไม่ใช่คำแนะนำการลงทุน

## ฟีเจอร์
- สแกนหลาย ticker พร้อมกัน
- Premarket/After-hours % จากข้อมูล pre/post market ถ้ามี
- Volume วันนี้
- Avg Volume 30 วัน
- RVOL
- กรองราคา Volume RVOL และ % ขึ้นก่อนตลาดเปิด
- Preset: AI, Quantum, Space, Small Cap
