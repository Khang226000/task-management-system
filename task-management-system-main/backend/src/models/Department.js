const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: 'Mã bộ phận, VD: KN-DMST, HC-TH, TT-TK, DV'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Tên bộ phận, VD: KN&DMST, Hành chính tổng hợp'
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'departments',
  timestamps: true
});

module.exports = Department;
