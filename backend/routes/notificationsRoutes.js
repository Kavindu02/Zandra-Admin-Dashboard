const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.get('/', notificationsController.getNotifications);
router.post('/', notificationsController.addNotification);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.updateReadStatus);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;
