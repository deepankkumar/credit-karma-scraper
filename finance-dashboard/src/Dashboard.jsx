import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  PiggyBank, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Target,
  Calendar,
  Moon,
  Sun,
  BarChart3,
  PieChart as PieChartIcon, // Renamed to avoid conflict
  Activity,
  Building,
  Banknote,
  Coins,
  // AlertTriangle
} from 'lucide-react';
import StatsCard from './components/StatsCard';
import TokenModal from './components/TokenModal';
import ModernLoader from './components/ModernLoader';
import { RotateCcw } from 'lucide-react';
// Correctly import PieChart from the charts component
import { LineChart, BarChart, PieChart } from './components/Charts';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './components/ui/Card';
import TransactionSearch, { getAccountImageUrl, getCategoryIcon } from './components/TransactionSearch';
import FinancialAIAssistant from './components/FinancialAIAssistant';
import {
  loadTransactions,
  loadCardBalances,
  loadCashBalances,
  loadInvestmentBalances,
  loadInvestmentHistory,
  formatCurrency,
  calculateNetWorth,
  getCardColors,
  groupTransactionsByCategory,
  getMonthlySpending,
  getAccountTypeBreakdown,
  processInvestmentHistory
} from './utils/dataUtils';

  
const Dashboard = () => {
  // All state hooks must be declared before any function definitions or effects
  const [refreshing, setRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [data, setData] = useState({
    cards: [],
    cash: [],
    investments: [],
    investmentHistory: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [theme, setTheme] = useState('dark');
  const [hoveredValue, setHoveredValue] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [barOverlay, setBarOverlay] = useState({ open: false, month: null, type: null, transactions: [], total: 0 });
  const [barMode, setBarMode] = useState('spending'); // 'spending' | 'income' | 'both'
  const [pieMode, setPieMode] = useState('spending'); // 'spending' | 'income'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedPieMonth, setSelectedPieMonth] = useState(null);
  const [pieOverlay, setPieOverlay] = useState({ open: false, category: null, transactions: [], total: 0 });

  // Handle token submit, then refresh
  const handleTokenSubmit = async (token) => {
    setRefreshing(true);
    setRefreshSuccess(false);
    setRefreshError(null);
    // Keep modal open until both succeed
    try {
      // 1. Set token
      const setRes = await fetch('http://localhost:8000/api/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!setRes.ok) {
        const errMsg = (await setRes.json()).detail || 'Failed to set token';
        setRefreshError(errMsg);
        return;
      }
      // 2. Refresh data
      const res = await fetch('http://localhost:8000/api/refresh', { method: 'POST' });
      if (!res.ok) {
        const errMsg = (await res.json()).detail || 'Failed to refresh data';
        setRefreshError(errMsg);
        return;
      }
      await reloadAllData();
      setRefreshSuccess(true);
      setTokenModalOpen(false);
    } catch (err) {
      setRefreshError(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  // Helper to reload all dashboard data
  const reloadAllData = async () => {
    try {
      const [cards, cash, investments, investmentHistory, transactions] = await Promise.all([
        loadCardBalances(),
        loadCashBalances(),
        loadInvestmentBalances(),
        loadInvestmentHistory(),
        loadTransactions()
      ]);
      setData({ cards, cash, investments, investmentHistory, transactions });
    } catch (error) {
      setData({ cards: [], cash: [], investments: [], investmentHistory: [], transactions: [] });
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshSuccess(false);
    setRefreshError(null);
    try {
      const res = await fetch('http://localhost:8000/api/refresh', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to refresh data');
      await reloadAllData();
      setRefreshSuccess(true);
    } catch (err) {
      setRefreshError(err.message);
    } finally {
      setRefreshing(false);
    }
  };
  // Handler for bar chart bar click
  const handleBarClick = (event, elements) => {
    if (!elements || elements.length === 0) return;
    const idx = elements[0].index;
    const datasetIdx = elements[0].datasetIndex;
    const monthKey = monthlyBarData[idx]?.month;
    if (!monthKey) return;
    // Determine type: spending or income
    let type = null;
    if (barChartData.datasets[datasetIdx]?.label === 'Spending') type = 'spending';
    if (barChartData.datasets[datasetIdx]?.label === 'Income') type = 'income';
    if (!type) return;
    // Get all transactions for this month and type
    const txns = data.transactions.filter(t => {
      const date = new Date(t.date);
      const tMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amt = parseFloat(t.amount_value || 0);
      if (tMonth !== monthKey) return false;
      if (type === 'spending') return amt < 0 && isValidSpendingCategory(t.category_name || 'Other');
      if (type === 'income') return amt > 0;
      return false;
    });
    const total = txns.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount_value || 0)), 0);
    setBarOverlay({ open: true, month: monthKey, type, transactions: txns, total });
  };

  const closeBarOverlay = () => setBarOverlay({ open: false, month: null, type: null, transactions: [], total: 0 });

  // --- New Chart Section State ---
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        console.log('Starting to load data...');
        const [cards, cash, investments, investmentHistory, transactions] = await Promise.all([
          loadCardBalances(),
          loadCashBalances(),
          loadInvestmentBalances(),
          loadInvestmentHistory(),
          loadTransactions()
        ]);

        console.log('Data loaded:', { cards, cash, investments, investmentHistory, transactions });

        setData({
          cards,
          cash,
          investments,
          investmentHistory,
          transactions
        });
      } catch (error) {
        console.error('Error loading data:', error);
        setData({
          cards: [],
          cash: [],
          investments: [],
          investmentHistory: [],
          transactions: []
        });
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    loadAllData();
    return () => clearTimeout(timeout);
  }, []);

  // Process investment history chart data early
  const investmentChartData = processInvestmentHistory(data.investmentHistory, selectedPeriod, theme);

  // Calculate dynamic percentage based on current display state
  const currentPercentage = useMemo(() => {
    if (!investmentChartData.rawData || investmentChartData.rawData.length === 0) return 0;
    
    const startValue = investmentChartData.startValue;
    const currentValue = isHovering && hoveredValue ? hoveredValue : investmentChartData.endValue;
    
    if (startValue > 0) {
      return ((currentValue - startValue) / startValue) * 100;
    }
    return 0;
  }, [investmentChartData, isHovering, hoveredValue]);

  // Smooth value animation effect
  useEffect(() => {
    const targetValue = isHovering && hoveredValue ? hoveredValue : investmentChartData?.endValue || 0;
    if (targetValue === null || targetValue === undefined) return;

    const startValue = displayValue || 0;
    const difference = targetValue - startValue;
    const duration = isHovering ? 200 : 400; // Faster when hovering, slower when returning
    const startTime = Date.now();

    let animationFrame;

    const animateValue = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const newValue = startValue + (difference * easeOutQuart);
      
      setDisplayValue(newValue);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateValue);
      }
    };

    if (Math.abs(difference) > 1) { // Only animate if difference is significant
      animationFrame = requestAnimationFrame(animateValue);
    } else {
      setDisplayValue(targetValue);
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [hoveredValue, isHovering, investmentChartData?.endValue]);

  // Initialize display value when investment data loads
  useEffect(() => {
    const currentValue = investmentChartData?.endValue || 0;
    if (currentValue > 0 && (displayValue === 0 || displayValue === null)) {
      setDisplayValue(currentValue);
    }
  }, [investmentChartData?.endValue]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // --- Monthly Income/Spending Data ---
  // Helper: filter out categories not used in spending analytics (e.g., 'Transfer')
  const isValidSpendingCategory = (cat) => cat && cat.toLowerCase() !== 'transfer';

  const monthlyBarData = useMemo(() => {
    // Group by month, sum income and spending, and by category (excluding 'Transfer')
    const monthly = {};
    data.transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) monthly[monthKey] = { income: 0, spending: 0, categories: {} };
      const amt = parseFloat(t.amount_value || 0);
      const cat = t.category_name || 'Other';
      if (!isValidSpendingCategory(cat)) return;
      // Fix: include all positive transactions for income, not just checking
      if (amt > 0) monthly[monthKey].income += amt;
      if (amt < 0) {
        monthly[monthKey].spending += Math.abs(amt);
        monthly[monthKey].categories[cat] = (monthly[monthKey].categories[cat] || 0) + Math.abs(amt);
      }
    });
    // Sort months ascending, keep last 5
    const sorted = Object.entries(monthly)
      .map(([month, vals]) => ({ month, ...vals }))
      .sort((a, b) => new Date(a.month + '-01') - new Date(b.month + '-01'))
      .slice(-5);
    return sorted;
  }, [data.transactions]);
  // --- Pie Chart Category Overlay State ---
  // Handler for pie chart slice click
  const handlePieSliceClick = (category) => {
    if (!selectedPieMonth || !category) return;
    // Find all transactions for this category and month
    const monthData = monthlyBarData.find(m => m.month === selectedPieMonth);
    if (!monthData) return;
    // Get all transactions for this month and category
    const txns = data.transactions.filter(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === selectedPieMonth && (t.category_name || 'Other') === category && parseFloat(t.amount_value || 0) < 0;
    });
    const total = txns.reduce((sum, t) => sum + Math.abs(parseFloat(t.amount_value || 0)), 0);
    setPieOverlay({ open: true, category, transactions: txns, total });
  };

  // Handler to close overlay
  const closePieOverlay = () => setPieOverlay({ open: false, category: null, transactions: [], total: 0 });

  const barChartData = useMemo(() => {
    const labels = monthlyBarData.map(m => {
      const d = new Date(m.month + '-01');
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    let datasets = [];
    if (selectedCategory) {
      // Show only the selected category's spending trend
      datasets = [{
        label: selectedCategory,
        data: monthlyBarData.map(m => m.categories[selectedCategory] || 0),
        backgroundColor: '#6366f1', // Indigo highlight
        borderRadius: 6,
        barPercentage: 0.7,
      }];
    } else {
      if (barMode === 'spending' || barMode === 'both') {
        datasets.push({
          label: 'Spending',
          data: monthlyBarData.map(m => {
            // Sum all valid categories for each month
            const categories = m.categories || {};
            return Object.entries(categories)
              .filter(([cat]) => isValidSpendingCategory(cat))
              .reduce((sum, [cat, total]) => sum + total, 0);
          }),
          backgroundColor: '#ef4444',
          borderRadius: 6,
          barPercentage: 0.7,
        });
      }
      if (barMode === 'income' || barMode === 'both') {
        datasets.push({
          label: 'Income',
          data: monthlyBarData.map(m => m.income),
          backgroundColor: '#22c55e',
          borderRadius: 6,
          barPercentage: 0.7,
        });
      }
    }
    return { labels, datasets };
  }, [monthlyBarData, barMode, selectedCategory]);

  // Get available months (last 5 months, newest last)
  const availableMonths = useMemo(() => {
    return monthlyBarData.map(m => m.month);
  }, [monthlyBarData]);

  // Set default selectedPieMonth to latest month
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedPieMonth) {
      setSelectedPieMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedPieMonth]);

  // --- Pie Chart Data for Selected Month ---
  const pieChartData = useMemo(() => {
    if (!selectedPieMonth) return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    const monthData = monthlyBarData.find(m => m.month === selectedPieMonth);
    if (!monthData) return { labels: [], datasets: [{ data: [], backgroundColor: [] }] };
    const categories = monthData.categories || {};
    // Use all valid categories for the pie chart
    const filtered = Object.entries(categories)
      .filter(([cat]) => isValidSpendingCategory(cat))
      .map(([cat, total]) => ({ cat, total }));
    // Sort all categories by total descending
    const sorted = filtered.sort((a, b) => b.total - a.total);
    // Generate enough colors for all categories (repeat palette if needed)
    const baseColors = [
      '#7CA6D6', // brighter steel-blue
      '#A48BC2', // brighter soft-purple
      '#C2A05E', // brighter warm-bronze
      '#8CA6B8', // brighter cool-slate
      '#A0B87C', // brighter olive-green
      '#C2A07B', // brighter warm-clay
      '#D96A5A'  // brighter muted-red
    ];
    const colors = Array.from({length: sorted.length}, (_, i) => baseColors[i % baseColors.length]);
    return {
      labels: sorted.map(item => item.cat),
      datasets: [{
        data: sorted.map(item => item.total),
        backgroundColor: colors,
      }],
    };
  }, [monthlyBarData, selectedPieMonth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center bg-grid">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-[var(--text-secondary)] font-medium tracking-wide">
            Loading financial data...
          </p>
        </div>
      </div>
    );
  }

  // Calculate key metrics
  const creditCardDebt = Math.abs(calculateNetWorth(data.cards));
  // Add pending income and expenses to cash balance, but only for BANK accounts of type 'Checking'
  const pendingIncome = data.transactions
    .filter(t =>
      t.status === 'PENDING' &&
      t.account_type === 'BANK' &&
      (t.account_subtype?.toLowerCase() === 'checking' || t.account_name?.toLowerCase().includes('checking')) &&
      parseFloat(t.amount_value || 0) > 0
    )
    .reduce((sum, t) => sum + parseFloat(t.amount_value || 0), 0);
  const pendingExpenses = data.transactions
    .filter(t =>
      t.status === 'PENDING' &&
      t.account_type === 'BANK' &&
      (t.account_subtype?.toLowerCase() === 'checking' || t.account_name?.toLowerCase().includes('checking')) &&
      parseFloat(t.amount_value || 0) < 0
    )
    .reduce((sum, t) => sum + parseFloat(t.amount_value || 0), 0);
  const cashBalance = calculateNetWorth(data.cash) + pendingIncome + pendingExpenses;
  const investmentBalance = calculateNetWorth(data.investments);
  const netWorth = cashBalance + investmentBalance - creditCardDebt;

  // Calculate monthly spending
  const thisMonth = new Date();
  const thisMonthTransactions = data.transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === thisMonth.getMonth() && 
           transactionDate.getFullYear() === thisMonth.getFullYear();
  });
  
  const monthlySpending = thisMonthTransactions.reduce((total, t) => {
    const amount = parseFloat(t.amount_value || 0);
    return amount < 0 ? total + Math.abs(amount) : total;
  }, 0);

  // Prepare chart data with sophisticated colors
  const categoryData = groupTransactionsByCategory(data.transactions);
  const monthlyData = getMonthlySpending(data.transactions);
  const accountBreakdown = getAccountTypeBreakdown(data.cards, data.cash, data.investments);

  // Generate sample trend data for stat cards
  const generateTrend = () => Array.from({length: 12}, () => Math.random());

  return (
    <>
      <TokenModal open={tokenModalOpen} onClose={() => setTokenModalOpen(false)} onSubmit={handleTokenSubmit} loading={refreshing} />
      {refreshing && !tokenModalOpen && <ModernLoader />}
      <div className="h-screen flex flex-col bg-[var(--bg-primary)] bg-grid text-[var(--text-primary)] overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 glass border-b border-[var(--border-glass)] font-sans" style={{ fontFamily: "'Inter', 'Segoe UI', 'Helvetica Neue', Arial, 'sans-serif'" }}>
        <div className="max-w-full mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-steel-blue)] to-[var(--accent-soft-purple)] flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer group hover:scale-105 hover:shadow-2xl">
                <BarChart3 size={20} className="text-white group-hover:scale-110 group-hover:drop-shadow-lg transition-transform duration-200" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-[var(--text-accent)] tracking-tight" style={{ fontFamily: "'Poppins', 'Segoe UI', 'Helvetica Neue', Arial, 'sans-serif'" }}>
                  DeepFinance
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setTokenModalOpen(true)}
                className="glass p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-all duration-200 shadow-md group focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                title="Refresh Data"
                disabled={refreshing}
              >
                <RotateCcw size={18} className="text-[var(--text-primary)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all duration-200" />
              </button>
              <button
                onClick={toggleTheme}
                className="glass p-2.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface-secondary)] transition-all duration-200 shadow-md group focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                title="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun size={18} className="group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-200" />
                ) : (
                  <Moon size={18} className="group-hover:text-blue-500 group-hover:scale-110 transition-all duration-200" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Modal blur animation */}
                  <div
                  className={`fixed inset-0 z-40 transition-all duration-300 pointer-events-none ${
                    tokenModalOpen ? 'backdrop-blur-sm bg-black/20 opacity-100' : 'opacity-0'
                  }`}
                  aria-hidden={!tokenModalOpen}
                  />
                  {/* Main Content - Two-column layout */}
      <div className="flex-grow flex max-w-full mx-auto px-4 lg:px-4 py-6 gap-4 overflow-hidden">
        {/* Left side: Main content */}
        <main className="w-full flex flex-col gap-4 overflow-y-auto p-4 scroll-smooth">
          {/* Section 1: Key Financial Metrics */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-accent)] mb-1">Overview</h2>
              <p className="text-sm text-[var(--text-secondary)]">Your financial position at a glance</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <StatsCard
                title="Net Worth"
                value={formatCurrency(netWorth)}
                icon={DollarSign}
                color="steel-blue"
              />
              <StatsCard
                title="Investments"
                value={formatCurrency(investmentBalance)}
                icon={Building}
                color="sage-green"
              />
              <StatsCard
                title="Cash Balance"
                value={formatCurrency(cashBalance)}
                icon={Banknote}
                color="soft-purple"
              />
              <StatsCard
                title="Credit Debt"
                value={formatCurrency(creditCardDebt)}
                icon={CreditCard}
                color="muted-red"
              />
            </div>
          </section>

          {/* Section 2: Performance Analytics */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-accent)] mb-1">Portfolio Performance</h2>
              <p className="text-sm text-[var(--text-secondary)]">Track your investment growth</p>
            </div>
            <div className="portfolio-performance">
              <Card variant="elevated" className="chart-hover-zone">
                <CardHeader className="pb-4 chart-header">
                  <div className="flex items-start justify-between">
                    <div>
                      
                      {investmentChartData.periodChange !== undefined && (
                        <div className="mt-1 flex items-baseline gap-1">
                          <div className="text-2xl font-bold text-[var(--text-primary)] chart-value">
                            {formatCurrency(displayValue || investmentChartData.endValue)}
                          </div>
                          <div className={`flex items-center gap-1 text-sm font-medium chart-percentage ${
                            currentPercentage >= 0 
                              ? 'text-[var(--accent-sage-green)]' 
                              : 'text-[var(--accent-warm-clay)]'
                          }`}>
                            <span className="text-base transition-all duration-300 ease-out">
                              {currentPercentage >= 0 ? '↗' : '↘'}
                            </span>
                            {currentPercentage >= 0 ? '+' : ''}
                            {currentPercentage.toFixed(2)}%
                          </div>
                          {hoveredDate && (
                            <div className="text-xs text-[var(--text-secondary)] animate-fade-in">
                              {hoveredDate}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 glass rounded-lg p-1 period-selector">
                      {['1M', '3M', '6M', 'YTD', '1Y', 'All'].map(period => (
                        <button
                          key={period}
                          onClick={() => setSelectedPeriod(period)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-300 ${
                            selectedPeriod === period 
                              ? 'bg-[var(--accent-steel-blue)] text-white shadow-sm active' 
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
                  <div className="h-72 w-full relative chart-container">
                    {investmentChartData.datasets && investmentChartData.datasets[0] && investmentChartData.datasets[0].data.length > 0 ? (
                      <div 
                        className="w-full h-full px-4"
                        onMouseLeave={() => {
                          setIsHovering(false);
                          setHoveredValue(null);
                          setHoveredDate(null);
                        }}
                      >
                        <LineChart 
                          data={investmentChartData} 
                          height={288}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            resizeDelay: 0,
                            animation: {
                              duration: 750,
                              easing: 'easeInOutQuart'
                            },
                            transitions: {
                              active: {
                                animation: {
                                  duration: 300
                                }
                              }
                            },
                            layout: {
                              padding: {
                                left: 0,
                                right: 5,
                                top: 15,
                                bottom: 10
                              }
                            },
                            interaction: {
                              intersect: false,
                              mode: 'nearest',
                              axis: 'x'
                            },
                            onHover: (event, activeElements) => {
                              if (activeElements && activeElements.length > 0) {
                                const dataIndex = activeElements[0].index;
                                const rawData = investmentChartData.rawData;
                                if (rawData && rawData[dataIndex]) {
                                  setIsHovering(true);
                                  setHoveredValue(rawData[dataIndex].value);
                                  setHoveredDate(rawData[dataIndex].date.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  }));
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
                                  color: getComputedStyle(document.documentElement).getPropertyValue('--border-secondary').trim() || '#374151',
                                  drawOnChartArea: false
                                },
                                ticks: { 
                                  color: getComputedStyle(document.documentElement).getPropertyValue('--text-tertiary').trim() || '#9ca3af',
                                  maxRotation: 0,
                                  padding: 10,
                                  autoSkip: true,
                                  maxTicksLimit: 8, // Adjust number of ticks for better spacing
                                  font: {
                                    size: 11
                                  },
                                  callback: function(value, index, ticks) {
                                    // Only show label if it's not an empty string
                                    const label = this.getLabelForValue(value);
                                    if (label) {
                                      // For YTD, show only every other month to prevent crowding
                                      if (selectedPeriod === 'YTD' && index % 2 !== 0) {
                                        return null;
                                      }
                                      return label;
                                    }
                                    return null;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)] px-6">
                        No investment data available for {selectedPeriod}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 3: Monthly Analytics */}
          <section className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--text-accent)] mb-1">Monthly Analytics</h2>
            <p className="text-sm text-[var(--text-secondary)]">Visualize your income, spending, and category breakdowns</p>
          </section>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Monthly Income/Spending Bar Chart Card - Modern Figma Style */}
            <Card className="flex-1 min-w-[320px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-steel-blue)] to-[var(--accent-soft-purple)] flex items-center justify-center shadow-md">
                    <BarChart3 size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[var(--text-accent)]"></div>
                  </div>
                </div>
                <div className="flex gap-1 bg-[var(--surface-tertiary)] rounded-full p-1">
                  {['spending', 'income', 'both'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setBarMode(mode)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${barMode === mode ? 'bg-[var(--accent-steel-blue)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]'}`}
                    >
                      {mode === 'spending' ? 'Spending' : mode === 'income' ? 'Income' : 'Both'}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <BarChart 
                  data={barChartData} 
                  height={320}
                  options={{
                    plugins: {
                      tooltip: {
                        enabled: true,
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                          }
                        }
                      }
                    }
                  }}
                  optionsExtra={{
                    onClick: handleBarClick
                  }}
                />
                {/* Bar Chart Month Overlay */}
                {barOverlay.open && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 animate-fade-in">
                    <div className="bg-[var(--surface-primary)] rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 relative">
                      <button onClick={closeBarOverlay} className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-accent)] text-xl font-bold">×</button>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg text-[var(--text-accent)]">
                            {barOverlay.type === 'spending' ? 'Spending' : 'Income'}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mb-2">{barOverlay.month && (() => { const d = new Date(barOverlay.month + '-01'); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); })()}</div>
                        <div className="text-sm text-[var(--text-secondary)]">Total: <span className="font-bold text-[var(--text-accent)]">{formatCurrency(barOverlay.total)}</span></div>
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {barOverlay.transactions.length === 0 ? (
                          <div className="text-center text-[var(--text-secondary)] py-8">No transactions found.</div>
                        ) : (
                          barOverlay.transactions.map((t, i) => (
                            <div key={t.transaction_id || t.description || i} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-transparent transition-all duration-200 hover:border-[var(--border-primary)]">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-md flex items-center justify-center overflow-hidden bg-[var(--surface-tertiary)]">
                                  {(() => {
                                    const imageUrl = getAccountImageUrl(t, data.cards, data.cash);
                                    if (imageUrl) {
                                      return (
                                        <img 
                                          src={imageUrl} 
                                          alt={t.account_name}
                                          className="w-full h-full object-cover"
                                          onError={e => { e.target.style.display = 'none'; }}
                                        />
                                      );
                                    } else {
                                      // Fallback icon (credit or bank)
                                      if (t.account_type === 'CREDIT') {
                                        return <CreditCard size={18} className="text-[var(--accent-soft-purple)]" />;
                                      } else if (t.account_type === 'BANK') {
                                        return <Banknote size={18} className="text-[var(--accent-steel-blue)]" />;
                                      } else {
                                        return <Wallet size={18} className="text-[var(--accent-muted-red)]" />;
                                      }
                                    }
                                  })()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm text-[var(--text-primary)] mb-0.5 truncate max-w-[180px]">{t.description || 'Transaction'}</p>
                                  <div className="flex items-center text-xs text-[var(--text-secondary)]">
                                    <span className="mr-2">{new Date(t.date).toLocaleDateString()}</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface-tertiary)] text-xs mr-1">{t.account_name?.split(' ')[0]}</span>
                                  </div>
                                </div>
                              </div>
                              <div className={`font-semibold text-sm text-mono ${barOverlay.type === 'income' ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-muted-red)]'}`}>{formatCurrency(Math.abs(parseFloat(t.amount_value || 0)))}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Category Pie Chart Card - Modern Figma Style */}
            <Card className="flex-1 min-w-[320px]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-soft-purple)] to-[var(--accent-steel-blue)] flex items-center justify-center shadow-md">
                    <PieChartIcon size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-[var(--text-accent)]"></div>
                    
                  </div>
                </div>
                {/* Month toggle moved to header right */}
                <div className="flex flex-col items-center gap-1 ml-auto w-36">
                  <div className="flex items-center justify-center gap-2 w-full">
                    <button
                      className="p-2 rounded-full bg-[var(--surface-tertiary)] hover:bg-[var(--surface-secondary)] text-[var(--text-accent)] shadow transition"
                      onClick={() => {
                        const idx = availableMonths.indexOf(selectedPieMonth);
                        if (idx > 0) setSelectedPieMonth(availableMonths[idx - 1]);
                      }}
                      aria-label="Previous Month"
                      disabled={availableMonths.indexOf(selectedPieMonth) === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <span className="font-medium text-sm px-3 select-none text-center w-full" style={{lineHeight: '1.1', display: 'block'}}>
                      {selectedPieMonth ? (() => {
                        const d = new Date(selectedPieMonth + '-01');
                        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                      })() : ''}
                    </span>
                    <button
                      className="p-2 rounded-full bg-[var(--surface-tertiary)] hover:bg-[var(--surface-secondary)] text-[var(--text-accent)] shadow transition"
                      onClick={() => {
                        const idx = availableMonths.indexOf(selectedPieMonth);
                        if (idx < availableMonths.length - 1) setSelectedPieMonth(availableMonths[idx + 1]);
                      }}
                      aria-label="Next Month"
                      disabled={availableMonths.indexOf(selectedPieMonth) === availableMonths.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                    <PieChart
                      data={pieChartData}
                      height={260}
                      options={{
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            enabled: true,
                            callbacks: {
                              label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) {
                                  label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                              }
                            }
                          },
                        },
                        borderWidth: 0,
                        onClick: (evt, elements, chart) => {
                          if (elements && elements.length > 0) {
                            const idx = elements[0].index;
                            const cat = pieChartData.labels[idx];
                            handlePieSliceClick(cat);
                          }
                        }
                      }}
                    />
                  {/* Pie Chart Category Overlay */}
                  {pieOverlay.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/10 animate-fade-in">
                      <div className="bg-[var(--surface-primary)] rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 relative">
                        <button onClick={closePieOverlay} className="absolute top-3 right-3 text-[var(--text-secondary)] hover:text-[var(--text-accent)] text-xl font-bold">×</button>
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-1">
                            {getCategoryIcon(pieOverlay.category)}
                            <span className="font-semibold text-lg text-[var(--text-accent)]">{pieOverlay.category}</span>
                          </div>
                          <div className="text-xs text-[var(--text-secondary)] mb-2">{selectedPieMonth && (() => { const d = new Date(selectedPieMonth + '-01'); return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); })()}</div>
                          <div className="text-sm text-[var(--text-secondary)]">Total: <span className="font-bold text-[var(--text-accent)]">{formatCurrency(pieOverlay.total)}</span></div>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-2">
                          {pieOverlay.transactions.length === 0 ? (
                            <div className="text-center text-[var(--text-secondary)] py-8">No transactions found.</div>
                          ) : (
                            pieOverlay.transactions.map((t, i) => (
                              <div key={t.transaction_id || t.description || i} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-transparent transition-all duration-200 hover:border-[var(--border-primary)]">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-md flex items-center justify-center bg-[var(--surface-tertiary)]">
                                    {getCategoryIcon(t.category_name)}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-[var(--text-primary)] mb-0.5 truncate max-w-[180px]">{t.description || 'Transaction'}</p>
                                    <div className="flex items-center text-xs text-[var(--text-secondary)]">
                                      <span className="mr-2">{new Date(t.date).toLocaleDateString()}</span>
                                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface-tertiary)] text-xs mr-1">{t.account_name?.split(' ')[0]}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="font-semibold text-sm text-mono text-[var(--accent-muted-red)]">{formatCurrency(Math.abs(parseFloat(t.amount_value || 0)))}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                  {/* Total at the bottom */}
                  <div className="w-full flex flex-col items-center mt-2">
                    <span className="text-xs text-[var(--text-secondary)]">Total</span>
                    <span className="text-lg font-semibold text-[var(--text-accent)]">
                      {formatCurrency((pieChartData.datasets[0]?.data || []).reduce((a, b) => a + b, 0))}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Section 4: Transaction Search */}
          <section className="flex-grow flex flex-col min-h-0">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[var(--text-accent)] mb-1">Transaction History</h2>
              <p className="text-sm text-[var(--text-secondary)]">Search and filter your recent transactions</p>
            </div>
            <div className="flex-grow min-h-0" style={{ minHeight: '500px' }}>
              <TransactionSearch 
                transactions={data.transactions} 
              />
            </div>
          </section>
        </main>
        {/* Right side: Financial AI Assistant */}
        <aside className="lg:flex flex-col w-128 max-w-full h-full">
          <FinancialAIAssistant 
            transactions={data.transactions} 
            cardBalances={data.cards} 
            cashBalances={data.cash}
            investmentBalances={data.investments}
          />
        </aside>
      </div>
    </div>
      </>
  );
}

export default Dashboard;
