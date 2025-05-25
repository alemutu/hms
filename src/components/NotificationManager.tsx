import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import { useNavigationHandler } from '../hooks/useNavigationHandler';
import { Bell, X, TestTube, Radio, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationManager: React.FC = () => {
  const { notifications, markNotificationAsRead } = usePatientStore();
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<string | null>(null);
  const { handleNotificationAction } = useNavigationHandler();
  
  // Monitor for new lab/radiology result notifications
  useEffect(() => {
    const resultNotifications = notifications.filter(n => 
      !n.read && 
      (n.type === 'lab-result' || n.type === 'radiology-result') &&
      n.testId && // Only show notifications with a test ID
      n.action === 'view-results' // Only show notifications for completed results
    );
    
    if (resultNotifications.length > 0 && !showNotification) {
      // Show the most recent notification
      setCurrentNotification(resultNotifications[0].id);
      setShowNotification(true);
      
      // Auto-dismiss after 5 seconds (reduced from 10 seconds for faster fading)
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications, showNotification]);

  const handleDismiss = () => {
    setShowNotification(false);
    setCurrentNotification(null);
  };
  
  const handleClick = () => {
    if (currentNotification) {
      const notification = notifications.find(n => n.id === currentNotification);
      if (notification) {
        markNotificationAsRead(currentNotification);
        handleNotificationAction(notification);
        setShowNotification(false);
        setCurrentNotification(null);
      }
    }
  };

  // If no current notification to show, return null
  if (!showNotification || !currentNotification) {
    return null;
  }
  
  const notification = notifications.find(n => n.id === currentNotification);
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 left-4 z-50 flex justify-center">
      <div 
        className="bg-white rounded-lg shadow-lg border border-slate-200 max-w-md w-full animate-slide-down transition-opacity duration-300"
        onClick={handleClick}
        style={{ opacity: showNotification ? 1 : 0 }}
      >
        <div className="p-3 bg-indigo-50 rounded-t-lg border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 rounded-full">
              {notification.type === 'lab-result' ? (
                <TestTube className="w-4 h-4 text-indigo-600" />
              ) : (
                <Radio className="w-4 h-4 text-indigo-600" />
              )}
            </div>
            <h3 className="font-medium text-indigo-800 text-sm">{notification.title}</h3>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="p-1 hover:bg-indigo-100 rounded-full text-indigo-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-3 cursor-pointer hover:bg-slate-50 transition-colors">
          <p className="text-sm text-slate-700">{notification.message}</p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </span>
            <button
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-xs transition-colors border border-indigo-100"
            >
              <span>View Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};