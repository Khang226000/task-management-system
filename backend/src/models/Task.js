const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // ── Mã công việc dạng cây: ADM-01, ADM-01.01 ──
  taskCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true
  },
  parentCode: {
    type: DataTypes.STRING(30),
    defaultValue: null,
    comment: 'Mã task cha, null = task gốc'
  },

  // ── Work Category Code ──
  workCategory: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'ADM'
  },

  // ── Thông tin chính ──
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
  collaborators: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const v = this.getDataValue('collaborators');
      try { return JSON.parse(v || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('collaborators', JSON.stringify(val || []));
    }
  },
  deputyDirector: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: 'Lãnh đạo phụ trách: GD Hải, PGĐ Khanh, PGĐ Điền, PGĐ Vụ'
  },

  // ── Thời gian ──
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
    defaultValue: null,
    comment: 'Gia hạn deadline vì lý do khách quan'
  },
  extensionReason: {
    type: DataTypes.TEXT,
    defaultValue: null,
    comment: 'Lý do gia hạn'
  },

  // ── Kết quả & tiến độ ──
  deliverable: {
    type: DataTypes.TEXT,
    defaultValue: null,
    comment: 'Kết quả đầu ra'
  },
  attachments: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    comment: 'Danh sách file đính kèm (JSON array)',
    get() {
      const v = this.getDataValue('attachments');
      try { return JSON.parse(v || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('attachments', JSON.stringify(val || []));
    }
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },

  // ── Phân loại ──
  taskType: {
    type: DataTypes.STRING(5),
    defaultValue: 'R',
    comment: 'R=Routine (bình thường), A=Ad-hoc (phát sinh)'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'not_started'
  },
  completion: {
    type: DataTypes.STRING(5),
    defaultValue: null,
    comment: 'OT=On Time, OD=Overdue, IC=Incomplete'
  },

  // ── Phê duyệt ──
  approvalStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: 'pending=chờ duyệt, review=yêu cầu duyệt, approved=đã duyệt, rejected=từ chối'
  },
  approvedById: {
    type: DataTypes.UUID,
    defaultValue: null,
    comment: 'ID người duyệt'
  },
  approvedAt: {
    type: DataTypes.DATE,
    defaultValue: null,
    comment: 'Thời điểm duyệt'
  },
  approvalNote: {
    type: DataTypes.TEXT,
    defaultValue: null,
    comment: 'Ghi chú khi duyệt/từ chối'
  },

  // ── Ghi chú ──
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null
  },

  // ── Tháng/năm để lọc ──
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
