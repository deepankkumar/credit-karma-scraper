import React, { useState, useMemo, useEffect } from 'react';
import { Activity, Clock, Zap, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { LineChart, BarChart } from './Charts';

const TransactionVelocityCard = ({ transactions }) => {
  const [selectedView, setSelectedView] = useState('daily');
  const [animatedStats, setAnimatedStats] = useState({ avgPerDay: 0, peakDay: 0, velocity: 0 });

  // Process transaction velocity data
  const velocityData = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter to last 30 days
    const recentTransactions = transactions.filter(t => new Date(t.date) >= last30Days);
    
    if (recentTransactions.length === 0) return null;

    // Group by day/week based on view
    const groupedData = {};
    const dayOfWeekData = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    recentTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const amount = Math.abs(parseFloat(transaction.amount_value || 0));
      
      if (selectedView === 'daily') {
        const dayKey = date.toISOString().split('T')[0];
        if (!groupedData[dayKey]) {
          groupedData[dayKey] = { count: 0, volume: 0, date };
        }
        groupedData[dayKey].count++;
        groupedData[dayKey].volume += amount;
      } else {
        // Weekly pattern
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        dayOfWeekData[dayName]++;
      }
    });

    let chartData, stats;

    if (selectedView === 'daily') {
      // Daily transaction velocity
      const sortedDays = Object.values(groupedData).sort((a, b) => a.date - b.date);
      const labels = sortedDays.map(d => d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      const avgTransactionsPerDay = sortedDays.reduce((sum, day) => sum + day.count, 0) / sortedDays.length;
      const peakDay = Math.max(...sortedDays.map(d => d.count));
      const avgVolumePerDay = sortedDays.reduce((sum, day) => sum + day.volume, 0) / sortedDays.length;

      stats = {
        avgPerDay: avgTransactionsPerDay,
        peakDay,
        velocity: avgVolumePerDay,
        period: '30 days'
      };

      chartData = {
        labels,
        datasets: [
          {
            label: 'Transaction Count',
            data: sortedDays.map(d => d.count),
            borderColor: 'var(--accent-steel-blue)',
            backgroundColor: 'var(--accent-steel-blue)20',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'var(--accent-steel-blue)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: 'y'
          },
          {
            label: 'Transaction Volume ($)',
            data: sortedDays.map(d => d.volume),
            borderColor: 'var(--accent-sage-green)',
            backgroundColor: 'var(--accent-sage-green)15',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: 'var(--accent-sage-green)',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: 'y1'
          }
        ]
      };
    } else {
      // Weekly pattern
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const avgByDay = weekdays.reduce((sum, day) => sum + dayOfWeekData[day], 0) / 7;
      const peakDayCount = Math.max(...Object.values(dayOfWeekData));
      const peakDayName = Object.entries(dayOfWeekData).find(([_, count]) => count === peakDayCount)?.[0];

      stats = {
        avgPerDay: avgByDay,
        peakDay: peakDayCount,
        velocity: peakDayName,
        period: 'weekly pattern'
      };

      chartData = {
        labels: weekdays,
        datasets: [{
          label: 'Transactions',
          data: weekdays.map(day => dayOfWeekData[day]),
          backgroundColor: weekdays.map((_, i) => {
            const colors = [
              'var(--accent-steel-blue)',
              'var(--accent-sage-green)',
              'var(--accent-soft-purple)', 
              'var(--accent-warm-bronze)',
              'var(--accent-cool-slate)',
              'var(--accent-olive-green)',
              'var(--accent-warm-clay)'
            ];
            return colors[i % colors.length];
          }),
          borderRadius: 8,
          borderSkipped: false,
        }]
      };
    }

    return { chartData, stats };
  }, [transactions, selectedView]);

  // Animate stats when they change
  useEffect(() => {
    if (!velocityData) return;

    const targetStats = velocityData.stats;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);

      setAnimatedStats({
        avgPerDay: animatedStats.avgPerDay + (targetStats.avgPerDay - animatedStats.avgPerDay) * easeOut,
        peakDay: animatedStats.peakDay + (targetStats.peakDay - animatedStats.peakDay) * easeOut,
        velocity: typeof targetStats.velocity === 'number' ? 
          animatedStats.velocity + (targetStats.velocity - animatedStats.velocity) * easeOut :
          targetStats.velocity
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [velocityData]);

  if (!velocityData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-80 text-[var(--text-secondary)]">
          No recent transaction data available
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num) => typeof num === 'number' ? num.toFixed(1) : num;
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card variant="elevated">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <Activity size={22} style={{ color: 'var(--accent-steel-blue)' }} />
              Transaction Velocity
            </CardTitle>
            <CardDescription>
              Activity patterns over {velocityData.stats.period}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {[
              { key: 'daily', label: 'Daily', icon: Calendar },
              { key: 'weekly', label: 'Weekly', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedView(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  selectedView === key 
                    ? 'bg-[var(--accent-steel-blue)] text-white shadow-md' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Velocity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-steel-blue)] bg-opacity-20 flex items-center justify-center">
                <TrendingUp size={16} style={{ color: 'var(--accent-steel-blue)' }} />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {selectedView === 'daily' ? 'Avg per Day' : 'Avg per Day'}
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--accent-steel-blue)]">
              {formatNumber(animatedStats.avgPerDay)}
              <span className="text-sm font-normal text-[var(--text-secondary)] ml-1">
                {selectedView === 'daily' ? 'txns' : 'txns'}
              </span>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-sage-green)] bg-opacity-20 flex items-center justify-center">
                <Zap size={16} style={{ color: 'var(--accent-sage-green)' }} />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {selectedView === 'daily' ? 'Peak Day' : 'Busiest Day'}
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--accent-sage-green)]">
              {selectedView === 'daily' ? formatNumber(animatedStats.peakDay) : animatedStats.velocity}
              {selectedView === 'daily' && (
                <span className="text-sm font-normal text-[var(--text-secondary)] ml-1">txns</span>
              )}
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft-purple)] bg-opacity-20 flex items-center justify-center">
                <ArrowRight size={16} style={{ color: 'var(--accent-soft-purple)' }} />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                {selectedView === 'daily' ? 'Daily Volume' : 'Total Volume'}
              </span>
            </div>
            <div className="text-2xl font-bold text-[var(--accent-soft-purple)]">
              {selectedView === 'daily' ? formatCurrency(animatedStats.velocity) : formatCurrency(velocityData.stats.velocity)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-80">
          {selectedView === 'daily' ? (
            <LineChart 
              data={velocityData.chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 750,
                  easing: 'easeInOutQuart'
                },
                interaction: {
                  intersect: false,
                  mode: 'index'
                },
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: {
                      usePointStyle: true,
                      pointStyle: 'circle',
                      padding: 20,
                      color: 'var(--text-secondary)',
                      font: { size: 12, weight: '500' }
                    }
                  },
                  tooltip: {
                    backgroundColor: 'var(--surface-primary)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border-primary)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                  }
                },
                scales: {
                  x: {
                    grid: { color: 'var(--border-secondary)', drawOnChartArea: false },
                    ticks: { color: 'var(--text-tertiary)', font: { size: 11 } },
                    border: { display: false }
                  },
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'var(--border-secondary)' },
                    ticks: { color: 'var(--text-tertiary)', font: { size: 11 } },
                    border: { display: false }
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    ticks: { 
                      color: 'var(--text-tertiary)', 
                      font: { size: 11 },
                      callback: function(value) {
                        return formatCurrency(value);
                      }
                    },
                    border: { display: false }
                  }
                }
              }}
            />
          ) : (
            <BarChart 
              data={velocityData.chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 750,
                  easing: 'easeInOutQuart'
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: 'var(--surface-primary)',
                    titleColor: 'var(--text-primary)',
                    bodyColor: 'var(--text-secondary)',
                    borderColor: 'var(--border-primary)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12
                  }
                },
                scales: {
                  x: {
                    grid: { color: 'var(--border-secondary)', drawOnChartArea: false },
                    ticks: { color: 'var(--text-tertiary)', font: { size: 11 } },
                    border: { display: false }
                  },
                  y: {
                    grid: { color: 'var(--border-secondary)' },
                    ticks: { color: 'var(--text-tertiary)', font: { size: 11 } },
                    border: { display: false }
                  }
                }
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionVelocityCard;
