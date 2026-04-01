import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopHeaderActions() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      const list = Array.isArray(res.data) ? res.data : [];
      const unread = list.filter((item) => Number(item.isRead) !== 1).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load unread notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    const intervalId = setInterval(fetchUnreadCount, 10000);

    const handleWindowFocus = () => fetchUnreadCount();
    const handleNotificationsUpdated = () => fetchUnreadCount();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('notifications-updated', handleNotificationsUpdated);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('notifications-updated', handleNotificationsUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  return (
    <div className="flex items-center gap-4 text-gray-500">
      <button
        type="button"
        onClick={() => navigate('/notifications')}
        className="relative cursor-pointer hover:text-gray-800"
        aria-label="Open notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => navigate('/notifications')}
        className="cursor-pointer hover:text-gray-800"
        aria-label="Open messages"
      >
        <MessageSquare size={20} />
      </button>

      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-700">
        Z
      </div>
    </div>
  );
}