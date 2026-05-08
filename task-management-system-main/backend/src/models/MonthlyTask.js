const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const MonthlyTask = sequelize.define('MonthlyTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  taskName: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  extendedDueDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  assigneeId: {
    type: DataTypes.UUID,
    defaultValue: null
  },
  taskType: {
    type: DataTypes.STRING(5),
    defaultValue: 'R'
  },
  completion: {
    type: DataTypes.STRING(5),
    defaultValue: null
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
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
  taskGroup: {
    type: DataTypes.STRING(50),
    defaultValue: 'THUONG_XUYEN'
  },
  department: {
    type: DataTypes.STRING(20),
    defaultValue: null
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: new Date().getMonth() + 1
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: new Date().getFullYear()
  },
  stt: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  approvalStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending'
  },
  approvedById: {
    type: DataTypes.UUID,
    defaultValue: null
  },
  approvedAt: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  approvalNote: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'monthly_tasks'
});

module.exports = MonthlyTask;
