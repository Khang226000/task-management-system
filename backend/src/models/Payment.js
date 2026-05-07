const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

/**
 * Payment — Khoản thanh toán phụ trách theo bộ phận
 */
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },

  // ── Tên khoản thanh toán ──
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'VD: Thanh toán thư mời màu, in ấn bảng tên'
  },

  // ── Bộ phận phụ trách ──
  department: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'KN&DMST, Dịch vụ, Hành chính, Truyền thông, Kỹ thuật, Ban Giám đốc'
  },

  // ── Số tiền (tùy chọn) ──
  amount: {
    type: DataTypes.DECIMAL(18, 0),
    defaultValue: null,
    comment: 'Số tiền (VNĐ)'
  },

  // ── Trạng thái thanh toán ──
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: 'pending=chờ thanh toán, paid=đã thanh toán, cancelled=hủy'
  },

  // ── Ngày thanh toán dự kiến ──
  dueDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },

  // ── Ngày đã thanh toán ──
  paidDate: {
    type: DataTypes.DATEONLY,
    defaultValue: null
  },

  // ── Người phụ trách thanh toán ──
  assigneeId: {
    type: DataTypes.UUID,
    defaultValue: null
  },

  // ── Ghi chú ──
  notes: {
    type: DataTypes.TEXT,
    defaultValue: null
  },

  // ── File đính kèm (hóa đơn, chứng từ) ──
  attachments: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const v = this.getDataValue('attachments');
      try { return JSON.parse(v || '[]'); } catch { return []; }
    },
    set(val) {
      this.setDataValue('attachments', JSON.stringify(val || []));
    }
  },

  // ── Tháng/năm sự kiện ──
  month: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getMonth() + 1
  },
  year: {
    type: DataTypes.INTEGER,
    defaultValue: new Date().getFullYear()
  },

  // ── Thứ tự hiển thị ──
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
