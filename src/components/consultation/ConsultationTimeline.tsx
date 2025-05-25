import React from 'react';
import { format } from 'date-fns';
import { 
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Pill,
  TestTube,
  Radio,
  Building2,
  Settings as Lungs,
  Eye
} from 'lucide-react';
import type { Consultation, LabTest } from '../../types';

interface ConsultationTimelineProps {
  consultation: Consultation;
  labTests: LabTest[];
}

export const ConsultationTimeline: React.FC<ConsultationTimelineProps> = ({
  consultation,
  labTests = []
}) => {
  // Combine all timeline events
  const timelineEvents = [
    // Consultation events
    ...(consultation?.timeline || []).map(event => ({
      type: 'event' as const,
      data: event,
      timestamp: new Date(event.timestamp)
    })),
    // Lab test events
    ...(labTests || []).map(test => ({
      type: 'lab-test' as const,
      data: test,
      timestamp: new Date(test.requestedAt)
    })),
    // Medication events
    ...(consultation?.medications || []).map(med => ({
      type: 'medication' as const,
      data: med,
      timestamp: new Date(consultation.startTime)
    }))
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lab-test':
        return TestTube;
      case 'medication':
        return Pill;
      case 'event':
        return Activity;
      default:
        return FileText;
    }
  };

  const getEventColor = (type: string, status?: string) => {
    if (status === 'completed') return 'text-green-600 bg-green-100';
    if (status === 'in-progress') return 'text-blue-600 bg-blue-100';
    
    switch (type) {
      case 'lab-test':
        return 'text-purple-600 bg-purple-100';
      case 'medication':
        return 'text-emerald-600 bg-emerald-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="space-y-4">
      {timelineEvents.map((event, index) => {
        const Icon = getEventIcon(event.type);
        const colorClass = getEventColor(event.type, 
          'status' in event.data ? event.data.status : undefined
        );

        return (
          <div key={index} className="relative">
            {index < timelineEvents.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-px bg-gray-200" />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">
                    {event.type === 'event' ? event.data.event :
                     event.type === 'lab-test' ? event.data.testType :
                     event.type === 'medication' ? event.data.name :
                     'Unknown Event'}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {format(event.timestamp, 'PPp')}
                  </span>
                </div>

                {event.type === 'event' && event.data.details && (
                  <p className="text-sm text-gray-600 mt-1">{event.data.details}</p>
                )}

                {event.type === 'lab-test' && event.data.results && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">{event.data.results.findings}</p>
                    {event.data.results.interpretation && (
                      <p className="text-sm text-gray-500 italic">
                        {event.data.results.interpretation}
                      </p>
                    )}
                    {event.data.results.imageUrl && (
                      <div className="mt-1">
                        <a 
                          href={event.data.results.imageUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Image</span>
                        </a>
                      </div>
                    )}
                    {event.data.results.criticalValues && (
                      <div className="mt-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs inline-block">
                        Critical Values
                      </div>
                    )}
                  </div>
                )}

                {event.type === 'medication' && (
                  <div className="mt-1 text-sm text-gray-600">
                    <p>{event.data.dosage} - {event.data.frequency}</p>
                    {event.data.notes && (
                      <p className="text-gray-500 mt-1">{event.data.notes}</p>
                    )}
                  </div>
                )}

                {event.data.actor && (
                  <p className="text-sm text-gray-500 mt-1">
                    By {event.data.actor}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};