import { useEffect, useState } from 'react';
import * as notificationService from '../../services/notificationService.js';
import Spinner from '../ui/Spinner.jsx';

function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    notificationService
      .getNotifications({ limit: 50 })
      .then((result) => {
        setNotifications(result.data.notifications);
        setError('');
      })
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAsRead = (notification) => {
    if (notification.isRead) return;
    notificationService
      .markNotificationAsRead(notification._id)
      .then(() => {
        setNotifications((prev) =>
          prev.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item)),
        );
      })
      .catch(() => setError('Failed to mark notification as read.'));
  };

  const handleDelete = (notification) => {
    notificationService
      .deleteNotification(notification._id)
      .then(() => {
        setNotifications((prev) => prev.filter((item) => item._id !== notification._id));
      })
      .catch(() => setError('Failed to delete notification.'));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Notifications</h1>

      {error && <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>}

      <div className="mt-6 flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800 ${
                notification.isRead ? 'bg-white dark:bg-gray-900' : 'bg-blue-50/50 dark:bg-blue-500/10'
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-3">
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(notification)}
                    className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notification)}
                  className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationList;
