import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import Reminders from './pages/Reminders.jsx';
import CustomersFlights from './pages/CustomersFlights.jsx';
import ProfitTracker from './pages/ProfitTracker.jsx';
import IssueTicket from './pages/IssueTicket.jsx';
import InvoiceGenerator from './pages/InvoiceGenerator.jsx';
import FlightCalendar from './pages/FlightCalendar.jsx';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/customers-flights" element={<CustomersFlights />} />
        <Route path="/profit-tracker" element={<ProfitTracker />} />
        <Route path="/issue-ticket" element={<IssueTicket />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
        <Route path="/flight-calendar" element={<FlightCalendar />} />
      </Routes>
    </Router>
  );
}
