const { Event, User } = require('../models');
const { Op } = require('sequelize');

exports.getEvents = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);

    const events = await Event.findAll({
      where,
      include: [{ model: User, as: 'createdBy', attributes: ['id', 'name', 'avatar'] }],
      order: [['startDate', 'ASC']]
    });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const startDate = new Date(req.body.startDate);
    const event = await Event.create({
      ...req.body,
      month: startDate.getMonth() + 1,
      year: startDate.getFullYear(),
      createdById: req.user.id
    });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });

    await event.update(req.body);
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Không tìm thấy sự kiện' });

    await event.destroy();
    res.json({ success: true, message: 'Xóa sự kiện thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
