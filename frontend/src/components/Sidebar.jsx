//
import { 
  LayoutDashboard, Bell, AlarmClock, Plane, 
  TrendingUp, Ticket, FileText, Calendar, 
  Users, CalendarClock, LogOut 
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
      { label: 'Profit Tracker', icon: TrendingUp },
      { label: 'Issue Ticket', icon: Ticket },
      { label: 'Invoice Generator', icon: FileText },
      { label: 'Flight Calendar', icon: Calendar },
    ]
  },
];


import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Reverse map: route -> label
  const routeToLabel = Object.entries({
    'Dashboard': '/',
    'Notifications': '/notifications',
    'Reminders': '/reminders',
    'Customers & Flights': '/customers-flights',
    'Profit Tracker': '/profit-tracker',
    'Issue Ticket': '/issue-ticket',
    'Invoice Generator': '/invoice-generator',
    'Flight Calendar': '/flight-calendar',
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
    'Customers & Flights': '/customers-flights',
    'Profit Tracker': '/profit-tracker',
    'Issue Ticket': '/issue-ticket',
    'Invoice Generator': '/invoice-generator',
    'Flight Calendar': '/flight-calendar',
  };

  return (
    <aside className="bg-[#101D42] text-gray-400 w-64 fixed left-0 top-0 bottom-0 h-full flex flex-col justify-between shrink-0 z-30">
      <div className="p-4">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-[#F3A91B] p-2 rounded-lg">
            <Plane className="text-[#101D42] w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm leading-tight tracking-wider">ZANDRA TRAVELERS</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-tighter">ADMIN PANEL</p>
          </div>
        </div>

        {/* Menu Groups */}
        <nav className="space-y-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-bold text-gray-500 tracking-widest mb-3 px-2">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
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
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3d3326] flex items-center justify-center text-[#F3A91B] text-xs font-bold border border-[#F3A91B]/20">
            Z
          </div>
          <div>
            <div className="text-white text-xs font-bold">Zandeepa Pb</div>
            <div className="text-[10px] text-gray-500">Admin</div>
          </div>
        </div>
        <LogOut size={16} className="text-gray-500 cursor-pointer hover:text-white" />
      </div>
    </aside>
  );
}