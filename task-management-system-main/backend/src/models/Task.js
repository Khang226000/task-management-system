const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  parentCode: {
    type: DataTypes.STRING(30),
    defaultValue: null
  },
  workCategory: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'ADM'
  },
  taskName: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  leadDepartment: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'LD-ADM'
  },
  assigneeId: {
    type: DataTypes.UUID,
    defaultValue: null
  },
  // PostgreSQL JSONB — lưu trực tiếp array, không cần serialize thủ công
  collaborators: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  deputyDirector: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  startDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  deadline: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  extendedDeadline: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },
  extensionReason: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  deliverable: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  // PostgreSQL JSONB — lưu trực tiếp array
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },
  taskType: {
    type: DataTypes.STRING(5),
    defaultValue: 'R'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'not_started'
  },
  completion: {
    type: DataTypes.STRING(5),
    defaultValue: null
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
  notes: {
    type: DataTypes.TEXT,
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
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'tasks'
});

module.exports = Task;
