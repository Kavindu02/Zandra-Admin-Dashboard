import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { Bell, ArrowUpCircle, TrendingUp, Ticket, ChevronRight, Plane, Users, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { user } = useAuth();
  
  const [dashboard, setDashboard] = useState({
    totalCustomers: 0,
    totalBookings: 0,
    totalIncome: 0,
    totalExpenses: 0,
    monthlyStats: [],
    topDestinations: [],
    todaysFlights: 0,
    flightsIn48h: 0,
    recentPassenger: null,
    recentReminder: null,
  });

  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getDateLabel = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    }).format(new Date());
  };

  const formatCurrency = (value) => {
    return `LKR ${Number(value || 0).toLocaleString()}`;
  };

  const formatRelativeTime = (value) => {
    if (!value) return 'No reminders';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fetchDashboard = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/dashboard/summary`);
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const intervalId = setInterval(fetchDashboard, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Dashboard</h2>
          <TopHeaderActions />
        </header>

        <div className="px-8 py-6">
          <div className="mb-8">
            <h3 className="text-3xl font-black text-[#1F2B3F] tracking-tight">{getGreeting()}, {user?.username || 'Admin'}</h3>
            <p className="text-sm font-semibold text-gray-500 mt-1">{getDateLabel()} — Here is what's happening today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard icon={<Users size={24}/>} label="Total Customers" value={dashboard.totalCustomers} iconBg="bg-blue-50 text-blue-500" />
            <StatCard icon={<Ticket size={24}/>} label="Total Bookings" value={dashboard.totalBookings} subText="Booked tickets" iconBg="bg-blue-50/50 text-indigo-500" />
            <StatCard icon={<DollarSign size={24}/>} label="Total Income" value={formatCurrency(dashboard.totalIncome)} subText="All time" iconBg="bg-emerald-50 text-emerald-500" />
            <StatCard icon={<ArrowUpCircle size={24}/>} label="Total Expenses" value={formatCurrency(dashboard.totalExpenses)} subText="All time" iconBg="bg-red-50 text-red-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <h3 className="text-sm font-black text-[#1F2B3F] mb-6 tracking-tight">Income vs Expenses — {currentYear}</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={dashboard.monthlyStats}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dx={-10} tickFormatter={(val) => `${val/1000}K`} />
                     <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Legend iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 'bold', bottom: -10}} />
                     <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                     <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={12} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <h3 className="text-sm font-black text-[#1F2B3F] mb-6 tracking-tight">Monthly Profit — {currentYear}</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={dashboard.monthlyStats || []}>
                     <defs>
                       <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                         <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dx={-10} tickFormatter={(val) => `${val/1000}K`} />
                     <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Area type="monotone" dataKey="profit" name="Profit" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <h3 className="text-sm font-black text-[#1F2B3F] mb-6 tracking-tight">Bookings per Month — {currentYear}</h3>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={dashboard.monthlyStats}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold'}} dx={-10} />
                     <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                     <Bar dataKey="bookings" name="Bookings" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
               <h3 className="text-sm font-black text-[#1F2B3F] mb-6 tracking-tight">Top Destinations</h3>
               <div className="h-64 flex items-center justify-center">
                 {dashboard.topDestinations?.length > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={dashboard.topDestinations}
                         cx="50%" cy="50%"
                         innerRadius={60} outerRadius={90}
                         paddingAngle={5} dataKey="value"
                       >
                         {dashboard.topDestinations.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                       </Pie>
                       <RechartsTooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                       <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', fontWeight: 'bold', color: '#4B5563'}} />
                     </PieChart>
                   </ResponsiveContainer>
                 ) : (
                   <div className="text-sm text-gray-400 font-bold">No destination data yet</div>
                 )}
               </div>
            </div>
          </div>

          {/* Bottom Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BottomCard title="Flights in 48h" icon={<Plane size={16} className="text-orange-400" />}>
              <p className="text-sm font-semibold text-gray-500 mt-4 text-center">
                {dashboard.flightsIn48h > 0
                  ? `${dashboard.flightsIn48h} upcoming flight${dashboard.flightsIn48h > 1 ? 's' : ''} in next 48h`
                  : 'No upcoming flights in 48h'}
              </p>
            </BottomCard>

            <BottomCard title="Recent Passengers" icon={<Users size={16} className="text-blue-500" />}>
              {dashboard.recentPassenger ? (
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-black border border-blue-100">
                    {(dashboard.recentPassenger.passenger || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                     <div className="text-sm font-bold text-gray-800">{dashboard.recentPassenger.passenger || 'Unknown'}</div>
                     <div className="text-xs font-semibold text-gray-400 mt-0.5">{dashboard.recentPassenger.invoiceNo || 'No Invoice'}</div>
                  </div>
                  <span className="text-[10px] bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-black uppercase tracking-wider">
                    {dashboard.recentPassenger.status || 'Pending'}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-400 mt-4 text-center">No passengers yet</p>
              )}
            </BottomCard>

            <BottomCard title="Recent Reminders" icon={<Bell size={16} className="text-red-400" />}>
              {dashboard.recentReminder ? (
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-gray-800">{dashboard.recentReminder.title || 'Reminder'}</p>
                  <p className="text-xs font-semibold text-gray-500 mt-1">{dashboard.recentReminder.message || '-'}</p>
                  <p className="inline-block text-[10px] uppercase tracking-wider font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-md mt-3">
                    {formatRelativeTime(dashboard.recentReminder.created_at)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-400 mt-4 text-center">No reminders</p>
              )}
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
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 ${iconBg} rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-105`}>
          {icon}
        </div>
      </div>
      <div className="mt-6">
        <div className="text-sm font-bold text-gray-500">{label}</div>
        <div className="text-2xl font-black text-[#1F2B3F] mt-1 tracking-tight">{value}</div>
      </div>
      {subText && (
        <div className="absolute top-6 right-6">
          <span className="text-[10px] font-black uppercase tracking-wider bg-gray-50 text-gray-400 px-2.5 py-1 rounded-lg">
             {subText}
          </span>
        </div>
      )}
    </div>
  );
}

function BottomCard({ title, icon, children }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</h4>
        </div>
      </div>
      {children}
    </div>
  );
}