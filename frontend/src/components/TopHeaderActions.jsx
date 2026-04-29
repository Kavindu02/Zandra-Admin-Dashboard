import React, { useCallback, useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Bell, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function TopHeaderActions() {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const prevCountRef = useRef(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/notifications`);
      const list = Array.isArray(res.data) ? res.data : [];
      const unreadList = list.filter((item) => Number(item.isRead) !== 1);
      const unread = unreadList.length;
      
      if (unread > prevCountRef.current && prevCountRef.current !== 0) {
        const latest = unreadList[0];
        if (latest) {
          toast((t) => (
            <div className="flex flex-col gap-1 cursor-pointer" onClick={() => {
              toast.dismiss(t.id);
              navigate('/notifications');
            }}>
              <span className="font-bold text-sm text-[#101D42]">{latest.title || 'New Notification'}</span>
              <span className="text-xs text-gray-600 line-clamp-2">{latest.message}</span>
            </div>
          ), {
            icon: '🔔',
            duration: 5000,
          });
        }
      }
      
      prevCountRef.current = unread;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load unread notifications:', error);
    }
  }, [navigate]);

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
    </div>
  );
}