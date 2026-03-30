import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Bell, MessageSquare, FileText, TrendingUp, AlertCircle, ChevronRight, Plane, Users, Clock } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Dashboard</h2>
          <div className="flex items-center gap-4 text-gray-500">
            <button onClick={() => navigate('/notifications')} className="cursor-pointer hover:text-gray-800">
              <Bell size={20} />
            </button>
            <MessageSquare size={20} className="cursor-pointer hover:text-gray-800" />
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">Z</div>
          </div>
        </header>
        {/* ...existing code... */}
        <div className="p-4 space-y-4">
          {/* Top Stats Cards - 2 rows, 5 per row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <StatCard icon={<Users size={20}/>} label="Total Customers" value="1" iconBg="bg-blue-50 text-blue-500" />
            <StatCard icon={<Users size={20}/>} label="Active Employees" value="0" iconBg="bg-green-50 text-green-500" />
            <StatCard icon={<Plane size={20}/>} label="Today's Flights" value="0" iconBg="bg-yellow-50 text-yellow-500" />
            <StatCard icon={<Bell size={20}/>} label="Pending Reminders" value="0" iconBg="bg-pink-50 text-pink-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
            <StatCard icon={<TrendingUp size={20}/>} label="Monthly Profit" value="LKR 20,000" iconBg="bg-emerald-50 text-emerald-500" />
            <StatCard icon={<TrendingUp size={20}/>} label="Total Profit" value="LKR 20,000" iconBg="bg-purple-50 text-purple-500" />
            <StatCard icon={<AlertCircle size={20}/>} label="Unread Alerts" value="0" iconBg="bg-red-50 text-red-500" />
             <StatCard icon={<FileText size={20}/>} label="Total Invoices" value="1" subText="Auto-generated" iconBg="bg-indigo-50 text-indigo-500" />
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
              <p className="text-sm text-gray-400 mt-4 text-center">No upcoming flights in 48h</p>
            </BottomCard>

            <BottomCard title="Recent Passengers" icon={<Users size={16} className="text-blue-500" />}>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold">s</div>
                <div className="flex-1">
                   <div className="text-sm font-semibold">sandeepa</div>
                   <div className="text-[10px] text-gray-400">ZT-INV-MMKGUOEG</div>
                </div>
                <span className="text-[10px] bg-orange-50 text-orange-500 px-2 py-1 rounded-full font-bold">Pending</span>
              </div>
            </BottomCard>

            <BottomCard title="Recent Reminders" icon={<Bell size={16} className="text-red-400" />}>
              <p className="text-sm text-gray-400 mt-4 text-center">No reminders</p>
            </BottomCard>
          </div>
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