const { Task, User, MonthlyTask, Payment } = require('../models');
const { fn, col, Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const { month, year, leadDepartment, assigneeId, department } = req.query;
    const m = parseInt(month) || new Date().getMonth() + 1;
    const y = parseInt(year)  || new Date().getFullYear();

    // ── Base where cho Tasks (Sự kiện) ──
    const taskWhere = { month: m, year: y };
    if (leadDepartment) taskWhere.leadDepartment = leadDepartment;
    if (assigneeId)     taskWhere.assigneeId     = assigneeId;

    // ── Base where cho MonthlyTask ──
    const mWhere = { month: m, year: y };
    if (department) mWhere.department = department;
    if (assigneeId) mWhere.assigneeId = assigneeId;

    // ── Sự kiện (Tasks) ──
    const [total, notStarted, inProgress, done, delayed] = await Promise.all([
      Task.count({ where: taskWhere }),
      Task.count({ where: { ...taskWhere, status: 'not_started' } }),
      Task.count({ where: { ...taskWhere, status: 'in_progress' } }),
      Task.count({ where: { ...taskWhere, status: 'done' } }),
      Task.count({ where: { ...taskWhere, status: 'delayed' } })
    ]);

    const [ot, od, ic] = await Promise.all([
      Task.count({ where: { ...taskWhere, completion: 'OT' } }),
      Task.count({ where: { ...taskWhere, completion: 'OD' } }),
      Task.count({ where: { ...taskWhere, completion: 'IC' } })
    ]);

    const [byDept, byCategory, byDirector, byType] = await Promise.all([
      Task.findAll({ where: taskWhere, attributes: ['leadDepartment', [fn('COUNT', col('id')), 'count']], group: ['leadDepartment'], raw: true }),
      Task.findAll({ where: taskWhere, attributes: ['workCategory',   [fn('COUNT', col('id')), 'count']], group: ['workCategory'],   raw: true }),
      Task.findAll({ where: taskWhere, attributes: ['deputyDirector', [fn('COUNT', col('id')), 'count']], group: ['deputyDirector'], raw: true }),
      Task.findAll({ where: taskWhere, attributes: ['taskType',       [fn('COUNT', col('id')), 'count']], group: ['taskType'],       raw: true }),
    ]);

    // ── Danh sách tên CV nhóm theo bộ phận & lãnh đạo (cho bảng thống kê dạng cột) ──
    const allTasksForTable = await Task.findAll({
      where: taskWhere,
      attributes: ['id','taskCode','taskName','leadDepartment','deputyDirector','status','completion','progress','deadline'],
      order: [['leadDepartment','ASC'],['taskCode','ASC']],
      raw: true
    });

    // Group theo bộ phận
    const tasksByDept = {};
    allTasksForTable.forEach(t => {
      const key = t.leadDepartment || 'Khác';
      if (!tasksByDept[key]) tasksByDept[key] = [];
      tasksByDept[key].push({ id:t.id, taskCode:t.taskCode, taskName:t.taskName, status:t.status, completion:t.completion, progress:t.progress, deadline:t.deadline });
    });

    // Group theo lãnh đạo
    const tasksByDirector = {};
    allTasksForTable.forEach(t => {
      const key = t.deputyDirector || 'Chưa phân công';
      if (!tasksByDirector[key]) tasksByDirector[key] = [];
      tasksByDirector[key].push({ id:t.id, taskCode:t.taskCode, taskName:t.taskName, status:t.status, completion:t.completion, progress:t.progress, deadline:t.deadline });
    });

    // Group theo người thực hiện (phụ trách thanh toán)
    const allTasksWithAssignee = await Task.findAll({
      where: taskWhere,
      attributes: ['id','taskCode','taskName','status','completion','progress','deadline','assigneeId'],
      include: [{ model: User, as: 'assignee', attributes: ['id','name','color'] }],
      order: [['taskCode','ASC']],
    });
    const tasksByAssignee = {};
    allTasksWithAssignee.forEach(t => {
      const tj = t.toJSON();
      const key = tj.assignee?.name || 'Chưa phân công';
      const color = tj.assignee?.color || '#64748b';
      if (!tasksByAssignee[key]) tasksByAssignee[key] = { tasks: [], color };
      tasksByAssignee[key].tasks.push({ id:tj.id, taskCode:tj.taskCode, taskName:tj.taskName, status:tj.status, completion:tj.completion, progress:tj.progress, deadline:tj.deadline });
    });

    const totalUsers = await User.count({ where: { isActive: true } });

    // ── CV tháng (MonthlyTask) ──
    const [mtTotal, mtOt, mtOd, mtIc] = await Promise.all([
      MonthlyTask.count({ where: mWhere }),
      MonthlyTask.count({ where: { ...mWhere, completion: 'OT' } }),
      MonthlyTask.count({ where: { ...mWhere, completion: 'OD' } }),
      MonthlyTask.count({ where: { ...mWhere, completion: 'IC' } }),
    ]);

    // CV tháng theo bộ phận
    const byMtDept = await MonthlyTask.findAll({
      where: mWhere,
      attributes: ['department', [fn('COUNT', col('id')), 'count']],
      group: ['department'],
      raw: true
    });

    // CV tháng theo loại R/A
    const byMtType = await MonthlyTask.findAll({
      where: mWhere,
      attributes: ['taskType', [fn('COUNT', col('id')), 'count']],
      group: ['taskType'],
      raw: true
    });

    const mtAvgProgress = await MonthlyTask.findAll({ where: mWhere, attributes: ['progress'], raw: true })
      .then(rows => rows.length ? Math.round(rows.reduce((s,r) => s + (r.progress||0), 0) / rows.length) : 0);

    // ── Grouped data cho MonthlyTask (grouped bar chart) ──
    const allMtForTable = await MonthlyTask.findAll({
      where: mWhere,
      attributes: ['id','taskId','taskName','department','taskGroup','taskType','completion','progress','dueDate','assigneeId'],
      include: [{ model: User, as: 'assignee', attributes: ['id','name','color'] }],
      order: [['department','ASC'],['stt','ASC']],
    });

    // Group theo bộ phận
    const mtByDept = {};
    allMtForTable.forEach(t => {
      const tj = t.toJSON();
      const key = tj.department || 'Khác';
      if (!mtByDept[key]) mtByDept[key] = [];
      mtByDept[key].push({ id:tj.id, taskId:tj.taskId, taskName:tj.taskName, completion:tj.completion, progress:tj.progress, dueDate:tj.dueDate, taskType:tj.taskType, taskGroup:tj.taskGroup });
    });

    // Group theo người thực hiện
    const mtByAssignee = {};
    allMtForTable.forEach(t => {
      const tj = t.toJSON();
      const key = tj.assignee?.name || 'Chưa phân công';
      const color = tj.assignee?.color || '#64748b';
      if (!mtByAssignee[key]) mtByAssignee[key] = { tasks: [], color };
      mtByAssignee[key].tasks.push({ id:tj.id, taskId:tj.taskId, taskName:tj.taskName, completion:tj.completion, progress:tj.progress, dueDate:tj.dueDate, taskType:tj.taskType });
    });

    // ── Trend trong tháng: chia theo tuần (4 tuần) ──
    const daysInMonth = new Date(y, m, 0).getDate();
    const weekSize = Math.ceil(daysInMonth / 4);
    const weeklyTrend = [];
    for (let w = 0; w < 4; w++) {
      const startDay = w * weekSize + 1;
      const endDay   = Math.min((w + 1) * weekSize, daysInMonth);
      const startDate = `${y}-${String(m).padStart(2,'0')}-${String(startDay).padStart(2,'0')}`;
      const endDate   = `${y}-${String(m).padStart(2,'0')}-${String(endDay).padStart(2,'0')}`;

      const [wTotal, wDone, wDelayed, wMtTotal, wMtDone] = await Promise.all([
        Task.count({ where: { ...taskWhere, deadline: { [Op.between]: [startDate, endDate] } } }),
        Task.count({ where: { ...taskWhere, deadline: { [Op.between]: [startDate, endDate] }, status: 'done' } }),
        Task.count({ where: { ...taskWhere, deadline: { [Op.between]: [startDate, endDate] }, status: 'delayed' } }),
        MonthlyTask.count({ where: { ...mWhere, dueDate: { [Op.between]: [startDate, endDate] } } }),
        MonthlyTask.count({ where: { ...mWhere, dueDate: { [Op.between]: [startDate, endDate] }, completion: 'OT' } }),
      ]);

      weeklyTrend.push({
        name: `Tuần ${w+1}`,
        label: `${startDay}/${m} - ${endDay}/${m}`,
        'Sự kiện': wTotal,
        'SK Hoàn thành': wDone,
        'SK Trễ hạn': wDelayed,
        'CV tháng': wMtTotal,
        'CVT Hoàn thành': wMtDone,
      });
    }

    // ── Payments (Phụ trách thanh toán) ──
    const allPayments = await Payment.findAll({
      attributes: ['id','name','department','amount','status','dueDate','paidDate','assigneeId','notes'],
      include: [{ model: User, as: 'assignee', attributes: ['id','name','color'] }],
      order: [['department','ASC'],['sortOrder','ASC']],
    });
    // Group theo bộ phận
    const paymentsByDept = {};
    allPayments.forEach(p => {
      const pj = p.toJSON();
      const key = pj.department || 'Khác';
      if (!paymentsByDept[key]) paymentsByDept[key] = [];
      paymentsByDept[key].push({
        id: pj.id, name: pj.name, department: pj.department,
        amount: pj.amount, status: pj.status,
        dueDate: pj.dueDate, paidDate: pj.paidDate,
        assignee: pj.assignee, notes: pj.notes
      });
    });

    res.json({
      success: true,
      data: {
        tasks: { total, notStarted, inProgress, done, delayed },
        completion: { ot, od, ic },
        monthlyTasks: { total: mtTotal, ot: mtOt, od: mtOd, ic: mtIc, avgProgress: mtAvgProgress },
        byDept, byCategory, byDirector, byType,
        byMtDept, byMtType,
        tasksByDept, tasksByDirector, tasksByAssignee,
        mtByDept, mtByAssignee,
        paymentsByDept,
        totalUsers,
        weeklyTrend,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
