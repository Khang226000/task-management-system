const router = require('express').Router();
const path   = require('path');
const fs     = require('fs');
const upload = require('../middleware/upload.middleware');
const ctrl   = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth.middleware');

// DOWNLOAD KHÔNG CẦN TOKEN
router.get('/download/:filename', (req, res) => {
  const filename     = path.basename(req.params.filename);
  const originalName = path.basename(req.query.name || filename);
  const filePath     = path.join(__dirname, '../../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File không tồn tại'
    });
  }

  const encodedName = encodeURIComponent(originalName);

  res.setHeader(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodedName}`
  );

  res.setHeader('Content-Type', 'application/octet-stream');

  res.sendFile(filePath);
});

router.use(authenticate);

// Upload file đính kèm
router.post('/task/:id',    upload.single('file'), ctrl.uploadTaskFile);
router.post('/monthly/:id', upload.single('file'), ctrl.uploadMonthlyFile);

// Xóa file
router.delete('/task/:id/:filename',    ctrl.deleteTaskFile);
router.delete('/monthly/:id/:filename', ctrl.deleteMonthlyFile);

// ── Download file với đúng tên gốc ──
// GET /api/upload/download/:filename?name=TenGoc.pdf
router.get('/download/:filename', (req, res) => {
  // Sanitize: chỉ lấy tên file, không cho path traversal
  const filename     = path.basename(req.params.filename);
  const originalName = path.basename(req.query.name || filename);
  const filePath     = path.join(__dirname, '../../uploads', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File không tồn tại' });
  }

  const encodedName = encodeURIComponent(originalName);
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.sendFile(filePath);
});

module.exports = router;
