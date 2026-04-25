const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');

router.get('/', reminderController.getAllReminders);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.delete('/:id', reminderController.deleteReminder);
router.patch('/:id/toggle', reminderController.toggleStatus);

module.exports = router;
