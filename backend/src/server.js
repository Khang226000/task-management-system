require('dotenv').config();
const express     = require('express');
const https       = require('https');
const http        = require('http');
const cors        = require('cors');
const path        = require('path');
const fs          = require('fs');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const { sequelize }        = require('./database/connection');
const { startDNS, getLocalIP, DNS_DOMAIN } = require('./dns-server');

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
const PORT      = parseInt(process.env.PORT)      || 443;
const PORT_HTTP = parseInt(process.env.PORT_HTTP) || 80;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Rate limiting ───────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
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
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
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

// ── Redirect HTTP → HTTPS ───────────────────────────────────
app.use((req, res, next) => {
  if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
    const host = req.headers.host?.replace(`:${PORT_HTTP}`, '') || 'casictask.local';
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
});

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/tasks',         apiLimiter, taskRoutes);
app.use('/api/users',         apiLimiter, userRoutes);
app.use('/api/events',        apiLimiter, eventRoutes);
app.use('/api/stats',         apiLimiter, statsRoutes);
app.use('/api/monthly-tasks', apiLimiter, monthlyTaskRoutes);
app.use('/api/notifications', apiLimiter, notificationRoutes);
app.use('/api/upload',        apiLimiter, uploadRoutes);
app.use('/api/activity-logs', apiLimiter, activityLogRoutes);
app.use('/api/task-templates',apiLimiter, taskTemplateRoutes);
app.use('/api/payments',      apiLimiter, paymentRoutes);
app.use('/api/departments',   apiLimiter, departmentRoutes);

// ── Static files ────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status:   'OK',
      protocol: req.secure ? 'HTTPS ✅' : 'HTTP',
      uptime:   Math.floor(process.uptime()) + 's'
    });
  } catch(e) {
    res.status(503).json({ status: 'ERROR', db: e.message });
  }
});

// ── Serve frontend ──────────────────────────────────────────
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  // Không lộ stack trace trong production
  const message = IS_PROD && status === 500 ? 'Lỗi máy chủ nội bộ' : err.message;
  if (!IS_PROD) console.error('[ERROR]', err.stack);
  res.status(status).json({ success: false, message });
});

// ── Khởi động server ────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected (SQL Server)');
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Database synced');

    // Seed bộ phận mặc định nếu chưa có
    const { Department } = require('./models');
    const deptCount = await Department.count();
    if (deptCount === 0) {
      await Department.bulkCreate([
        { code: 'KN-DMST',  name: 'KN&DMST',                color: '#ef4444' },
        { code: 'HC-TH',    name: 'Hành chính tổng hợp',    color: '#f59e0b' },
        { code: 'TT-TK',    name: 'Thông tin thống kê',      color: '#8b5cf6' },
        { code: 'DV',       name: 'Dịch vụ',                 color: '#10b981' },
        { code: 'BGD',      name: 'Ban Giám đốc',            color: '#0ea5e9' },
      ]);
      console.log('✅ Seeded default departments');
    }

    // ── Đọc SSL certificate ──
    const certsDir = path.join(__dirname, '../certs');
    const keyFile  = path.join(certsDir, 'server.key');
    const crtFile  = path.join(certsDir, 'server.crt');

    if (fs.existsSync(keyFile) && fs.existsSync(crtFile)) {
      // ── HTTPS server ──
      const sslOptions = {
        key:  fs.readFileSync(keyFile),
        cert: fs.readFileSync(crtFile),
      };

      https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
        const localIP = getLocalIP();
        console.log('\n🔒 CASIC Task chạy HTTPS tại:');
        console.log(`   Máy chủ      : https://${DNS_DOMAIN}`);
        console.log(`   Hoặc         : https://localhost`);
        console.log(`   IP máy chủ   : ${localIP}`);
        console.log('\n   ✅ Kết nối an toàn (HTTPS)');
        console.log(`\n   📡 DNS Server: Cấu hình router DHCP → DNS = ${localIP}`);
        console.log(`      Sau đó nhân viên gõ: https://${DNS_DOMAIN}\n`);
      });

      // ── HTTP redirect ──
      http.createServer((req, res) => {
        const host = req.headers.host?.replace(':80', '') || DNS_DOMAIN;
        res.writeHead(301, { Location: `https://${host}${req.url}` });
        res.end();
      }).listen(PORT_HTTP, '0.0.0.0', () => {
        console.log(`   HTTP :${PORT_HTTP} → redirect sang HTTPS tự động`);
      });

      // ── DNS server nội bộ ──
      startDNS();

    } else {
      // ── Fallback: HTTP nếu không có cert ──
      console.warn('⚠️  Không tìm thấy SSL cert — chạy HTTP (không an toàn)');
      console.warn('   Chạy: node generate-cert.js để tạo cert\n');
      app.listen(PORT, '0.0.0.0', () => {
        console.log('🚀 TaskMaster chạy HTTP tại: http://localhost:5000');
      });
    }

  } catch (error) {
    console.error('❌ Không thể khởi động:', error.message);
    process.exit(1);
  }
}

startServer();
