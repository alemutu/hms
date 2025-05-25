// Billing Anomaly Detection
import { Invoice, BillingItem, ServiceCharge } from '../../types';

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number; // 0-1 scale, higher means more likely to be an anomaly
  reason: string;
  suggestedAction?: string;
}

export const billingAI = {
  // Detect anomalies in billing
  detectAnomalies: (
    invoice: Invoice,
    historicalInvoices: Invoice[],
    serviceCharges: ServiceCharge[]
  ): {
    hasAnomalies: boolean;
    anomalies: Array<AnomalyDetectionResult & { itemId: string }>;
    overallRiskScore: number;
  } => {
    const anomalies: Array<AnomalyDetectionResult & { itemId: string }> = [];
    
    // Calculate average prices for each service type
    const averagePrices: Record<string, { total: number; count: number; avg: number }> = {};
    
    // Build average prices from service charges
    serviceCharges.forEach(service => {
      if (!averagePrices[service.name]) {
        averagePrices[service.name] = { total: 0, count: 0, avg: 0 };
      }
      
      averagePrices[service.name].total += service.amount;
      averagePrices[service.name].count += 1;
      averagePrices[service.name].avg = averagePrices[service.name].total / averagePrices[service.name].count;
    });
    
    // Update averages with historical invoice data
    historicalInvoices.forEach(inv => {
      inv.items.forEach(item => {
        if (!averagePrices[item.serviceName]) {
          averagePrices[item.serviceName] = { total: 0, count: 0, avg: 0 };
        }
        
        averagePrices[item.serviceName].total += item.unitPrice;
        averagePrices[item.serviceName].count += 1;
        averagePrices[item.serviceName].avg = averagePrices[item.serviceName].total / averagePrices[item.serviceName].count;
      });
    });
    
    // Check each item in the current invoice for anomalies
    invoice.items.forEach(item => {
      const result: AnomalyDetectionResult = {
        isAnomaly: false,
        score: 0,
        reason: 'No anomaly detected'
      };
      
      // Check if we have average price data for this service
      if (averagePrices[item.serviceName]) {
        const avgPrice = averagePrices[item.serviceName].avg;
        const priceRatio = item.unitPrice / avgPrice;
        
        // Check for price anomalies
        if (priceRatio >= 1.5) {
          result.isAnomaly = true;
          result.score = Math.min((priceRatio - 1) / 2, 1); // Normalize to 0-1
          result.reason = `Price (${item.unitPrice}) is ${Math.round((priceRatio - 1) * 100)}% higher than average (${avgPrice.toFixed(2)})`;
          result.suggestedAction = 'Verify pricing with service department';
        }
      }
      
      // Check for quantity anomalies
      if (item.quantity > 3) {
        const quantityScore = Math.min((item.quantity - 3) / 7, 1); // Normalize to 0-1
        
        // If this is already an anomaly, update the score and reason
        if (result.isAnomaly) {
          const combinedScore = Math.max(result.score, quantityScore);
          result.score = combinedScore;
          result.reason += ` and quantity (${item.quantity}) is unusually high`;
        } else if (quantityScore > 0.3) { // Only flag if quantity is significantly high
          result.isAnomaly = true;
          result.score = quantityScore;
          result.reason = `Quantity (${item.quantity}) is unusually high for this service`;
          result.suggestedAction = 'Verify quantity with ordering physician';
        }
      }
      
      // Add to anomalies list if flagged
      if (result.isAnomaly) {
        anomalies.push({
          ...result,
          itemId: item.id
        });
      }
    });
    
    // Calculate overall risk score (average of individual anomaly scores)
    const overallRiskScore = anomalies.length > 0
      ? anomalies.reduce((sum, anomaly) => sum + anomaly.score, 0) / anomalies.length
      : 0;
    
    return {
      hasAnomalies: anomalies.length > 0,
      anomalies,
      overallRiskScore
    };
  }
};