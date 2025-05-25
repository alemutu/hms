import React, { useState, useEffect, useRef } from 'react';
import { usePatientStore } from '../lib/store';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  TestTube, 
  Radio, 
  AlertCircle, 
  Clock, 
  Eye, 
  Check, 
  ArrowRight,
  Info
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Notification } from '../types';

export const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    markAllNotificationsAsRead, 
    clearAllNotifications,
    unreadNotificationsCount,
    currentDepartment
  } = usePatientStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'results'>('all');
  const notificationRef = useRef<HTMLDivElement>(null);

  // Filter notifications based on current department and filter setting
  useEffect(() => {
    let filtered = [...notifications];
    
    // Apply department filter if applicable
    if (currentDepartment) {
      filtered = filtered.filter(n => 
        n.departmentTarget === currentDepartment || 
        n.departmentTarget === undefined
      );
    }
    
    // Apply type filter
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'results') {
      filtered = filtered.filter(n => 
        n.type === 'lab-result' || n.type === 'radiology-result'
      );
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, currentDepartment, filter]);

  // Check for unread notifications
  useEffect(() => {
    setHasNewNotifications(unreadNotificationsCount > 0);
  }, [unreadNotificationsCount]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'lab-result':
        return <TestTube className="w-4 h-4 text-indigo-600" />;
      case 'radiology-result':
        return <Radio className="w-4 h-4 text-sky-600" />;
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'system':
        return <Info className="w-4 h-4 text-slate-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'bg-rose-50 border-rose-200';
    }
    
    switch (type) {
      case 'lab-result':
        return 'bg-indigo-50 border-indigo-200';
      case 'radiology-result':
        return 'bg-sky-50 border-sky-200';
      case 'urgent':
        return 'bg-rose-50 border-rose-200';
      case 'system':
        return 'bg-slate-50 border-slate-200';
      default:
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markNotificationAsRead(notification.id);
    
    // Here you would handle navigation based on notification action
    // For now, we'll just close the notification center
    setIsOpen(false);
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-slate-600" />
        {hasNewNotifications && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse"></span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Notifications</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs">
                <button 
                  onClick={() => setFilter('all')}
                  className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-white shadow-sm' : ''}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('unread')}
                  className={`px-2 py-1 rounded ${filter === 'unread' ? 'bg-white shadow-sm' : ''}`}
                >
                  Unread
                </button>
                <button 
                  onClick={() => setFilter('results')}
                  className={`px-2 py-1 rounded ${filter === 'results' ? 'bg-white shadow-sm' : ''}`}
                >
                  Results
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length > 0 ? (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 ${notification.read ? 'opacity-70' : ''}`}
                  >
                    <div 
                      className={`flex items-start gap-3 p-3 rounded-lg border ${getNotificationColor(notification.type, notification.priority)} ${!notification.read ? 'animate-pulse-subtle' : ''} cursor-pointer hover:shadow-sm transition-shadow`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="p-1.5 bg-white rounded-full flex-shrink-0 shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm text-slate-900">{notification.title}</p>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{notification.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs text-slate-500">{getTimeAgo(notification.timestamp)}</span>
                          {notification.action && (
                            <button className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
                              {notification.action === 'view-results' ? (
                                <>
                                  <Eye className="w-3 h-3" />
                                  <span>View Results</span>
                                </>
                              ) : notification.action === 'view-patient' ? (
                                <>
                                  <ArrowRight className="w-3 h-3" />
                                  <span>View Patient</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Acknowledge</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No notifications</p>
              </div>
            )}
          </div>
          
          {filteredNotifications.length > 0 && (
            <div className="px-4 py-2 border-t flex items-center justify-between">
              <button 
                onClick={() => markAllNotificationsAsRead()}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Mark all as read
              </button>
              <button 
                onClick={() => clearAllNotifications()}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};