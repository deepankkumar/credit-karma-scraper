import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, Calendar, AlertCircle, Target, Lightbulb, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { LineChart } from './Charts';

const PredictiveInsightsCard = ({ transactions }) => {
  const [selectedInsight, setSelectedInsight] = useState('spending');

  // Generate predictive insights and forecasts
  const insights = useMemo(() => {
    if (!transactions || transactions.length === 0) return null;

    const now = new Date();
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recentTransactions = transactions.filter(t => new Date(t.date) >= last90Days);

    if (recentTransactions.length === 0) return null;

    // 1. Spending Prediction
    const monthlySpending = {};
    recentTransactions.forEach(t => {
      const amount = parseFloat(t.amount_value || 0);
      if (amount < 0) {
        const monthKey = new Date(t.date).getFullYear() + '-' + String(new Date(t.date).getMonth() + 1).padStart(2, '0');
        monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + Math.abs(amount);
      }
    });

    const spendingValues = Object.values(monthlySpending);
    const avgMonthlySpending = spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length;
    const spendingTrend = calculateTrend(spendingValues);

    // 2. Category Growth Analysis
    const categoryGrowth = {};
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    recentTransactions.forEach(t => {
      const date = new Date(t.date);
      const amount = Math.abs(parseFloat(t.amount_value || 0));
      const category = t.category_name || 'Other';
      
      if (!categoryGrowth[category]) {
        categoryGrowth[category] = { current: 0, previous: 0 };
      }
      
      if (date >= lastMonth) {
        categoryGrowth[category].current += amount;
      } else if (date >= twoMonthsAgo) {
        categoryGrowth[category].previous += amount;
      }
    });

    // Find fastest growing category
    let fastestGrowth = { category: '', growth: 0, amount: 0 };
    Object.entries(categoryGrowth).forEach(([category, data]) => {
      if (data.previous > 0) {
        const growth = ((data.current - data.previous) / data.previous) * 100;
        if (growth > fastestGrowth.growth) {
          fastestGrowth = { category, growth, amount: data.current };
        }
      }
    });

    // 3. Income Prediction
    const monthlyIncome = {};
    recentTransactions.forEach(t => {
      const amount = parseFloat(t.amount_value || 0);
      if (amount > 0) {
        const monthKey = new Date(t.date).getFullYear() + '-' + String(new Date(t.date).getMonth() + 1).padStart(2, '0');
        monthlyIncome[monthKey] = (monthlyIncome[monthKey] || 0) + amount;
      }
    });

    const incomeValues = Object.values(monthlyIncome);
    const avgMonthlyIncome = incomeValues.reduce((sum, val) => sum + val, 0) / incomeValues.length;
    const incomeTrend = calculateTrend(incomeValues);

    // 4. Merchant Patterns
    const merchantFrequency = {};
    recentTransactions.forEach(t => {
      const merchant = t.merchant_name;
      if (merchant && merchant.trim()) {
        merchantFrequency[merchant] = (merchantFrequency[merchant] || 0) + 1;
      }
    });

    const topMerchant = Object.entries(merchantFrequency)
      .sort((a, b) => b[1] - a[1])[0];

    // Generate predictions for next 3 months
    const generateForecast = (values, trend) => {
      const lastValue = values[values.length - 1] || 0;
      const trendMultiplier = 1 + (trend / 100);
      
      return Array.from({ length: 3 }, (_, i) => {
        return lastValue * Math.pow(trendMultiplier, i + 1) * (0.95 + Math.random() * 0.1); // Add some variance
      });
    };

    const spendingForecast = generateForecast(spendingValues, spendingTrend);
    const incomeForecast = generateForecast(incomeValues, incomeTrend);

    // Create chart data
    const chartData = {
      spending: {
        labels: ['3M ago', '2M ago', '1M ago', 'Next M', '2M out', '3M out'],
        datasets: [{
          label: 'Historical Spending',
          data: [...spendingValues.slice(-3), null, null, null],
          borderColor: 'var(--accent-warm-clay)',
          backgroundColor: 'var(--accent-warm-clay)20',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'var(--accent-warm-clay)',
          pointRadius: 5
        }, {
          label: 'Predicted Spending',
          data: [null, null, spendingValues[spendingValues.length - 1], ...spendingForecast],
          borderColor: 'var(--accent-steel-blue)',
          backgroundColor: 'var(--accent-steel-blue)15',
          borderWidth: 3,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'var(--accent-steel-blue)',
          pointRadius: 5
        }]
      },
      income: {
        labels: ['3M ago', '2M ago', '1M ago', 'Next M', '2M out', '3M out'],
        datasets: [{
          label: 'Historical Income',
          data: [...incomeValues.slice(-3), null, null, null],
          borderColor: 'var(--accent-sage-green)',
          backgroundColor: 'var(--accent-sage-green)20',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'var(--accent-sage-green)',
          pointRadius: 5
        }, {
          label: 'Predicted Income',
          data: [null, null, incomeValues[incomeValues.length - 1], ...incomeForecast],
          borderColor: 'var(--accent-soft-purple)',
          backgroundColor: 'var(--accent-soft-purple)15',
          borderWidth: 3,
          borderDash: [5, 5],
          fill: false,
          tension: 0.4,
          pointBackgroundColor: 'var(--accent-soft-purple)',
          pointRadius: 5
        }]
      }
    };

    return {
      predictions: {
        avgMonthlySpending,
        avgMonthlyIncome,
        spendingTrend,
        incomeTrend,
        nextMonthSpending: spendingForecast[0],
        nextMonthIncome: incomeForecast[0],
        fastestGrowthCategory: fastestGrowth,
        topMerchant: topMerchant ? { name: topMerchant[0], frequency: topMerchant[1] } : null
      },
      chartData,
      insights: generateInsights(spendingTrend, incomeTrend, fastestGrowth, avgMonthlySpending, avgMonthlyIncome)
    };
  }, [transactions]);

  // Helper function to calculate trend
  function calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = n * (n - 1) * (2 * n - 1) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;
    
    return avgY > 0 ? (slope / avgY) * 100 : 0;
  }

  // Generate AI-like insights
  function generateInsights(spendingTrend, incomeTrend, fastestGrowth, avgSpending, avgIncome) {
    const insights = [];
    
    if (spendingTrend > 10) {
      insights.push({
        type: 'warning',
        title: 'Rising Spending Alert',
        description: `Your spending is trending upward by ${spendingTrend.toFixed(1)}% monthly. Consider reviewing your budget.`,
        icon: AlertCircle,
        color: 'var(--accent-warm-clay)'
      });
    } else if (spendingTrend < -5) {
      insights.push({
        type: 'positive',
        title: 'Improving Spending Control',
        description: `Great job! Your spending has decreased by ${Math.abs(spendingTrend).toFixed(1)}% monthly.`,
        icon: TrendingUp,
        color: 'var(--accent-sage-green)'
      });
    }
    
    if (incomeTrend > 5) {
      insights.push({
        type: 'positive',
        title: 'Growing Income',
        description: `Your income is growing by ${incomeTrend.toFixed(1)}% monthly. Perfect time to increase savings.`,
        icon: TrendingUp,
        color: 'var(--accent-sage-green)'
      });
    }
    
    if (fastestGrowth.growth > 20) {
      insights.push({
        type: 'info',
        title: 'Category Growth Alert',
        description: `${fastestGrowth.category} spending increased by ${fastestGrowth.growth.toFixed(1)}% this month.`,
        icon: Lightbulb,
        color: 'var(--accent-warm-bronze)'
      });
    }

    const savingsRate = avgIncome > 0 ? ((avgIncome - avgSpending) / avgIncome) * 100 : 0;
    if (savingsRate < 10) {
      insights.push({
        type: 'suggestion',
        title: 'Savings Opportunity',
        description: `Current savings rate: ${savingsRate.toFixed(1)}%. Aim for 20% for better financial health.`,
        icon: Target,
        color: 'var(--accent-steel-blue)'
      });
    }

    return insights;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!insights) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center h-80 text-[var(--text-secondary)]">
          Insufficient data for predictive analysis
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="elevated" className="col-span-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <Brain size={22} style={{ color: 'var(--accent-steel-blue)' }} />
              AI Predictive Insights
            </CardTitle>
            <CardDescription>
              Machine learning-powered financial forecasting and recommendations
            </CardDescription>
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            {[
              { key: 'spending', label: 'Spending', icon: TrendingUp },
              { key: 'income', label: 'Income', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedInsight(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 ${
                  selectedInsight === key 
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
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction Chart */}
          <div className="lg:col-span-2">
            <div className="h-80">
              <LineChart 
                data={insights.chartData[selectedInsight]}
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
                      padding: 12,
                      callbacks: {
                        label: function(context) {
                          return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                      }
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
            </div>
          </div>

          {/* Insights Panel */}
          <div className="space-y-4">
            {/* Key Predictions */}
            <div className="glass rounded-lg p-4">
              <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Target size={16} style={{ color: 'var(--accent-steel-blue)' }} />
                Next Month Forecast
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Predicted {selectedInsight}</span>
                  <span className="font-bold" style={{ 
                    color: selectedInsight === 'spending' ? 'var(--accent-warm-clay)' : 'var(--accent-sage-green)' 
                  }}>
                    {formatCurrency(selectedInsight === 'spending' ? insights.predictions.nextMonthSpending : insights.predictions.nextMonthIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--text-secondary)]">Trend</span>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    (selectedInsight === 'spending' ? insights.predictions.spendingTrend : insights.predictions.incomeTrend) >= 0 
                      ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-warm-clay)]'
                  }`}>
                    {(selectedInsight === 'spending' ? insights.predictions.spendingTrend : insights.predictions.incomeTrend) >= 0 ? '↗' : '↘'}
                    {Math.abs(selectedInsight === 'spending' ? insights.predictions.spendingTrend : insights.predictions.incomeTrend).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="space-y-3">
              <h4 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Lightbulb size={16} style={{ color: 'var(--accent-warm-bronze)' }} />
                Smart Insights
              </h4>
              {insights.insights.map((insight, index) => {
                const InsightIcon = insight.icon;
                return (
                  <div 
                    key={index}
                    className="p-3 rounded-lg border border-[var(--border-secondary)] glass hover:border-[var(--border-primary)] transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-6 h-6 rounded-lg bg-opacity-20 flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: insight.color + '33' }}
                      >
                        <InsightIcon size={12} style={{ color: insight.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)] text-sm mb-1">
                          {insight.title}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                          {insight.description}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-[var(--text-tertiary)] mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Stats */}
            {insights.predictions.topMerchant && (
              <div className="glass rounded-lg p-4">
                <h4 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">
                  Most Frequent Merchant
                </h4>
                <div className="text-[var(--accent-steel-blue)] font-medium">
                  {insights.predictions.topMerchant.name}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {insights.predictions.topMerchant.frequency} transactions
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PredictiveInsightsCard;
