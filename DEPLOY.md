# Hướng dẫn Deploy Production — CASIC Task

## Yêu cầu hệ thống

| Thành phần | Phiên bản tối thiểu |
|---|---|
| Node.js | 18.x trở lên |
| SQL Server | 2017 trở lên |
| Windows | 10/11 hoặc Server 2019+ |
| RAM | 2GB trở lên |

---

## 1. Cài đặt lần đầu

### Bước 1 — Clone/copy project

```bash
git clone <repo-url>
cd casic-task
```

### Bước 2 — Cấu hình môi trường

```bash
copy backend\.env.example backend\.env
```

Mở `backend\.env` và điền thông tin thực:

```env
DB_HOST=TEN_SERVER\INSTANCE   # Ví dụ: ZINHDEPTRAI\HUNGKHANG
DB_PORT=1433
DB_NAME=QLCV_DB
DB_USER=sa
DB_PASSWORD=mat_khau_cua_ban

JWT_SECRET=chuoi_ngau_nhien_dai_it_nhat_32_ky_tu
```

> ⚠️ **Bảo mật**: Không bao giờ commit file `.env` lên Git.

### Bước 3 — Chuẩn bị SQL Server

1. Mở SQL Server Management Studio (SSMS)
2. Chạy file `database/QLCV_SQLServer_Schema.sql` để tạo database và bảng
3. Đảm bảo SQL Server Authentication được bật (không chỉ Windows Auth)
4. Đảm bảo tài khoản `sa` được bật và có quyền truy cập `QLCV_DB`

### Bước 4 — Build và khởi động

```bat
build-production.bat
```

Hoặc thủ công:

```bash
# Build frontend
cd frontend
npm install
npm run build
cd ..

# Cài backend
cd backend
npm install --omit=dev
cd ..
```

### Bước 5 — Kiểm tra database

```bash
node backend/scripts/setup-db.js
```

Script này sẽ:
- Kiểm tra kết nối SQL Server
- Tạo bảng nếu chưa có
- Tạo tài khoản admin mặc định nếu chưa có

### Bước 6 — Khởi động server

```bat
start-server.bat
```

Hoặc:

```bash
node backend/src/server.js
```

---

## 2. Cấu hình SSL (HTTPS)

Server tự động dùng HTTPS nếu có cert trong `backend/certs/`:

```
backend/certs/
  server.key   ← Private key
  server.crt   ← Certificate
  ca.crt       ← CA certificate (tùy chọn)
```

Nếu không có cert, server chạy HTTP (không an toàn — chỉ dùng cho test).

---

## 3. Deploy lên hosting / VPS

### Option A — Deploy trực tiếp trên Windows Server

1. Cài Node.js 18+ trên server
2. Cài SQL Server và tạo database `QLCV_DB`
3. Copy toàn bộ project (trừ `node_modules`, `.env`, `dist`)
4. Cấu hình `.env` trên server
5. Chạy `build-production.bat`
6. Dùng PM2 để giữ server chạy liên tục:

```bash
npm install -g pm2
pm2 start backend/src/server.js --name casic-task
pm2 save
pm2 startup
```

### Option B — Deploy qua GitHub + Cloudflare Tunnel

1. Push code lên GitHub (đảm bảo `.env` trong `.gitignore`)
2. Trên server, pull code về
3. Cấu hình `.env`
4. Build và chạy server
5. Cấu hình Cloudflare Tunnel để expose ra internet:

```bash
cloudflare/cloudflared.exe tunnel --url https://localhost:443
```

---

## 4. Biến môi trường đầy đủ

| Biến | Mô tả | Bắt buộc |
|---|---|---|
| `DB_HOST` | Tên server SQL Server | ✅ |
| `DB_PORT` | Port SQL Server (mặc định 1433) | ✅ |
| `DB_NAME` | Tên database | ✅ |
| `DB_USER` | Tài khoản SQL Server | ✅ |
| `DB_PASSWORD` | Mật khẩu SQL Server | ✅ |
| `JWT_SECRET` | Secret key cho JWT (tối thiểu 32 ký tự) | ✅ |
| `JWT_EXPIRES_IN` | Thời hạn token (mặc định 30d) | ❌ |
| `PORT` | Port HTTPS (mặc định 443) | ❌ |
| `PORT_HTTP` | Port HTTP redirect (mặc định 80) | ❌ |
| `NODE_ENV` | Môi trường (production/development) | ❌ |
| `FRONTEND_URL` | URL frontend cho CORS | ❌ |
| `DNS_PORT` | Port DNS server nội bộ (mặc định 5454) | ❌ |

---

## 5. Tài khoản mặc định

Sau khi chạy `setup-db.js`, tài khoản admin mặc định:

- **Email**: `admin@qlcv.vn`
- **Password**: `Admin@2024`

> ⚠️ **Đổi mật khẩu ngay sau khi đăng nhập lần đầu!**

---

## 6. Kiểm tra health

```
GET https://casictask.local/api/health
```

Response thành công:
```json
{
  "status": "OK",
  "protocol": "HTTPS ✅",
  "uptime": "120s"
}
```

---

## 7. Xử lý sự cố thường gặp

### Lỗi kết nối SQL Server

```
❌ Không thể kết nối SQL Server: Login failed for user 'sa'
```

Kiểm tra:
1. SQL Server Authentication được bật trong Server Properties → Security
2. Tài khoản `sa` được bật: `ALTER LOGIN sa ENABLE; ALTER LOGIN sa WITH PASSWORD = 'mat_khau';`
3. TCP/IP được bật trong SQL Server Configuration Manager

### Lỗi port 443/80 bị chiếm

Chạy server với quyền Administrator, hoặc đổi port trong `.env`:
```env
PORT=5000
PORT_HTTP=8080
```

### Frontend không load

Đảm bảo đã build frontend trước:
```bash
cd frontend && npm run build
```
