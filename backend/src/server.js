require('dotenv').config();
const express     = require('express');
const https       = require('https');
const http        = require('http');
const cors        = require('cors');
const path        = require('path');
const fs          = require('fs');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const { sequelize } = require('./database/connection');

const authRoutes         = require('./routes/auth.routes');
const taskRoutes         = require('./routes/task.routes');
const userRoutes         = require('./routes/user.routes');
const eventRoutes        = require('./routes/event.routes');
const statsRoutes        = require('./routes/stats.routes');
const monthlyTaskRoutes  = require('./routes/monthlyTask.routes');
const notificationRoutes = require('./routes/notification.routes');
const uploadRoutes       = require('./routes/upload.routes');
const activityLogRoutes  = require('./routes/activityLog.routes');
const taskTemplateRoutes = require('./routes/taskTemplate.routes');
const paymentRoutes      = require('./routes/payment.routes');
const departmentRoutes   = require('./routes/department.routes');

const app     = express();
// Render inject PORT tự động; local fallback 5000
const PORT    = parseInt(process.env.PORT) || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Rate limiting ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút.' }
});

// ── Middleware ──────────────────────────────────────────────
app.use(compression());

// Trust proxy — bắt buộc khi chạy sau Render / Cloudflare / nginx
app.set('trust proxy', 1);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://task-management-system-lilac-chi.vercel.app"
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Security headers ────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/tasks',         apiLimiter,  taskRoutes);
app.use('/api/users',         apiLimiter,  userRoutes);
app.use('/api/events',        apiLimiter,  eventRoutes);
app.use('/api/stats',         apiLimiter,  statsRoutes);
app.use('/api/monthly-tasks', apiLimiter,  monthlyTaskRoutes);
app.use('/api/notifications', apiLimiter,  notificationRoutes);
app.use('/api/upload',        apiLimiter,  uploadRoutes);
app.use('/api/activity-logs', apiLimiter,  activityLogRoutes);
app.use('/api/task-templates',apiLimiter,  taskTemplateRoutes);
app.use('/api/payments',      apiLimiter,  paymentRoutes);
app.use('/api/departments',   apiLimiter,  departmentRoutes);

// ── Static uploads ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'OK', db: 'PostgreSQL ✅', uptime: Math.floor(process.uptime()) + 's' });
  } catch (e) {
    res.status(503).json({ status: 'ERROR', db: e.message });
  }
});

// ── Serve frontend (production) ─────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = IS_PROD && status === 500 ? 'Lỗi máy chủ nội bộ' : err.message;
  if (!IS_PROD) console.error('[ERROR]', err.stack);
  res.status(status).json({ success: false, message });
});

// ── Khởi động ───────────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database synced');
   if (process.env.SEED_ADMIN === 'true') {
  const bcrypt = require("bcryptjs");
  const { User } = require('./models');

  const email = process.env.ADMIN_EMAIL || "admin@qlcv.vn";
  const hashedPassword = await bcrypt.hash("Admin@2026", 10);

  // ❗ XÓA luôn admin cũ
  await User.destroy({ where: { email } });

  // TẠO lại admin mới
  await User.create({
    name: "Admin",
    email,
    password: hashedPassword,
    role: "admin"
  });

  console.log("🔥 FORCE RESET ADMIN DONE");
}
    // Seed bộ phận mặc định nếu chưa có
    const { Department } = require('./models');
    const deptCount = await Department.count();
    if (deptCount === 0) {
      await Department.bulkCreate([
        { code: 'KN-DMST', name: 'KN&DMST',             color: '#ef4444' },
        { code: 'HC-TH',   name: 'Hành chính tổng hợp', color: '#f59e0b' },
        { code: 'TT-TK',   name: 'Thông tin thống kê',   color: '#8b5cf6' },
        { code: 'DV',      name: 'Dịch vụ',              color: '#10b981' },
        { code: 'BGD',     name: 'Ban Giám đốc',         color: '#0ea5e9' },
      ]);
      console.log('✅ Seeded default departments');
    }

    // ── HTTPS local (nếu có cert) ──
    const certsDir = path.join(__dirname, '../certs');
    const keyFile  = path.join(certsDir, 'server.key');
    const crtFile  = path.join(certsDir, 'server.crt');

    if (!IS_PROD && fs.existsSync(keyFile) && fs.existsSync(crtFile)) {
      const sslOptions = {
        key:  fs.readFileSync(keyFile),
        cert: fs.readFileSync(crtFile),
      };
      const httpsPort = parseInt(process.env.PORT_HTTPS) || 443;
      https.createServer(sslOptions, app).listen(httpsPort, '0.0.0.0', () => {
        console.log(`🔒 HTTPS local: https://localhost:${httpsPort}`);
      });
      http.createServer((req, res) => {
        res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
        res.end();
      }).listen(parseInt(process.env.PORT_HTTP) || 80, '0.0.0.0');
    } else {
      // Render / production: HTTP (Render tự xử lý TLS)
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on port ${PORT}`);
        if (IS_PROD) console.log('   Mode: production (Render)');
      });
    }

  } catch (error) {
    console.error('❌ Không thể khởi động:', error.message);
    process.exit(1);
  }
}

startServer();
