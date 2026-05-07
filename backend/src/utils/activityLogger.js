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
 * @param {string} opts.action - create|update|delete|approve|reject|status_change|upload
 * @param {string} opts.entityType - task|monthly_task|event
 * @param {string} opts.entityId
 * @param {string} opts.entityCode - mã CV
 * @param {string} opts.entityName - tên CV
 * @param {string} opts.description - mô tả chi tiết
 * @param {string} opts.userId
 * @param {object} [opts.metadata] - dữ liệu thêm
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
      metadata:    opts.metadata || null
    });
  } catch (e) {
    // Không để lỗi log làm crash request chính
    console.error('ActivityLog error:', e.message);
  }
}

module.exports = { logActivity, ACTION_LABELS };
