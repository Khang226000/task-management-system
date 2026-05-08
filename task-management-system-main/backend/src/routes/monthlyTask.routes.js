const router = require('express').Router();
const ctrl = require('../controllers/monthlyTask.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.post('/sync-groups', ctrl.syncGroups);
router.get('/',      ctrl.getTasks);
router.get('/:id',   ctrl.getById);
router.post('/',     ctrl.create);
router.put('/:id',   ctrl.update);
router.patch('/:id/approve',        ctrl.approve);
router.patch('/:id/request-review', ctrl.requestReview);
router.delete('/:id',ctrl.delete);

module.exports = router;
