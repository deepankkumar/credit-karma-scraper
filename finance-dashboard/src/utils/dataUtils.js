// Utility functions for loading and processing financial data

const API_BASE = 'http://localhost:8000/api'; // FastAPI default port

// API-based data loader
export const loadAPIData = async (endpoint) => {
  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading from API ${endpoint}:`, error);
    return [];
  }
};

export const loadTransactions = async () => {
  return await loadAPIData(`${API_BASE}/transactions`);
};
export const loadCardBalances = async () => {
  return await loadAPIData(`${API_BASE}/card_balances`);
};
export const loadCashBalances = async () => {
  return await loadAPIData(`${API_BASE}/cash_balances`);
};
export const loadInvestmentBalances = async () => {
  return await loadAPIData(`${API_BASE}/investment_balances`);
};
export const loadInvestmentHistory = async () => {
  return await loadAPIData(`${API_BASE}/investment_history`);
};

// export const loadCSVData = async (filename) => {
//   try {
//     const response = await fetch(`/data/${filename}`);
//     const text = await response.text();
//     return parseCSV(text);
//   } catch (error) {
//     console.error(`Error loading ${filename}:`, error);
//     return [];
//   }
// };

// export const parseCSV = (csvText) => {
//   const lines = csvText.trim().split('\n');
//   const headers = lines[0].split(',').map(header => header.replace(/"/g, ''));
  
//   return lines.slice(1).map(line => {
//     const values = parseCSVLine(line);
//     const obj = {};
//     headers.forEach((header, index) => {
//       obj[header] = values[index] || '';
//     });
//     return obj;
//   });
// };

// const parseCSVLine = (line) => {
//   const result = [];
//   let current = '';
//   let inQuotes = false;
  
//   for (let i = 0; i < line.length; i++) {
//     const char = line[i];
    
//     if (char === '"') {
//       inQuotes = !inQuotes;
//     } else if (char === ',' && !inQuotes) {
//       result.push(current.trim());
//       current = '';
//     } else {
//       current += char;
//     }
//   }
  
//   result.push(current.trim());
//   return result;
// };

export const formatCurrency = (amount) => {
  const num = parseFloat(amount.toString().replace(/[$,]/g, ''));
  if (isNaN(num)) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(num);
};

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number);
};

export const calculateNetWorth = (accounts) => {
  return accounts.reduce((total, account) => {
    const balance = parseFloat(account.balance?.toString().replace(/[$,]/g, '') || 0);
    return total + balance;
  }, 0);
};

export const getCardColors = () => [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#06B6D4', // cyan
  '#84CC16', // lime
  '#F97316', // orange
];

export const groupTransactionsByCategory = (transactions) => {
  const categoryTotals = {};
  
  transactions.forEach(transaction => {
    const amount = Math.abs(parseFloat(transaction.amount_value || 0));
    const category = transaction.category_name || 'Other';
    
    if (amount > 0) { // Only count expenses (negative amounts)
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    }
  });
  
  const sortedCategories = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7); // Top 7 categories

  return {
    labels: sortedCategories.map(item => item.category),
    datasets: [{
      data: sortedCategories.map(item => item.total),
      backgroundColor: [
        'var(--accent-steel-blue)',
        'var(--accent-soft-purple)',
        'var(--accent-sage-green)',
        'var(--accent-warm-bronze)',
        'var(--accent-cool-slate)',
        'var(--accent-olive-green)',
        'var(--accent-warm-clay)'
      ]
    }]
  };
};

export const getMonthlySpending = (transactions) => {
  const monthlyData = {};
  
  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount_value || 0);
    if (amount < 0) { // Only expenses
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Math.abs(amount);
    }
  });
  
  const sortedMonths = Object.entries(monthlyData)
    .map(([month, total]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      total
    }))
    .sort((a, b) => new Date(a.month) - new Date(b.month))
    .slice(-6); // Last 6 months

  return {
    labels: sortedMonths.map(item => item.month),
    datasets: [{
      label: 'Monthly Spending',
      data: sortedMonths.map(item => item.total),
      backgroundColor: 'var(--accent-steel-blue)',
      borderColor: 'var(--accent-steel-blue)',
      borderWidth: 0
    }]
  };
};

export const getAccountTypeBreakdown = (cardBalances, cashBalances, investmentBalances) => {
  const cardTotal = Math.abs(calculateNetWorth(cardBalances));
  const cashTotal = calculateNetWorth(cashBalances);
  const investmentTotal = calculateNetWorth(investmentBalances);
  
  const data = [
    { type: 'Credit Cards', amount: cardTotal },
    { type: 'Cash & Banking', amount: cashTotal },
    { type: 'Investments', amount: investmentTotal },
  ].filter(item => item.amount > 0); // Only show accounts with positive balances

  return {
    labels: data.map(item => item.type),
    datasets: [{
      data: data.map(item => item.amount),
      backgroundColor: [
        'var(--accent-steel-blue)',
        'var(--accent-sage-green)',
        'var(--accent-soft-purple)'
      ]
    }]
  };
};

export const processInvestmentHistory = (investmentHistory, selectedPeriod = '3M', theme = 'dark') => {
  if (!investmentHistory || investmentHistory.length === 0) {
    return {
      labels: [],
      datasets: [],
      periodChange: 0,
      startValue: 0,
      endValue: 0
    };
  }

  // Filter data by selected period
  const filteredData = investmentHistory
    .filter(item => item.period === selectedPeriod)
    .map(item => ({
      date: new Date(item.date),
      value: parseFloat(item.raw_value || 0),
      dateStr: item.date
    }))
    .sort((a, b) => a.date - b.date);

  if (filteredData.length === 0) {
    return {
      labels: [],
      datasets: [],
      periodChange: 0,
      startValue: 0,
      endValue: 0,
      rawData: []
    };
  }

  const startValue = filteredData[0]?.value || 0;
  const endValue = filteredData[filteredData.length - 1]?.value || 0;
  const periodChange = startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0;
  
  // Determine colors based on performance - use hex colors for reliability
  const isPositive = periodChange >= 0;
  const primaryColor = isPositive ? '#22c55e' : '#ef4444'; // Green for positive, red for negative
  
  // Theme-aware background gradient with reliable colors
  const gradientColorStart = isPositive 
    ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(34, 197, 94, 0.2)')
    : (theme === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.2)');
  const gradientColorEnd = isPositive 
    ? (theme === 'dark' ? 'rgba(34, 197, 94, 0.05)' : 'rgba(34, 197, 94, 0.02)')
    : (theme === 'dark' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)');

  // --- START: Improved X-Axis Label Logic ---
  const labels = filteredData.map(item => {
    // Format labels based on the selected period for clarity
    switch (selectedPeriod) {
      case '1M':
      case '3M':
        // For shorter periods, show Month and Day
        return item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '6M':
        // For 6 months, show Month abbreviation
        return item.date.toLocaleDateString('en-US', { month: 'short' });
      case 'YTD':
      case '1Y':
      case 'All':
        // For longer periods, show Month abbreviation
        return item.date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  });
  // --- END: Improved X-Axis Label Logic ---

  return {
    labels,
    datasets: [{
      label: 'Portfolio Value',
      data: filteredData.map(item => item.value),
      borderColor: primaryColor,
      backgroundColor: function(context) {
        const chart = context.chart;
        const {ctx, chartArea} = chart;
        
        if (!chartArea) {
          return null;
        }
        
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, gradientColorStart);
        gradient.addColorStop(1, gradientColorEnd);
        return gradient;
      },
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: primaryColor,
      pointBorderColor: theme === 'dark' ? '#ffffff' : '#1e293b',
      pointBorderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 8,
      pointHoverBackgroundColor: primaryColor,
      pointHoverBorderColor: theme === 'dark' ? '#ffffff' : '#1e293b',
      pointHoverBorderWidth: 3,
    }],
    periodChange,
    startValue,
    endValue,
    rawData: filteredData, // Keep raw data for tooltips
    isPositive
  };
};

// Group transactions by category and month, with income/spending/net
export const getCategoryMonthSummary = (transactions, {
  startMonth, // e.g. '2025-01'
  endMonth,   // e.g. '2025-06'
  categories = null, // array of category names to include, or null for all
  type = 'spending', // 'spending', 'income', or 'net'
} = {}) => {
  // Helper to get YYYY-MM from date
  const getMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Filter by month range and category
  let filtered = transactions.filter(t => {
    const monthKey = getMonthKey(t.date);
    if (startMonth && monthKey < startMonth) return false;
    if (endMonth && monthKey > endMonth) return false;
    if (categories && !categories.includes(t.category_name)) return false;
    return true;
  });

  // Group by category and month
  const summary = {};
  filtered.forEach(t => {
    const monthKey = getMonthKey(t.date);
    const cat = t.category_name || 'Other';
    const amount = parseFloat(t.amount_value || 0);
    if (!summary[cat]) summary[cat] = {};
    if (!summary[cat][monthKey]) summary[cat][monthKey] = { income: 0, spending: 0, net: 0 };
    if (amount > 0) {
      summary[cat][monthKey].income += amount;
    } else {
      summary[cat][monthKey].spending += Math.abs(amount);
    }
    summary[cat][monthKey].net = summary[cat][monthKey].income - summary[cat][monthKey].spending;
  });

  // Prepare chart data
  const allMonths = Array.from(new Set(filtered.map(t => getMonthKey(t.date)))).sort();
  const allCategories = categories || Object.keys(summary);

  // For each category, build a dataset for the selected type
  const datasets = allCategories.map(cat => {
    return {
      label: cat,
      data: allMonths.map(month => summary[cat]?.[month]?.[type] || 0),
    };
  });

  return {
    labels: allMonths,
    datasets,
    summary, // raw summary for advanced use
  };
};

// Get top N categories by total spending/income/net in a period
export const getTopCategories = (transactions, { N = 5, type = 'spending', startMonth, endMonth } = {}) => {
  const summary = {};
  const getMonthKey = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };
  transactions.forEach(t => {
    const monthKey = getMonthKey(t.date);
    if (startMonth && monthKey < startMonth) return;
    if (endMonth && monthKey > endMonth) return;
    const cat = t.category_name || 'Other';
    const amount = parseFloat(t.amount_value || 0);
    if (!summary[cat]) summary[cat] = { income: 0, spending: 0, net: 0 };
    if (amount > 0) {
      summary[cat].income += amount;
    } else {
      summary[cat].spending += Math.abs(amount);
    }
    summary[cat].net = summary[cat].income - summary[cat].spending;
  });
};
