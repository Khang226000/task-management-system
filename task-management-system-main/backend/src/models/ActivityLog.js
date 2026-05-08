const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  action: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(20),
    defaultValue: 'task'
  },
  entityId: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  entityCode: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  entityName: {
    type: DataTypes.STRING(500),
    defaultValue: null
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  // PostgreSQL JSONB thay vì TEXT serialize thủ công
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: null
  }
}, {
  tableName: 'activity_logs',
  updatedAt: false
});

module.exports = ActivityLog;
