const cron = require('node-cron');
const db = require('../models/db');
const Reminder = require('../models/reminderModel');

const scheduleReminders = () => {
    // Run every day at 00:00 (midnight)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily departure reminder check...');
        try {
            // Get tomorrow's date in YYYY-MM-DD format
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];

            // Get today's date for the reminder
            const todayStr = new Date().toISOString().split('T')[0];

            // Query flights departing tomorrow
            const [flights] = await db.query(
                'SELECT * FROM CustomersFlights WHERE departureDate = ?',
                [tomorrowStr]
            );

            console.log(`Found ${flights.length} flights departing on ${tomorrowStr}`);

            for (const flight of flights) {
                const title = `Upcoming Flight: ${flight.passenger}`;
                const description = `Passenger ${flight.passenger} is departing tomorrow (${flight.departureDate}) to ${flight.to}. Flight: ${flight.flightNo || 'N/A'}. Invoice: ${flight.invoiceNo}`;
                
                // Check if reminder already exists to avoid duplicates
                const [existing] = await db.query(
                    'SELECT id FROM reminders WHERE title = ? AND reminder_date = ?',
                    [title, todayStr]
                );

                if (existing.length === 0) {
                    await Reminder.create({
                        title,
                        description,
                        reminder_date: todayStr,
                        priority: 'High'
                    });
                    console.log(`Created reminder for ${flight.passenger}`);
                } else {
                    console.log(`Reminder already exists for ${flight.passenger}`);
                }
            }
        } catch (err) {
            console.error('Error in reminder scheduler:', err);
        }
    });
};

module.exports = scheduleReminders;
