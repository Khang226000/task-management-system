const { Task, MonthlyTask } = require('../models');
const path = require('path');
const fs   = require('fs');

/**
 * Upload file đính kèm cho task (sự kiện hoặc tháng)
 * POST /api/upload/task/:id        — Event task
 * POST /api/upload/monthly/:id     — Monthly task
 */

const buildFileInfo = (file) => ({
  filename:     file.filename,
  originalName: file.originalname,
  mimetype:     file.mimetype,
  size:         file.size,
  url:          `/uploads/${file.filename}`,
  uploadedAt:   new Date().toISOString()
});

exports.uploadTaskFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file được gửi lên' });

    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });

    const existing = Array.isArray(task.attachments) ? task.attachments : [];
    const newFile  = buildFileInfo(req.file);
    await task.update({ attachments: [...existing, newFile] });

    res.json({ success: true, data: newFile, message: 'Upload thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.uploadMonthlyFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Không có file được gửi lên' });

    const task = await MonthlyTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy công việc' });

    const existing = Array.isArray(task.attachments) ? task.attachments : [];
    const newFile  = buildFileInfo(req.file);
    await task.update({ attachments: [...existing, newFile] });

    res.json({ success: true, data: newFile, message: 'Upload thành công' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteTaskFile = async (req, res) => {
  try {
    const { id, filename } = req.params;
    // Ngăn path traversal attack
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(400).json({ success: false, message: 'Tên file không hợp lệ' });
    }
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const existing = Array.isArray(task.attachments) ? task.attachments : [];
    const toDelete = existing.find(f => f.filename === filename);
    if (toDelete) {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await task.update({ attachments: existing.filter(f => f.filename !== filename) });
    res.json({ success: true, message: 'Đã xóa file' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.deleteMonthlyFile = async (req, res) => {
  try {
    const { id, filename } = req.params;
    // Ngăn path traversal attack
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(400).json({ success: false, message: 'Tên file không hợp lệ' });
    }
    const task = await MonthlyTask.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const existing = Array.isArray(task.attachments) ? task.attachments : [];
    const toDelete = existing.find(f => f.filename === filename);
    if (toDelete) {
      const filePath = path.join(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await task.update({ attachments: existing.filter(f => f.filename !== filename) });
    res.json({ success: true, message: 'Đã xóa file' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
