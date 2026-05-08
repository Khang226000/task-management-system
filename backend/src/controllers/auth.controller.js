const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

let role = 'member';

if (email === process.env.ADMIN_EMAIL) {
  role = 'admin';
}
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
  name,
  email,
  password: hashedPassword,
  role: role || 'member'
});
    const token = generateToken(user);

    res.status(201).json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({
    success: false,
    message: 'Email hoặc mật khẩu không đúng'
  });
}

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị vô hiệu hóa' });
    }

    const token = generateToken(user);
    res.json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    const isMatch = await bcrypt.compare(
  currentPassword,
  user.password
);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
user.password = hashed;
await user.save();

    await logActivity({
      action: 'update',
      entityType: 'user',
      entityId: user.id,
      entityCode: user.email,
      entityName: user.name,
      description: `"${user.name}" đã đổi mật khẩu`,
      userId: user.id,
    });

    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Cập nhật thông tin cá nhân ──
exports.updateProfile = async (req, res) => {
  try {
    const { name, color, department } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

    const updates = {};
    const changes = [];
    if (name && name.trim() && name.trim() !== user.name) {
      changes.push(`Tên: "${user.name}" → "${name.trim()}"`);
      updates.name = name.trim();
    }
    if (color && color !== user.color) {
      updates.color = color;
    }

    // Chỉ admin mới được đặt bộ phận "Ban Giám đốc"
    if (department !== undefined) {
      if (department === 'Ban Giám đốc' && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền đặt bộ phận Ban Giám đốc' });
      }
      if (department !== user.department) {
        changes.push(`Bộ phận: "${user.department || '—'}" → "${department || '—'}"`);
        updates.department = department;
      }
    }

    await user.update(updates);

    if (changes.length > 0) {
      await logActivity({
        action: 'update',
        entityType: 'user',
        entityId: user.id,
        entityCode: user.email,
        entityName: user.name,
        description: `"${user.name}" cập nhật thông tin cá nhân: ${changes.join(', ')}`,
        userId: user.id,
      });
    }

    res.json({ success: true, data: user, message: 'Cập nhật thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
