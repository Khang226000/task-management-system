-- ============================================================
-- HỆ THỐNG QUẢN LÝ CÔNG VIỆC NỘI BỘ
-- SQL Server Schema
-- ============================================================

USE master;
GO

-- Tạo database nếu chưa có
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'qlcv_db')
BEGIN
    CREATE DATABASE qlcv_db
    COLLATE Vietnamese_CI_AS;
    PRINT N'✅ Đã tạo database qlcv_db';
END
GO

USE qlcv_db;
GO

-- ============================================================
-- 1. BẢNG USERS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id            NVARCHAR(36)  NOT NULL PRIMARY KEY,
        name          NVARCHAR(100) NOT NULL,
        email         NVARCHAR(150) NOT NULL UNIQUE,
        password      NVARCHAR(255) NOT NULL,
        avatar        NVARCHAR(500) NULL,
        role          NVARCHAR(20)  NOT NULL DEFAULT 'member'
                      CHECK (role IN ('admin','director','manager','member')),
        color         NVARCHAR(7)   NOT NULL DEFAULT '#6366f1',
        department    NVARCHAR(50)  NULL,
        isActive      BIT           NOT NULL DEFAULT 1,
        createdAt     DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt     DATETIME2     NOT NULL DEFAULT GETDATE()
    );
    PRINT N'✅ Đã tạo bảng users';
END
GO

-- ============================================================
-- 2. BẢNG TASKS (Công việc sự kiện)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tasks')
BEGIN
    CREATE TABLE tasks (
        id               NVARCHAR(36)  NOT NULL PRIMARY KEY,
        taskCode         NVARCHAR(30)  NOT NULL UNIQUE,
        parentCode       NVARCHAR(30)  NULL,
        workCategory     NVARCHAR(10)  NOT NULL DEFAULT 'ADM',
        taskName         NVARCHAR(500) NOT NULL,
        leadDepartment   NVARCHAR(20)  NOT NULL DEFAULT 'LD-ADM',
        assigneeId       NVARCHAR(36)  NULL,
        collaborators    NVARCHAR(MAX) NULL DEFAULT '[]',
        deputyDirector   NVARCHAR(100) NULL,
        startDate        DATE          NULL,
        deadline         DATE          NOT NULL,
        extendedDeadline DATE          NULL,
        extensionReason  NVARCHAR(MAX) NULL,
        deliverable      NVARCHAR(MAX) NULL,
        attachments      NVARCHAR(MAX) NULL DEFAULT '[]',
        progress         INT           NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        taskType         NVARCHAR(5)   NOT NULL DEFAULT 'R',
        status           NVARCHAR(20)  NOT NULL DEFAULT 'not_started',
        completion       NVARCHAR(5)   NULL,
        approvalStatus   NVARCHAR(20)  NOT NULL DEFAULT 'pending',
        approvedById     NVARCHAR(36)  NULL,
        approvedAt       DATETIME2     NULL,
        approvalNote     NVARCHAR(MAX) NULL,
        notes            NVARCHAR(MAX) NULL,
        month            INT           NOT NULL,
        year             INT           NOT NULL,
        createdById      NVARCHAR(36)  NOT NULL,
        [order]          INT           NOT NULL DEFAULT 0,
        createdAt        DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt        DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_tasks_assignee    FOREIGN KEY (assigneeId)   REFERENCES users(id),
        CONSTRAINT FK_tasks_createdBy   FOREIGN KEY (createdById)  REFERENCES users(id),
        CONSTRAINT FK_tasks_approvedBy  FOREIGN KEY (approvedById) REFERENCES users(id)
    );
    CREATE INDEX IX_tasks_month_year    ON tasks(month, year);
    CREATE INDEX IX_tasks_assigneeId    ON tasks(assigneeId);
    CREATE INDEX IX_tasks_status        ON tasks(status);
    CREATE INDEX IX_tasks_approvalStatus ON tasks(approvalStatus);
    PRINT N'✅ Đã tạo bảng tasks';
END
GO

-- ============================================================
-- 3. BẢNG MONTHLY_TASKS (Công việc hằng tháng)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'monthly_tasks')
BEGIN
    CREATE TABLE monthly_tasks (
        id              NVARCHAR(36)  NOT NULL PRIMARY KEY,
        taskId          NVARCHAR(50)  NOT NULL UNIQUE,
        taskName        NVARCHAR(500) NOT NULL,
        startDate       DATE          NULL,
        dueDate         DATE          NOT NULL,
        extendedDueDate DATE          NULL,
        assigneeId      NVARCHAR(36)  NULL,
        taskType        NVARCHAR(5)   NOT NULL DEFAULT 'R',
        completion      NVARCHAR(5)   NULL,
        progress        INT           NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
        notes           NVARCHAR(MAX) NULL,
        attachments     NVARCHAR(MAX) NULL DEFAULT '[]',
        taskGroup       NVARCHAR(50)  NOT NULL DEFAULT 'THUONG_XUYEN',
        department      NVARCHAR(20)  NULL,
        month           INT           NOT NULL,
        year            INT           NOT NULL,
        stt             INT           NOT NULL DEFAULT 0,
        createdById     NVARCHAR(36)  NOT NULL,
        createdAt       DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt       DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_monthly_assignee   FOREIGN KEY (assigneeId)  REFERENCES users(id),
        CONSTRAINT FK_monthly_createdBy  FOREIGN KEY (createdById) REFERENCES users(id)
    );
    CREATE INDEX IX_monthly_month_year ON monthly_tasks(month, year);
    CREATE INDEX IX_monthly_assigneeId ON monthly_tasks(assigneeId);
    PRINT N'✅ Đã tạo bảng monthly_tasks';
END
GO

-- ============================================================
-- 4. BẢNG EVENTS (Lịch sự kiện)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
BEGIN
    CREATE TABLE events (
        id          NVARCHAR(36)  NOT NULL PRIMARY KEY,
        title       NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        type        NVARCHAR(20)  NOT NULL DEFAULT 'other'
                    CHECK (type IN ('meeting','deadline','holiday','reminder','other')),
        color       NVARCHAR(7)   NOT NULL DEFAULT '#6366f1',
        startDate   DATETIME2     NOT NULL,
        endDate     DATETIME2     NULL,
        allDay      BIT           NOT NULL DEFAULT 0,
        month       INT           NOT NULL,
        year        INT           NOT NULL,
        createdById NVARCHAR(36)  NOT NULL,
        createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt   DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_events_createdBy FOREIGN KEY (createdById) REFERENCES users(id)
    );
    CREATE INDEX IX_events_month_year ON events(month, year);
    PRINT N'✅ Đã tạo bảng events';
END
GO

-- ============================================================
-- 5. BẢNG ACTIVITY_LOGS (Lịch sử hoạt động)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'activity_logs')
BEGIN
    CREATE TABLE activity_logs (
        id          NVARCHAR(36)  NOT NULL PRIMARY KEY,
        action      NVARCHAR(30)  NOT NULL,
        entityType  NVARCHAR(20)  NOT NULL DEFAULT 'task',
        entityId    NVARCHAR(50)  NULL,
        entityCode  NVARCHAR(50)  NULL,
        entityName  NVARCHAR(500) NULL,
        description NVARCHAR(MAX) NOT NULL,
        userId      NVARCHAR(36)  NOT NULL,
        metadata    NVARCHAR(MAX) NULL,
        createdAt   DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_logs_user FOREIGN KEY (userId) REFERENCES users(id)
    );
    CREATE INDEX IX_logs_userId    ON activity_logs(userId);
    CREATE INDEX IX_logs_createdAt ON activity_logs(createdAt DESC);
    CREATE INDEX IX_logs_action    ON activity_logs(action);
    PRINT N'✅ Đã tạo bảng activity_logs';
END
GO

-- ============================================================
-- 6. BẢNG TASK_TEMPLATES (Danh sách công việc mẫu)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'task_templates')
BEGIN
    CREATE TABLE task_templates (
        id             NVARCHAR(36)  NOT NULL PRIMARY KEY,
        taskCode       NVARCHAR(30)  NOT NULL,
        taskName       NVARCHAR(500) NOT NULL,
        workCategory   NVARCHAR(10)  NOT NULL DEFAULT 'ADM',
        leadDepartment NVARCHAR(20)  NOT NULL DEFAULT 'LD-ADM',
        deputyDirector NVARCHAR(100) NULL,
        taskType       NVARCHAR(5)   NOT NULL DEFAULT 'R',
        deliverable    NVARCHAR(MAX) NULL,
        estimatedDays  INT           NOT NULL DEFAULT 7,
        notes          NVARCHAR(MAX) NULL,
        isActive       BIT           NOT NULL DEFAULT 1,
        createdById    NVARCHAR(36)  NOT NULL,
        createdAt      DATETIME2     NOT NULL DEFAULT GETDATE(),
        updatedAt      DATETIME2     NOT NULL DEFAULT GETDATE(),

        CONSTRAINT FK_templates_createdBy FOREIGN KEY (createdById) REFERENCES users(id)
    );
    PRINT N'✅ Đã tạo bảng task_templates';
END
GO

-- ============================================================
-- 7. DỮ LIỆU MẪU — USERS
-- Mật khẩu mặc định: Qlcv@2026 (đã hash bcrypt)
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@qlcv.vn')
BEGIN
    -- Hash của 'Qlcv@2026' — thay bằng hash thực khi deploy
    DECLARE @hash NVARCHAR(255) = '$2a$10$placeholder_run_seed_to_get_real_hash';

    INSERT INTO users (id, name, email, password, role, color, department, isActive) VALUES
    (NEWID(), N'Admin',           'admin@qlcv.vn',   @hash, 'admin',    '#6366f1', N'Ban Giám đốc', 1),
    (NEWID(), N'Nguyễn Minh Hải', 'hai@qlcv.vn',     @hash, 'director', '#10b981', N'Ban Giám đốc', 1),
    (NEWID(), N'Trần Thị Khanh',  'khanh@qlcv.vn',   @hash, 'manager',  '#f59e0b', N'Ban Giám đốc', 1),
    (NEWID(), N'Lê Văn Điền',     'dien@qlcv.vn',    @hash, 'manager',  '#ef4444', N'Ban Giám đốc', 1),
    (NEWID(), N'Phạm Quốc Vụ',    'vu@qlcv.vn',      @hash, 'manager',  '#8b5cf6', N'Ban Giám đốc', 1),
    (NEWID(), N'Sương',            'suong@qlcv.vn',   @hash, 'member',   '#ec4899', N'KN&DMST',      1),
    (NEWID(), N'Như',              'nhu@qlcv.vn',     @hash, 'member',   '#14b8a6', N'KN&DMST',      1),
    (NEWID(), N'Hương',            'huong@qlcv.vn',   @hash, 'member',   '#f97316', N'Hành chính',   1),
    (NEWID(), N'Khánh',            'khanh2@qlcv.vn',  @hash, 'member',   '#06b6d4', N'Hành chính',   1),
    (NEWID(), N'P.Anh',            'panh@qlcv.vn',    @hash, 'member',   '#a855f7', N'Kỹ thuật',     1),
    (NEWID(), N'Trà',              'tra@qlcv.vn',     @hash, 'member',   '#d946ef', N'Truyền thông', 1),
    (NEWID(), N'Tùng',             'tung@qlcv.vn',    @hash, 'member',   '#0891b2', N'Kỹ thuật',     1),
    (NEWID(), N'Tiên',             'tien@qlcv.vn',    @hash, 'member',   '#0ea5e9', N'KN&DMST',      1),
    (NEWID(), N'Sương',            'suong2@qlcv.vn',  @hash, 'member',   '#ec4899', N'KN&DMST',      1);

    PRINT N'✅ Đã thêm dữ liệu mẫu users (cần chạy seed.js để có hash mật khẩu đúng)';
END
GO

PRINT N'';
PRINT N'============================================================';
PRINT N'✅ HOÀN TẤT TẠO DATABASE qlcv_db';
PRINT N'============================================================';
PRINT N'';
PRINT N'BƯỚC TIẾP THEO:';
PRINT N'1. Cập nhật file backend/.env với thông tin SQL Server';
PRINT N'2. Chạy: npm install mssql tedious (trong thư mục backend)';
PRINT N'3. Chạy: node src/database/seed.js để tạo dữ liệu mẫu đúng';
PRINT N'';
GO
