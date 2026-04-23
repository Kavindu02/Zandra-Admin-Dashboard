import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { Bell, FileText, TrendingUp, AlertCircle, ChevronRight, Plane, Users } from 'lucide-react';

export default function Dashboard() {
  const [dashboard, setDashboard] = useState({
    totalCustomers: 0,
    todaysFlights: 0,
    pendingReminders: 0,
    unreadAlerts: 0,
    totalInvoices: 0,
    flightsIn48h: 0,
    recentPassenger: null,
    recentReminder: null,
    settings: {
      activeEmployees: 0,
      monthlyProfit: 0,
      totalProfit: 0
    }
  });

  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    }
    if (hour < 17) {
      return 'Good Afternoon';
    }
    return 'Good Evening';
  };

  const getDateLabel = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  };

  const formatCurrency = (value) => {
    return `LKR ${Number(value || 0).toLocaleString()}`;
  };

  const formatRelativeTime = (value) => {
    if (!value) {
      return 'No reminders';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) {
      return 'Just now';
    }
    if (mins < 60) {
      return `${mins} min ago`;
    }
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) {
      return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fetchDashboard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/dashboard/summary`);
      const data = res.data || {};
      const settings = data.settings || {};

      setDashboard({
        totalCustomers: Number(data.totalCustomers || 0),
        todaysFlights: Number(data.todaysFlights || 0),
        pendingReminders: Number(data.pendingReminders || 0),
        unreadAlerts: Number(data.unreadAlerts || 0),
        totalInvoices: Number(data.totalInvoices || 0),
        flightsIn48h: Number(data.flightsIn48h || 0),
        recentPassenger: data.recentPassenger || null,
        recentReminder: data.recentReminder || null,
        settings: {
          activeEmployees: Number(settings.activeEmployees || 0),
          monthlyProfit: Number(settings.monthlyProfit || 0),
          totalProfit: Number(settings.totalProfit || 0)
        }
      });
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, 20000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Dashboard</h2>
          <TopHeaderActions />
        </header>

        <div className="bg-[#E5E7EB] border-b border-gray-200 px-4 py-5">
          <h3 className="text-3xl font-bold text-[#111827]">{getGreeting()}</h3>
          <p className="text-xl text-gray-500 mt-1">{getDateLabel()} - ZANDRA TRAVELERS</p>
        </div>

        <div className="p-4 space-y-4">
          {/* Top Stats Cards - 2 rows, 5 per row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <StatCard icon={<Users size={20}/>} label="Total Customers" value={dashboard.totalCustomers} iconBg="bg-blue-50 text-blue-500" />
            <StatCard icon={<Users size={20}/>} label="Active Employees" value={dashboard.settings.activeEmployees} iconBg="bg-green-50 text-green-500" />
            <StatCard icon={<Plane size={20}/>} label="Today's Flights" value={dashboard.todaysFlights} iconBg="bg-yellow-50 text-yellow-500" />
            <StatCard icon={<Bell size={20}/>} label="Pending Reminders" value={dashboard.pendingReminders} iconBg="bg-pink-50 text-pink-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <StatCard icon={<TrendingUp size={20}/>} label="Monthly Profit" value={formatCurrency(dashboard.settings.monthlyProfit)} iconBg="bg-emerald-50 text-emerald-500" />
            <StatCard icon={<TrendingUp size={20}/>} label="Total Profit" value={formatCurrency(dashboard.settings.totalProfit)} iconBg="bg-purple-50 text-purple-500" />
            <StatCard icon={<AlertCircle size={20}/>} label="Unread Alerts" value={dashboard.unreadAlerts} iconBg="bg-red-50 text-red-500" />
             <StatCard icon={<FileText size={20}/>} label="Total Invoices" value={dashboard.totalInvoices} subText="Auto-generated" iconBg="bg-indigo-50 text-indigo-500" />
            <div></div>
            <div></div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-800 mb-2">Monthly Profit — 2026</h3>
              <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 italic text-xs">Chart rendering here...</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-xs font-bold text-gray-800 mb-2">Income vs Cost — 2026</h3>
              <div className="h-40 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 italic text-xs">Chart rendering here...</div>
            </div>
          </div>

          {/* Bottom Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <BottomCard title="Flights in 48h" icon={<Plane size={16} className="text-orange-400" />}>
              <p className="text-sm text-gray-400 mt-4 text-center">
                {dashboard.flightsIn48h > 0
                  ? `${dashboard.flightsIn48h} upcoming flight${dashboard.flightsIn48h > 1 ? 's' : ''} in next 48h`
                  : 'No upcoming flights in 48h'}
              </p>
            </BottomCard>

            <BottomCard title="Recent Passengers" icon={<Users size={16} className="text-blue-500" />}>
              {dashboard.recentPassenger ? (
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">
                    {(dashboard.recentPassenger.passenger || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                     <div className="text-sm font-semibold">{dashboard.recentPassenger.passenger || 'Unknown'}</div>
                     <div className="text-[10px] text-gray-400">{dashboard.recentPassenger.invoiceNo || 'No Invoice'}</div>
                  </div>
                  <span className="text-[10px] bg-orange-50 text-orange-500 px-2 py-1 rounded-full font-bold">
                    {dashboard.recentPassenger.status || 'Pending'}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-4 text-center">No passengers yet</p>
              )}
            </BottomCard>

            <BottomCard title="Recent Reminders" icon={<Bell size={16} className="text-red-400" />}>
              {dashboard.recentReminder ? (
                <div className="mt-4 text-center">
                  <p className="text-sm font-semibold text-gray-700">{dashboard.recentReminder.title || 'Reminder'}</p>
                  <p className="text-xs text-gray-400 mt-1">{dashboard.recentReminder.message || '-'}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{formatRelativeTime(dashboard.recentReminder.created_at)}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mt-4 text-center">No reminders</p>
              )}
            </BottomCard>
          </div>

          {loading && <p className="text-xs text-gray-400 text-right">Loading dashboard...</p>}
        </div>
      </main>
    </div>
  );
}

// Helper Components for clean code
function StatCard({ icon, label, value, subText, iconBg }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[180px] flex flex-col justify-between">
      <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center mb-4 text-xl`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-gray-800">{value}</div>
      <div className="text-base font-semibold text-gray-700 mt-2">{label}</div>
      {subText && <div className="text-xs text-indigo-400 mt-1">{subText}</div>}
    </div>
  );
}

function BottomCard({ title, icon, children }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-sm font-bold text-gray-800">{title}</h4>
        </div>
        <button className="text-[10px] font-bold text-gray-500 flex items-center gap-1 hover:text-gray-800">
          View all <ChevronRight size={12} />
        </button>
      </div>
      {children}
    </div>
  );
}