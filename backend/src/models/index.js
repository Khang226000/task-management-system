const User = require('./User');
const Task = require('./Task');
const Event = require('./Event');
const MonthlyTask = require('./MonthlyTask');
const ActivityLog = require('./ActivityLog');
const TaskTemplate = require('./TaskTemplate');
const Payment = require('./Payment');
const Department = require('./Department');

// Task (sự kiện) associations
User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(Task, { foreignKey: 'createdById', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// MonthlyTask associations
User.hasMany(MonthlyTask, { foreignKey: 'assigneeId', as: 'monthlyTasks' });
MonthlyTask.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
User.hasMany(MonthlyTask, { foreignKey: 'createdById', as: 'createdMonthlyTasks' });
MonthlyTask.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// Event associations
User.hasMany(Event, { foreignKey: 'createdById', as: 'events' });
Event.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// ActivityLog associations
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });

// Payment associations
Payment.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });
Payment.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });
User.hasMany(Payment, { foreignKey: 'assigneeId', as: 'payments' });

module.exports = { User, Task, Event, MonthlyTask, ActivityLog, TaskTemplate, Payment, Department };
