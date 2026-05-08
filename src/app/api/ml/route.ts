import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  forecastDemand,
  detectHourlyPatterns,
  predictNoShowRisk,
  optimizeBoarding,
  forecastRevenue,
  detectAnomalies,
  linearRegression,
  ema,
  stdDev,
  calculateMetrics,
} from '@/lib/ml/engine';

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentHour = now.getHours();

    // ── Gather Real Data ────────────────────────────────────────────────

    // 1. Today's queue entries with timestamps
    const todayEntries = await db.queueEntry.findMany({
      where: { queue: { date: today } },
      select: {
        createdAt: true,
        status: true,
        channel: true,
        position: true,
        calledAt: true,
        boardedAt: true,
        ticketNumber: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Historical entries (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const historicalEntries = await db.queueEntry.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, status: true, channel: true, position: true },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Hourly distribution today
    const hourlyCounts: Map<number, number> = new Map();
    for (let h = 6; h <= 22; h++) hourlyCounts.set(h, 0);
    for (const entry of todayEntries) {
      const hour = new Date(entry.createdAt).getHours();
      hourlyCounts.set(hour, (hourlyCounts.get(hour) || 0) + 1);
    }
    const hourlyData = Array.from(hourlyCounts.entries()).map(([hour, count]) => ({ hour, count }));

    // 4. Historical hourly patterns (across all days)
    const historicalHourly: Map<number, number[]> = new Map();
    for (const entry of historicalEntries) {
      const hour = new Date(entry.createdAt).getHours();
      if (!historicalHourly.has(hour)) historicalHourly.set(hour, []);
      historicalHourly.get(hour)!.push(1);
    }
    const historicalHourlyData = Array.from(historicalHourly.entries()).map(([hour, counts]) => ({
      hour,
      count: counts.length > 0 ? Math.round(counts.length * 10 / Math.max(1, 7)) : 0, // avg per day
    }));

    // 5. Wait time data (boarded entries)
    const boardedToday = todayEntries.filter(e => e.status === 'boarded' && e.boardedAt);
    const waitTimes = boardedToday.map(e => {
      return (new Date(e.boardedAt!).getTime() - new Date(e.createdAt).getTime()) / 60000;
    });

    // 6. Boarding session throughput
    const completedSessions = await db.boardingSession.findMany({
      where: {
        status: 'completed',
        completedAt: { not: null },
      },
      select: { passengersLoaded: true, startedAt: true, completedAt: true },
      orderBy: { completedAt: 'desc' },
      take: 20,
    });
    const throughputData = completedSessions.map(s => s.passengersLoaded);

    // 7. Current queue status
    const waitingEntries = todayEntries.filter(e => e.status === 'waiting' || e.status === 'called');
    const calledEntries = todayEntries.filter(e => e.status === 'called');
    const totalInQueue = waitingEntries.length;

    // 8. Driver data
    const availableDrivers = await db.driver.count({
      where: { status: { in: ['available', 'boarding'] } },
    });
    const avgCapacity = await db.driver.aggregate({ _avg: { capacity: true } });
    const avgVehicleCapacity = avgCapacity._avg.capacity || 14;

    // 9. Revenue data (last 14 days)
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const transactions = await db.transaction.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: fourteenDaysAgo },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group revenue by day
    const revenueByDay = new Map<string, number>();
    for (const tx of transactions) {
      const date = new Date(tx.createdAt).toISOString().split('T')[0];
      revenueByDay.set(date, (revenueByDay.get(date) || 0) + tx.amount);
    }
    const dailyRevenue = Array.from(revenueByDay.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 10. Daily volume (last 14 days) for anomaly detection
    const dailyVolume = new Map<string, number>();
    for (const entry of historicalEntries) {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      dailyVolume.set(date, (dailyVolume.get(date) || 0) + 1);
    }
    const volumeData = Array.from(dailyVolume.values());

    // ── Run ML Models ───────────────────────────────────────────────────

    // 1. Demand Forecast
    const combinedHourly = hourlyData.length >= 5 ? hourlyData : historicalHourlyData;
    const demandForecast = forecastDemand(combinedHourly, 6);

    // 2. Hourly Patterns
    const hourlyPatterns = detectHourlyPatterns(
      historicalHourlyData.length >= 5 ? historicalHourlyData : hourlyData
    );

    // 3. No-Show Risk for current waiting passengers
    const noShowPredictions = waitingEntries.slice(0, 10).map(entry => {
      const waitMinutes = Math.round((now.getTime() - new Date(entry.createdAt).getTime()) / 60000);
      const risk = predictNoShowRisk({
        position: entry.position,
        totalInQueue,
        waitMinutes,
        channel: entry.channel,
        hourOfDay: currentHour,
      });
      return {
        ticketNumber: entry.ticketNumber,
        position: entry.position,
        channel: entry.channel,
        waitMinutes,
        ...risk,
      };
    });

    // Overall no-show summary
    const avgNoShowRisk = noShowPredictions.length > 0
      ? noShowPredictions.reduce((s, p) => s + p.probability, 0) / noShowPredictions.length
      : 0;
    const highRiskCount = noShowPredictions.filter(p => p.level === 'high' || p.level === 'critical').length;

    // 4. Throughput Optimization
    const throughputOpt = optimizeBoarding({
      queueLength: totalInQueue,
      availableDrivers,
      avgVehicleCapacity,
      avgWaitTime: waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0,
      historicalThroughput: throughputData,
    });

    // 5. Revenue Forecast
    const revenueForecast = forecastRevenue(dailyRevenue, 7);

    // 6. Anomaly Detection on daily volumes
    const { anomalies: volumeAnomalies, scores: volumeScores } = detectAnomalies(volumeData, 1.5);

    // 7. Wait Time Analysis
    const waitTimeStats = stdDev(waitTimes);
    const waitTimeEma = ema(waitTimes.sort((a, b) => a - b), 0.3);
    const predictedWait = waitTimeEma.length > 0
      ? waitTimeEma[waitTimeEma.length - 1]
      : 0;

    // 8. Model Performance Metrics
    // Backtest: compare last 3 days forecast vs actual
    let modelMetrics = { mae: 0, rmse: 0, mape: 0 };
    if (dailyRevenue.length >= 5) {
      const trainingData = dailyRevenue.slice(0, -3).map(d => d.revenue);
      const actual = dailyRevenue.slice(-3).map(d => d.revenue);
      const { slope, intercept } = linearRegression(trainingData);
      const predicted = actual.map((_, i) =>
        Math.max(0, slope * (trainingData.length + i) + intercept)
      );
      modelMetrics = calculateMetrics(actual, predicted);
    }

    // 9. Channel preference prediction
    const channelCounts = new Map<string, number>();
    for (const entry of historicalEntries) {
      channelCounts.set(entry.channel, (channelCounts.get(entry.channel) || 0) + 1);
    }
    const totalHistorical = historicalEntries.length || 1;
    const channelPreferences = Array.from(channelCounts.entries())
      .map(([channel, count]) => ({
        channel,
        count,
        share: Math.round((count / totalHistorical) * 100) / 100,
        trend: count > 50 ? 'growing' : count > 20 ? 'stable' : 'emerging',
      }))
      .sort((a, b) => b.count - a.count);

    // 10. Boarding efficiency trend
    const sessionDurations = completedSessions.slice(0, 10).map(s => {
      if (!s.completedAt) return 0;
      return Math.round((new Date(s.completedAt).getTime() - new Date(s.startedAt).getTime()) / 60000);
    }).filter(d => d > 0);
    const boardingEfficiency = sessionDurations.length > 0
      ? stdDev(sessionDurations)
      : { mean: 0, std: 0, min: 0, max: 0 };

    // 11. Log ML Activity
    try {
      await db.mLActivity.create({
        data: {
          modelType: 'orchestrator',
          insight: `ML run completed: ${totalInQueue} in queue, ${demandForecast.trend} demand, ${Math.round(avgNoShowRisk * 100)}% no-show risk.`,
          confidence: linearRegression(dailyRevenue.map(d => d.revenue)).r2,
          impact: totalInQueue > 40 ? 'high' : 'medium',
          details: JSON.stringify({
            demand: demandForecast.trend,
            risk: Math.round(avgNoShowRisk * 100),
            efficiency: throughputOpt.efficiencyScore,
            dataPoints: todayEntries.length
          })
        }
      });
    } catch (logError) {
      console.warn('Failed to log ML activity:', logError);
    }

    return NextResponse.json({
      success: true,
      generatedAt: now.toISOString(),
      dataPoints: {
        todayEntries: todayEntries.length,
        historicalEntries: historicalEntries.length,
        daysOfHistory: Math.max(1, Math.round(historicalEntries.length / Math.max(1, todayEntries.length || 1))),
        completedSessions: completedSessions.length,
      },
      models: {
        demandForecast,
        hourlyPatterns,
        noShowPredictions: {
          passengers: noShowPredictions,
          summary: {
            averageRisk: Math.round(avgNoShowRisk * 100),
            highRiskCount,
            totalAnalyzed: noShowPredictions.length,
          },
        },
        throughputOptimization: throughputOpt,
        revenueForecast,
        anomalyDetection: {
          volumeAnomalies: volumeAnomalies.map(a => ({
            day: a.index,
            volume: a.value,
            zScore: a.zScore,
            severity: Math.abs(a.zScore) > 2 ? 'high' : 'medium',
          })),
          dailyScores: volumeScores,
        },
        waitTimeAnalysis: {
          current: {
            avg: Math.round(waitTimeStats.mean),
            min: Math.round(waitTimeStats.min),
            max: Math.round(waitTimeStats.max),
            std: Math.round(waitTimeStats.std),
            count: waitTimes.length,
          },
          predicted: Math.round(predictedWait),
          trend: waitTimeStats.mean > 0
            ? (predictedWait < waitTimeStats.mean ? 'improving' : predictedWait > waitTimeStats.mean * 1.1 ? 'worsening' : 'stable')
            : 'stable',
        },
        modelPerformance: {
          backtest: modelMetrics,
          r2: linearRegression(dailyRevenue.map(d => d.revenue)).r2,
          dataQuality: dailyRevenue.length >= 7 ? 'good' : dailyRevenue.length >= 3 ? 'fair' : 'limited',
        },
        channelPreferences,
        boardingEfficiency: {
          avgDuration: Math.round(boardingEfficiency.mean),
          std: Math.round(boardingEfficiency.std),
          min: Math.round(boardingEfficiency.min),
          max: Math.round(boardingEfficiency.max),
          sessions: sessionDurations.length,
        },
      },
    });
  } catch (error) {
    console.error('ML predictions failed:', error);
    return NextResponse.json(
      { success: false, error: 'ML prediction failed' },
      { status: 500 }
    );
  }
}
