const cron = require('node-cron');
const db = require('../models/db');
const Reminder = require('../models/reminderModel');
const { sendEmailInternal } = require('../controllers/emailController');

const scheduleReminders = () => {
    // Check for 3-hour customer reminders every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('Running 3-hour flight reminder check...');
        try {
            const now = new Date();
            
            // Query all flights that haven't had a reminder sent yet
            const [flights] = await db.query(
                'SELECT * FROM customersflights WHERE reminder_sent = FALSE AND departureDate IS NOT NULL'
            );

            for (const flight of flights) {
                try {
                    // Combine date and time
                    const depDate = new Date(flight.departureDate);
                    const [hours, minutes] = (flight.departureTime || '00:00').split(':');
                    depDate.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0);

                    // Time difference in hours
                    const diffMs = depDate - now;
                    const diffHours = diffMs / (1000 * 60 * 60);

                    // If departure is between 2.5 and 3.5 hours from now
                    if (diffHours > 0 && diffHours <= 3.5) {
                        console.log(`Sending 3-hour reminder to ${flight.passenger} for flight ${flight.flightNo}`);
                        
                        await sendEmailInternal(flight, null, 'Ready for Check-in');
                        
                        // Mark as sent
                        await db.query(
                            'UPDATE customersflights SET reminder_sent = TRUE WHERE id = ?',
                            [flight.id]
                        );
                        
                        console.log(`Successfully sent and marked reminder for ${flight.passenger}`);
                    }
                } catch (err) {
                    console.error(`Failed to send reminder for flight ${flight.id}:`, err.message);
                }
            }
        } catch (err) {
            console.error('Error in 3-hour reminder check:', err);
        }
    });

    // Run daily admin reminders at 01:00 AM
    cron.schedule('0 1 * * *', async () => {
        console.log('Running daily admin departure reminder check...');
        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            const todayStr = new Date().toISOString().split('T')[0];

            const [flights] = await db.query(
                'SELECT * FROM customersflights WHERE departureDate = ?',
                [tomorrowStr]
            );

            for (const flight of flights) {
                const title = `Flight Tomorrow: ${flight.passenger}`;
                const description = `Passenger ${flight.passenger} is departing tomorrow (${flight.departureDate}) to ${flight.to}. Flight: ${flight.flightNo || 'N/A'}. Route: ${flight.from} to ${flight.to}.`;
                
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
                }
            }
        } catch (err) {
            console.error('Error in daily admin reminder check:', err);
        }
    });
};

module.exports = scheduleReminders;
