import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as notificationService from '../../services/notificationService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { ROLES } from '../../constants/roles.js';

const NOTIFICATIONS_PATH = {
  [ROLES.CITIZEN]: '/citizen/notifications',
  [ROLES.OFFICER]: '/officer/notifications',
  [ROLES.ADMIN]: '/admin/notifications',
};

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    notificationService
      .getNotifications({ limit: 1 })
      .then((result) => setUnreadCount(result.data.unreadCount))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      notificationService
        .getNotifications({ limit: 5 })
        .then((result) => {
          setNotifications(result.data.notifications);
          setUnreadCount(result.data.unreadCount);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAsRead = (notification) => {
    if (notification.isRead) return;
    notificationService
      .markNotificationAsRead(notification._id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)),
        );
        setUnreadCount((prev) => Math.max(prev - 1, 0));
      })
      .catch(() => {});
  };

  const handleNewNotification = useCallback((notification) => {
    setUnreadCount((prev) => prev + 1);
    setNotifications((prev) => [notification, ...prev].slice(0, 5));
  }, []);

  useSocketEvent('notification:new', handleNewNotification);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-modal-in absolute right-0 z-40 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                No notifications yet.
              </p>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleMarkAsRead(notification)}
                  className={`block w-full border-b border-gray-50 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60 ${
                    notification.isRead ? 'bg-white dark:bg-gray-900' : 'bg-blue-50/50 dark:bg-blue-500/10'
                  }`}
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                  <p className="mt-0.5 text-gray-500 dark:text-gray-400">{notification.message}</p>
                </button>
              ))
            )}
          </div>
          <Link
            to={NOTIFICATIONS_PATH[user?.role] || '/'}
            onClick={() => setOpen(false)}
            className="block px-4 py-3 text-center text-sm font-medium text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-800/60"
          >
            View all
          </Link>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
