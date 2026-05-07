const { Payment, User } = require('../models');
const { Op } = require('sequelize');

const include = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'color', 'avatar'] }
];

// ── Lấy danh sách ──
exports.getAll = async (req, res) => {
  try {
    const { month, year, department, status, assigneeId, search } = req.query;
    const where = {};
    if (month)      where.month      = parseInt(month);
    if (year)       where.year       = parseInt(year);
    if (department) where.department = department;
    if (status)     where.status     = status;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search)     where.name       = { [Op.like]: `%${search}%` };

    const payments = await Payment.findAll({
      where, include,
      order: [['department', 'ASC'], ['sortOrder', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json({ success: true, data: payments });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Thống kê ──
exports.getStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year)  where.year  = parseInt(year);

    const all = await Payment.findAll({ where, attributes: ['department', 'status', 'amount'] });

    const total   = all.length;
    const paid    = all.filter(p => p.status === 'paid').length;
    const pending = all.filter(p => p.status === 'pending').length;
    const cancelled = all.filter(p => p.status === 'cancelled').length;

    // Tổng tiền
    const totalAmount  = all.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const paidAmount   = all.filter(p => p.status === 'paid').reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);

    // Theo bộ phận
    const byDept = {};
    all.forEach(p => {
      if (!byDept[p.department]) byDept[p.department] = { total: 0, paid: 0, pending: 0, amount: 0 };
      byDept[p.department].total++;
      byDept[p.department].amount += parseFloat(p.amount) || 0;
      if (p.status === 'paid')    byDept[p.department].paid++;
      if (p.status === 'pending') byDept[p.department].pending++;
    });

    res.json({ success: true, data: { total, paid, pending, cancelled, totalAmount, paidAmount, byDept } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Lấy 1 ──
exports.getById = async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id, { include });
    if (!p) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: p });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Tạo mới ──
exports.create = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.dueDate === '') body.dueDate = null;
    if (body.paidDate === '') body.paidDate = null;
    if (body.amount === '' || body.amount === undefined) body.amount = null;
    if (body.assigneeId === '') body.assigneeId = null;

    const p = await Payment.create({ ...body, createdById: req.user.id });
    const full = await Payment.findByPk(p.id, { include });
    res.status(201).json({ success: true, data: full });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Cập nhật ──
exports.update = async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    const body = { ...req.body };
    if (body.dueDate === '') body.dueDate = null;
    if (body.paidDate === '') body.paidDate = null;
    if (body.amount === '') body.amount = null;
    if (body.assigneeId === '') body.assigneeId = null;
    await p.update(body);
    const full = await Payment.findByPk(p.id, { include });
    res.json({ success: true, data: full });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Xóa ──
exports.delete = async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await p.destroy();
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Đánh dấu đã thanh toán ──
exports.markPaid = async (req, res) => {
  try {
    const p = await Payment.findByPk(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await p.update({ status: 'paid', paidDate: req.body.paidDate || new Date().toISOString().slice(0,10) });
    const full = await Payment.findByPk(p.id, { include });
    res.json({ success: true, data: full, message: 'Đã đánh dấu thanh toán' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
