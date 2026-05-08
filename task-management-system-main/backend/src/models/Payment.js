const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(18, 0),
    defaultValue: null
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  paidDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  assigneeId: {
    type: DataTypes.UUID,
    defaultValue: null
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  // PostgreSQL JSONB
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  month: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getMonth() + 1
  },
  year: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getFullYear()
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'payments'
});

module.exports = Payment;
