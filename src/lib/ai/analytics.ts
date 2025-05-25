// Smart Reports and Analytics
import { Patient, Consultation, LabTest, Invoice, Payment } from '../../types';

// Simple linear regression for trend prediction
const linearRegression = (data: number[]): { slope: number; intercept: number } => {
  const n = data.length;
  
  if (n <= 1) {
    return { slope: 0, intercept: data[0] || 0 };
  }
  
  // X values are just the indices (0, 1, 2, ...)
  const xValues = Array.from({ length: n }, (_, i) => i);
  
  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = data.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (data[i] - yMean);
    denominator += Math.pow(xValues[i] - xMean, 2);
  }
  
  const slope = denominator !== 0 ? numerator / denominator : 0;
  
  // Calculate intercept
  const intercept = yMean - slope * xMean;
  
  return { slope, intercept };
};

// Predict next value using linear regression
const predictNextValue = (data: number[]): number => {
  const { slope, intercept } = linearRegression(data);
  return slope * data.length + intercept;
};

// Format percentage change
const formatChange = (current: number, previous: number): string => {
  if (previous === 0) return current > 0 ? '+∞%' : '0%';
  
  const percentChange = ((current - previous) / previous) * 100;
  const sign = percentChange >= 0 ? '+' : '';
  return `${sign}${percentChange.toFixed(1)}%`;
};

// Group data by time period
const groupDataByPeriod = <T extends { timestamp: string | Date }>(
  data: T[],
  period: 'day' | 'week' | 'month'
): Record<string, T[]> => {
  const result: Record<string, T[]> = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key: string;
    
    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week':
        // Get the Monday of the week
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date);
        monday.setDate(diff);
        key = monday.toISOString().split('T')[0]; // YYYY-MM-DD of Monday
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    if (!result[key]) {
      result[key] = [];
    }
    
    result[key].push(item);
  });
  
  return result;
};

export const analyticsEngine = {
  // Generate performance report
  generateReport: (
    patients: Patient[],
    consultations: Consultation[],
    labTests: LabTest[],
    invoices: Invoice[],
    payments: Payment[],
    period: 'day' | 'week' | 'month' = 'month'
  ): {
    summary: string;
    metrics: Record<string, any>;
    trends: Record<string, any>;
    departmentPerformance: Record<string, any>;
    predictions: Record<string, any>;
  } => {
    // Group data by period
    const groupedConsultations = groupDataByPeriod(
      consultations.map(c => ({ ...c, timestamp: c.startTime })),
      period
    );
    
    const groupedLabTests = groupDataByPeriod(
      labTests.map(t => ({ ...t, timestamp: t.requestedAt })),
      period
    );
    
    const groupedInvoices = groupDataByPeriod(
      invoices.map(i => ({ ...i, timestamp: i.createdAt })),
      period
    );
    
    const groupedPayments = groupDataByPeriod(payments, period);
    
    // Get periods in chronological order
    const periods = Object.keys(groupedConsultations)
      .concat(Object.keys(groupedLabTests))
      .concat(Object.keys(groupedInvoices))
      .concat(Object.keys(groupedPayments))
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort();
    
    // Calculate metrics for each period
    const metricsByPeriod: Record<string, {
      patientCount: number;
      consultationCount: number;
      labTestCount: number;
      revenue: number;
      averageConsultationTime: number;
    }> = {};
    
    periods.forEach(p => {
      const periodConsultations = groupedConsultations[p] || [];
      const periodLabTests = groupedLabTests[p] || [];
      const periodInvoices = groupedInvoices[p] || [];
      const periodPayments = groupedPayments[p] || [];
      
      // Calculate metrics
      const patientCount = new Set(periodConsultations.map(c => c.patientId)).size;
      
      const consultationCount = periodConsultations.length;
      
      const labTestCount = periodLabTests.length;
      
      const revenue = periodPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Calculate average consultation time
      const consultationTimes = periodConsultations
        .filter(c => c.endTime) // Only include completed consultations
        .map(c => {
          const start = new Date(c.startTime).getTime();
          const end = new Date(c.endTime!).getTime();
          return (end - start) / (1000 * 60); // Convert to minutes
        });
      
      const averageConsultationTime = consultationTimes.length > 0
        ? consultationTimes.reduce((sum, time) => sum + time, 0) / consultationTimes.length
        : 0;
      
      metricsByPeriod[p] = {
        patientCount,
        consultationCount,
        labTestCount,
        revenue,
        averageConsultationTime
      };
    });
    
    // Calculate trends
    const trends: Record<string, { 
      current: number; 
      previous: number; 
      change: string;
      trend: 'up' | 'down' | 'stable';
    }> = {};
    
    if (periods.length >= 2) {
      const currentPeriod = periods[periods.length - 1];
      const previousPeriod = periods[periods.length - 2];
      
      const current = metricsByPeriod[currentPeriod];
      const previous = metricsByPeriod[previousPeriod];
      
      // Patient count trend
      trends.patientCount = {
        current: current.patientCount,
        previous: previous.patientCount,
        change: formatChange(current.patientCount, previous.patientCount),
        trend: current.patientCount > previous.patientCount ? 'up' : 
               current.patientCount < previous.patientCount ? 'down' : 'stable'
      };
      
      // Consultation count trend
      trends.consultationCount = {
        current: current.consultationCount,
        previous: previous.consultationCount,
        change: formatChange(current.consultationCount, previous.consultationCount),
        trend: current.consultationCount > previous.consultationCount ? 'up' : 
               current.consultationCount < previous.consultationCount ? 'down' : 'stable'
      };
      
      // Lab test count trend
      trends.labTestCount = {
        current: current.labTestCount,
        previous: previous.labTestCount,
        change: formatChange(current.labTestCount, previous.labTestCount),
        trend: current.labTestCount > previous.labTestCount ? 'up' : 
               current.labTestCount < previous.labTestCount ? 'down' : 'stable'
      };
      
      // Revenue trend
      trends.revenue = {
        current: current.revenue,
        previous: previous.revenue,
        change: formatChange(current.revenue, previous.revenue),
        trend: current.revenue > previous.revenue ? 'up' : 
               current.revenue < previous.revenue ? 'down' : 'stable'
      };
    }
    
    // Calculate department performance
    const departmentPerformance: Record<string, {
      consultationCount: number;
      averageConsultationTime: number;
      revenue: number;
    }> = {};
    
    // Group consultations by department
    consultations.forEach(consultation => {
      const dept = consultation.department;
      
      if (!departmentPerformance[dept]) {
        departmentPerformance[dept] = {
          consultationCount: 0,
          averageConsultationTime: 0,
          revenue: 0
        };
      }
      
      departmentPerformance[dept].consultationCount++;
      
      // Calculate consultation time if available
      if (consultation.endTime) {
        const start = new Date(consultation.startTime).getTime();
        const end = new Date(consultation.endTime).getTime();
        const durationMinutes = (end - start) / (1000 * 60);
        
        // Update average
        const current = departmentPerformance[dept];
        current.averageConsultationTime = 
          (current.averageConsultationTime * (current.consultationCount - 1) + durationMinutes) / 
          current.consultationCount;
      }
    });
    
    // Add revenue data from invoices
    invoices.forEach(invoice => {
      invoice.items.forEach(item => {
        const dept = item.department;
        
        if (departmentPerformance[dept]) {
          departmentPerformance[dept].revenue += item.totalAmount;
        }
      });
    });
    
    // Make predictions for next period
    const predictions: Record<string, number> = {};
    
    if (periods.length >= 3) {
      // Get data for the last 3 periods
      const patientCounts = periods.slice(-3).map(p => metricsByPeriod[p].patientCount);
      const consultationCounts = periods.slice(-3).map(p => metricsByPeriod[p].consultationCount);
      const labTestCounts = periods.slice(-3).map(p => metricsByPeriod[p].labTestCount);
      const revenues = periods.slice(-3).map(p => metricsByPeriod[p].revenue);
      
      // Predict next values
      predictions.patientCount = predictNextValue(patientCounts);
      predictions.consultationCount = predictNextValue(consultationCounts);
      predictions.labTestCount = predictNextValue(labTestCounts);
      predictions.revenue = predictNextValue(revenues);
    }
    
    // Generate summary text
    let summary = `Hospital Performance Report (${period === 'day' ? 'Daily' : period === 'week' ? 'Weekly' : 'Monthly'})\n\n`;
    
    // Add trend information to summary
    if (Object.keys(trends).length > 0) {
      summary += 'Performance Trends:\n';
      
      if (trends.patientCount) {
        summary += `- Patient volume: ${trends.patientCount.change} (${trends.patientCount.current} vs ${trends.patientCount.previous})\n`;
      }
      
      if (trends.consultationCount) {
        summary += `- Consultations: ${trends.consultationCount.change} (${trends.consultationCount.current} vs ${trends.consultationCount.previous})\n`;
      }
      
      if (trends.revenue) {
        summary += `- Revenue: ${trends.revenue.change} (${trends.revenue.current.toLocaleString()} vs ${trends.revenue.previous.toLocaleString()})\n`;
      }
      
      summary += '\n';
    }
    
    // Add department performance to summary
    summary += 'Department Performance:\n';
    Object.entries(departmentPerformance)
      .sort((a, b) => b[1].consultationCount - a[1].consultationCount)
      .slice(0, 3) // Top 3 departments
      .forEach(([dept, metrics]) => {
        summary += `- ${dept}: ${metrics.consultationCount} consultations, avg ${metrics.averageConsultationTime.toFixed(1)} minutes, revenue ${metrics.revenue.toLocaleString()}\n`;
      });
    
    summary += '\n';
    
    // Add predictions to summary if available
    if (Object.keys(predictions).length > 0) {
      summary += 'Predictions for Next Period:\n';
      summary += `- Estimated patient volume: ${Math.round(predictions.patientCount)}\n`;
      summary += `- Estimated consultations: ${Math.round(predictions.consultationCount)}\n`;
      summary += `- Estimated revenue: ${Math.round(predictions.revenue).toLocaleString()}\n`;
    }
    
    return {
      summary,
      metrics: metricsByPeriod,
      trends,
      departmentPerformance,
      predictions
    };
  },
  
  // Predict trends for next period
  predictTrends: (
    historicalData: number[],
    periods: number = 1
  ): number[] => {
    if (historicalData.length < 2) {
      return Array(periods).fill(historicalData[0] || 0);
    }
    
    const { slope, intercept } = linearRegression(historicalData);
    
    // Generate predictions
    return Array.from(
      { length: periods },
      (_, i) => slope * (historicalData.length + i) + intercept
    );
  }
};