import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

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

export default function CashFlowAnalysisCard({ transactions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [hoveredValue, setHoveredValue] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  // Process cash flow data by month
  const cashFlowData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { labels: [], datasets: [], summary: {} };

    const now = new Date();
    const periodMonths = selectedPeriod === '1M' ? 1 : selectedPeriod === '3M' ? 3 : selectedPeriod === '6M' ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 1);

    const monthlyData = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date >= startDate) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = parseFloat(t.amount_value || 0);
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, spending: 0, net: 0 };
        }
        
        if (amount > 0) {
          monthlyData[monthKey].income += amount;
        } else {
          monthlyData[monthKey].spending += Math.abs(amount);
        }
        monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].spending;
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const spendingData = sortedMonths.map(month => monthlyData[month].spending);
    const netData = sortedMonths.map(month => monthlyData[month].net);

    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }),
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'var(--accent-sage-green)',
          backgroundColor: 'rgba(123, 160, 91, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: 'var(--accent-sage-green)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        },
        {
          label: 'Spending',
          data: spendingData,
          borderColor: 'var(--accent-warm-clay)',
          backgroundColor: 'rgba(166, 138, 123, 0.1)',
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: 'var(--accent-warm-clay)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }
      ],
      summary: {
        totalIncome: incomeData.reduce((sum, val) => sum + val, 0),
        totalSpending: spendingData.reduce((sum, val) => sum + val, 0),
        avgNet: netData.reduce((sum, val) => sum + val, 0) / netData.length || 0,
        rawData: sortedMonths.map(month => ({
          month,
          ...monthlyData[month]
        }))
      }
    };
  }, [transactions, selectedPeriod]);

  const displayIncome = isHovering && hoveredValue ? hoveredValue.income : cashFlowData.summary.totalIncome;
  const displaySpending = isHovering && hoveredValue ? hoveredValue.spending : cashFlowData.summary.totalSpending;
  const displayNet = displayIncome - displaySpending;

  return (
    <Card variant="elevated" className="chart-hover-zone">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <DollarSign size={22} style={{ color: 'var(--accent-steel-blue)' }} />
              Cash Flow Analysis
            </CardTitle>
            <CardDescription>Income vs spending trends over time</CardDescription>
            <div className="mt-3 grid grid-cols-3 gap-4">
              <div>
                <div className="text-lg font-bold text-[var(--accent-sage-green)] transition-all duration-300">
                  <AnimatedNumber value={displayIncome} />
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Income</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[var(--accent-warm-clay)] transition-all duration-300">
                  <AnimatedNumber value={displaySpending} />
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Spending</div>
              </div>
              <div>
                <div className={`text-lg font-bold transition-all duration-300 ${
                  displayNet >= 0 ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-warm-clay)]'
                }`}>
                  <span className="text-base">
                    {displayNet >= 0 ? '↗' : '↘'}
                  </span>
                  <AnimatedNumber value={displayNet} />
                </div>
                <div className="text-sm text-[var(--text-secondary)]">Net Flow</div>
              </div>
            </div>
            {hoveredDate && (
              <div className="text-sm text-[var(--text-secondary)] animate-fade-in mt-2">
                {hoveredDate}
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
                    ? 'bg-[var(--accent-steel-blue)] text-white shadow-md active' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 px-0">
        <div className="h-80 w-full relative chart-container">
          {cashFlowData.labels.length > 0 ? (
            <div 
              className="w-full h-full px-6"
              onMouseLeave={() => {
                setIsHovering(false);
                setHoveredValue(null);
                setHoveredDate(null);
              }}
            >
              <Line 
                data={cashFlowData} 
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
                  onHover: (event, activeElements) => {
                    if (activeElements.length > 0) {
                      const dataIndex = activeElements[0].index;
                      const rawData = cashFlowData.summary.rawData;
                      if (rawData && rawData[dataIndex]) {
                        setIsHovering(true);
                        setHoveredValue(rawData[dataIndex]);
                        setHoveredDate(cashFlowData.labels[dataIndex]);
                      }
                    } else {
                      setIsHovering(false);
                      setHoveredValue(null);
                      setHoveredDate(null);
                    }
                  },
                  plugins: {
                    legend: { 
                      display: false 
                    },
                    tooltip: {
                      enabled: false
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
                      display: false
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
              No cash flow data available for {selectedPeriod}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
