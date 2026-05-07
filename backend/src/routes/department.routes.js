const router = require('express').Router();
const ctrl   = require('../controllers/department.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/',       ctrl.getAll);                    // Tất cả đều xem được
router.post('/',      authorize('admin'), ctrl.create); // Chỉ admin thêm
router.put('/:id',    authorize('admin'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
