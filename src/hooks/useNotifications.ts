import { useState, useEffect, useMemo } from 'react';
import type { AppNotification } from '../database/schema';
import { DB } from '../database/db';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refreshData = () => {
    setNotifications(DB.getNotifications());
  };

  useEffect(() => {
    refreshData();
    const handleStorage = () => refreshData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const markAsRead = (id: string) => {
    DB.markNotificationRead(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const markAllAsRead = () => {
    DB.markAllNotificationsRead();
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const deleteNotification = (id: string) => {
    DB.deleteNotification(id);
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const clearAll = () => {
    DB.clearAllNotifications();
    refreshData();
    window.dispatchEvent(new Event('storage'));
  };

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshData
  };
}
