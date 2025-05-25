import React, { useEffect, useState } from 'react';
import { usePatientStore } from '../lib/store';
import { X, Bell, CheckCircle2, ArrowRight, TestTube, Radio, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ResultNotificationProps {
  notificationId: string;
  onClose: () => void;
  onClick: () => void;
  style?: React.CSSProperties;
}

export const ResultNotification: React.FC<ResultNotificationProps> = ({ 
  notificationId,
  onClose,
  onClick,
  style = {}
}) => {
  const { notifications, patientQueue, labTests } = usePatientStore();
  const [isVisible, setIsVisible] = useState(false);
  
  const notification = notifications.find(n => n.id === notificationId);
  
  if (!notification) return null;
  
  const patient = notification.patientId ? 
    patientQueue.find(p => p.id === notification.patientId) : null;
  
  const test = notification.testId && notification.patientId ? 
    (labTests[notification.patientId] || []).find(t => t.id === notification.testId) : null;

  // Fade in on mount
  useEffect(() => {
    // Small delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for fade-out animation
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

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
      style={style}
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
      
      <div className="p-4 cursor-pointer" onClick={onClick}>
        <p className="text-sm text-slate-700">{notification.message}</p>
        
        {patient && (
          <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-700 font-medium">{patient.fullName.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium text-slate-800">{patient.fullName}</p>
                <p className="text-xs text-slate-500">
                  {patient.age} years, {patient.gender}
                </p>
              </div>
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
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-sm transition-colors border border-indigo-100"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};