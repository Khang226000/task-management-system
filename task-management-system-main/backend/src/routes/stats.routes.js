const router = require('express').Router();
const { getDashboardStats } = require('../controllers/stats.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/dashboard', getDashboardStats);

module.exports = router;
