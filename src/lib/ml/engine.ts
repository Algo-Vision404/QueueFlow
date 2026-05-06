// ============================================
// QueueFlow ML Engine
// Pure TypeScript statistical models for transport queue prediction
// ============================================

// ── Linear Regression ────────────────────────────────────────────────────
// Fits y = mx + b to data points, returns slope, intercept, R²
export function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
    sumY2 += data[i] * data[i];
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-10) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² goodness of fit
  const yMean = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssRes += (data[i] - predicted) ** 2;
    ssTot += (data[i] - yMean) ** 2;
  }
  const r2 = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;

  return { slope, intercept, r2 };
}

// Predict next n values using linear regression
export function predictLinear(data: number[], steps: number): number[] {
  const { slope, intercept } = linearRegression(data);
  const predictions: number[] = [];
  for (let i = 0; i < steps; i++) {
    const val = slope * (data.length + i) + intercept;
    predictions.push(Math.max(0, Math.round(val * 10) / 10));
  }
  return predictions;
}

// ── Exponential Moving Average ──────────────────────────────────────────
export function ema(data: number[], alpha: number = 0.3): number[] {
  if (data.length === 0) return [];
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// ── Moving Average ──────────────────────────────────────────────────────
export function movingAverage(data: number[], window: number = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

// ── Standard Deviation ──────────────────────────────────────────────────
export function stdDev(data: number[]): { mean: number; std: number; min: number; max: number } {
  if (data.length === 0) return { mean: 0, std: 0, min: 0, max: 0 };
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + (val - mean) ** 2, 0) / data.length;
  const std = Math.sqrt(variance);
  return { mean, std, min: Math.min(...data), max: Math.max(...data) };
}

// ── Anomaly Detection (Z-Score) ────────────────────────────────────────
export function detectAnomalies(data: number[], threshold: number = 2): {
  anomalies: Array<{ index: number; value: number; zScore: number }>;
  scores: number[];
} {
  const { mean, std } = stdDev(data);
  const anomalies: Array<{ index: number; value: number; zScore: number }> = [];
  const scores: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const zScore = std > 0 ? (data[i] - mean) / std : 0;
    scores.push(Math.round(zScore * 100) / 100);
    if (Math.abs(zScore) > threshold) {
      anomalies.push({ index: i, value: data[i], zScore: Math.round(zScore * 100) / 100 });
    }
  }

  return { anomalies, scores };
}

// ── Seasonal Pattern Detection ──────────────────────────────────────────
// Detect hourly patterns from timestamped entry data
export interface HourlyPattern {
  hour: number;
  avgVolume: number;
  label: string;
  category: 'low' | 'moderate' | 'high' | 'peak';
}

export function detectHourlyPatterns(
  hourlyCounts: Array<{ hour: number; count: number }>
): {
  patterns: HourlyPattern[];
  peakHour: number;
  offPeakHours: number[];
  avgVolume: number;
} {
  if (hourlyCounts.length === 0) {
    return { patterns: [], peakHour: 0, offPeakHours: [], avgVolume: 0 };
  }

  const avg = hourlyCounts.reduce((s, h) => s + h.count, 0) / hourlyCounts.length;
  const patterns: HourlyPattern[] = hourlyCounts.map(h => {
    const ratio = h.count / (avg || 1);
    let category: HourlyPattern['category'] = 'low';
    if (ratio >= 1.5) category = 'peak';
    else if (ratio >= 1.1) category = 'high';
    else if (ratio >= 0.7) category = 'moderate';

    return {
      hour: h.hour,
      avgVolume: Math.round(h.count * 10) / 10,
      label: `${h.hour.toString().padStart(2, '0')}:00`,
      category,
    };
  });

  const peakHour = patterns.reduce((best, p) => p.avgVolume > best.avgVolume ? p : best, patterns[0]);
  const offPeakHours = patterns.filter(p => p.category === 'low').map(p => p.hour);

  return { patterns, peakHour: peakHour.hour, offPeakHours, avgVolume: Math.round(avg * 10) / 10 };
}

// ── No-Show Risk Model ──────────────────────────────────────────────────
// Predict probability of no-show based on features:
// - position in queue (higher = more likely to leave)
// - wait time already elapsed (longer = more likely to leave)
// - channel (USSD users more likely to no-show than agent-assisted)
// - time of day (off-peak = more likely to leave)
interface NoShowFeatures {
  position: number;
  totalInQueue: number;
  waitMinutes: number;
  channel: string;
  hourOfDay: number;
}

export function predictNoShowRisk(features: NoShowFeatures): {
  probability: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
} {
  let riskScore = 0;
  const factors: string[] = [];

  // Position factor: higher position = higher risk
  const positionRatio = features.totalInQueue > 0 ? features.position / features.totalInQueue : 0;
  if (positionRatio > 0.7) {
    riskScore += 0.25;
    factors.push('Far back in queue (top 30%)');
  } else if (positionRatio > 0.4) {
    riskScore += 0.1;
  }

  // Wait time factor: longer wait = higher risk
  if (features.waitMinutes > 45) {
    riskScore += 0.3;
    factors.push('Wait exceeded 45 minutes');
  } else if (features.waitMinutes > 30) {
    riskScore += 0.2;
    factors.push('Wait exceeded 30 minutes');
  } else if (features.waitMinutes > 15) {
    riskScore += 0.1;
  }

  // Channel factor: USSD/SMS = higher no-show risk
  if (features.channel === 'ussd') {
    riskScore += 0.1;
    factors.push('USSD channel (higher abandonment)');
  } else if (features.channel === 'sms') {
    riskScore += 0.05;
  } else if (features.channel === 'agent') {
    riskScore -= 0.1; // Agent-assisted = lower risk
  }

  // Time of day factor: off-peak = higher risk
  const isOffPeak = features.hourOfDay >= 10 && features.hourOfDay <= 14; // midday lull
  if (isOffPeak) {
    riskScore += 0.1;
    factors.push('Off-peak hours (higher abandonment)');
  }

  // Late evening risk
  if (features.hourOfDay >= 19) {
    riskScore += 0.15;
    factors.push('Late evening (reduced patience)');
  }

  // Clamp probability
  const probability = Math.min(0.95, Math.max(0.02, riskScore));

  let level: 'low' | 'medium' | 'high' | 'critical';
  if (probability >= 0.6) level = 'critical';
  else if (probability >= 0.4) level = 'high';
  else if (probability >= 0.2) level = 'medium';
  else level = 'low';

  return { probability: Math.round(probability * 100) / 100, level, factors };
}

// ── Demand Forecasting ──────────────────────────────────────────────────
// Forecast next N hours of demand
export function forecastDemand(
  hourlyData: Array<{ hour: number; count: number }>,
  forecastHours: number = 6
): {
  forecast: Array<{ hour: number; predicted: number; lower: number; upper: number; confidence: string }>;
  trend: 'rising' | 'falling' | 'stable';
  trendStrength: number;
} {
  if (hourlyData.length < 3) {
    // Return flat forecast if insufficient data
    const currentHour = new Date().getHours();
    const avg = hourlyData.length > 0 ? hourlyData.reduce((s, h) => s + h.count, 0) / hourlyData.length : 10;
    return {
      forecast: Array.from({ length: forecastHours }, (_, i) => ({
        hour: (currentHour + 1 + i) % 24,
        predicted: Math.round(avg),
        lower: Math.round(avg * 0.7),
        upper: Math.round(avg * 1.3),
        confidence: 'low',
      })),
      trend: 'stable',
      trendStrength: 0,
    };
  }

  const counts = hourlyData.map(h => h.count);
  const { slope } = linearRegression(counts);

  // Determine trend
  let trend: 'rising' | 'falling' | 'stable';
  const trendStrength = Math.abs(slope);
  if (slope > 1) trend = 'rising';
  else if (slope < -1) trend = 'falling';
  else trend = 'stable';

  // Generate forecast using EMA + seasonal adjustment
  const smoothed = ema(counts, 0.4);
  const lastSmoothed = smoothed[smoothed.length - 1] || counts[counts.length - 1];
  const { std } = stdDev(counts);

  // Create hourly pattern profile from data (for seasonal adjustment)
  const hourPattern = new Map<number, number>();
  const hourCounts = new Map<number, number[]>();
  for (const h of hourlyData) {
    if (!hourCounts.has(h.hour)) hourCounts.set(h.hour, []);
    hourCounts.get(h.hour)!.push(h.count);
  }
  for (const [hour, vals] of hourCounts) {
    hourPattern.set(hour, vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  const currentHour = new Date().getHours();
  const forecast: Array<{ hour: number; predicted: number; lower: number; upper: number; confidence: string }> = [];

  for (let i = 0; i < forecastHours; i++) {
    const targetHour = (currentHour + 1 + i) % 24;
    const basePrediction = lastSmoothed + slope * (i + 1);

    // Apply seasonal adjustment if we have pattern data for this hour
    const seasonalFactor = hourPattern.has(targetHour) ? hourPattern.get(targetHour)! / lastSmoothed : 1;
    const adjustedPrediction = basePrediction * seasonalFactor;

    const confidenceInterval = std * 1.5;
    const predicted = Math.max(0, Math.round(adjustedPrediction));
    const lower = Math.max(0, Math.round(adjustedPrediction - confidenceInterval));
    const upper = Math.round(adjustedPrediction + confidenceInterval);

    // Confidence decreases for further predictions
    const confidence = i < 2 ? 'high' : i < 4 ? 'medium' : 'low';

    forecast.push({ hour: targetHour, predicted, lower, upper, confidence });
  }

  return { forecast, trend, trendStrength: Math.round(trendStrength * 100) / 100 };
}

// ── Throughput Optimization ─────────────────────────────────────────────
export function optimizeBoarding(params: {
  queueLength: number;
  availableDrivers: number;
  avgVehicleCapacity: number;
  avgWaitTime: number;
  historicalThroughput: number[];
}): {
  optimalGroupSize: number;
  recommendedActions: string[];
  estimatedClearTime: number; // minutes
  efficiencyScore: number; // 0-100
} {
  const { queueLength, availableDrivers, avgVehicleCapacity, avgWaitTime, historicalThroughput } = params;

  // Calculate base group size as average vehicle capacity
  const baseGroupSize = avgVehicleCapacity;

  // Adjust based on queue pressure
  let optimalGroupSize = baseGroupSize;
  if (queueLength > 50) {
    optimalGroupSize = Math.ceil(baseGroupSize * 1.2); // Load more per trip when busy
  } else if (queueLength < 10) {
    optimalGroupSize = Math.max(queueLength, Math.ceil(baseGroupSize * 0.6));
  }

  // Adjust based on driver availability
  if (availableDrivers <= 1 && queueLength > 20) {
    optimalGroupSize = Math.ceil(optimalGroupSize * 1.1); // Maximize per trip
  }

  const actions: string[] = [];
  if (queueLength > 30 && availableDrivers < 2) {
    actions.push('Request additional drivers - queue backing up');
  }
  if (avgWaitTime > 30) {
    actions.push('Consider increasing boarding group size to reduce wait');
  }
  if (queueLength > 0 && availableDrivers === 0) {
    actions.push('Critical: No drivers available - passengers accumulating');
  }

  // Check if historical throughput is declining
  if (historicalThroughput.length >= 3) {
    const recent = historicalThroughput.slice(-3);
    const { slope } = linearRegression(recent);
    if (slope < -2) {
      actions.push('Throughput declining - check for bottlenecks');
    }
  }

  // Calculate efficiency
  const theoreticalMax = avgVehicleCapacity * availableDrivers;
  const actualThroughput = historicalThroughput.length > 0
    ? historicalThroughput[historicalThroughput.length - 1]
    : 0;
  const efficiencyScore = theoreticalMax > 0
    ? Math.min(100, Math.round((actualThroughput / theoreticalMax) * 100))
    : queueLength === 0 ? 100 : 0;

  // Estimated clear time
  const avgBoardingTime = 15; // minutes per boarding session
  const sessionsNeeded = Math.ceil(queueLength / optimalGroupSize);
  const estimatedClearTime = availableDrivers > 0
    ? Math.ceil(sessionsNeeded * avgBoardingTime / availableDrivers)
    : Infinity;

  return {
    optimalGroupSize,
    recommendedActions: actions,
    estimatedClearTime: estimatedClearTime === Infinity ? -1 : estimatedClearTime,
    efficiencyScore,
  };
}

// ── Revenue Forecasting ─────────────────────────────────────────────────
export function forecastRevenue(
  dailyRevenue: Array<{ date: string; revenue: number }>,
  forecastDays: number = 7
): {
  forecast: Array<{ date: string; predicted: number; lower: number; upper: number }>;
  weeklyTotal: number;
  growthRate: number; // daily growth %
} {
  const revenues = dailyRevenue.map(d => d.revenue);

  const { slope, intercept, r2 } = linearRegression(revenues);
  const { std } = stdDev(revenues);

  // Calculate daily growth rate
  const lastRevenue = revenues.length > 0 ? revenues[revenues.length - 1] : 0;
  const prevRevenue = revenues.length > 1 ? revenues[revenues.length - 2] : lastRevenue;
  const growthRate = prevRevenue > 0 ? ((lastRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const forecast: Array<{ date: string; predicted: number; lower: number; upper: number }> = [];
  let totalWeek = 0;
  const today = new Date();

  for (let i = 1; i <= forecastDays; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const predicted = Math.max(0, slope * (revenues.length + i - 1) + intercept);
    const lower = Math.max(0, predicted - std);
    const upper = predicted + std;

    totalWeek += predicted;
    forecast.push({
      date: dateStr,
      predicted: Math.round(predicted * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      upper: Math.round(upper * 100) / 100,
    });
  }

  return { forecast, weeklyTotal: Math.round(totalWeek * 100) / 100, growthRate: Math.round(growthRate * 100) / 100 };
}

// ── Model Accuracy Metrics ──────────────────────────────────────────────
export function calculateMetrics(actual: number[], predicted: number[]): {
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  mape: number; // Mean Absolute Percentage Error
} {
  if (actual.length !== predicted.length || actual.length === 0) {
    return { mae: 0, rmse: 0, mape: 0 };
  }

  let maeSum = 0, rmseSum = 0, mapeSum = 0;
  for (let i = 0; i < actual.length; i++) {
    const error = actual[i] - predicted[i];
    maeSum += Math.abs(error);
    rmseSum += error * error;
    if (actual[i] !== 0) {
      mapeSum += Math.abs(error / actual[i]);
    }
  }

  const n = actual.length;
  return {
    mae: Math.round((maeSum / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(rmseSum / n) * 100) / 100,
    mape: Math.round((mapeSum / n) * 100),
  };
}
