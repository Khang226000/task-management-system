const router = require('express').Router();
const { getNotifications } = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getNotifications);

module.exports = router;
