const { ActivityLog, User } = require('../models');
const { Op } = require('sequelize');

exports.getLogs = async (req, res) => {
  try {
    const { date, dateFrom, dateTo, action, userId, search, limit = 100, offset = 0 } = req.query;
    const where = {};

    if (action)  where.action = action;
    if (userId)  where.userId = userId;
    if (search)  where.description = { [Op.iLike]: `%${search}%` };

    // Lọc theo ngày đơn
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end   = new Date(date); end.setHours(23,59,59,999);
      where.createdAt = { [Op.between]: [start, end] };
    }
    // Lọc theo khoảng thời gian
    else if (dateFrom || dateTo) {
      const rangeFilter = {};
      if (dateFrom) {
        const s = new Date(dateFrom); s.setHours(0,0,0,0);
        rangeFilter[Op.gte] = s;
      }
      if (dateTo) {
        const e = new Date(dateTo); e.setHours(23,59,59,999);
        rangeFilter[Op.lte] = e;
      }
      where.createdAt = rangeFilter;
    }

    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id','name','color','role'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ success: true, data: rows, total: count });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
