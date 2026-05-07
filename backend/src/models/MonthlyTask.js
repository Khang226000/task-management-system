const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * MonthlyTask - Công việc hằng tháng
 * Cấu trúc bảng phẳng theo ảnh mẫu
 */
const MonthlyTask = sequelize.define('MonthlyTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // ── Mã công việc: KN_TT_02_01 ──
  taskId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },

  // ── Tên công việc ──
  taskName: {
    type: DataTypes.STRING(500),
    allowNull: false
  },

  // ── Thời gian ──
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
    defaultValue: null,
    comment: 'Ngày gia hạn'
  },

  // ── Người thực hiện ──
  assigneeId: {
    type: DataTypes.UUID,
    defaultValue: null
  },

  // ── Loại nhiệm vụ: R=Routine, A=Ad-hoc ──
  taskType: {
    type: DataTypes.STRING(5),
    defaultValue: 'R',
    comment: 'R=Routine, A=Ad-hoc'
  },

  // ── Mức độ hoàn thành: OT, OD, IC ──
  completion: {
    type: DataTypes.STRING(5),
    defaultValue: null,
    comment: 'OT=On Time, OD=Overdue, IC=Incomplete'
  },

  // ── Tiến độ % ──
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 }
  },

  // ── Ghi chú ──
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null
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

  // ── Nhóm nhiệm vụ: NHIEM_VU_THUONG_XUYEN, NHIEM_VU_PHAT_SINH ──
  taskGroup: {
    type: DataTypes.STRING(50),
    defaultValue: 'THUONG_XUYEN',
    comment: 'THUONG_XUYEN=Thường xuyên, PHAT_SINH=Phát sinh'
  },

  // ── Bộ phận ──
  department: {
    type: DataTypes.STRING(20),
    defaultValue: null
  },

  // ── Tháng/năm ──
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

  // ── STT (số thứ tự trong tháng) ──
  stt: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // ── Phê duyệt ──
  approvalStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: 'pending=chờ duyệt, review=yêu cầu duyệt, approved=đã duyệt, rejected=từ chối'
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
