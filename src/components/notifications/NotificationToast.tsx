import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle2, ArrowRight, TestTube, Radio, AlertCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '../../types';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onClick: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ 
  notification,
  onClose,
  onClick,
  autoClose = true,
  autoCloseDelay = 2000 // Default to 2 seconds
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  // Fade in on mount
  useEffect(() => {
    // Small delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after delay
  useEffect(() => {
    if (!autoClose) return;
    
    const startTime = Date.now();
    const endTime = startTime + autoCloseDelay;
    
    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / autoCloseDelay) * 100;
      
      setProgress(newProgress);
      
      if (newProgress > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow time for fade-out animation
      }
    };
    
    const animationId = requestAnimationFrame(updateProgress);
    
    return () => cancelAnimationFrame(animationId);
  }, [autoClose, autoCloseDelay, onClose]);

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'lab-result':
        return <TestTube className="w-4 h-4 text-white" />;
      case 'radiology-result':
        return <Radio className="w-4 h-4 text-white" />;
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-white" />;
      default:
        return <Bell className="w-4 h-4 text-white" />;
    }
  };

  const getNotificationColor = () => {
    if (notification.priority === 'high') {
      return 'from-rose-500 to-rose-600';
    }
    
    switch (notification.type) {
      case 'lab-result':
        return 'from-indigo-500 to-indigo-600';
      case 'radiology-result':
        return 'from-sky-500 to-sky-600';
      case 'urgent':
        return 'from-rose-500 to-rose-600';
      default:
        return 'from-emerald-500 to-emerald-600';
    }
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'just now';
    }
  };

  return (
    <div 
      className={`max-w-md bg-white rounded-lg shadow-xl border border-slate-200 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className={`p-3 bg-gradient-to-r ${getNotificationColor()} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-full">
              {getNotificationIcon()}
            </div>
            <h3 className="font-medium text-white">{notification.title}</h3>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <p className="text-sm text-slate-700">{notification.message}</p>
        
        {notification.patientId && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">Patient ID: {notification.patientId.slice(0, 8)}</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-slate-500">{getTimeAgo(notification.timestamp)}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 text-xs"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Progress bar */}
      {autoClose && (
        <div className="h-1 bg-gray-100">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${
              notification.priority === 'high' ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};