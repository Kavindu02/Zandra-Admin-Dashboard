const Reminder = require('../models/reminderModel');

exports.getAllReminders = async (req, res) => {
    try {
        const reminders = await Reminder.getAll();
        res.status(200).json(reminders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createReminder = async (req, res) => {
    try {
        const reminder = await Reminder.create(req.body);
        res.status(201).json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateReminder = async (req, res) => {
    try {
        const reminder = await Reminder.update(req.params.id, req.body);
        res.status(200).json(reminder);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteReminder = async (req, res) => {
    try {
        await Reminder.delete(req.params.id);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleStatus = async (req, res) => {
    try {
        const { is_completed } = req.body;
        const result = await Reminder.toggleStatus(req.params.id, is_completed);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
