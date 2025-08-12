import React, { useState, useMemo } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { getCategoryMonthSummary } from '../utils/dataUtils';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';

const monthOptions = Array.from({length: 12}, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0,7);
}).reverse();

export default function MonthlySpendingPatternCard({ transactions }) {
  const [type, setType] = useState('spending');
  const [startMonth, setStartMonth] = useState(monthOptions[0]);
  const [endMonth, setEndMonth] = useState(monthOptions[monthOptions.length-1]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // All categories in the data
  const allCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category_name || 'Other'));
    return Array.from(cats);
  }, [transactions]);

  // Chart data for selected range/type/categories
  const chartData = useMemo(() => {
    const cats = selectedCategories.length > 0 ? selectedCategories : allCategories;
    const summary = getCategoryMonthSummary(transactions, { startMonth, endMonth, categories: cats, type });
    return {
      labels: summary.labels,
      datasets: summary.datasets.map((d, i) => ({
        ...d,
        backgroundColor: `var(--accent-steel-blue)`,
        borderColor: `var(--accent-steel-blue)`
      }))
    };
  }, [transactions, type, startMonth, endMonth, selectedCategories, allCategories]);

  // Detect spikes/drops
  const patternAnnotations = useMemo(() => {
    // For each category, find months with >30% change
    const annots = [];
    chartData.datasets.forEach(ds => {
      ds.data.forEach((val, i) => {
        if (i === 0) return;
        const prev = ds.data[i-1];
        if (prev === 0) return;
        const change = (val - prev) / prev;
        if (Math.abs(change) > 0.3) {
          annots.push({
            month: chartData.labels[i],
            category: ds.label,
            change: (change*100).toFixed(1)
          });
        }
      });
    });
    return annots;
  }, [chartData]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 mb-2">
          Monthly Spending Pattern
        </CardTitle>
        <CardDescription>How your spending changes over time</CardDescription>
        <div className="flex gap-2 mt-2 flex-wrap">
          <select value={startMonth} onChange={e => setStartMonth(e.target.value)} className="glass rounded px-2 py-1">
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <span className="text-[var(--text-secondary)]">to</span>
          <select value={endMonth} onChange={e => setEndMonth(e.target.value)} className="glass rounded px-2 py-1">
            {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} className="glass rounded px-2 py-1">
            <option value="spending">Spending</option>
            <option value="income">Income</option>
            <option value="net">Net</option>
          </select>
          <select multiple value={selectedCategories} onChange={e => setSelectedCategories(Array.from(e.target.selectedOptions, o => o.value))} className="glass rounded px-2 py-1 min-w-[120px]">
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-80">
          <Bar data={chartData} options={{
            responsive: true,
            plugins: {
              legend: { position: 'bottom', labels: { color: 'var(--text-primary)' } },
              tooltip: {
                callbacks: {
                  label: ctx => `${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`
                }
              }
            },
            animation: { duration: 700, easing: 'easeInOutQuart' },
            scales: {
              x: { stacked: true, ticks: { color: 'var(--text-tertiary)' } },
              y: { stacked: true, ticks: { color: 'var(--text-tertiary)' } }
            }
          }} />
          <div className="mt-4 text-xs text-[var(--text-secondary)]">
            {patternAnnotations.length > 0 ? (
              <ul>
                {patternAnnotations.map((a, i) => (
                  <li key={i}>
                    <span className="font-semibold text-[var(--accent-steel-blue)]">{a.category}</span> had a {a.change > 0 ? 'spike' : 'drop'} of {Math.abs(a.change)}% in {a.month}
                  </li>
                ))}
              </ul>
            ) : (
              <span>No major pattern changes detected.</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
