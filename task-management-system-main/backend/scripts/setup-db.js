/**
 * Script kiểm tra và khởi tạo database PostgreSQL
 * Chạy: node backend/scripts/setup-db.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize } = require('../src/database/connection');
const { User, Department } = require('../src/models');

async function setupDatabase() {
  const dbUrl = process.env.DATABASE_URL || '';
  // Ẩn password khi log
  const safeUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
  console.log('\n🔧 Đang kiểm tra kết nối PostgreSQL...');
  console.log(`   URL: ${safeUrl}\n`);

  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối PostgreSQL thành công!\n');
  } catch (err) {
    console.error('❌ Không thể kết nối PostgreSQL:', err.message);
    console.error('\n   Kiểm tra lại:');
    console.error('   1. DATABASE_URL trong .env đúng chưa?');
    console.error('   2. PostgreSQL đang chạy?');
    console.error('   3. Database đã được tạo chưa?');
    console.error('   4. SSL: thêm DB_SSL=false nếu dùng local không có SSL');
    process.exit(1);
  }

  console.log('🔧 Đang sync schema...');
  try {
    await sequelize.sync({ force: false, alter: false });
    console.log('✅ Schema đã sẵn sàng\n');
  } catch (err) {
    console.error('❌ Lỗi sync schema:', err.message);
    process.exit(1);
  }

  // Kiểm tra admin (theo email để tránh seed trùng)
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@qlcv.vn';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@2024';

  const adminExists = await User.findOne({ where: { email: adminEmail } });
  if (!adminExists) {
    console.log('⚠️  Chưa có tài khoản admin. Tạo tài khoản mặc định...');
    await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      color: '#6366f1'
    });
    console.log('✅ Tạo admin thành công');
    console.log('   Email   :', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('   ⚠️  Đổi mật khẩu ngay sau khi đăng nhập!\n');
  } else {
    console.log('✅ Tài khoản admin đã tồn tại\n');
  }

  // Kiểm tra departments
  const deptCount = await Department.count();
  if (deptCount === 0) {
    await Department.bulkCreate([
      { code: 'KN-DMST', name: 'KN&DMST',             color: '#ef4444' },
      { code: 'HC-TH',   name: 'Hành chính tổng hợp', color: '#f59e0b' },
      { code: 'TT-TK',   name: 'Thông tin thống kê',   color: '#8b5cf6' },
      { code: 'DV',      name: 'Dịch vụ',              color: '#10b981' },
      { code: 'BGD',     name: 'Ban Giám đốc',         color: '#0ea5e9' },
    ]);
    console.log('✅ Tạo bộ phận mặc định thành công\n');
  }

  console.log('🎉 Database setup hoàn tất!\n');
  process.exit(0);
}

setupDatabase().catch(err => {
  console.error('❌ Lỗi không xác định:', err.message);
  process.exit(1);
});

