require('dotenv').config();
const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  console.error('❌ Thiếu biến môi trường DATABASE_URL');
  console.error('   Ví dụ: DATABASE_URL=postgresql://user:password@host:5432/dbname');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,

  dialectOptions: {
    ssl: process.env.DB_SSL === 'false'
      ? false
      : {
          require: true,
          rejectUnauthorized: false
        }
  },

  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = { sequelize };
