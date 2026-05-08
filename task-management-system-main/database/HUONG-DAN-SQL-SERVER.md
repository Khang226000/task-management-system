# HƯỚNG DẪN CHUYỂN SANG SQL SERVER

## BƯỚC 1: Chạy script tạo database

Mở **SQL Server Management Studio (SSMS)** hoặc **Azure Data Studio**, kết nối vào SQL Server rồi chạy file:
```
database/QLCV_SQLServer_Schema.sql
```

Script sẽ tự động:
- Tạo database `qlcv_db`
- Tạo 6 bảng: users, tasks, monthly_tasks, events, activity_logs, task_templates
- Tạo các index tối ưu hiệu năng

---

## BƯỚC 2: Cài driver SQL Server cho Node.js

```bash
cd backend
npm install mssql@10.0.4 --save-exact
```

---

## BƯỚC 3: Cập nhật file backend/.env

```env
PORT=5000
NODE_ENV=development

# SQL Server
DB_DIALECT=mssql
DB_HOST=localhost
DB_PORT=1433
DB_NAME=qlcv_db
DB_USER=sa
DB_PASSWORD=YourPassword123!

# Hoặc dùng Windows Authentication (không cần user/pass):
# DB_TRUSTED_CONNECTION=true

# JWT
JWT_SECRET=taskmaster_internal_secret_2024
JWT_EXPIRES_IN=30d
```

---

## BƯỚC 4: Cập nhật file connection.js

Thay nội dung `backend/src/database/connection.js`:

```javascript
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        encrypt: false,           // true nếu dùng Azure
        trustServerCertificate: true,
        enableArithAbort: true,
        // Nếu dùng Windows Authentication:
        // trustedConnection: process.env.DB_TRUSTED_CONNECTION === 'true'
      }
    },
    pool: {
      max: 10, min: 0, acquire: 30000, idle: 10000
    }
  }
);

module.exports = { sequelize };
```

---

## BƯỚC 5: Chạy seed để tạo dữ liệu mẫu

```bash
cd backend
node src/database/seed.js
```

---

## THÔNG TIN KẾT NỐI PHỔ BIẾN

| Trường hợp | DB_HOST | DB_USER | Ghi chú |
|-----------|---------|---------|---------|
| SQL Server Express local | `localhost\SQLEXPRESS` | `sa` | Cần bật TCP/IP |
| SQL Server Developer | `localhost` | `sa` | Port mặc định 1433 |
| Windows Auth | `localhost` | *(bỏ trống)* | Thêm `trustedConnection: true` |
| SQL Server trên mạng LAN | `192.168.1.x` | `sa` | Mở port 1433 trên firewall |

---

## LƯU Ý QUAN TRỌNG

- **ENUM không có trong SQL Server** — đã dùng `NVARCHAR + CHECK CONSTRAINT` thay thế
- **UUID** — dùng `NVARCHAR(36)` + `NEWID()` thay vì `UNIQUEIDENTIFIER` để tương thích Sequelize
- **Boolean** — dùng `BIT` (0/1) thay vì `BOOLEAN`
- **TEXT** — dùng `NVARCHAR(MAX)` để hỗ trợ Unicode tiếng Việt
- Collation `Vietnamese_CI_AS` đảm bảo sắp xếp tiếng Việt đúng
