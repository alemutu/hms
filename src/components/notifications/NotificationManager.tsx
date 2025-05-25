import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePatientStore } from '../../lib/store';
import { useNavigationHandler } from '../../hooks/useNavigationHandler';
import { NotificationToast } from './NotificationToast';
import { cn } from '@/lib/utils';

export const NotificationManager: React.FC = () => {
  const { notifications, markNotificationAsRead } = usePatientStore();
  const [activeNotifications, setActiveNotifications] = useState<string[]>([]);
  const { handleNotificationAction } = useNavigationHandler();
  const notificationTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const processedNotifications = useRef<Set<string>>(new Set());
  
  // Monitor for new notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Only show the most recent 3 unread notifications
    const recentUnread = unreadNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
    
    // Check for new notifications that aren't already active or processed
    const newNotifications = recentUnread
      .filter(n => !activeNotifications.includes(n.id) && !processedNotifications.current.has(n.id))
      .map(n => n.id);
    
    // Add new notifications to active list
    if (newNotifications.length > 0) {
      setActiveNotifications(prev => [...newNotifications, ...prev].slice(0, 3));
      
      // Set up auto-dismiss timers for new notifications (2 seconds)
      newNotifications.forEach(notificationId => {
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          // Add to processed set to prevent showing again
          processedNotifications.current.add(notificationId);
          
          // Clear any existing timer for this notification
          if (notificationTimers.current[notificationId]) {
            clearTimeout(notificationTimers.current[notificationId]);
          }
          
          // Set new timer - 2 seconds for all notifications
          notificationTimers.current[notificationId] = setTimeout(() => {
            setActiveNotifications(prev => prev.filter(id => id !== notificationId));
            delete notificationTimers.current[notificationId];
          }, 2000); // 2 seconds auto-close
        }
      });
    }
    
    // Cleanup function to clear all timers
    return () => {
      Object.values(notificationTimers.current).forEach(timer => clearTimeout(timer));
    };
  }, [notifications, activeNotifications]);

  const handleDismiss = (notificationId: string) => {
    // Clear the timer if it exists
    if (notificationTimers.current[notificationId]) {
      clearTimeout(notificationTimers.current[notificationId]);
      delete notificationTimers.current[notificationId];
    }
    
    setActiveNotifications(prev => prev.filter(id => id !== notificationId));
  };
  
  const handleClick = (notificationId: string) => {
    if (notificationId) {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        markNotificationAsRead(notificationId);
        handleNotificationAction(notification);
        handleDismiss(notificationId);
      }
    }
  };

  // If no current notification to show, return null
  if (activeNotifications.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {activeNotifications.map((notificationId, index) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification) return null;
        
        return (
          <div 
            key={notificationId} 
            className={cn(
              "pointer-events-auto",
              "transition-all duration-300 ease-in-out",
              "transform-gpu"
            )}
            style={{ 
              zIndex: 100 - index,
              marginTop: index * 4
            }}
          >
            <NotificationToast
              notification={notification}
              onClose={() => handleDismiss(notificationId)}
              onClick={() => handleClick(notificationId)}
              autoClose={true}
              autoCloseDelay={2000} // 2 seconds
            />
          </div>
        );
      })}
    </div>
  );
};