const { MonthlyTask, User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

const COMPLETION_VI = { OT: 'Đúng hạn (OT)', OD: 'Trễ hạn (OD)', IC: 'Không hoàn thành (IC)' };

const include = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'color', 'avatar'] }
];

exports.getTasks = async (req, res) => {
  try {
    const { month, year, taskGroup, department, completion, taskType, assigneeId, search } = req.query;
    const where = {};
    if (month)      where.month      = parseInt(month);
    if (year)       where.year       = parseInt(year);
    if (taskGroup)  where.taskGroup  = taskGroup;
    if (department) where.department = department;
    if (completion) where.completion = completion;
    if (taskType)   where.taskType   = taskType;
    if (assigneeId) where.assigneeId = assigneeId;
    if (search)     where.taskName   = { [Op.iLike]: `%${search}%` };

    const tasks = await MonthlyTask.findAll({
      where, include,
      order: [['taskGroup', 'ASC'], ['stt', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json({ success: true, data: tasks });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getById = async (req, res) => {
  try {
    const task = await MonthlyTask.findByPk(req.params.id, { include });
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: task });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const body = { ...req.body };
    // Tự động sync taskGroup theo taskType
    if (body.taskType === 'A') body.taskGroup = 'PHAT_SINH';
    else if (body.taskType === 'R') body.taskGroup = 'THUONG_XUYEN';
    // Đảm bảo date fields đúng format hoặc null
    for (const df of ['startDate', 'dueDate', 'extendedDueDate']) {
      if (body[df] === '' || body[df] === 'Invalid Date') body[df] = null;
      else if (body[df] && typeof body[df] === 'string' && body[df].length > 10)
        body[df] = body[df].slice(0, 10);
    }
    if (body.assigneeId === '') body.assigneeId = null;
    if (body.completion === '') body.completion = null;
    const task = await MonthlyTask.create({ ...body, createdById: req.user.id });
    const full = await MonthlyTask.findByPk(task.id, { include });
    await logActivity({
      action: 'create', entityType: 'MonthlyTask',
      entityId: task.id, entityCode: task.taskId, entityName: task.taskName,
      description: `Đã tạo công việc tháng mới: [${task.taskId}] ${task.taskName}`,
      userId: req.user.id
    });
    res.status(201).json({ success: true, data: full });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const task = await MonthlyTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    const before = { completion: task.completion, progress: task.progress };
    const body = { ...req.body };
    // Tự động sync taskGroup theo taskType nếu taskType được gửi lên
    if (body.taskType === 'A') body.taskGroup = 'PHAT_SINH';
    else if (body.taskType === 'R') body.taskGroup = 'THUONG_XUYEN';
    // Đảm bảo date fields đúng format hoặc null (tránh lỗi SQL Server)
    for (const df of ['startDate', 'dueDate', 'extendedDueDate']) {
      if (body[df] === '' || body[df] === 'Invalid Date') body[df] = null;
      else if (body[df] && typeof body[df] === 'string') {
        // Nếu là ISO string, lấy phần YYYY-MM-DD
        if (body[df].length > 10) body[df] = body[df].slice(0, 10);
      }
    }
    if (body.assigneeId === '') body.assigneeId = null;
    if (body.completion === '') body.completion = null;
    await task.update(body);
    const full = await MonthlyTask.findByPk(task.id, { include });

    const changes = [];
    if (req.body.completion && req.body.completion !== before.completion)
      changes.push(`kết quả từ "${COMPLETION_VI[before.completion]||'Chưa xác định'}" → "${COMPLETION_VI[req.body.completion]||req.body.completion}"`);
    if (req.body.progress !== undefined && req.body.progress !== before.progress)
      changes.push(`tiến độ từ ${before.progress}% → ${req.body.progress}%`);
    if (req.body.taskName && req.body.taskName !== task.taskName)
      changes.push(`tên thành "${req.body.taskName}"`);
    if (req.body.dueDate) changes.push(`ngày kết thúc: ${req.body.dueDate}`);
    if (req.body.extendedDueDate) changes.push(`gia hạn đến: ${req.body.extendedDueDate}`);
    if (req.body.notes) changes.push(`cập nhật ghi chú`);

    const desc = changes.length > 0
      ? `Đã chỉnh sửa [${task.taskId}] ${task.taskName}: ${changes.join(', ')}`
      : `Đã chỉnh sửa thông tin công việc tháng [${task.taskId}] ${task.taskName}`;

    await logActivity({
      action: 'update', entityType: 'MonthlyTask',
      entityId: task.id, entityCode: task.taskId, entityName: task.taskName,
      description: desc, userId: req.user.id
    });
    res.json({ success: true, data: full });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.delete = async (req, res) => {
  try {
    const task = await MonthlyTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await logActivity({
      action: 'delete', entityType: 'MonthlyTask',
      entityId: task.id, entityCode: task.taskId, entityName: task.taskName,
      description: `Đã xóa công việc tháng [${task.taskId}] ${task.taskName}`,
      userId: req.user.id
    });
    await task.destroy();
    res.json({ success: true, message: 'Đã xóa' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Sync taskGroup theo taskType cho toàn bộ dữ liệu cũ ──
exports.syncGroups = async (req, res) => {
  try {
    const [updatedR] = await MonthlyTask.update(
      { taskGroup: 'THUONG_XUYEN' },
      { where: { taskType: 'R' } }
    );
    const [updatedA] = await MonthlyTask.update(
      { taskGroup: 'PHAT_SINH' },
      { where: { taskType: 'A' } }
    );
    res.json({ success: true, message: `Đã sync: ${updatedR} task R → THUONG_XUYEN, ${updatedA} task A → PHAT_SINH` });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
exports.requestReview = async (req, res) => {
  try {
    const task = await MonthlyTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await task.update({ approvalStatus: 'review', approvedById: null, approvedAt: null, approvalNote: null });
    await logActivity({
      action: 'update', entityType: 'MonthlyTask',
      entityId: task.id, entityCode: task.taskId, entityName: task.taskName,
      description: `Đã gửi yêu cầu phê duyệt công việc tháng [${task.taskId}] ${task.taskName}`,
      userId: req.user.id
    });
    const full = await MonthlyTask.findByPk(task.id, { include: [{ model: User, as: 'assignee', attributes: ['id','name','color','avatar'] }] });
    res.json({ success: true, data: full, message: 'Đã gửi yêu cầu duyệt' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// ── Duyệt / từ chối (admin/director/manager) ──
exports.approve = async (req, res) => {
  try {
    const { action, note } = req.body;
    const allowedRoles = ['admin','director','manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt' });
    }
    const task = await MonthlyTask.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await task.update({
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      approvedById:   req.user.id,
      approvedAt:     new Date(),
      approvalNote:   note || null
    });
    await logActivity({
      action: action === 'approve' ? 'approve' : 'reject',
      entityType: 'MonthlyTask',
      entityId: task.id, entityCode: task.taskId, entityName: task.taskName,
      description: action === 'approve'
        ? `Đã phê duyệt công việc tháng [${task.taskId}] ${task.taskName}`
        : `Đã từ chối công việc tháng [${task.taskId}] ${task.taskName}${note ? ` — Lý do: ${note}` : ''}`,
      userId: req.user.id
    });
    const full = await MonthlyTask.findByPk(task.id, { include: [{ model: User, as: 'assignee', attributes: ['id','name','color','avatar'] }] });
    res.json({ success: true, data: full, message: action === 'approve' ? 'Đã duyệt' : 'Đã từ chối' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    const where = {};
    if (month) where.month = parseInt(month);
    if (year)  where.year  = parseInt(year);

    const [total, ot, od, ic, routine, adhoc] = await Promise.all([
      MonthlyTask.count({ where }),
      MonthlyTask.count({ where: { ...where, completion: 'OT' } }),
      MonthlyTask.count({ where: { ...where, completion: 'OD' } }),
      MonthlyTask.count({ where: { ...where, completion: 'IC' } }),
      MonthlyTask.count({ where: { ...where, taskType: 'R' } }),
      MonthlyTask.count({ where: { ...where, taskType: 'A' } })
    ]);

    // Avg progress
    const tasks = await MonthlyTask.findAll({ where, attributes: ['progress'] });
    const avgProgress = tasks.length
      ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / tasks.length)
      : 0;

    res.json({ success: true, data: { total, ot, od, ic, routine, adhoc, avgProgress } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};
