const { ActivityLog } = require('../models');

const ACTION_LABELS = {
  create:        'Tạo mới',
  update:        'Chỉnh sửa',
  delete:        'Xóa',
  approve:       'Duyệt',
  reject:        'Từ chối',
  status_change: 'Đổi trạng thái',
  upload:        'Đính kèm file',
};

/**
 * Ghi log hoạt động
 * @param {object} opts
 * @param {string} opts.action
 * @param {string} opts.entityType
 * @param {string} opts.entityId
 * @param {string} opts.entityCode
 * @param {string} opts.entityName
 * @param {string} opts.description
 * @param {string} opts.userId
 * @param {object} [opts.metadata]
 */
async function logActivity(opts) {
  try {
    await ActivityLog.create({
      action:      opts.action,
      entityType:  opts.entityType || 'task',
      entityId:    opts.entityId,
      entityCode:  opts.entityCode,
      entityName:  opts.entityName,
      description: opts.description,
      userId:      opts.userId,
      metadata:    opts.metadata || null   // JSONB — truyền object trực tiếp
    });
  } catch (e) {
    // Không để lỗi log làm crash request chính
    console.error('ActivityLog error:', e.message);
  }
}

module.exports = { logActivity, ACTION_LABELS };
