import React, { useState } from 'react';
import { usePatientStore } from '../lib/store';
import { Activity, Users, Clock, CheckCircle2, AlertTriangle, Search, Filter, FileText, ArrowRight, FileBarChart, X, Plus, ArrowLeft, Building2, RefreshCw, ChevronRight, ChevronLeft, Stethoscope, CalendarDays, User, ClipboardList, TestTube, Pill, LayoutDashboard, Layers, Hourglass, Clipboard, Radio, Loader2, Gauge, BarChart3, LineChart, PieChart, Bell, ShieldAlert, Server, Cpu, Zap, Calendar, UserCog, Heart, ThermometerSun, Laptop, Wifi, CheckCheck, ArrowUpRight, ArrowDownRight, AlertCircle as CircleAlert, CheckCircle as CircleCheck, Siren, Ambulance, Bed, Milestone, Settings } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { departments, departmentNames } from '../types/departments';

export const OverviewDashboard = () => {
  const { 
    patientQueue, 
    departmentStats, 
    setCurrentSection,
    notifications,
    labTests
  } = usePatientStore();

  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedMetric, setSelectedMetric] = useState<'patients' | 'consultations' | 'tests'>('patients');
  const [showDepartmentDetails, setShowDepartmentDetails] = useState(false);

  // Calculate system metrics
  const systemMetrics = {
    totalPatients: patientQueue.length,
    activePatients: patientQueue.filter(p => p.status !== 'discharged').length,
    consultationsToday: patientQueue.filter(p => 
      p.status === 'in-consultation' || 
      p.status === 'consultation-complete'
    ).length,
    waitingForTriage: patientQueue.filter(p => p.status === 'registered').length,
    inTriage: patientQueue.filter(p => p.status === 'in-triage').length,
    waitingForConsultation: patientQueue.filter(p => p.status === 'triage-complete').length,
    inConsultation: patientQueue.filter(p => p.status === 'in-consultation').length,
    pendingLabTests: Object.values(labTests).flat().filter(t => t.status === 'pending').length,
    pendingRadiology: Object.values(labTests).flat().filter(t => 
      t.department === 'radiology' && t.status === 'pending'
    ).length,
    dischargedToday: patientQueue.filter(p => p.status === 'discharged').length,
    urgentCases: patientQueue.filter(p => p.priority === 'urgent').length,
    criticalCases: patientQueue.filter(p => p.priority === 'critical').length,
    systemUptime: '99.9%',
    lastBackup: '2 hours ago',
    activeUsers: 24,
    pendingAlerts: notifications.filter(n => !n.read).length
  };

  // Department activity data
  const departmentActivity = [
    { 
      id: departments.TRIAGE, 
      name: departmentNames[departments.TRIAGE],
      active: systemMetrics.inTriage,
      waiting: systemMetrics.waitingForTriage,
      completed: 45,
      trend: 'up',
      change: '+12%',
      status: 'operational'
    },
    { 
      id: departments.GENERAL, 
      name: departmentNames[departments.GENERAL],
      active: systemMetrics.inConsultation,
      waiting: systemMetrics.waitingForConsultation,
      completed: 32,
      trend: 'up',
      change: '+8%',
      status: 'operational'
    },
    { 
      id: departments.LABORATORY, 
      name: departmentNames[departments.LABORATORY],
      active: 8,
      waiting: systemMetrics.pendingLabTests,
      completed: 56,
      trend: 'down',
      change: '-3%',
      status: 'operational'
    },
    { 
      id: departments.RADIOLOGY, 
      name: departmentNames[departments.RADIOLOGY],
      active: 5,
      waiting: systemMetrics.pendingRadiology,
      completed: 28,
      trend: 'up',
      change: '+5%',
      status: 'operational'
    },
    { 
      id: departments.PHARMACY, 
      name: departmentNames[departments.PHARMACY],
      active: 3,
      waiting: 0,
      completed: 72,
      trend: 'up',
      change: '+7%',
      status: 'operational'
    }
  ];

  // Critical alerts
  const criticalAlerts = [
    {
      id: 1,
      type: 'urgent',
      message: 'Critical patient in Triage',
      department: departments.TRIAGE,
      time: '5 minutes ago',
      action: () => setCurrentSection('triage')
    },
    {
      id: 2,
      type: 'lab',
      message: 'Abnormal lab results for patient #12345',
      department: departments.LABORATORY,
      time: '15 minutes ago',
      action: () => setCurrentSection('laboratory')
    },
    {
      id: 3,
      type: 'system',
      message: 'System maintenance scheduled',
      department: 'system',
      time: '30 minutes ago',
      action: () => setCurrentSection('admin')
    }
  ];

  // Recent activity log
  const recentActivity = [
    {
      id: 1,
      action: 'Patient Registration',
      subject: 'John Doe',
      actor: 'Jane Smith',
      department: departments.RECEPTION,
      time: '10 minutes ago'
    },
    {
      id: 2,
      action: 'Lab Results Uploaded',
      subject: 'Sarah Johnson',
      actor: 'Lab Technician',
      department: departments.LABORATORY,
      time: '25 minutes ago'
    },
    {
      id: 3,
      action: 'Prescription Issued',
      subject: 'Robert Williams',
      actor: 'Pharmacist',
      department: departments.PHARMACY,
      time: '40 minutes ago'
    }
  ];

  // Mock data for charts
  const patientFlowData = {
    today: [12, 18, 15, 22, 30, 35, 28, 20, 15, 10, 8, 5],
    week: [120, 145, 135, 160, 175, 165, 140],
    month: [450, 520, 480, 510, 540, 560, 530, 570, 590, 610, 580, 600, 620, 640, 610, 590, 620, 650, 670, 690, 710, 680, 650, 670, 690, 710, 730, 750, 720, 700]
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <Siren className="w-4 h-4 text-red-600" />;
      case 'lab':
        return <TestTube className="w-4 h-4 text-purple-600" />;
      case 'system':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  const getDepartmentIcon = (departmentId: string) => {
    switch (departmentId) {
      case departments.TRIAGE:
        return <Activity className="w-4 h-4" />;
      case departments.GENERAL:
        return <Stethoscope className="w-4 h-4" />;
      case departments.LABORATORY:
        return <TestTube className="w-4 h-4" />;
      case departments.RADIOLOGY:
        return <Radio className="w-4 h-4" />;
      case departments.PHARMACY:
        return <Pill className="w-4 h-4" />;
      case departments.RECEPTION:
        return <Users className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-emerald-600';
      case 'busy':
        return 'text-amber-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-emerald-500';
      case 'busy':
        return 'bg-amber-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Hospital management system performance and metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {['today', 'week', 'month'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as typeof timeRange)}
                className={`px-3 py-1.5 rounded-md text-xs ${
                  timeRange === range
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => {}}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { 
            title: 'Patient Management',
            description: 'View and manage patients',
            icon: Users,
            color: 'blue',
            action: () => setCurrentSection('patient-management')
          },
          { 
            title: 'Appointments',
            description: 'Schedule and manage appointments',
            icon: Calendar,
            color: 'indigo',
            action: () => setCurrentSection('appointments')
          },
          { 
            title: 'Medical Records',
            description: 'Access patient records',
            icon: FileText,
            color: 'purple',
            action: () => setCurrentSection('records')
          },
          { 
            title: 'System Settings',
            description: 'Configure system parameters',
            icon: Settings,
            color: 'gray',
            action: () => setCurrentSection('admin')
          }
        ].map(({ title, description, icon: Icon, color, action }) => (
          <button
            key={title}
            onClick={action}
            className={`bg-${color}-50 rounded-lg border border-${color}-100 p-4 text-left hover:bg-${color}-100 transition-colors`}
          >
            <div className={`p-2 bg-${color}-100 rounded-lg w-fit mb-3`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </button>
        ))}
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { 
            label: 'Total Patients', 
            value: systemMetrics.totalPatients,
            icon: Users,
            color: 'blue',
            change: '+12%',
            trend: 'up'
          },
          { 
            label: 'Active Patients', 
            value: systemMetrics.activePatients,
            icon: Activity,
            color: 'indigo',
            change: '+8%',
            trend: 'up'
          },
          { 
            label: 'Consultations', 
            value: systemMetrics.consultationsToday,
            icon: Stethoscope,
            color: 'purple',
            change: '+5%',
            trend: 'up'
          },
          { 
            label: 'Pending Tests', 
            value: systemMetrics.pendingLabTests + systemMetrics.pendingRadiology,
            icon: TestTube,
            color: 'amber',
            change: '-3%',
            trend: 'down'
          },
          { 
            label: 'Urgent Cases', 
            value: systemMetrics.urgentCases + systemMetrics.criticalCases,
            icon: AlertTriangle,
            color: 'red',
            change: '+2%',
            trend: 'up'
          }
        ].map(({ label, value, icon: Icon, color, change, trend }) => (
          <div key={label} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 bg-${color}-50 rounded-lg`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div className="flex items-center gap-1">
                {trend === 'up' ? (
                  <ArrowUpRight className={`w-3 h-3 ${trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`} />
                ) : (
                  <ArrowDownRight className={`w-3 h-3 ${trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`} />
                )}
                <span className={`text-xs ${trend === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>{change}</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* System Activity and Health */}
      <div className="grid grid-cols-3 gap-5">
        {/* System Activity Chart */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">System Activity</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                {['patients', 'consultations', 'tests'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric as typeof selectedMetric)}
                    className={`px-2 py-1 rounded-md text-xs ${
                      selectedMetric === metric
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="h-56 w-full">
            <div className="flex items-end h-full w-full gap-1">
              {patientFlowData[timeRange].map((value, index) => (
                <div 
                  key={index} 
                  className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm w-full"
                  style={{ 
                    height: `${(value / Math.max(...patientFlowData[timeRange])) * 100}%`,
                    opacity: 0.7 + (index / patientFlowData[timeRange].length) * 0.3
                  }}
                >
                  <div className="h-full w-full hover:bg-blue-600 transition-colors rounded-t-sm"></div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {timeRange === 'today' && (
                <>
                  <span>8 AM</span>
                  <span>10 AM</span>
                  <span>12 PM</span>
                  <span>2 PM</span>
                  <span>4 PM</span>
                  <span>6 PM</span>
                  <span>8 PM</span>
                </>
              )}
              {timeRange === 'week' && (
                <>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </>
              )}
              {timeRange === 'month' && (
                <>
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <Server className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">System Health</h2>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">System Uptime</span>
                <span className="text-xs font-medium text-emerald-600">{systemMetrics.systemUptime}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '99.9%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Server Load</span>
                <span className="text-xs font-medium text-emerald-600">28%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '28%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Database</span>
                <span className="text-xs font-medium text-emerald-600">Healthy</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Network</span>
                <span className="text-xs font-medium text-emerald-600">Optimal</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>

            <div className="pt-3 border-t mt-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-600">Last Backup</span>
                </div>
                <span className="font-medium">{systemMetrics.lastBackup}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <div className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-gray-600">Active Users</span>
                </div>
                <span className="font-medium">{systemMetrics.activeUsers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity & Resource Utilization */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Gauge className="w-4 h-4 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Capacity & Resource Utilization</h2>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Bed Occupancy', value: '78%', icon: Bed, color: 'blue' },
            { label: 'Doctor Availability', value: '65%', icon: Stethoscope, color: 'indigo' },
            { label: 'Lab Capacity', value: '42%', icon: TestTube, color: 'purple' },
            { label: 'Pharmacy Efficiency', value: '85%', icon: Pill, color: 'emerald' }
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                  <span className="text-xs font-medium text-gray-700">{label}</span>
                </div>
                <span className="text-xs font-medium text-gray-900">{value}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full bg-${color}-500 rounded-full`} style={{ width: value }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Status */}
      <div className="bg-white rounded-lg shadow-sm border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 rounded-lg">
              <Building2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Department Status</h2>
          </div>
          <button 
            onClick={() => setShowDepartmentDetails(!showDepartmentDetails)}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            {showDepartmentDetails ? 'Show Summary' : 'Show Details'}
          </button>
        </div>

        {showDepartmentDetails ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiting</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {departmentActivity.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 rounded-lg">
                          {getDepartmentIcon(dept.id)}
                        </div>
                        <span className="text-xs font-medium text-gray-900">{dept.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(dept.status)}`}></div>
                        <span className={`text-xs ${getStatusColor(dept.status)}`}>
                          {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {dept.active}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {dept.waiting}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {dept.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-amber-600" />
                        )}
                        <span className={`text-xs ${
                          dept.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
                        }`}>
                          {dept.change}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={() => setCurrentSection(dept.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-xs"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {departmentActivity.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setCurrentSection(dept.id)}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white rounded-lg">
                      {getDepartmentIcon(dept.id)}
                    </div>
                    <span className="text-xs font-medium text-gray-900">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot(dept.status)}`}></div>
                    <span className={`text-xs ${getStatusColor(dept.status)}`}>
                      {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-1">
                    {dept.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-amber-600" />
                    )}
                    <span className={`text-xs ${
                      dept.trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {dept.change}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Critical Alerts and Recent Activity */}
      <div className="grid grid-cols-2 gap-5">
        {/* Critical Alerts */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Critical Alerts</h2>
            </div>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {criticalAlerts.length} alerts
            </span>
          </div>

          <div className="space-y-3">
            {criticalAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white rounded-lg">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{alert.time}</span>
                      <span className="text-xs text-gray-500">{alert.department === 'system' ? 'System' : departmentNames[alert.department]}</span>
                    </div>
                  </div>
                  <button
                    onClick={alert.action}
                    className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors text-xs"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}

            {criticalAlerts.length === 0 && (
              <div className="p-4 text-center">
                <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <CheckCheck className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-xs font-medium text-gray-900 mb-1">No Critical Alerts</h3>
                <p className="text-xs text-gray-500">All systems are operating normally</p>
              </div>
            )}

            {criticalAlerts.length > 3 && (
              <button className="w-full text-center text-xs text-indigo-600 hover:text-indigo-800 py-2">
                View all {criticalAlerts.length} alerts
              </button>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-white rounded-lg">
                    {getDepartmentIcon(activity.department)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">{activity.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">Patient: {activity.subject}</span>
                      <span className="text-xs text-gray-500">By: {activity.actor}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};