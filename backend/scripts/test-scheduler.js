const db = require('../models/db');
const Reminder = require('../models/reminderModel');

async function testReminderLogic() {
    console.log('--- Testing Reminder Logic ---');
    try {
        // 1. Create a dummy flight for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const todayStr = new Date().toISOString().split('T')[0];

        console.log(`Setting up test flight for ${tomorrowStr}...`);
        
        const testFlight = {
            passenger: 'Test Passenger',
            departureDate: tomorrowStr,
            to: 'Test City',
            flightNo: 'TEST123',
            invoiceNo: 'TEST-INV-001',
            class: 'Economy',
            status: 'Confirmed'
        };

        // Check if test flight already exists
        const [existingFlights] = await db.query('SELECT id FROM CustomersFlights WHERE invoiceNo = ?', [testFlight.invoiceNo]);
        if (existingFlights.length === 0) {
            await db.query(
                'INSERT INTO CustomersFlights (passenger, departureDate, `to`, flightNo, invoiceNo, class, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [testFlight.passenger, testFlight.departureDate, testFlight.to, testFlight.flightNo, testFlight.invoiceNo, testFlight.class, testFlight.status]
            );
            console.log('Test flight created.');
        } else {
            console.log('Test flight already exists.');
        }

        // 2. Run the same logic as in the scheduler
        console.log('Running logic...');
        const [flights] = await db.query(
            'SELECT * FROM CustomersFlights WHERE departureDate = ?',
            [tomorrowStr]
        );

        for (const flight of flights) {
            const title = `Upcoming Flight: ${flight.passenger}`;
            const [existing] = await db.query(
                'SELECT id FROM reminders WHERE title = ? AND reminder_date = ?',
                [title, todayStr]
            );

            if (existing.length === 0) {
                await Reminder.create({
                    title,
                    description: `Passenger ${flight.passenger} is departing tomorrow (${flight.departureDate}) to ${flight.to}. Flight: ${flight.flightNo || 'N/A'}. Invoice: ${flight.invoiceNo}`,
                    reminder_date: todayStr,
                    priority: 'High'
                });
                console.log(`SUCCESS: Reminder created for ${flight.passenger}`);
            } else {
                console.log(`INFO: Reminder already exists for ${flight.passenger}`);
            }
        }

        // 3. Verify
        const [finalReminders] = await db.query(
            'SELECT * FROM reminders WHERE title = ? AND reminder_date = ?',
            [`Upcoming Flight: ${testFlight.passenger}`, todayStr]
        );

        if (finalReminders.length > 0) {
            console.log('Verification PASSED: Reminder found in database.');
            console.log('Reminder Details:', finalReminders[0]);
        } else {
            console.log('Verification FAILED: Reminder not found in database.');
        }

    } catch (err) {
        console.error('Test failed with error:', err);
    } finally {
        // We don't exit process here if running manually, but for a one-off it's fine
        process.exit(0);
    }
}

testReminderLogic();
