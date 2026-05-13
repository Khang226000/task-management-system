const { Task, User, MonthlyTask } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

const taskInclude = [
  { model: User, as: 'assignee', attributes: ['id', 'name', 'avatar', 'color'] },
  { model: User, as: 'createdBy', attributes: ['id', 'name'] }
];

// Resolve collaborator IDs → User objects
async function resolveCollaborators(tasks) {
  const allIds = new Set();
  tasks.forEach(t => {
    const collab = Array.isArray(t.collaborators) ? t.collaborators : [];
    collab.forEach(id => allIds.add(id));
  });
  if (allIds.size === 0) return tasks;

  const users = await User.findAll({
    where: { id: { [Op.in]: [...allIds] } },
    attributes: ['id', 'name', 'color']
  });
  const userMap = {};
  users.forEach(u => { userMap[u.id] = u.toJSON(); });

  return tasks.map(t => {
    const collab = Array.isArray(t.collaborators) ? t.collaborators : [];
    return { ...t, collaboratorUsers: collab.map(id => userMap[id]).filter(Boolean) };
  });
}

exports.getTasks = async (req, res) => {
  try {
    const { status, workCategory, leadDepartment, deputyDirector,
            assigneeId, taskType, month, year, search, parentCode } = req.query;
    const where = {};

    if (status) where.status = status;
    if (workCategory) where.workCategory = workCategory;
    if (leadDepartment) where.leadDepartment = leadDepartment;
    if (deputyDirector) where.deputyDirector = deputyDirector;
    if (assigneeId) where.assigneeId = assigneeId;
    if (taskType) where.taskType = taskType;
    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (search) where.taskName = { [Op.iLike]: `%${search}%` };
    

    const tasks = await Task.findAll({
      where,
      include: taskInclude,
      order: [['taskCode', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaskTree = async (req, res) => {
  try {
    const { month, year, workCategory, leadDepartment, deputyDirector, status, assigneeId, search } = req.query;
    const where = {};
    if (month)          where.month          = parseInt(month);
    if (year)           where.year           = parseInt(year);
    if (workCategory)   where.workCategory   = workCategory;
    if (leadDepartment) where.leadDepartment = leadDepartment;
    if (deputyDirector) where.deputyDirector = deputyDirector;
    if (status)         where.status         = status;
    if (search)         where.taskName       = { [Op.iLike]: `%${search}%` };

    // Khi lọc theo assigneeId: lấy tất cả tasks rồi lọc ở app level
    // để giữ cấu trúc cây (parent luôn hiển thị nếu có child khớp)
    const allTasks = await Task.findAll({
      where,
      include: taskInclude,
      order: [['taskCode', 'ASC']]
    });

    const allJson = allTasks.map(t => t.toJSON());
    const resolved = await resolveCollaborators(allJson);

    let filtered = resolved;
    if (assigneeId) {
      // Lấy các task khớp assignee
      const matchIds = new Set(resolved.filter(t => t.assigneeId === assigneeId).map(t => t.taskCode));
      // Thêm parent của các task khớp
      const parentCodes = new Set(resolved.filter(t => matchIds.has(t.taskCode) && t.parentCode).map(t => t.parentCode));
      filtered = resolved.filter(t => matchIds.has(t.taskCode) || parentCodes.has(t.taskCode));
    }

    const parents = filtered.filter(t => {
  // task cha thật
  if (!t.parentCode) return true;

  // task con nhưng parent không tồn tại
  const hasParent = filtered.some(p => p.taskCode === t.parentCode);

  return !hasParent;
});

const tree = parents.map(parent => ({
  ...parent,
  children: filtered.filter(t => t.parentCode === parent.taskCode)
}));

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getKanbanBoard = async (req, res) => {
  try {
    const { month, year, leadDepartment, deputyDirector, workCategory, assigneeId, status, search } = req.query;
    const where = {};
    if (month)          where.month          = parseInt(month);
    if (year)           where.year           = parseInt(year);
    if (leadDepartment) where.leadDepartment = leadDepartment;
    if (deputyDirector) where.deputyDirector = deputyDirector;
    if (workCategory)   where.workCategory   = workCategory;
    if (assigneeId)     where.assigneeId     = assigneeId;
    if (status)         where.status         = status;
    if (search)         where.taskName       = { [Op.iLike]: `%${search}%` };

    const tasks = await Task.findAll({
      where,
      include: taskInclude,
      order: [['taskCode', 'ASC']]
    });

    const board = {
      not_started: tasks.filter(t => t.status === 'not_started'),
      in_progress:  tasks.filter(t => t.status === 'in_progress'),
      done:         tasks.filter(t => t.status === 'done'),
      delayed:      tasks.filter(t => t.status === 'delayed')
    };

    res.json({ success: true, data: board });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id, { include: taskInclude });
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const STATUS_VI = {
  not_started: 'Chưa bắt đầu',
  in_progress:  'Đang thực hiện',
  done:         'Hoàn thành',
  delayed:      'Trễ hạn'
};

exports.createTask = async (req, res) => {
  try {
    // Làm sạch payload
    const allowed = [
      'taskCode','parentCode','workCategory','taskName','leadDepartment','department',
      'assigneeId','collaborators','deputyDirector','startDate','deadline',
      'extendedDeadline','extensionReason','deliverable','progress',
      'taskType','status','completion','notes','month','year','order'
    ];
    const body = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) body[k] = req.body[k];
    }
    const now = new Date();
    if (!body.month) body.month = now.getMonth() + 1;
    if (!body.year) body.year = now.getFullYear();
    for (const df of ['startDate','deadline','extendedDeadline']) {
      if (body[df] === '' || body[df] === 'Invalid Date') body[df] = null;
    }
    if (body.assigneeId === '') body.assigneeId = null;
    if (
    body.parentCode === '' ||
    body.parentCode === 'undefined' ||
    body.parentCode === undefined
  ) {
    body.parentCode = null;
  }
    // collaborators phải là array — JSONB tự xử lý, chỉ cần đảm bảo là array
    if (body.collaborators !== undefined && !Array.isArray(body.collaborators)) {
      try { body.collaborators = JSON.parse(body.collaborators); } catch { body.collaborators = []; }
    }

    const task = await Task.create({ ...body, createdById: req.user.id });
    await MonthlyTask.create({
  taskId: task.id,

  taskCode: task.taskCode,
  taskName: task.taskName,

  department: body.department,

  month: body.month,
  year: body.year,

  assigneeId: task.assigneeId,
  deputyDirector: task.deputyDirector,

  progress: task.progress || 0,
  status: task.status || 'not_started',

  deadline: task.deadline
});
    const fullTask = await Task.findByPk(task.id, { include: taskInclude });
    await logActivity({
      action: 'create', entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: `Đã tạo công việc mới: [${task.taskCode}] ${task.taskName}`,
      userId: req.user.id
    });
    res.status(201).json({ success: true, data: fullTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    const before = { status: task.status, progress: task.progress, assigneeId: task.assigneeId };

    // Làm sạch payload — loại bỏ các field không hợp lệ cho SQL Server
    const allowed = [
      // taskCode KHÔNG cho phép update (unique, không đổi)
      'parentCode','workCategory','taskName','leadDepartment',
      'assigneeId','collaborators','deputyDirector','startDate','deadline',
      'extendedDeadline','extensionReason','deliverable','attachments',
      'progress','taskType','status','completion','approvalStatus',
      'approvedById','approvedAt','approvalNote','notes','month','year','order'
    ];
    const body = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) body[k] = req.body[k];
    }
    // Đảm bảo date fields đúng format hoặc null
    for (const df of ['startDate','deadline','extendedDeadline']) {
      if (body[df] === '' || body[df] === 'Invalid Date') body[df] = null;
    }
    // assigneeId rỗng → null
    if (body.assigneeId === '') body.assigneeId = null;
    // collaborators phải là array — JSONB tự xử lý
    if (body.collaborators !== undefined && !Array.isArray(body.collaborators)) {
      try { body.collaborators = JSON.parse(body.collaborators); } catch { body.collaborators = []; }
    }

    await task.update(body);
    const fullTask = await Task.findByPk(task.id, { include: taskInclude });

    // Mô tả thay đổi
    const changes = [];
    if (req.body.status && req.body.status !== before.status)
      changes.push(`trạng thái từ "${STATUS_VI[before.status]||before.status}" → "${STATUS_VI[req.body.status]||req.body.status}"`);
    if (req.body.progress !== undefined && req.body.progress !== before.progress)
      changes.push(`tiến độ từ ${before.progress}% → ${req.body.progress}%`);
    if (req.body.taskName && req.body.taskName !== task.taskName)
      changes.push(`tên thành "${req.body.taskName}"`);
    if (req.body.deadline) changes.push(`hạn chót: ${req.body.deadline}`);
    if (req.body.extendedDeadline) changes.push(`gia hạn đến: ${req.body.extendedDeadline}`);
    if (req.body.deliverable) changes.push(`cập nhật kết quả đầu ra`);
    if (req.body.notes) changes.push(`cập nhật ghi chú`);

    const desc = changes.length > 0
      ? `Đã chỉnh sửa [${task.taskCode}] ${task.taskName}: ${changes.join(', ')}`
      : `Đã chỉnh sửa thông tin công việc [${task.taskCode}] ${task.taskName}`;

    await logActivity({
      action: 'update', entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: desc,
      userId: req.user.id, metadata: { before, after: req.body }
    });
    res.json({ success: true, data: fullTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, detail: error.errors?.map(e => e.message) });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status, completion } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    const oldStatus = task.status;
    const updates = { status };
    if (completion) updates.completion = completion;
    if (status === 'in_progress' && !task.startDate) updates.startDate = new Date();
    if (status === 'done' && !updates.completion) {
      const effectiveDeadline = task.extendedDeadline || task.deadline;
      updates.completion = new Date() <= new Date(effectiveDeadline) ? 'OT' : 'OD';
      updates.progress = 100;
    }
    await task.update(updates);
    await logActivity({
      action: 'status_change', entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: `Đã đổi trạng thái [${task.taskCode}] ${task.taskName}: "${STATUS_VI[oldStatus]||oldStatus}" → "${STATUS_VI[status]||status}"`,
      userId: req.user.id
    });
    const fullTask = await Task.findByPk(task.id, { include: taskInclude });
    res.json({ success: true, data: fullTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });
    await logActivity({
      action: 'delete', entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: `Đã xóa công việc [${task.taskCode}] ${task.taskName}`,
      userId: req.user.id
    });
    await Task.destroy({ where: { parentCode: task.taskCode } });
    await task.destroy();
    res.json({ success: true, message: 'Xóa task thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Nhân viên yêu cầu duyệt ──
exports.requestReview = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });

    // Chỉ assignee hoặc admin mới được yêu cầu duyệt
    if (task.assigneeId !== req.user.id && !['admin','director','manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    await task.update({ approvalStatus: 'review', approvedById: null, approvedAt: null, approvalNote: null });
    await require('../utils/activityLogger').logActivity({
      action: 'update', entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: `Đã gửi yêu cầu phê duyệt công việc [${task.taskCode}] ${task.taskName}`,
      userId: req.user.id
    });
    const fullTask = await Task.findByPk(task.id, { include: taskInclude });
    res.json({ success: true, data: fullTask, message: 'Đã gửi yêu cầu duyệt' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
exports.approveTask = async (req, res) => {
  try {
    const { action, note } = req.body;
    const allowedRoles = ['admin', 'director', 'manager'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền duyệt công việc' });
    }
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Không tìm thấy task' });

    const updates = {
      approvalStatus: action === 'approve' ? 'approved' : 'rejected',
      approvedById:   req.user.id,
      approvedAt:     new Date(),
      approvalNote:   note || null
    };
    await task.update(updates);
    await logActivity({
      action: action === 'approve' ? 'approve' : 'reject',
      entityType: 'Task',
      entityId: task.id, entityCode: task.taskCode, entityName: task.taskName,
      description: action === 'approve'
        ? `Đã phê duyệt công việc [${task.taskCode}] ${task.taskName}`
        : `Đã từ chối công việc [${task.taskCode}] ${task.taskName}${note ? ` — Lý do: ${note}` : ''}`,
      userId: req.user.id
    });
    const fullTask = await Task.findByPk(task.id, { include: taskInclude });
    res.json({ success: true, data: fullTask, message: action === 'approve' ? 'Đã duyệt công việc' : 'Đã từ chối công việc' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
