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
    allowNull: false,
    comment: 'create | update | delete | approve | reject | status_change | upload'
  },
  entityType: {
    type: DataTypes.STRING(20),
    defaultValue: 'task',
    comment: 'task | monthly_task | event | user'
  },
  entityId: {
    type: DataTypes.STRING(50),
    defaultValue: null
  },
  entityCode: {
    type: DataTypes.STRING(50),
    defaultValue: null,
    comment: 'Mã CV dễ đọc: ADM-01.01'
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
  metadata: {
    type: DataTypes.TEXT,
    defaultValue: null,
    comment: 'JSON extra data',
    get() {
      const v = this.getDataValue('metadata');
      try { return v ? JSON.parse(v) : null; } catch { return null; }
    },
    set(val) {
      this.setDataValue('metadata', val ? JSON.stringify(val) : null);
    }
  }
}, {
  tableName: 'activity_logs',
  updatedAt: false
});

module.exports = ActivityLog;
