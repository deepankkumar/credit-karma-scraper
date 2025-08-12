import React, { useState, useMemo } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { getCategoryMonthSummary, getTopCategories } from '../utils/dataUtils';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';

const ACCENT_COLORS = [
  'var(--accent-steel-blue)',
  'var(--accent-sage-green)',
  'var(--accent-soft-purple)',
  'var(--accent-warm-bronze)',
  'var(--accent-cool-slate)',
  'var(--accent-olive-green)',
  'var(--accent-warm-clay)',
  'var(--accent-muted-red)'
];

const monthOptions = Array.from({length: 12}, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0,7);
});

function AnimatedNumber({ value }) {
  const [display, setDisplay] = React.useState(value);
  React.useEffect(() => {
    let start = display;
    let end = value;
    let startTime = null;
    const duration = 500;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setDisplay(start + (end - start) * (1 - Math.pow(1 - progress, 4)));
      if (progress < 1) requestAnimationFrame(animate);
    }
    if (Math.abs(display - value) > 1) requestAnimationFrame(animate);
    else setDisplay(value);
    // eslint-disable-next-line
  }, [value]);
  return <span>{display.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>;
}

export default function SpendingByCategoryCard({ transactions }) {
  const [type, setType] = useState('spending');
  const [month, setMonth] = useState(monthOptions[0]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Top categories for the selected month/type
  const topCats = useMemo(() => getTopCategories(transactions, { N: 7, type, startMonth: month, endMonth: month }), [transactions, type, month]);
  const categories = topCats.map(c => c.category);
  const total = topCats.reduce((sum, c) => sum + c.value, 0);

  // Doughnut data for the selected month/type
  const chartData = useMemo(() => {
    const summary = getCategoryMonthSummary(transactions, { startMonth: month, endMonth: month, categories, type });
    return {
      labels: summary.datasets.map(d => d.label),
      datasets: [{
        data: summary.datasets.map(d => d.data[0]),
        backgroundColor: ACCENT_COLORS.slice(0, categories.length),
        borderWidth: 2,
        borderColor: 'var(--bg-primary)',
        hoverOffset: 16
      }]
    };
  }, [transactions, type, month, categories]);

  // Trend for selected category
  const trendData = useMemo(() => {
    if (!selectedCategory) return null;
    const summary = getCategoryMonthSummary(transactions, { categories: [selectedCategory], type });
    return {
      labels: summary.labels,
      datasets: [{
        label: selectedCategory,
        data: summary.datasets[0]?.data || [],
        borderColor: ACCENT_COLORS[categories.indexOf(selectedCategory)%ACCENT_COLORS.length] || 'var(--accent-steel-blue)',
        backgroundColor: 'rgba(107,140,174,0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  }, [transactions, type, selectedCategory, categories]);

  // Animated value for selected category
  const selectedValue = selectedCategory
    ? (topCats.find(c => c.category === selectedCategory)?.value || 0)
    : total;

  return (
    <Card variant="elevated" className="glass border border-[var(--accent-primary)] shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 mb-2 text-lg">
          <span role="img" aria-label="pie">🍩</span> Spending by Category
        </CardTitle>
        <CardDescription>Where your money goes by category</CardDescription>
        <div className="flex gap-2 mt-2 flex-wrap">
          <select value={month} onChange={e => setMonth(e.target.value)} className="glass rounded px-2 py-1">
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="glass rounded px-2 py-1">
            <option value="spending">Spending</option>
            <option value="income">Income</option>
            <option value="net">Net</option>
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80 flex flex-col md:flex-row gap-6 items-center">
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
            <div className="relative w-full flex flex-col items-center">
              <Doughnut 
                data={chartData} 
                options={{
                  plugins: {
                    legend: {
                      display: false
                    },
                    tooltip: {
                      callbacks: {
                        label: ctx => {
                          const val = ctx.parsed;
                          const pct = total > 0 ? (val/total*100).toFixed(1) : 0;
                          return `${ctx.label}: $${val.toLocaleString()} (${pct}%)`;
                        }
                      }
                    }
                  },
                  cutout: '70%',
                  animation: { duration: 900, easing: 'easeInOutQuart' },
                  onHover: (evt, actives) => {
                    if (actives.length > 0) setHoveredIndex(actives[0].index);
                    else setHoveredIndex(null);
                  }
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold text-[var(--accent-primary)] animate-fade-in">
                  $<AnimatedNumber value={selectedValue} />
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {selectedCategory ? selectedCategory : 'Total'}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 border-2 ${selectedCategory === cat ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] scale-105 shadow-lg' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-tertiary)]'}`}
                  style={{
                    color: selectedCategory === cat ? '#fff' : ACCENT_COLORS[i%ACCENT_COLORS.length],
                    borderColor: selectedCategory === cat ? ACCENT_COLORS[i%ACCENT_COLORS.length] : 'transparent',
                    background: selectedCategory === cat ? ACCENT_COLORS[i%ACCENT_COLORS.length] : undefined
                  }}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
            {selectedCategory && trendData ? (
              <div className="w-full bg-[var(--surface-secondary)] rounded-xl p-4 shadow animate-fade-in">
                <Line data={trendData} options={{
                  plugins: { legend: { display: false } },
                  scales: { x: { ticks: { color: 'var(--text-tertiary)' } }, y: { ticks: { color: 'var(--text-tertiary)' } } },
                  animation: { duration: 900, easing: 'easeInOutQuart' }
                }} />
              </div>
            ) : (
              <div className="text-[var(--text-secondary)] text-center mt-8">Select a category to see its trend</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
