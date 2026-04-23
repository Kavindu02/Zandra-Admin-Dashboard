const CustomersFlights = require('../models/customersFlightsModel');
const Notifications = require('../models/notificationsModel');

exports.getCustomersFlights = async (req, res) => {
  try {
    const data = await CustomersFlights.getAllCustomersFlights();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCustomerFlight = async (req, res) => {
  try {
    const data = await CustomersFlights.addCustomerFlight(req.body);

    try {
      await Notifications.addNotification({
        title: 'New Customer Added',
        message: `${data.passenger || 'Customer'} - ${data.invoiceNo || 'No Invoice'}`,
        type: 'customer',
        isRead: false
      });
    } catch (notificationError) {
      console.error('Failed to save add notification:', notificationError.message);
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomerFlight = async (req, res) => {
  try {
    const existing = await CustomersFlights.getCustomerFlightById(req.params.id);
    await CustomersFlights.deleteCustomerFlight(req.params.id);

    try {
      await Notifications.addNotification({
        title: 'Customer Deleted',
        message: `${existing?.passenger || 'Customer'} - ${existing?.invoiceNo || 'No Invoice'}`,
        type: 'warning',
        isRead: false
      });
    } catch (notificationError) {
      console.error('Failed to save delete notification:', notificationError.message);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCustomerFlight = async (req, res) => {
  try {
    const existing = await CustomersFlights.getCustomerFlightById(req.params.id);
    const data = await CustomersFlights.updateCustomerFlight(req.params.id, req.body);

    try {
      const labels = {
        passenger: 'Passenger',
        passport: 'Passport',
        email: 'Email',
        phone: 'Phone',
        invoiceNo: 'Invoice',
        ticketNo: 'Ticket No',
        issuedDate: 'Issued Date',
        bookingRef: 'Booking Ref',
        pnr: 'PNR',
        airlineRef: 'Airline Ref',
        status: 'Status',
        baggage: 'Baggage',
        fareBasis: 'Fare Basis',
        tripType: 'Trip Type',
        routeType: 'Route Type',
        from: 'From',
        to: 'To',
        departureDate: 'Departure Date',
        departureTime: 'Departure Time',
        returnDate: 'Return Date',
        returnTime: 'Return Time',
        transitAirport: 'Transit Airport',
        transitTime: 'Transit Time',
        outboundSecondFlightNo: 'Outbound 2nd Flight No',
        returnSecondFlightNo: 'Return 2nd Flight No',
        airline: 'Airline',
        flightNo: 'Flight No',
        class: 'Class',
        adults: 'Adults',
        handledBy: 'Handled By',
        notes: 'Notes'
      };

      const changedFields = Object.keys(labels).filter((key) => {
        const before = existing?.[key] ?? '';
        const after = data?.[key] ?? '';
        return String(before) !== String(after);
      });

      const changedPreview = changedFields.slice(0, 5).map((key) => labels[key]).join(', ');
      const remainingCount = Math.max(0, changedFields.length - 5);
      const changeText = changedFields.length
        ? ` | Changed: ${changedPreview}${remainingCount > 0 ? ` +${remainingCount} more` : ''}`
        : '';

      await Notifications.addNotification({
        title: 'Customer Updated',
        message: `${data.passenger || 'Customer'} - ${data.invoiceNo || 'No Invoice'}${changeText}`,
        type: 'info',
        isRead: false
      });
    } catch (notificationError) {
      console.error('Failed to save update notification:', notificationError.message);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
