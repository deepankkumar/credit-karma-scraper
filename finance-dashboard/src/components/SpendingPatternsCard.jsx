import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { Clock, Calendar, TrendingUp } from 'lucide-react';

export default function SpendingPatternsCard({ transactions }) {
  const [patternType, setPatternType] = useState('daily'); // 'daily', 'weekly', 'category'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Process spending patterns
  const patternData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { labels: [], datasets: [] };

    const now = new Date();
    const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const filteredTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const amount = parseFloat(t.amount_value || 0);
      const categoryMatch = selectedCategory === 'all' || t.category_name === selectedCategory;
      return date >= last3Months && amount < 0 && categoryMatch; // Only spending
    });

    if (patternType === 'daily') {
      // Daily spending pattern (last 30 days)
      const dailyData = {};
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        if (date >= last30Days) {
          const dayKey = date.toISOString().split('T')[0];
          const amount = Math.abs(parseFloat(t.amount_value || 0));
          dailyData[dayKey] = (dailyData[dayKey] || 0) + amount;
        }
      });

      const sortedDays = Object.keys(dailyData).sort();
      return {
        labels: sortedDays.map(day => new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Daily Spending',
          data: sortedDays.map(day => dailyData[day]),
          borderColor: 'var(--accent-steel-blue)',
          backgroundColor: 'rgba(107, 140, 174, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: 'var(--accent-steel-blue)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }]
      };
    } else if (patternType === 'weekly') {
      // Weekly spending pattern (day of week)
      const weeklyData = {
        'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
        'Thursday': 0, 'Friday': 0, 'Saturday': 0
      };
      const weeklyCount = { ...weeklyData };
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
        const amount = Math.abs(parseFloat(t.amount_value || 0));
        weeklyData[dayName] += amount;
        weeklyCount[dayName] += 1;
      });

      // Calculate average per day of week
      Object.keys(weeklyData).forEach(day => {
        weeklyData[day] = weeklyCount[day] > 0 ? weeklyData[day] / weeklyCount[day] : 0;
      });

      return {
        labels: Object.keys(weeklyData),
        datasets: [{
          label: 'Avg Weekly Spending',
          data: Object.values(weeklyData),
          borderColor: 'var(--accent-sage-green)',
          backgroundColor: 'rgba(123, 160, 91, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: 'var(--accent-sage-green)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }]
      };
    } else {
      // Category trends over time
      const monthlyCategories = {};
      
      filteredTransactions.forEach(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const category = t.category_name || 'Other';
        const amount = Math.abs(parseFloat(t.amount_value || 0));
        
        if (!monthlyCategories[monthKey]) monthlyCategories[monthKey] = {};
        monthlyCategories[monthKey][category] = (monthlyCategories[monthKey][category] || 0) + amount;
      });

      const sortedMonths = Object.keys(monthlyCategories).sort();
      const allCategories = [...new Set(filteredTransactions.map(t => t.category_name || 'Other'))];
      const topCategories = allCategories.slice(0, 5); // Top 5 categories

      const colors = [
        'var(--accent-steel-blue)',
        'var(--accent-sage-green)',
        'var(--accent-soft-purple)',
        'var(--accent-warm-bronze)',
        'var(--accent-cool-slate)'
      ];

      return {
        labels: sortedMonths.map(month => {
          const [year, monthNum] = month.split('-');
          return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        }),
        datasets: topCategories.map((category, index) => ({
          label: category,
          data: sortedMonths.map(month => monthlyCategories[month]?.[category] || 0),
          borderColor: colors[index],
          backgroundColor: colors[index].replace(')', ', 0.1)').replace('var(--accent-', 'rgba('),
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }))
      };
    }
  }, [transactions, patternType, selectedCategory]);

  // Get available categories
  const categories = useMemo(() => {
    if (!transactions) return [];
    const cats = [...new Set(transactions.map(t => t.category_name || 'Other'))];
    return cats.filter(cat => cat && cat.trim() !== '').slice(0, 10);
  }, [transactions]);

  // Calculate insights
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return {};

    const spendingTransactions = transactions.filter(t => parseFloat(t.amount_value || 0) < 0);
    const now = new Date();
    
    // Peak spending day of week
    const weeklySpending = {};
    spendingTransactions.forEach(t => {
      const date = new Date(t.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const amount = Math.abs(parseFloat(t.amount_value || 0));
      weeklySpending[dayName] = (weeklySpending[dayName] || 0) + amount;
    });
    
    const peakDay = Object.entries(weeklySpending).reduce((max, [day, amount]) => 
      amount > max.amount ? { day, amount } : max, { day: 'N/A', amount: 0 }
    );

    // Average transaction size
    const avgTransaction = spendingTransactions.length > 0 
      ? spendingTransactions.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount_value || 0)), 0) / spendingTransactions.length
      : 0;

    return { peakDay, avgTransaction };
  }, [transactions]);

  return (
    <Card variant="elevated" className="chart-hover-zone">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <Clock size={22} style={{ color: 'var(--accent-cool-slate)' }} />
              Spending Patterns
            </CardTitle>
            <CardDescription>When and how you spend money</CardDescription>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div className="glass rounded-lg p-3 border border-[var(--accent-cool-slate)]/20">
                <div className="text-lg font-bold text-[var(--accent-cool-slate)]">
                  {insights.peakDay?.day || 'N/A'}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Peak Spending Day</div>
              </div>
              <div className="glass rounded-lg p-3 border border-[var(--accent-steel-blue)]/20">
                <div className="text-lg font-bold text-[var(--accent-steel-blue)]">
                  ${insights.avgTransaction?.toFixed(0) || 0}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Avg Transaction</div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1 glass rounded-xl p-1 period-selector">
              {[
                { key: 'daily', label: 'Daily', icon: Calendar },
                { key: 'weekly', label: 'Weekly', icon: Clock },
                { key: 'category', label: 'Trends', icon: TrendingUp }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setPatternType(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1 ${
                    patternType === key 
                      ? 'bg-[var(--accent-cool-slate)] text-white shadow-md active' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
            {patternType !== 'weekly' && (
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className="glass rounded px-2 py-1 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="h-80 w-full relative chart-container">
          {patternData.labels.length > 0 ? (
            <div className="w-full h-full px-6">
              <Line 
                data={patternData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                  },
                  interaction: {
                    intersect: false,
                    mode: 'index',
                  },
                  plugins: {
                    legend: { 
                      display: patternType === 'category',
                      position: 'bottom',
                      labels: {
                        color: 'var(--text-secondary)',
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                          size: 11
                        }
                      }
                    },
                    tooltip: {
                      backgroundColor: 'var(--glass-bg)',
                      titleColor: 'var(--text-primary)',
                      bodyColor: 'var(--text-secondary)',
                      borderColor: 'var(--border-primary)',
                      borderWidth: 1,
                      cornerRadius: 12,
                      padding: 12,
                      callbacks: {
                        label: (context) => {
                          return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
                        }
                      }
                    }
                  },
                  scales: {
                    x: { 
                      grid: { 
                        color: 'var(--border-secondary)',
                        drawOnChartArea: false
                      },
                      ticks: { 
                        color: 'var(--text-tertiary)',
                        maxRotation: 0,
                        padding: 10
                      },
                      border: {
                        display: false
                      }
                    },
                    y: { 
                      grid: { 
                        color: 'var(--border-secondary)',
                        lineWidth: 0.5
                      },
                      ticks: { 
                        color: 'var(--text-tertiary)',
                        callback: (value) => `$${(value / 1000).toFixed(0)}k`
                      },
                      border: {
                        display: false
                      }
                    }
                  },
                  elements: {
                    line: {
                      borderJoinStyle: 'round',
                      tension: 0.4
                    },
                    point: {
                      radius: 0,
                      hoverRadius: 6,
                      hoverBorderWidth: 2
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)] px-6">
              No pattern data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
