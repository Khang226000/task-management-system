require('dotenv').config();
const express     = require('express');
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

// ── CORS ────────────────────────────────────────────────────
// Hỗ trợ nhiều origin: local dev + Vercel production
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// Luôn cho phép localhost khi dev
if (!IS_PROD) {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));

// ── Middleware ──────────────────────────────────────────────
app.use(compression());
app.set('trust proxy', 1); // Bắt buộc cho Render / Vercel / Cloudflare
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
app.get("/debug/admin", async (req, res) => {
  const { User } = require("./models");
  const admin = await User.findOne({ where: { email: "admin@qlcv.vn" } });

  res.json({
    exists: !!admin,
    role: admin?.role,
    password: admin?.password
  });
});
// ── Serve frontend nếu có dist (monorepo deploy) ────────────
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

// ── Seed dữ liệu mặc định ───────────────────────────────────
const bcrypt = require('bcryptjs');

async function seedDefaults() {
  const { User, Department } = require('./models');

  const email = 'admin@qlcv.vn';
  const passwordPlain = 'Admin@2026';

  const admin = await User.findOne({ where: { email } });

  const hashed = await bcrypt.hash(passwordPlain, 10);

  if (!admin) {
    await User.create({
      name: 'Admin',
      email,
      password: hashed,
      role: 'admin',
      color: '#6366f1'
    });

    console.log('🔥 Admin CREATED:', email);
  } else {
    await admin.update({
      password: hashed,
      role: 'admin'
    });

    console.log('♻️ Admin UPDATED:', email);
  }

  const deptCount = await Department.count();
  if (deptCount === 0) {
    await Department.bulkCreate([
      { code: 'KN-DMST', name: 'KN&DMST', color: '#ef4444' },
      { code: 'HC-TH', name: 'Hành chính tổng hợp', color: '#f59e0b' },
      { code: 'TT-TK', name: 'Thông tin thống kê', color: '#8b5cf6' },
      { code: 'DV', name: 'Dịch vụ', color: '#10b981' },
      { code: 'BGD', name: 'Ban Giám đốc', color: '#0ea5e9' },
    ]);
  }
}

// ── Khởi động ───────────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // alter: false — không tự sửa schema đang có dữ liệu
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database synced');

    await seedDefaults();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
    });

  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
