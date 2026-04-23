import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Dashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import Reminders from './pages/Reminders.jsx';
import CustomersFlights from './pages/CustomersFlights.jsx';
import Passengers from './pages/Passengers.jsx';
import Employees from './pages/Employees.jsx';
import ProfitTracker from './pages/ProfitTracker.jsx';
import IssueTicket from './pages/IssueTicket.jsx';
import InvoiceGenerator from './pages/InvoiceGenerator.jsx';
import FlightCalendar from './pages/FlightCalendar.jsx';
import Expenses from './pages/Expenses.jsx';
import Receivables from './pages/Receivables.jsx';
import Payables from './pages/Payables.jsx';
import Payroll from './pages/Payroll.jsx';
import ChartOfAccounts from './pages/ChartOfAccounts.jsx';
import GeneralLedger from './pages/GeneralLedger.jsx';
import ProfitAndLoss from './pages/ProfitAndLoss.jsx';
import BalanceSheet from './pages/BalanceSheet.jsx';
import './index.css';

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/customers-flights" element={<CustomersFlights />} />
        <Route path="/passengers" element={<Passengers />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/profit-tracker" element={<ProfitTracker />} />
        <Route path="/issue-ticket" element={<IssueTicket />} />
        <Route path="/invoice-generator" element={<InvoiceGenerator />} />
        <Route path="/flight-calendar" element={<FlightCalendar />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/receivables" element={<Receivables />} />
        <Route path="/payables" element={<Payables />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
        <Route path="/general-ledger" element={<GeneralLedger />} />
        <Route path="/profit-and-loss" element={<ProfitAndLoss />} />
        <Route path="/balance-sheet" element={<BalanceSheet />} />
      </Routes>
    </Router>
  );
}
