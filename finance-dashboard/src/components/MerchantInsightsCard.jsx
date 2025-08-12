import React, { useState, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { Store, TrendingUp, Calendar } from 'lucide-react';

function AnimatedNumber({ value, prefix = '$' }) {
  const [display, setDisplay] = React.useState(value);
  
  React.useEffect(() => {
    let start = display;
    let end = value;
    let startTime = null;
    const duration = 600;
    
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setDisplay(start + (end - start) * easeOutQuart);
      if (progress < 1) requestAnimationFrame(animate);
    }
    
    if (Math.abs(display - value) > 1) {
      requestAnimationFrame(animate);
    } else {
      setDisplay(value);
    }
  }, [value, display]);
  
  return <span>{prefix}{Math.abs(display).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>;
}

export default function MerchantInsightsCard({ transactions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [selectedMerchant, setSelectedMerchant] = useState(null);

  // Process merchant data
  const merchantData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { topMerchants: [], chartData: null };

    const now = new Date();
    const periodMonths = selectedPeriod === '1M' ? 1 : selectedPeriod === '3M' ? 3 : selectedPeriod === '6M' ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 1);

    const merchantStats = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date >= startDate) {
        const merchant = t.merchant_name || 'Unknown Merchant';
        const amount = Math.abs(parseFloat(t.amount_value || 0));
        
        if (amount > 0) {
          if (!merchantStats[merchant]) {
            merchantStats[merchant] = {
              totalSpent: 0,
              transactionCount: 0,
              avgTransaction: 0,
              category: t.category_name || 'Other'
            };
          }
          
          merchantStats[merchant].totalSpent += amount;
          merchantStats[merchant].transactionCount += 1;
          merchantStats[merchant].avgTransaction = merchantStats[merchant].totalSpent / merchantStats[merchant].transactionCount;
        }
      }
    });

    const topMerchants = Object.entries(merchantStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .filter(m => m.name !== 'Unknown Merchant' && m.name.trim() !== '')
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 8);

    const colors = [
      'var(--accent-steel-blue)',
      'var(--accent-sage-green)',
      'var(--accent-soft-purple)',
      'var(--accent-warm-bronze)',
      'var(--accent-cool-slate)',
      'var(--accent-olive-green)',
      'var(--accent-warm-clay)',
      'var(--accent-muted-red)'
    ];

    const chartData = {
      labels: topMerchants.map(m => m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name),
      datasets: [{
        label: 'Total Spent',
        data: topMerchants.map(m => m.totalSpent),
        backgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };

    return { topMerchants, chartData };
  }, [transactions, selectedPeriod]);

  const selectedMerchantData = selectedMerchant 
    ? merchantData.topMerchants.find(m => m.name === selectedMerchant)
    : null;

  return (
    <Card variant="elevated" className="chart-hover-zone">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <Store size={22} style={{ color: 'var(--accent-soft-purple)' }} />
              Merchant Insights
            </CardTitle>
            <CardDescription>Where you spend the most money</CardDescription>
            {selectedMerchantData && (
              <div className="mt-3 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-lg font-bold text-[var(--accent-steel-blue)] transition-all duration-300">
                    <AnimatedNumber value={selectedMerchantData.totalSpent} />
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Total Spent</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--accent-warm-bronze)] transition-all duration-300">
                    <AnimatedNumber value={selectedMerchantData.transactionCount} prefix="" />
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Transactions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[var(--accent-sage-green)] transition-all duration-300">
                    <AnimatedNumber value={selectedMerchantData.avgTransaction} />
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">Avg/Transaction</div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 glass rounded-xl p-1 period-selector">
            {['1M', '3M', '6M', 'YTD'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  selectedPeriod === period 
                    ? 'bg-[var(--accent-soft-purple)] text-white shadow-md active' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 w-full">
          {merchantData.chartData ? (
            <Bar 
              data={merchantData.chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                  duration: 750,
                  easing: 'easeInOutQuart'
                },
                onClick: (event, elements) => {
                  if (elements.length > 0) {
                    const index = elements[0].index;
                    const merchantName = merchantData.topMerchants[index].name;
                    setSelectedMerchant(merchantName === selectedMerchant ? null : merchantName);
                  }
                },
                plugins: {
                  legend: { 
                    display: false 
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
                        const merchant = merchantData.topMerchants[context.dataIndex];
                        return [
                          `Total: $${context.parsed.y.toLocaleString()}`,
                          `Transactions: ${merchant.transactionCount}`,
                          `Category: ${merchant.category}`
                        ];
                      }
                    }
                  }
                },
                scales: {
                  x: { 
                    grid: { 
                      display: false
                    },
                    ticks: { 
                      color: 'var(--text-tertiary)',
                      maxRotation: 45,
                      font: {
                        size: 11
                      }
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
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
              No merchant data available for {selectedPeriod}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {merchantData.topMerchants.slice(0, 5).map((merchant, index) => (
            <button
              key={merchant.name}
              onClick={() => setSelectedMerchant(merchant.name === selectedMerchant ? null : merchant.name)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedMerchant === merchant.name 
                  ? 'bg-[var(--accent-soft-purple)] text-white shadow-md' 
                  : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)]'
              }`}
            >
              {merchant.name.length > 20 ? merchant.name.substring(0, 20) + '...' : merchant.name}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
