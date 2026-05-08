const { Department } = require('../models');
const { logActivity } = require('../utils/activityLogger');

// Lấy tất cả bộ phận
exports.getAll = async (req, res) => {
  try {
    const depts = await Department.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: depts });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Thêm bộ phận mới
exports.create = async (req, res) => {
  try {
    const { code, name, color } = req.body;
    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Mã và tên bộ phận không được để trống' });
    }

    // Kiểm tra trùng mã
    const existing = await Department.findOne({ where: { code: code.trim().toUpperCase() } });
    if (existing) {
      return res.status(400).json({ success: false, message: `Mã bộ phận "${code}" đã tồn tại` });
    }

    const dept = await Department.create({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      color: color || '#6366f1'
    });

    await logActivity({
      action: 'create',
      entityType: 'department',
      entityId: dept.id,
      entityCode: dept.code,
      entityName: dept.name,
      description: `Thêm bộ phận mới: [${dept.code}] ${dept.name}`,
      userId: req.user?.id,
    });

    res.status(201).json({ success: true, data: dept, message: 'Thêm bộ phận thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Cập nhật bộ phận
exports.update = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ phận' });

    const { name, color } = req.body;
    await dept.update({ name: name?.trim() || dept.name, color: color || dept.color });

    res.json({ success: true, data: dept, message: 'Cập nhật thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Xóa bộ phận (soft delete)
exports.remove = async (req, res) => {
  try {
    const dept = await Department.findByPk(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Không tìm thấy bộ phận' });

    await dept.update({ isActive: false });
    res.json({ success: true, message: 'Đã xóa bộ phận' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
