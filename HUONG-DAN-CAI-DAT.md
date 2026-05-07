# HƯỚNG DẪN CÀI ĐẶT & SỬ DỤNG
# CASIC Task — Hệ thống quản lý công việc nội bộ

---

## TỔNG QUAN

```
┌─────────────────────────────────────────────────────┐
│  MÁY CHỦ (1 máy duy nhất — do IT/Admin quản lý)    │
│                                                     │
│  Cài 2 phần mềm (1 lần duy nhất):                  │
│    • Node.js                                        │
│    • SQL Server Express                             │
│                                                     │
│  Chạy: start-server.bat (mỗi khi bật máy)          │
│  Hoặc: cài tự động khởi động (1 lần)               │
│                                                     │
│  Phục vụ tại: https://casictask.local               │
│  Cổng HTTPS : 443  |  HTTP: 80  |  DNS: 5454        │
└──────────────────────┬──────────────────────────────┘
                       │ Mạng WiFi/LAN nội bộ
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Máy NV 1     Máy NV 2     Máy NV 3
      Chạy         Chạy         Chạy
      install-     install-     install-
      cert.bat     cert.bat     cert.bat
      (1 lần)      (1 lần)      (1 lần)
          ↓            ↓            ↓
      Mở Chrome → https://casictask.local → Dùng ngay 🔒
```

**Không cần internet. Hoạt động hoàn toàn offline trong mạng nội bộ.**

---

# PHẦN 1 — CÀI ĐẶT MÁY CHỦ
## (IT/Admin làm 1 lần duy nhất)

---

### BƯỚC 1 — Cài Node.js

1. Vào: **https://nodejs.org**
2. Tải bản **LTS** (ví dụ: Node.js 20 LTS)
3. Chạy file `.msi` vừa tải → nhấn **Next** liên tục → **Finish**
4. Kiểm tra: mở **CMD** → gõ `node --version` → thấy `v20.x.x` là OK

---

### BƯỚC 2 — Cài SQL Server Express (miễn phí)

1. Vào: **https://www.microsoft.com/en-us/sql-server/sql-server-downloads**
2. Tải **SQL Server Express** (miễn phí)
3. Chạy file cài đặt → chọn **Basic** → nhấn **Accept** → **Install**
4. Chờ cài xong (5-10 phút)
5. Ghi nhớ thông tin hiển thị sau khi cài:
   - Connection String: `Server=localhost\SQLEXPRESS`

> **Lưu ý:** SQL Server Express miễn phí, giới hạn 10GB — đủ dùng cho hệ thống nội bộ.

---

### BƯỚC 3 — Cấu hình kết nối database

Mở file `backend\.env` bằng Notepad, kiểm tra và điền đúng thông tin:

```
PORT=443
PORT_HTTP=80
NODE_ENV=production
DNS_PORT=5454

DB_DIALECT=mssql
DB_HOST=localhost
DB_PORT=1433
DB_NAME=qlcv_db
DB_USER=sa
DB_PASSWORD=<mật khẩu SA của bạn>

JWT_SECRET=taskmaster_internal_secret_2024
JWT_EXPIRES_IN=30d
FRONTEND_URL=https://casictask.local
```

> Nếu không nhớ mật khẩu SA, xem lại trong quá trình cài SQL Server,
> hoặc dùng Windows Authentication (để trống DB_PASSWORD).

---

### BƯỚC 4 — Khởi động hệ thống lần đầu

```
Chuột phải vào: start-server.bat
→ Chọn: "Run as administrator"
```

Cửa sổ CMD sẽ hiện:
```
✅ Database connected (SQL Server)
✅ Database synced
✅ DNS server chạy tại port 5454
🔒 CASIC Task chạy HTTPS tại: https://casictask.local
✅ Kết nối an toàn (HTTPS)
```

> **Quan trọng:** Phải chạy với quyền Administrator để dùng port 443 (HTTPS).

---

### BƯỚC 5 — Cài tự động khởi động cùng Windows

Để server tự chạy mỗi khi bật máy chủ (không cần làm gì thêm):

```
Chuột phải vào: install-autostart.bat
→ Chọn: "Run as administrator"
```

Sau bước này, mỗi khi bật máy chủ → server tự động chạy.

---

### BƯỚC 6 — Mở cổng tường lửa

Chạy **CMD với quyền Administrator**, gõ lần lượt:

```cmd
netsh advfirewall firewall add rule name="CASIC Task HTTPS" dir=in action=allow protocol=TCP localport=443
netsh advfirewall firewall add rule name="CASIC Task HTTP"  dir=in action=allow protocol=TCP localport=80
netsh advfirewall firewall add rule name="CASIC Task DNS"   dir=in action=allow protocol=UDP localport=5454
```

---

### BƯỚC 7 — Tìm IP máy chủ (để thông báo cho nhân viên)

Mở **CMD** → gõ `ipconfig` → tìm dòng **IPv4 Address**

Ví dụ: `192.168.1.100`

Thông báo IP này cho nhân viên để họ chạy `install-cert.bat`.

---

# PHẦN 2 — CÀI ĐẶT MÁY NHÂN VIÊN
## (Mỗi máy làm 1 lần duy nhất)

---

### Chỉ cần làm 1 việc:

```
Chuột phải vào: install-cert.bat
→ Chọn: "Run as administrator"
```

Script sẽ hỏi IP máy chủ → nhập IP (ví dụ: `192.168.1.100`) → Enter.

Script tự động:
- ✅ Cài chứng chỉ bảo mật vào Windows
- ✅ Thêm `casictask.local` vào danh sách địa chỉ

**Sau đó:** Khởi động lại Chrome → gõ `https://casictask.local` → vào ngay 🔒

---

# PHẦN 3 — SỬ DỤNG HÀNG NGÀY

---

### Nhân viên truy cập

Mở **Chrome** hoặc **Edge** → gõ vào thanh địa chỉ:

```
https://casictask.local
```

Thấy biểu tượng 🔒 trên thanh địa chỉ = kết nối an toàn ✅

---

### Tài khoản mặc định

| Họ tên | Email đăng nhập | Mật khẩu | Quyền |
|--------|----------------|----------|-------|
| Admin | admin@qlcv.vn | Admin@2024 | Toàn quyền |
| GĐ Nguyễn Minh Hải | hai@qlcv.vn | Hai@2024 | Giám đốc |
| PGĐ Trần Thị Khanh | khanh@qlcv.vn | Khanh@2024 | Phó GĐ |
| PGĐ Lê Văn Điền | dien@qlcv.vn | Dien@2024 | Phó GĐ |
| PGĐ Phạm Quốc Vụ | vu@qlcv.vn | Vu@2024 | Phó GĐ |
| Sương | suong@qlcv.vn | Suong@2024 | Nhân viên |
| Như | nhu@qlcv.vn | Nhu@2024 | Nhân viên |
| *(các nhân viên khác)* | *tên@qlcv.vn* | *Tên@2024* | Nhân viên |

> ⚠️ **Đổi mật khẩu admin ngay sau khi cài đặt!**
> Vào: Tài khoản → Đổi mật khẩu

---

### Quản lý hàng ngày (Admin)

| Việc cần làm | Cách thực hiện |
|-------------|----------------|
| Thêm nhân viên mới | Đăng nhập admin → Người dùng → Thêm |
| Đặt lại mật khẩu | Người dùng → Chỉnh sửa → Đặt lại mật khẩu |
| Sao lưu dữ liệu | Chạy `backup-data.bat` |
| Khởi động lại server | Chạy `start-server.bat` (Run as administrator) |
| Dừng server | Chạy `stop-server.bat` |

---

# PHẦN 4 — XỬ LÝ SỰ CỐ

---

### Nhân viên không vào được `https://casictask.local`

**Kiểm tra theo thứ tự:**

1. **Máy chủ có đang chạy không?**
   - Vào máy chủ → kiểm tra cửa sổ CMD server còn mở không
   - Nếu không → chạy lại `start-server.bat` (Run as administrator)

2. **Máy nhân viên có cùng mạng WiFi không?**
   - Kiểm tra máy nhân viên kết nối đúng WiFi công ty

3. **Đã chạy `install-cert.bat` chưa?**
   - Nếu chưa → chạy `install-cert.bat` (Run as administrator)

4. **Thử bằng IP trực tiếp:**
   - Gõ `https://192.168.1.100` (IP máy chủ) thay vì tên miền
   - Nếu vào được bằng IP nhưng không được bằng tên → chạy lại `install-cert.bat`

---

### Chrome báo "Not Secure" hoặc "Your connection is not private"

- Chạy lại `install-cert.bat` trên máy đó
- Khởi động lại Chrome hoàn toàn (đóng hết tab, mở lại)
- Hoặc vào `chrome://restart` để restart Chrome

---

### Server không khởi động

- Kiểm tra SQL Server đang chạy:
  - Nhấn `Win + R` → gõ `services.msc` → tìm `SQL Server` → nhấn **Start**
- Kiểm tra file `backend\.env` có đúng mật khẩu DB không
- Đảm bảo chạy `start-server.bat` với **Run as administrator**

---

### Quên mật khẩu nhân viên

- Admin đăng nhập → **Người dùng** → tìm nhân viên → **Chỉnh sửa** → nhập mật khẩu mới → **Lưu**

---

# PHẦN 5 — THÔNG TIN KỸ THUẬT

| Thành phần | Chi tiết |
|-----------|---------|
| Địa chỉ truy cập | `https://casictask.local` |
| Giao thức | HTTPS (TLS) — kết nối mã hóa |
| Chứng chỉ SSL | Tự ký, hiệu lực đến 2036 |
| Backend | Node.js + Express |
| Database | SQL Server Express (miễn phí) |
| Cổng HTTPS | 443 (mặc định, không cần gõ) |
| Cổng HTTP | 80 (tự redirect sang HTTPS) |
| Cổng DNS | 5454 (UDP) |
| Internet | **Không cần** — hoàn toàn offline |
| Dữ liệu | Lưu trong SQL Server trên máy chủ |
| Backup | Chạy `backup-data.bat` |

---

*Phiên bản tài liệu: 2.0 — Cập nhật tháng 5/2026*
