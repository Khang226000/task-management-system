const router = require('express').Router();
const ctrl = require('../controllers/task.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',        ctrl.getTasks);
router.get('/tree',    ctrl.getTaskTree);
router.get('/kanban',  ctrl.getKanbanBoard);
router.get('/:id',     ctrl.getTaskById);
router.post('/',       ctrl.createTask);
router.put('/:id',     ctrl.updateTask);
router.patch('/:id/status',        ctrl.updateTaskStatus);
router.patch('/:id/approve',       ctrl.approveTask);
router.patch('/:id/request-review',ctrl.requestReview);
router.delete('/:id',              ctrl.deleteTask);

module.exports = router;
