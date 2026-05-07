const router = require('express').Router();
const { getLogs } = require('../controllers/activityLog.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/', getLogs);

module.exports = router;
