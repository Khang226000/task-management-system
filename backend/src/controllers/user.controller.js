const { User, Task } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    const { password, ...updateData } = req.body;
    const oldName = user.name;
    const oldRole = user.role;
    const oldDept = user.department;

    await user.update(updateData);

    // Đổi mật khẩu nếu admin cung cấp (reset mật khẩu cho nhân viên)
    if (password && password.trim()) {
      const hash = await bcrypt.hash(password.trim(), 10);
      await User.update({ password: hash }, { where: { id: user.id }, hooks: false });

      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: user.id,
        entityCode: user.email,
        entityName: user.name,
        description: `Admin đặt lại mật khẩu cho tài khoản "${user.name}" (${user.email})`,
        userId: req.user?.id,
      });
    }

    // Log thay đổi thông tin
    const changes = [];
    if (updateData.name && updateData.name !== oldName) changes.push(`Tên: "${oldName}" → "${updateData.name}"`);
    if (updateData.role && updateData.role !== oldRole) changes.push(`Vai trò: "${oldRole}" → "${updateData.role}"`);
    if (updateData.department !== undefined && updateData.department !== oldDept) changes.push(`Bộ phận: "${oldDept || '—'}" → "${updateData.department || '—'}"`);

    if (changes.length > 0) {
      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: user.id,
        entityCode: user.email,
        entityName: user.name,
        description: `Admin cập nhật thông tin tài khoản "${user.name}": ${changes.join(', ')}`,
        userId: req.user?.id,
      });
    }

    res.json({ success: true, data: user, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

    await user.update({ isActive: false });

    await logActivity({
      action: 'delete',
      entityType: 'user',
      entityId: user.id,
      entityCode: user.email,
      entityName: user.name,
      description: `Vô hiệu hóa tài khoản "${user.name}" (${user.email})`,
      userId: req.user?.id,
    });

    res.json({ success: true, message: 'Vô hiệu hóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
