import * as React from 'react';
import { usePatientStore } from '../lib/store';
import { 
  Search, 
  Bell,
  UserPlus,
  Activity,
  Users,
  Clock,
  Calendar,
  FileText,
  Stethoscope,
  AlertCircle,
  ClipboardList,
  CheckCircle2,
  Filter,
  MoreVertical,
  ArrowUpRight,
  ChevronRight,
  CalendarClock,
  UserCog,
  Clipboard,
  HeartPulse,
  Plus,
  ArrowRight,
  Star,
  LayoutGrid,
  ListFilter,
  ArrowLeft,
  ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '../types';

export const ReceptionDashboard = () => {
  const { setCurrentSection, patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5; // Show 5 patients per page

  const notifications = [
    { id: 1, message: 'New patient registered', time: '2 mins ago', type: 'info' },
    { id: 2, message: 'Critical patient in triage', time: '5 mins ago', type: 'urgent' },
    { id: 3, message: 'Lab results ready for Sarah Johnson', time: '10 mins ago', type: 'success' },
  ];

  const quickActions = [
    { 
      icon: UserPlus, 
      label: 'New Patient', 
      description: 'Register a new patient',
      action: () => setCurrentSection('registration'),
      color: 'violet'
    },
    { 
      icon: CalendarClock, 
      label: 'Schedule', 
      description: 'Manage appointments',
      action: () => setCurrentSection('appointments'),
      color: 'cyan'
    },
    { 
      icon: Clipboard, 
      label: 'Records', 
      description: 'View medical records',
      action: () => setCurrentSection('records'),
      color: 'pink'
    }
  ];

  const stats = React.useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const queue = patientQueue || [];
    
    const registeredToday = queue.filter(p => 
      new Date(p.registrationDate) >= todayStart
    ).length;

    const activePatients = queue.filter(p => p.status !== 'discharged').length;
    const completedPatients = queue.filter(p => p.status === 'discharged').length;
    
    const waitTimes = queue
      .filter(p => p.waitTime)
      .map(p => p.waitTime || 0);
    const avgWaitTime = waitTimes.length 
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    return [
      { 
        icon: UserPlus, 
        label: 'Registered Today', 
        value: registeredToday,
        change: '+12%',
        trend: 'up',
        color: 'violet'
      },
      { 
        icon: Clock, 
        label: 'Avg. Wait Time', 
        value: `${avgWaitTime} min`,
        change: avgWaitTime > 20 ? '+5%' : '-5%',
        trend: avgWaitTime > 20 ? 'up' : 'down',
        color: 'cyan'
      },
      { 
        icon: HeartPulse, 
        label: 'Active Patients', 
        value: activePatients,
        change: '+8%',
        trend: 'up',
        color: 'pink'
      },
      { 
        icon: CheckCircle2, 
        label: 'Completed Today', 
        value: completedPatients,
        change: '+15%',
        trend: 'up',
        color: 'amber'
      }
    ];
  }, [patientQueue]);

  const filteredPatients = React.useMemo(() => {
    const queue = patientQueue || [];
    return queue
      .filter(patient => {
        const matchesSearch = searchQuery === '' ||
          patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          patient.id.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesFilter = selectedFilter === 'all' ||
          (selectedFilter === 'waiting' && patient.status === 'registered') ||
          (selectedFilter === 'urgent' && patient.priority === 'urgent');
        
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        const priorityOrder = { critical: 0, urgent: 1, normal: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      });
  }, [patientQueue, searchQuery, selectedFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusColor = (status: Patient['status']) => {
    switch (status) {
      case 'registered':
        return 'bg-violet-100 text-violet-700 border border-violet-200';
      case 'in-triage':
        return 'bg-cyan-100 text-cyan-700 border border-cyan-200';
      case 'in-consultation':
        return 'bg-pink-100 text-pink-700 border border-pink-200';
      case 'in-pharmacy':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'discharged':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const getPriorityColor = (priority: Patient['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
  };

  const getStatusIcon = (status: Patient['status']) => {
    switch (status) {
      case 'registered':
        return Clock;
      case 'in-triage':
        return Activity;
      case 'in-consultation':
        return Stethoscope;
      case 'in-pharmacy':
        return FileText;
      case 'discharged':
        return CheckCircle2;
      default:
        return Clock;
    }
  };

  const renderPatientCard = (patient: Patient) => {
    const StatusIcon = getStatusIcon(patient.status);
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl flex items-center justify-center">
              <span className="text-violet-700 font-semibold text-lg">
                {patient.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{patient.fullName}</h3>
              <p className="text-sm text-slate-500">ID: #{patient.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentSection('records')}
            className="p-2 text-slate-400 hover:text-violet-600 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Registration Time</span>
            <span className="text-slate-700 font-medium">
              {format(new Date(patient.registrationDate), 'p')}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Department</span>
            <span className="text-slate-700 font-medium">
              {patient.currentDepartment || 'Reception'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Wait Time</span>
            <span className="text-slate-700 font-medium">
              {patient.waitTime ? `${patient.waitTime} min` : '-'}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {patient.status.split('-').join(' ').replace(/^\w/, c => c.toUpperCase())}
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
              <Star className="w-3 h-3 mr-1" />
              {patient.priority.charAt(0).toUpperCase() + patient.priority.slice(1)}
            </div>
          </div>
          
          <button
            onClick={() => setCurrentSection('records')}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>View Records</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-violet-500 to-violet-600 px-6 pt-6 pb-8 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Reception Dashboard</h1>
            <p className="text-violet-100 mt-1">Monitor patient flow and status</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-white" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full" />
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <h3 className="font-medium text-slate-900">Notifications</h3>
                  </div>
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className="px-4 py-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          notification.type === 'urgent' ? 'bg-rose-500' :
                          notification.type === 'success' ? 'bg-emerald-500' :
                          'bg-violet-500'
                        }`} />
                        <div>
                          <p className="text-sm text-slate-800">{notification.message}</p>
                          <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setCurrentSection('registration')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-violet-700 rounded-lg hover:bg-violet-50 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="font-medium">New Patient</span>
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map(({ icon: Icon, label, description, action, color }) => (
            <button
              key={label}
              onClick={action}
              className="group bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all border border-white/20 text-left"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md bg-${color}-500/10`}>
                  <Icon className={`w-4 h-4 text-${color}-100`} />
                </div>
                <div>
                  <h3 className="font-medium text-white text-sm">{label}</h3>
                  <p className="text-violet-100 text-xs group-hover:text-white transition-colors">
                    {description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {stats.map(({ icon: Icon, label, value, change, trend, color }) => (
            <div 
              key={label} 
              className="bg-white rounded-lg p-4 shadow-lg border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${color}-100 rounded-lg`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <div>
                  <p className="text-slate-600 text-sm">{label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className={`w-4 h-4 text-${color}-600 ${
                      trend === 'up' ? '' : 'transform rotate-90'
                    }`} />
                    <span className={`text-xs text-${color}-600 font-medium`}>{change}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Patient List/Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-3 gap-6 mb-8">
            {currentItems.map((patient) => renderPatientCard(patient))}
            
            {filteredPatients.length === 0 && (
              <div className="col-span-3">
                <div className="text-center py-12">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-1">
                    No patients found
                  </h3>
                  <p className="text-slate-500">
                    {searchQuery 
                      ? `No results for "${searchQuery}"`
                      : 'There are no patients in the system at the moment'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-50 rounded-lg">
                    <Activity className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Patient Status</h2>
                    <p className="text-sm text-slate-500">
                      {filteredPatients.length} patients total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search patients..."
                      className="pl-9 pr-4 py-2 bg-slate-50 text-slate-900 placeholder-slate-400 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-violet-500 w-64"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 rounded-lg text-slate-600 border-0 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="all">All Patients</option>
                    <option value="waiting">Waiting</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      <ListFilter className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      <LayoutGrid className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Wait Time</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.map((patient) => {
                    const StatusIcon = getStatusIcon(patient.status);
                    return (
                      <tr key={patient.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                              <span className="text-violet-600 font-medium">
                                {patient.fullName.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-slate-900">
                                {patient.fullName}
                              </p>
                              <p className="text-xs text-slate-500">ID: #{patient.id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {format(new Date(patient.registrationDate), 'p')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {patient.currentDepartment || 'Reception'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {patient.status.split('-').join(' ').replace(/^\w/, c => c.toUpperCase())}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(patient.priority)}`}>
                            <Star className="w-3 h-3 mr-1" />
                            {patient.priority.charAt(0).toUpperCase() + patient.priority.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {patient.waitTime ? `${patient.waitTime} min` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setCurrentSection('records')}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredPatients.length === 0 && (
                <div className="py-12">
                  <div className="text-center">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      No patients found
                    </h3>
                    <p className="text-slate-500">
                      {searchQuery 
                        ? `No results for "${searchQuery}"`
                        : 'There are no patients in the system at the moment'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-md ${
                  currentPage === page
                    ? 'bg-violet-600 text-white'
                    : 'border hover:bg-gray-50 text-gray-700'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};