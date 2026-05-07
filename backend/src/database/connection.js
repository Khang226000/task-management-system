require('dotenv').config();
const { Sequelize } = require('sequelize');

// Kiểm tra biến môi trường bắt buộc cho SQL Server
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Thiếu biến môi trường: ${missingVars.join(', ')}`);
  console.error('   Kiểm tra file .env và đảm bảo đã cấu hình đầy đủ.');
  process.exit(1);
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    parseInt(process.env.DB_PORT) || 1433,
    dialect: 'mssql',
    logging: false,
    dialectOptions: {
      options: {
        encrypt:                false,
        trustServerCertificate: true,
        enableArithAbort:       true,
        connectTimeout:         30000,
        requestTimeout:         30000,
        packetSize:             4096,
        cancelTimeout:          5000,
      }
    },
    pool: { max: 30, min: 3, acquire: 30000, idle: 10000, evict: 5000 },
    retry: { max: 3 }
  }
);

module.exports = { sequelize };
