const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/stats', ctrl.getStats);
router.get('/',      ctrl.getAll);
router.get('/:id',   ctrl.getById);
router.post('/',     ctrl.create);
router.put('/:id',   ctrl.update);
router.patch('/:id/mark-paid', ctrl.markPaid);
router.delete('/:id', ctrl.delete);

module.exports = router;
