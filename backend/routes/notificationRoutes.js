const express = require('express');
const { getNotifications, markAllRead } = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markAllRead);

module.exports = router;
