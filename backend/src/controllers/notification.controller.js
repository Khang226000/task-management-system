const { Task, MonthlyTask, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Trả về danh sách thông báo deadline cho user hiện tại:
 * - Quá hạn (overdue): deadline < hôm nay, chưa done
 * - Sắp đến hạn (due_soon): deadline trong vòng 3 ngày tới
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId  = req.user.id;
    const isAdmin = ['admin','director','manager'].includes(req.user.role);
    const today   = new Date();
    today.setHours(0, 0, 0, 0);

    const soon = new Date(today);
    soon.setDate(soon.getDate() + 3);

    // ── Điều kiện lọc theo role ──
    const assigneeWhere = isAdmin ? {} : { assigneeId: userId };

    // ── Event Tasks ──
    const tasks = await Task.findAll({
      where: {
        ...assigneeWhere,
        status: { [Op.notIn]: ['done'] }
      },
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'color'] }],
      order: [['deadline', 'ASC']]
    });

    // ── Monthly Tasks ──
    const monthlyTasks = await MonthlyTask.findAll({
      where: {
        ...assigneeWhere,
        completion: null
      },
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'color'] }],
      order: [['dueDate', 'ASC']]
    });

    const notifications = [];

    // Xử lý Event Tasks
    tasks.forEach(task => {
      const effectiveDL = task.extendedDeadline || task.deadline;
      if (!effectiveDL) return;
      const dl = new Date(effectiveDL);
      dl.setHours(0, 0, 0, 0);

      if (dl < today) {
        notifications.push({
          id:       `task-overdue-${task.id}`,
          type:     'overdue',
          taskType: 'event',
          taskId:   task.id,
          taskCode: task.taskCode,
          taskName: task.taskName,
          deadline: effectiveDL,
          assignee: task.assignee,
          daysOverdue: Math.floor((today - dl) / 86400000)
        });
      } else if (dl <= soon) {
        notifications.push({
          id:       `task-soon-${task.id}`,
          type:     'due_soon',
          taskType: 'event',
          taskId:   task.id,
          taskCode: task.taskCode,
          taskName: task.taskName,
          deadline: effectiveDL,
          assignee: task.assignee,
          daysLeft: Math.floor((dl - today) / 86400000)
        });
      }
    });

    // Xử lý Monthly Tasks
    monthlyTasks.forEach(task => {
      const effectiveDL = task.extendedDueDate || task.dueDate;
      if (!effectiveDL) return;
      const dl = new Date(effectiveDL);
      dl.setHours(0, 0, 0, 0);

      if (dl < today) {
        notifications.push({
          id:       `monthly-overdue-${task.id}`,
          type:     'overdue',
          taskType: 'monthly',
          taskId:   task.id,
          taskCode: task.taskId,
          taskName: task.taskName,
          deadline: effectiveDL,
          assignee: task.assignee,
          daysOverdue: Math.floor((today - dl) / 86400000)
        });
      } else if (dl <= soon) {
        notifications.push({
          id:       `monthly-soon-${task.id}`,
          type:     'due_soon',
          taskType: 'monthly',
          taskId:   task.id,
          taskCode: task.taskId,
          taskName: task.taskName,
          deadline: effectiveDL,
          assignee: task.assignee,
          daysLeft: Math.floor((dl - today) / 86400000)
        });
      }
    });

    // Sắp xếp: overdue trước, sau đó theo deadline
    notifications.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

    res.json({
      success: true,
      data: {
        notifications,
        counts: {
          total:    notifications.length,
          overdue:  notifications.filter(n => n.type === 'overdue').length,
          due_soon: notifications.filter(n => n.type === 'due_soon').length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
