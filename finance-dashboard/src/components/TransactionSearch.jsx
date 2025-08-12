// Get card or bank image URL (exported for use in Dashboard)
export function getAccountImageUrl(transaction, cardBalances = [], cashBalances = []) {
  // Check if it's a credit card account
  if (transaction.account_type === 'CREDIT') {
    const card = cardBalances.find(c => 
      c.card_name && transaction.account_name &&
      (c.card_name.toLowerCase().includes(transaction.account_name.toLowerCase()) ||
      transaction.account_name.toLowerCase().includes(c.card_name.toLowerCase()))
    );
    return card?.image_url;
  } 
  // Check if it's a bank account
  else if (transaction.account_type === 'BANK') {
    const account = cashBalances.find(a => 
      a.account_name === transaction.account_name
    );
    return account?.image_url;
  }
  return null;
}
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Calendar, 
  CreditCard, 
  DollarSign, 
  Building, 
  Tag, 
  ChevronDown, 
  X,
  Coffee,
  ShoppingBag,
  Car,
  Home,
  Utensils,
  Plane,
  RefreshCw
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from './ui/Card';
import { loadCardBalances, loadCashBalances } from '../utils/dataUtils';

// Helper function to format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
};

// Helper function to get category icon
export function getCategoryIcon(categoryName) {
// Export getCategoryIcon for use in Dashboard
  const categoryMap = {
    'Food & dining': Utensils,
    'Shopping': ShoppingBag,
    'Travel & vacation': Plane,
    'Auto & transport': Car,
    'Home': Home,
    'Coffee shops': Coffee,
  };
  
  const CategoryIcon = categoryMap[categoryName] || ShoppingBag;
  return <CategoryIcon size={14} />;
};

const TransactionSearch = ({ transactions = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(20);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterValues, setFilterValues] = useState({});
  const [cardBalances, setCardBalances] = useState([]);
  const [cashBalances, setCashBalances] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const scrollContainerRef = useRef(null);
  const filterMenuRef = useRef(null);

  // Load card and cash balances for images and icons
  useEffect(() => {
    const loadBalanceData = async () => {
      try {
        const cards = await loadCardBalances();
        const cash = await loadCashBalances();
        setCardBalances(cards || []);
        setCashBalances(cash || []);
      } catch (error) {
        console.error('Error loading balance data:', error);
      }
    };
    
    loadBalanceData();
  }, []);
  
  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique values for filter fields
  const filterOptions = useMemo(() => {
    const options = {};
    
    // Define filter categories and their fields
    const categories = {
      'Transaction Type': {
        field: 'transaction-type',
        isMultiSelect: true,
        options: [
          { id: 'transaction-type-expenses', label: 'Expenses Only', value: 'expenses' },
          { id: 'transaction-type-income', label: 'Income Only', value: 'income' }
        ]
      },
      'Date Range': {
        field: 'date-range',
        isMultiSelect: false, // Date ranges are mutually exclusive
        options: [
          { id: 'date-range-30', label: 'Last 30 Days', value: '30days' },
          { id: 'date-range-90', label: 'Last 90 Days', value: '90days' },
          { id: 'date-range-year', label: 'Year to Date', value: 'ytd' }
        ]
      },
      'Account': {
        field: 'account_name',
        isMultiSelect: true,
        options: [...new Set(transactions.map(t => t.account_name).filter(Boolean))].map(name => ({
          id: `account-${name.toLowerCase().replace(/\s+/g, '-')}`,
          label: name,
          value: name
        }))
      },
      'Account Type': {
        field: 'account_type',
        isMultiSelect: true,
        options: [...new Set(transactions.map(t => t.account_type).filter(Boolean))].map(type => ({
          id: `account-type-${type.toLowerCase()}`,
          label: type,
          value: type
        }))
      },
      'Category': {
        field: 'category_name',
        isMultiSelect: true,
        options: [...new Set(transactions.map(t => t.category_name).filter(Boolean))].map(category => ({
          id: `category-${category.toLowerCase().replace(/\s+/g, '-')}`,
          label: category,
          value: category
        }))
      },
      'Status': {
        field: 'status',
        isMultiSelect: true,
        options: [...new Set(transactions.map(t => t.status).filter(Boolean))].map(status => ({
          id: `status-${status.toLowerCase()}`,
          label: status,
          value: status
        }))
      }
    };
    
    return categories;
  }, [transactions]);
  
  // Toggle a category in the selected categories list
  const toggleCategory = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(cat => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Derived state for active filters
  const activeFilters = useMemo(() => {
    const filters = [];
    
    // Process special filter types
    if (Array.isArray(filterValues['transaction-type'])) {
      filterValues['transaction-type'].forEach(value => {
        filters.push({
          category: 'Transaction Type',
          label: value === 'expenses' ? 'Expenses Only' : 'Income Only',
          key: 'transaction-type',
          value
        });
      });
    }
    
    if (filterValues['date-range']) {
      const labels = {
        '30days': 'Last 30 Days',
        '90days': 'Last 90 Days',
        'ytd': 'Year to Date'
      };
      filters.push({
        category: 'Date Range',
        label: labels[filterValues['date-range']],
        key: 'date-range',
        value: filterValues['date-range']
      });
    }
    
    // Process field-based multi-select filters
    for (const [category, config] of Object.entries(filterOptions)) {
      if (config.field && config.field !== 'transaction-type' && config.field !== 'date-range') {
        const fieldValues = filterValues[config.field];
        if (Array.isArray(fieldValues)) {
          fieldValues.forEach(value => {
            filters.push({
              category,
              label: value,
              key: config.field,
              value
            });
          });
        }
      }
    }
    
    return filters;
  }, [filterValues, filterOptions]);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    let results = [...transactions];
    
    // Apply transaction type filters
    if (Array.isArray(filterValues['transaction-type'])) {
      if (filterValues['transaction-type'].includes('expenses')) {
        // If both expenses and income are selected, this is a no-op filter
        if (!filterValues['transaction-type'].includes('income')) {
          results = results.filter(t => parseFloat(t.amount_value) < 0);
        }
      } else if (filterValues['transaction-type'].includes('income')) {
        results = results.filter(t => parseFloat(t.amount_value) > 0);
      }
    }
    
    // Date range filters
    if (filterValues['date-range']) {
      const now = new Date();
      let startDate = new Date();
      
      if (filterValues['date-range'] === '30days') {
        startDate.setDate(now.getDate() - 30);
      } else if (filterValues['date-range'] === '90days') {
        startDate.setDate(now.getDate() - 90);
      } else if (filterValues['date-range'] === 'ytd') {
        startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
      }
      
      results = results.filter(t => new Date(t.date) >= startDate);
    }
    
    // Apply field-based multi-select filters
    const fieldFilters = ['account_name', 'account_type', 'category_name', 'status'];
    fieldFilters.forEach(field => {
      const values = filterValues[field];
      if (Array.isArray(values) && values.length > 0) {
        results = results.filter(t => values.includes(t[field]));
      }
    });
    
    // Apply search query if present
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      results = results.filter(t =>
        (t.description?.toLowerCase().includes(query)) ||
        (t.category_name?.toLowerCase().includes(query)) ||
        (t.merchant_name?.toLowerCase().includes(query))
      );
    }
    
    return results;
  }, [searchQuery, transactions, filterValues]);

  // Reset visible count and scroll to top when the list changes
  useEffect(() => {
    setVisibleCount(20);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [searchQuery, filterValues, transactions]);

  // Infinite scroll handler
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is 150px from the bottom
      if (scrollHeight - scrollTop <= clientHeight + 150) {
        setVisibleCount(prevCount => Math.min(prevCount + 20, filteredTransactions.length));
      }
    }
  };

  // Attach and clean up scroll listener
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [filteredTransactions]); // Re-attach if filtered list changes

  // Apply a filter (supporting multi-select)
  const applyFilter = (field, value, isMultiSelect) => {
    setFilterValues(prev => {
      const newValues = { ...prev };
      
      if (isMultiSelect) {
        if (!Array.isArray(newValues[field])) {
          newValues[field] = [];
        }
        
        if (newValues[field].includes(value)) {
          newValues[field] = newValues[field].filter(v => v !== value);
          if (newValues[field].length === 0) {
            delete newValues[field];
          }
        } else {
          newValues[field] = [...newValues[field], value];
        }
      } else {
        // For non-multi-select, just replace the value
        if (newValues[field] === value) {
          delete newValues[field];
        } else {
          newValues[field] = value;
        }
      }
      
      return newValues;
    });
  };

  // Clear a specific filter
  const clearFilter = (key, value) => {
    setFilterValues(prev => {
      const newValues = {...prev};
      
      if (Array.isArray(newValues[key]) && value !== undefined) {
        // For multi-select filters, remove just this value
        newValues[key] = newValues[key].filter(v => v !== value);
        if (newValues[key].length === 0) {
          delete newValues[key];
        }
      } else {
        // For single-value filters, remove the entire key
        delete newValues[key];
      }
      
      return newValues;
    });
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilterValues({});
    setSelectedCategories([]);
  };

// Get card or bank image URL (exported for use in Dashboard)
function getAccountImageUrl(transaction, cardBalances = [], cashBalances = []) {
  // Check if it's a credit card account
  if (transaction.account_type === 'CREDIT') {
    const card = cardBalances.find(c => 
      c.card_name && transaction.account_name &&
      (c.card_name.toLowerCase().includes(transaction.account_name.toLowerCase()) ||
      transaction.account_name.toLowerCase().includes(c.card_name.toLowerCase()))
    );
    return card?.image_url;
  } 
  // Check if it's a bank account
  else if (transaction.account_type === 'BANK') {
    const account = cashBalances.find(a => 
      a.account_name === transaction.account_name
    );
    return account?.image_url;
  }
  return null;
}

// Export at top level

  // Get account type icon
  const getAccountTypeIcon = (accountType) => {
    switch(accountType) {
      case 'BANK':
        return <Building size={14} />;
      case 'CREDIT':
        return <CreditCard size={14} />;
      default:
        return <DollarSign size={14} />;
    }
  };

  const renderTransactionItem = (transaction) => {
    const isPositive = parseFloat(transaction.amount_value) > 0;
    const imageUrl = getAccountImageUrl(transaction, cardBalances, cashBalances);
    
    return (
      <div key={transaction.transaction_id || transaction.description} className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--surface-secondary)] border border-transparent transition-all duration-200 hover:border-[var(--border-primary)]">
        <div className="flex items-center gap-3">
          {imageUrl ? (
            <div className="w-9 h-9 rounded-md flex items-center justify-center overflow-hidden">
              <img 
                src={imageUrl} 
                alt={transaction.account_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add(isPositive ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-muted-red)]');
                  e.target.parentNode.style.backgroundColor = isPositive ? 'rgba(123, 160, 91, 0.1)' : 'rgba(184, 84, 80, 0.1)';
                  e.target.parentNode.innerHTML = isPositive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>';
                }}
              />
            </div>
          ) : (
            <div className={`w-9 h-9 rounded-md flex items-center justify-center ${
              isPositive 
                ? 'text-[var(--accent-sage-green)]' 
                : 'text-[var(--accent-muted-red)]'
            }`} style={{ 
              backgroundColor: isPositive 
                ? 'rgba(123, 160, 91, 0.1)' 
                : 'rgba(184, 84, 80, 0.1)' 
            }}>
              {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            </div>
          )}
          
          <div className="flex-1">
            <p className="font-medium text-sm text-[var(--text-primary)] mb-0.5 truncate max-w-[220px]">
              {transaction.description || 'Transaction'}
            </p>
            <div className="flex items-center text-xs text-[var(--text-secondary)]">
              <p className="mr-2">{new Date(transaction.date).toLocaleDateString()}</p>
              
              {/* Account type indicator */}
              <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface-tertiary)] text-xs flex items-center mr-1">
                {getAccountTypeIcon(transaction.account_type)}
                <span className="ml-1">{transaction.account_name?.split(' ')[0]}</span>
              </span>
              
              {/* Category indicator */}
              {transaction.category_name && (
                <span className="px-1.5 py-0.5 rounded-md bg-[var(--surface-tertiary)] text-xs flex items-center">
                  {getCategoryIcon(transaction.category_name)}
                  <span className="ml-1">{transaction.category_name}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={`font-semibold text-sm text-mono ${
          isPositive ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-muted-red)]'
        }`}>
          {formatCurrency(Math.abs(parseFloat(transaction.amount_value || 0)))}
        </div>
      </div>
    );
  };

  // Check if a filter option is selected
  const isFilterSelected = (field, value) => {
    const values = filterValues[field];
    if (Array.isArray(values)) {
      return values.includes(value);
    }
    return values === value;
  };

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-md bg-[var(--surface-secondary)] border border-[var(--border-secondary)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-primary)] transition-colors"
              />
            </div>
            
            {/* Filter button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`filter-button ${activeFilters.length > 0 ? 'active' : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border-secondary)]'}`}
              >
                <Filter size={14} className="mr-1.5" /> 
                Filter
                {activeFilters.length > 0 && (
                  <span className="filter-button-badge">
                    {activeFilters.length}
                  </span>
                )}
              </button>
              
              {/* Enhanced Filter dropdown menu */}
              {showFilterMenu && (
                <div 
                  ref={filterMenuRef}
                  className="absolute z-50 right-0 mt-2 w-72 rounded-lg shadow-lg bg-[var(--surface-secondary)] border border-[var(--border-primary)] filter-menu"
                  style={{ 
                    maxHeight: 'calc(100vh - 490px)', 
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div className="sticky top-0 bg-[var(--surface-secondary)] px-3 py-2.5 border-b border-[var(--border-secondary)] flex justify-between items-center z-10 filter-header flex-shrink-0">
                    <h3 className="font-medium text-sm text-[var(--text-primary)]">Filter Transactions</h3>
                    <button 
                      onClick={resetAllFilters}
                      className="text-xs flex items-center text-[var(--accent-steel-blue)]"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      Reset all
                    </button>
                  </div>
                  
                  <div className="px-2 py-1 overflow-y-visible flex-1">
                    {/* Filter categories */}
                    {Object.entries(filterOptions).map(([category, config]) => (
                      <div key={category} className="border-b border-[var(--border-secondary)] last:border-0 filter-category">
                        <button
                          onClick={() => toggleCategory(category)}
                          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                        >
                          <span>{category}</span>
                          <ChevronDown 
                            size={15} 
                            className={`transition-transform ${selectedCategories.includes(category) ? 'transform rotate-180' : ''}`}
                          />
                        </button>
                        
                        {/* Filter options */}
                        {selectedCategories.includes(category) && (
                          <div className="pl-3 pb-2 pt-1 space-y-1 max-h-60 overflow-y-auto filter-options-container">
                            {config.options && config.options.map(option => {
                              const isActive = isFilterSelected(config.field, option.value);
                                
                              return (
                                <button
                                  key={option.id}
                                  onClick={() => applyFilter(config.field, option.value, config.isMultiSelect)}
                                  className={`filter-option ${isActive ? 'active' : ''}`}
                                >
                                  <span className={`filter-checkbox ${isActive ? 'active' : ''}`}>
                                    {isActive && (
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M8 2.5L3.75 6.75L2 5" 
                                          stroke="white" 
                                          strokeWidth="1.5" 
                                          strokeLinecap="round" 
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                  </span>
                                  <span className="text-sm truncate">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Active filters with improved display */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((filter, index) => (
              <div 
                key={`${filter.key}-${filter.value}-${index}`}
                className="filter-chip"
              >
                <span className="filter-chip-text">{filter.label}</span>
                <button 
                  onClick={() => clearFilter(filter.key, filter.value)}
                  className="filter-chip-close"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X size={11} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <RefreshCw size={12} className="mr-1" /> Clear All
            </button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-2 flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef} 
          className="h-full overflow-y-auto space-y-1.5 pr-1 transaction-list-container"
          style={{ minHeight: "200px" }}
        >
          {filteredTransactions.length > 0 ? (
            filteredTransactions.slice(0, visibleCount).map((transaction) => renderTransactionItem(transaction))
          ) : (
            <div className="text-center py-6 text-sm text-[var(--text-secondary)]">
              No transactions found.
            </div>
          )}
          
          {visibleCount < filteredTransactions.length && (
            <div className="text-center py-4 text-sm text-[var(--text-secondary)]">
              Loading more...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionSearch;
