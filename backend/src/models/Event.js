const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: null
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'other',
    validate: {
      isIn: [['meeting', 'deadline', 'holiday', 'reminder', 'other']]
    }
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#6366f1'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  allDay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'events'
});

module.exports = Event;
