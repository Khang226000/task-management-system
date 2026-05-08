# Hướng dẫn bàn giao — CASIC Task

---

## Cấu trúc bàn giao

```
TaskManagementSystem/
├── backend/                  ← Server + API
│   ├── certs/
│   │   ├── server.key        ← Private key (giữ bí mật)
│   │   ├── server.crt        ← Certificate server
│   │   └── ca.crt            ← CA cert (cài trên máy nhân viên)
│   ├── src/                  ← Source code backend
│   └── .env                  ← Cấu hình (DB, port...)
├── frontend/dist/            ← Giao diện đã build sẵn
│
├── start-server.bat          ← ▶ KHỞI ĐỘNG SERVER
├── install-autostart.bat     ← ▶ Cài tự động khởi động
├── setup-hosts-cert.ps1      ← ▶ Cài đặt trên máy nhân viên
├── install-cert.bat          ← ▶ Cài đặt trên máy nhân viên (dễ dùng)
├── backup-data.bat           ← Sao lưu dữ liệu
└── HUONG-DAN-CAI-DAT.md      ← Hướng dẫn chi tiết
```

---

## Checklist bàn giao

### Máy chủ (admin làm 1 lần)

- [ ] Cài **Node.js LTS** — https://nodejs.org
- [ ] Cài **SQL Server Express** — https://microsoft.com/sql-server-downloads
- [ ] Điền thông tin DB vào `backend/.env`
- [ ] Chạy `start-server.bat` (chuột phải → Run as administrator)
- [ ] Chạy `install-autostart.bat` (chuột phải → Run as administrator)
- [ ] Chạy `setup-hosts-cert.ps1` trên máy chủ (nhập IP: 127.0.0.1)
- [ ] Đổi mật khẩu admin tại `https://casictask.local`

### Mỗi máy nhân viên — CHỌN 1 TRONG 2 CÁCH:

**Cách A — Cấu hình router (nhân viên không cần làm gì):**
- [ ] Vào trang quản trị router (thường là http://192.168.1.1)
- [ ] Tìm mục DHCP → DNS Server → nhập IP máy chủ
- [ ] Tìm mục DNS Port → nhập `5454`
- [ ] Lưu và khởi động lại router
- [ ] Nhân viên kết nối lại WiFi → vào `https://casictask.local` ngay

**Cách B — Chạy script trên từng máy (nếu router không hỗ trợ):**
- [ ] Chạy `install-cert.bat` (chuột phải → Run as administrator)
- [ ] Nhập IP máy chủ khi được hỏi
- [ ] Khởi động lại Chrome → vào `https://casictask.local`

---

## Thông tin truy cập

| | Địa chỉ |
|---|---|
| Tất cả máy trong mạng | `https://casictask.local` |
| Máy chủ (local) | `https://localhost` |

## Tài khoản mặc định

| Email | Mật khẩu | Quyền |
|-------|----------|-------|
| admin@qlcv.vn | Admin@2024 | Admin |
| hai@qlcv.vn | Hai@2024 | Giám đốc |
| khanh@qlcv.vn | Khanh@2024 | Phó GĐ |

> ⚠️ Đổi mật khẩu ngay sau khi bàn giao!

---

## Lưu ý kỹ thuật

- **Chứng chỉ SSL** tự ký, hiệu lực 10 năm (đến 2036)
- **Không cần internet** — hoạt động hoàn toàn offline trong mạng LAN
- **Backup** chạy `backup-data.bat` định kỳ hàng tuần
- **Port**: HTTPS 443, HTTP 80 (tự redirect sang HTTPS)
