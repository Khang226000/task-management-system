const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * TaskTemplate - Danh sách công việc mẫu
 * Dùng để tạo task nhanh từ template có sẵn
 */
const TaskTemplate = sequelize.define('TaskTemplate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  taskCode: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  taskName: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  workCategory: {
    type: DataTypes.STRING(10),
    defaultValue: 'ADM'
  },
  leadDepartment: {
    type: DataTypes.STRING(20),
    defaultValue: 'LD-ADM'
  },
  deputyDirector: {
    type: DataTypes.STRING(100),
    defaultValue: null
  },
  taskType: {
    type: DataTypes.STRING(5),
    defaultValue: 'R'
  },
  deliverable: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  estimatedDays: {
    type: DataTypes.INTEGER,
    defaultValue: 7,
    comment: 'Số ngày dự kiến hoàn thành'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'task_templates'
});

module.exports = TaskTemplate;
