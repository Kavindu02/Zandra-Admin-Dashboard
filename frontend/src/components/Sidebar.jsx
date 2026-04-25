import { 
  LayoutDashboard, Bell, AlarmClock, Plane, 
  TrendingUp, Ticket, FileText, Calendar, 
  Users, CalendarClock, LogOut, Map,
  ArrowUpCircle, ArrowDownCircle, CreditCard, Banknote,
  BookOpen, BarChart3, DollarSign, UserCog, UserPlus
} from 'lucide-react';

const menuGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, active: true },
      { label: 'Notifications', icon: Bell },
      { label: 'Reminders', icon: AlarmClock },
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { label: 'Customers & Flights', icon: Plane },
      { label: 'Tour Packages', icon: Map },
      { label: 'Passengers', icon: Users },
      { label: 'Employees', icon: UserCog },
      { label: 'Issue Ticket', icon: Ticket },
      { label: 'Flight Calendar', icon: Calendar },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Profit Tracker', icon: TrendingUp, adminOnly: true },
      { label: 'Expenses', icon: ArrowUpCircle },
      { label: 'Receivables', icon: ArrowDownCircle },
      { label: 'Payables', icon: CreditCard },
      { label: 'Payroll', icon: Banknote, adminOnly: true },
    ]
  },
  {
    title: 'ACCOUNTING',
    items: [
      { label: 'Chart of Accounts', icon: BookOpen, hidden: true },
      { label: 'General Ledger', icon: FileText, hidden: true },
      { label: 'Cash Flow', icon: TrendingUp, adminOnly: true },
      { label: 'Profit & Loss', icon: BarChart3, adminOnly: true },
      { label: 'Balance Sheet', icon: DollarSign, hidden: true },
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
       { label: 'User Management', icon: UserPlus, adminOnly: true }
    ]
  }
];


import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const scrollRef = React.useRef(null);

  // Restore scroll position on mount
  React.useEffect(() => {
    const savedScrollPos = sessionStorage.getItem('sidebar_scroll_pos');
    if (savedScrollPos && scrollRef.current) {
      scrollRef.current.scrollTop = parseInt(savedScrollPos, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = (e) => {
    if (scrollRef.current) {
      sessionStorage.setItem('sidebar_scroll_pos', scrollRef.current.scrollTop.toString());
    }
  };

  // Reverse map: route -> label
  const routeToLabel = Object.entries({
    'Dashboard': '/',
    'Notifications': '/notifications',
    'Reminders': '/reminders',
    'Tour Packages': '/tour-packages',
    'Customers & Flights': '/customers-flights',
    'Passengers': '/passengers',
    'Employees': '/employees',
    'Issue Ticket': '/issue-ticket',

    'Flight Calendar': '/flight-calendar',
    'Profit Tracker': '/profit-tracker',
    'Expenses': '/expenses',
    'Receivables': '/receivables',
    'Payables': '/payables',
    'Payroll': '/payroll',
    'Chart of Accounts': '/chart-of-accounts',
    'General Ledger': '/general-ledger',
    'Cash Flow': '/cash-flow',
    'Profit & Loss': '/profit-and-loss',
    'Balance Sheet': '/balance-sheet',
  }).reduce((acc, [label, path]) => {
    acc[path] = label;
    return acc;
  }, {});

  // Find the label for the current path
  const activeLabel = routeToLabel[location.pathname] || 'Dashboard';

  // Map label to route
  const routeMap = {
    'Dashboard': '/',
    'Notifications': '/notifications',
    'Reminders': '/reminders',
    'Tour Packages': '/tour-packages',
    'Customers & Flights': '/customers-flights',
    'Passengers': '/passengers',
    'Employees': '/employees',
    'Issue Ticket': '/issue-ticket',

    'Flight Calendar': '/flight-calendar',
    'Profit Tracker': '/profit-tracker',
    'Expenses': '/expenses',
    'Receivables': '/receivables',
    'Payables': '/payables',
    'Payroll': '/payroll',
    'Chart of Accounts': '/chart-of-accounts',
    'General Ledger': '/general-ledger',
    'Cash Flow': '/cash-flow',
    'Profit & Loss': '/profit-and-loss',
    'Balance Sheet': '/balance-sheet',
    'User Management': '/user-management'
  };

  return (
    <aside className="bg-[#101D42] text-gray-400 w-64 fixed left-0 top-0 bottom-0 h-full flex flex-col justify-between shrink-0 z-30">
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 custom-scrollbar"
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8 px-2 flex-shrink-0">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden rounded-lg bg-white/10 p-1">
            <img src="/zandralogo.png" alt="Zandra Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight tracking-wider uppercase">Zandra Travelers</h1>
            <p className="text-[10px] text-orange-400 font-bold tracking-tighter uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Menu Groups */}
        <nav className="space-y-6 flex-1">
          {menuGroups.map((group) => {
            const visibleItems = group.items.filter(item => {
               if (item.hidden) return false;
               if (item.adminOnly && user?.role !== 'admin') return false;
               return true;
            });
            
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title}>
                <h3 className="text-[10px] font-bold text-gray-500 tracking-widest mb-3 px-2">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {visibleItems.map((item) => (
                    <li key={item.label}>
                      <button
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm ${
                          activeLabel === item.label
                            ? 'bg-[#F3A91B] text-[#101D42] font-bold'
                            : 'hover:bg-[#1e2e5a] hover:text-white'
                        }`}
                        onClick={() => {
                          if (routeMap[item.label]) {
                            navigate(routeMap[item.label]);
                          }
                        }}
                      >
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3d3326] flex items-center justify-center text-[#F3A91B] text-xs font-bold border border-[#F3A91B]/20 uppercase">
             {user?.username?.[0] || 'U'}
          </div>
          <div>
            <div className="text-white text-xs font-bold">{user?.username || 'Guest'}</div>
            <div className="text-[10px] text-gray-500 uppercase">{user?.role || 'Guest'}</div>
          </div>
        </div>
        <button onClick={logout} className="p-2 -mr-2 rounded-lg hover:bg-white/5 group transition-colors">
          <LogOut size={16} className="text-gray-500 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
    </aside>
  );
}