const db = require('./db');

const Reminder = {
    getAll: async () => {
        const [rows] = await db.execute('SELECT * FROM reminders ORDER BY reminder_date ASC, created_at DESC');
        return rows;
    },

    create: async (data) => {
        const { title, description, reminder_date, priority } = data;
        const [result] = await db.execute(
            'INSERT INTO reminders (title, description, reminder_date, priority) VALUES (?, ?, ?, ?)',
            [title, description, reminder_date, priority || 'Medium']
        );
        return { id: result.insertId, ...data };
    },

    update: async (id, data) => {
        const { title, description, reminder_date, priority, is_completed } = data;
        await db.execute(
            'UPDATE reminders SET title = ?, description = ?, reminder_date = ?, priority = ?, is_completed = ? WHERE id = ?',
            [title, description, reminder_date, priority, is_completed, id]
        );
        return { id, ...data };
    },

    delete: async (id) => {
        await db.execute('DELETE FROM reminders WHERE id = ?', [id]);
        return { id };
    },

    toggleStatus: async (id, status) => {
        await db.execute('UPDATE reminders SET is_completed = ? WHERE id = ?', [status, id]);
        return { id, is_completed: status };
    }
};

module.exports = Reminder;
