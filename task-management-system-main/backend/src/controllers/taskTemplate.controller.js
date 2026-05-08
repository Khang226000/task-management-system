const { TaskTemplate, User } = require('../models');
const { Op } = require('sequelize');

const include = [{ model: User, as: 'createdBy', attributes: ['id','name'] }];

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { isActive: true };
    if (search) where[Op.or] = [
      { taskCode: { [Op.iLike]: `%${search}%` } },
      { taskName: { [Op.iLike]: `%${search}%` } }
    ];
    const templates = await TaskTemplate.findAll({ where, include, order: [['taskCode','ASC']] });
    res.json({ success: true, data: templates });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const t = await TaskTemplate.create({ ...req.body, createdById: req.user.id });
    res.status(201).json({ success: true, data: t });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const t = await TaskTemplate.findByPk(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await t.update(req.body);
    res.json({ success: true, data: t });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const t = await TaskTemplate.findByPk(req.params.id);
    if (!t) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await t.update({ isActive: false });
    res.json({ success: true, message: 'Đã xóa' });
  } catch(e) { res.status(500).json({ success: false, message: e.message }); }
};
