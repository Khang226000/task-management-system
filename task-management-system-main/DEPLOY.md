# Hướng dẫn Deploy lên Render (Free Tier)

## Tổng quan kiến trúc

```
GitHub Repo
    │
    ▼
Render Web Service  ──►  Render PostgreSQL (Free)
  (Node.js backend)       DATABASE_URL tự động inject
  (Serve frontend dist)
```

---

## Bước 1 — Chuẩn bị repository GitHub

### 1.1 Đảm bảo `.gitignore` đúng

Các thứ KHÔNG được commit:
- `node_modules/`
- `backend/.env`
- `frontend/dist/`
- `backend/certs/`
- `backend/uploads/*` (trừ `.gitkeep`)

### 1.2 Push lên GitHub

```bash
git add .
git commit -m "chore: migrate to PostgreSQL, ready for Render deploy"
git push origin main
```

---

## Bước 2 — Tạo PostgreSQL database trên Render

1. Vào [render.com](https://render.com) → **New** → **PostgreSQL**
2. Điền thông tin:
   - **Name**: `casic-task-db`
   - **Database**: `qlcv_db`
   - **User**: `qlcv_user`
   - **Region**: Singapore (gần nhất với VN)
   - **Plan**: Free
3. Click **Create Database**
4. Chờ ~1 phút, sau đó copy **Internal Database URL** (dùng cho Web Service cùng region)

---

## Bước 3 — Tạo Web Service trên Render

1. **New** → **Web Service**
2. Kết nối GitHub repo
3. Cấu hình:

| Trường | Giá trị |
|---|---|
| **Name** | `casic-task` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Root Directory** | *(để trống)* |
| **Runtime** | Node |
| **Build Command** | `cd frontend && npm install && npm run build && cd ../backend && npm install --omit=dev` |
| **Start Command** | `node backend/src/server.js` |
| **Plan** | Free |

### 3.1 Cấu hình Environment Variables

Trong tab **Environment**, thêm các biến sau:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(paste Internal Database URL từ bước 2)* |
| `JWT_SECRET` | *(click "Generate" để tạo ngẫu nhiên)* |
| `JWT_EXPIRES_IN` | `30d` |
| `FRONTEND_URL` | `https://casic-task.onrender.com` *(URL của service này)* |

> ⚠️ `DATABASE_URL` từ Render đã có SSL. **Không** thêm `DB_SSL=false`.

4. Click **Create Web Service**

---

## Bước 4 — Kiểm tra deploy

### 4.1 Xem build logs

Render sẽ tự động:
1. Clone repo
2. Chạy Build Command (build frontend + install backend)
3. Chạy Start Command
4. Server tự tạo bảng PostgreSQL khi khởi động lần đầu

### 4.2 Kiểm tra health

```
GET https://casic-task.onrender.com/api/health
```

Response thành công:
```json
{
  "status": "OK",
  "db": "PostgreSQL ✅",
  "uptime": "30s"
}
```

### 4.3 Tài khoản admin mặc định

Lần đầu khởi động, server tự tạo:
- **Email**: `admin@qlcv.vn`
- **Password**: `Admin@2024`

> ⚠️ Đổi mật khẩu ngay sau khi đăng nhập!

---

## Bước 5 — Cấu hình tự động deploy (Auto-Deploy)

Render tự động redeploy khi push lên `main`. Để tắt:
- Web Service → Settings → **Auto-Deploy** → Off

---

## Lưu ý Free Tier

| Giới hạn | Free Tier |
|---|---|
| Web Service | Spin down sau 15 phút không có request (cold start ~30s) |
| PostgreSQL | 1GB storage, xóa sau 90 ngày không active |
| Bandwidth | 100GB/tháng |
| Build time | 500 phút/tháng |

**Giải pháp tránh cold start**: Dùng [UptimeRobot](https://uptimerobot.com) ping `/api/health` mỗi 14 phút (miễn phí).

---

## Deploy thủ công (không dùng render.yaml)

Nếu muốn tách frontend/backend riêng:

### Backend only trên Render

Build Command:
```bash
npm install --omit=dev
```

Start Command:
```bash
node src/server.js
```

Root Directory: `backend`

### Frontend trên Render Static Site

Build Command:
```bash
npm install && npm run build
```

Publish Directory: `dist`

Root Directory: `frontend`

Thêm env var: `VITE_API_URL=https://casic-task-backend.onrender.com`

---

## Development local với PostgreSQL

### Cài PostgreSQL local

```bash
# Windows: tải từ https://www.postgresql.org/download/windows/
# Hoặc dùng Docker:
docker run --name postgres-local -e POSTGRES_PASSWORD=123 -p 5432:5432 -d postgres:16
```

### Tạo database

```sql
CREATE DATABASE qlcv_db;
```

### Cấu hình .env

```env
DATABASE_URL=postgresql://postgres:123@localhost:5432/qlcv_db
DB_SSL=false
NODE_ENV=development
```

### Khởi động

```bash
# Kiểm tra kết nối và tạo bảng
node backend/scripts/setup-db.js

# Chạy backend
cd backend && npm run dev

# Chạy frontend (terminal khác)
cd frontend && npm run dev
```

---

## Troubleshooting

### Lỗi SSL khi kết nối PostgreSQL local

```
Error: self signed certificate
```

Thêm vào `.env`:
```env
DB_SSL=false
```

### Lỗi "relation does not exist"

Sequelize chưa tạo bảng. Chạy:
```bash
node backend/scripts/setup-db.js
```

### Build thất bại trên Render

Kiểm tra:
1. `package.json` có `"engines": { "node": ">=18.0.0" }`
2. Build Command đúng thứ tự (frontend trước, backend sau)
3. Không có file `.env` trong repo (dùng Environment Variables trên Render)

### Cold start chậm

Free tier Render spin down sau 15 phút. Dùng UptimeRobot ping `/api/health` mỗi 14 phút.
