import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { Bell, ChevronDown, Plane, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DROPDOWN_OPTIONS = ['All', 'Reminders', 'Customers', 'Ticket', 'Invoice'];

const getNotificationCategory = (notification) => {
  const text = `${notification?.title || ''} ${notification?.message || ''} ${notification?.type || ''}`.toLowerCase();

  if (text.includes('reminder')) {
    return 'reminders';
  }
  if (text.includes('ticket')) {
    return 'ticket';
  }
  if (text.includes('invoice') || text.includes('zt-inv') || text.includes('inv-')) {
    return 'invoice';
  }
  if (text.includes('customer')) {
    return 'customers';
  }

  return '';
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [tabFilter, setTabFilter] = useState('all');
  const [dropdownFilter, setDropdownFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const notifyHeaderRefresh = () => {
    window.dispatchEvent(new Event('notifications-updated'));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/notifications`);
      setNotifications(res.data || []);
      notifyHeaderRefresh();
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => Number(n.isRead) !== 1).length,
    [notifications]
  );

  const readCount = notifications.length - unreadCount;

  const getFilter = () => {
    if (dropdownFilter.toLowerCase() !== 'all') {
      return dropdownFilter.toLowerCase();
    }
    return tabFilter;
  };

  const visibleNotifications = useMemo(() => {
    const filter = getFilter();
    if (filter === 'unread') {
      return notifications.filter((n) => Number(n.isRead) !== 1);
    }
    if (filter === 'read') {
      return notifications.filter((n) => Number(n.isRead) === 1);
    }
    if (['reminders', 'customers', 'ticket', 'invoice'].includes(filter)) {
      return notifications.filter((n) => getNotificationCategory(n) === filter);
    }
    return notifications;
  }, [notifications, tabFilter, dropdownFilter]);

  const formatRelativeTime = (value) => {
    if (!value) {
      return 'Just now';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      notifyHeaderRefresh();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkRead = async (id, isRead) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/api/notifications/${id}/read`, { isRead });
      const nextStatus = Number(res.data?.isRead ?? (isRead ? 1 : 0));
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: nextStatus } : n))
      );
      notifyHeaderRefresh();
    } catch (err) {
      console.error('Failed to update notification status:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Notifications</h2>
          <TopHeaderActions />
        </div>

        <div className="px-8 py-7">
          <h3 className="text-2xl font-bold text-[#111827] mb-1">Notifications</h3>
          <p className="text-gray-400 mb-7">{unreadCount} unread notifications</p>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div className="flex gap-2">
              <button
                onClick={() => setTabFilter('all')}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm border ${tabFilter === 'all' ? 'bg-[#101D42] text-white border-[#101D42]' : 'bg-[#F3F4F6] text-gray-700 border-gray-200'}`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setTabFilter('unread')}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm border ${tabFilter === 'unread' ? 'bg-[#101D42] text-white border-[#101D42]' : 'bg-[#F3F4F6] text-gray-700 border-gray-200'}`}
              >
                Unread ({unreadCount})
              </button>
              <button
                onClick={() => setTabFilter('read')}
                className={`px-4 py-1.5 rounded-full font-semibold text-sm border ${tabFilter === 'read' ? 'bg-[#101D42] text-white border-[#101D42]' : 'bg-[#F3F4F6] text-gray-700 border-gray-200'}`}
              >
                Read ({readCount})
              </button>
            </div>

            <div ref={dropdownRef} className="relative self-start md:self-auto">
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="w-[176px] px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 bg-[#EDEFF3] flex items-center justify-between"
              >
                {dropdownFilter}
                <ChevronDown size={16} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  {DROPDOWN_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setDropdownFilter(option);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${dropdownFilter === option ? 'bg-gray-100 text-[#101D42] font-semibold' : 'text-gray-700'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {visibleNotifications.length === 0 && (
            <div className="rounded-2xl bg-white border border-gray-200 p-12 text-center text-gray-500">
              No notifications yet.
            </div>
          )}

          {visibleNotifications.map((item) => {
            const isRead = Number(item.isRead) === 1;

            return (
              <div
                key={item.id}
                className={`rounded-2xl px-4 py-4 border mb-3 ${isRead ? 'bg-white border-gray-200' : 'bg-[#F8FAFE] border-[#dce5f3]'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isRead) {
                        handleMarkRead(item.id, true);
                      }
                    }}
                    className="flex items-center gap-4 text-left"
                  >
                    <span className="w-10 h-10 bg-[#EAF2FF] text-[#4A7CE9] rounded-xl border border-[#d6e4ff] flex items-center justify-center">
                      {item.type === 'customer' ? <Plane size={18} /> : <Bell size={18} />}
                    </span>
                    <div>
                      <div className="font-semibold text-base text-gray-700 leading-tight">{item.title}</div>
                      <div className="text-gray-500 text-sm leading-tight mt-1">{item.message}</div>
                    </div>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleMarkRead(item.id, !isRead)}
                      className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50"
                    >
                      {isRead ? 'Mark unread' : 'Mark read'}
                    </button>
                    <div className="text-gray-500 text-sm min-w-[120px] text-right">{formatRelativeTime(item.created_at)}</div>
                    <button className="text-gray-500 hover:text-red-500" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
