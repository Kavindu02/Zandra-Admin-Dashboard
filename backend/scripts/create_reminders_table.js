const db = require('../models/db');

const createRemindersTable = async () => {
    const sql = `
    CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        reminder_date DATE NOT NULL,
        priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
        is_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    try {
        await db.execute(sql);
        console.log("Reminders table created or already exists.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating reminders table:", err);
        process.exit(1);
    }
};

createRemindersTable();
