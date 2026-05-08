# 🚀 HƯỚNG DẪN CHẠY CHƯƠNG TRÌNH QUẢN LÝ CÔNG VIỆC

## ✅ YÊU CẦU TRƯỚC KHI CHẠY

| Phần mềm | Phiên bản | Kiểm tra |
|----------|-----------|----------|
| Node.js | ≥ 18 | `node --version` |
| SQL Server | 2019+ | Đang chạy service |
| VS Code | Mới nhất | Đã cài |

---

## 📁 CẤU TRÚC THƯ MỤC

```
TaskManagementSystem/
├── backend/          ← Server Node.js
│   ├── src/
│   ├── .env          ← Cấu hình database
│   └── package.json
├── frontend/         ← Giao diện React
│   ├── dist/         ← File đã build (dùng để chạy)
│   └── package.json
└── start-server.bat  ← File chạy nhanh (Windows)
```

---

## 🔧 CÁCH 1: CHẠY BẰNG FILE BAT (Đơn giản nhất)

**Chỉ cần double-click file `start-server.bat`**

File này sẽ tự động:
1. Vào thư mục backend
2. Chạy `node src/server.js`
3. Mở trình duyệt tại `http://localhost:5000`

---

## 💻 CÁCH 2: CHẠY TRONG VS CODE (Khuyến nghị)

### Bước 1: Mở project trong VS Code
```
File → Open Folder → Chọn thư mục TaskManagementSystem
```

### Bước 2: Mở Terminal trong VS Code
```
Terminal → New Terminal  (hoặc Ctrl + `)
```

### Bước 3: Chạy server backend
```bash
cd backend
node src/server.js
```

**Kết quả thành công:**
```
✅ Database connected (SQL Server)
✅ Database synced
🚀 TaskMaster chạy tại:
   Trên máy này  : http://localhost:5000
```

### Bước 4: Mở trình duyệt
Truy cập: **http://localhost:5000**

---

## 🔄 CÁCH 3: DÙNG NODEMON (Tự động restart khi sửa code)

```bash
cd backend
npm run dev
```

> Cần cài nodemon: `npm install -g nodemon`

---

## ⚙️ CẤU HÌNH DATABASE (.env)

File `backend/.env`:
```env
PORT=5000
NODE_ENV=development

# SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_NAME=qlcv_db
DB_USER=sa
DB_PASSWORD=123

# JWT
JWT_SECRET=taskmaster_internal_secret_2024
JWT_EXPIRES_IN=30d
```

> **Lưu ý:** Nếu SQL Server dùng instance name (VD: `ZINHDEPTRAI\HUNGKHANG`), đổi `DB_HOST`:
> ```env
> DB_HOST=ZINHDEPTRAI\HUNGKHANG
> ```

---

## 🌐 TRUY CẬP TỪ ĐIỆN THOẠI / MÁY KHÁC TRONG MẠNG LAN

1. Chạy lệnh `ipconfig` trong terminal để lấy IP máy chủ
2. Truy cập: `http://[IP-máy-chủ]:5000`
   - VD: `http://192.168.1.100:5000`

---

## 👤 TÀI KHOẢN ĐĂNG NHẬP

| Tài khoản | Email | Mật khẩu | Quyền |
|-----------|-------|----------|-------|
| Admin | admin@qlcv.vn | Qlcv@2026 | Toàn quyền |
| GĐ Hải | hai@qlcv.vn | Qlcv@2026 | Giám đốc |
| PGĐ Khanh | khanh@qlcv.vn | Qlcv@2026 | Phó GĐ |
| Nhân viên | [email]@qlcv.vn | Qlcv@2026 | Nhân viên |

---

## 🔨 KHI CẦN BUILD LẠI FRONTEND

Nếu có thay đổi code frontend, cần build lại:

```bash
cd frontend
$env:NODE_OPTIONS="--max-old-space-size=4096"
npx vite build
```

> Sau khi build xong, restart server backend là xong.

---

## ❌ XỬ LÝ LỖI THƯỜNG GẶP

### Lỗi: `EADDRINUSE: address already in use :::5000`
Port 5000 đang bị chiếm. Chạy lệnh sau để kill:
```bash
# Tìm PID đang dùng port 5000
netstat -ano | findstr :5000

# Kill process (thay XXXX bằng PID tìm được)
taskkill /PID XXXX /F
```

### Lỗi: `Cannot connect to SQL Server`
- Kiểm tra SQL Server service đang chạy
- Kiểm tra thông tin trong file `.env`
- Đảm bảo database `qlcv_db` đã tồn tại

### Lỗi: `Module not found`
```bash
cd backend
npm install
```

---

## 📋 TASK TRONG VS CODE (Tùy chọn)

Tạo file `.vscode/tasks.json` để chạy bằng 1 click:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Server",
      "type": "shell",
      "command": "node src/server.js",
      "options": { "cwd": "${workspaceFolder}/backend" },
      "group": { "kind": "build", "isDefault": true },
      "presentation": { "reveal": "always", "panel": "new" }
    }
  ]
}
```

Sau đó nhấn **Ctrl+Shift+B** để chạy server.

---

## 🔁 QUY TRÌNH HÀNG NGÀY

```
1. Mở VS Code
2. Mở Terminal (Ctrl + `)
3. cd backend
4. node src/server.js
5. Mở http://localhost:5000
```

**Hoặc đơn giản hơn:** Double-click `start-server.bat`
