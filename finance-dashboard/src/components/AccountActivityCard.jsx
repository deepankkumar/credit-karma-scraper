import React, { useState, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from './ui/Card';
import { CreditCard, Building2, Wallet } from 'lucide-react';

export default function AccountActivityCard({ transactions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('3M');
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Process account activity data
  const accountData = useMemo(() => {
    if (!transactions || transactions.length === 0) return { accounts: [], chartData: null };

    const now = new Date();
    const periodMonths = selectedPeriod === '1M' ? 1 : selectedPeriod === '3M' ? 3 : selectedPeriod === '6M' ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - periodMonths + 1, 1);

    const accountStats = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      if (date >= startDate) {
        const accountKey = `${t.account_name || 'Unknown'} (${t.account_provider || 'Unknown'})`;
        const amount = Math.abs(parseFloat(t.amount_value || 0));
        
        if (amount > 0) {
          if (!accountStats[accountKey]) {
            accountStats[accountKey] = {
              totalActivity: 0,
              transactionCount: 0,
              accountType: t.account_type || 'Unknown',
              provider: t.account_provider || 'Unknown',
              display: t.account_display || accountKey
            };
          }
          
          accountStats[accountKey].totalActivity += amount;
          accountStats[accountKey].transactionCount += 1;
        }
      }
    });

    const accounts = Object.entries(accountStats)
      .map(([key, stats]) => ({ key, ...stats }))
      .sort((a, b) => b.totalActivity - a.totalActivity);

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
      labels: accounts.map(a => a.display.length > 25 ? a.display.substring(0, 25) + '...' : a.display),
      datasets: [{
        data: accounts.map(a => a.totalActivity),
        backgroundColor: colors.slice(0, accounts.length),
        borderWidth: 3,
        borderColor: 'var(--bg-primary)',
        hoverOffset: 12
      }]
    };

    return { accounts, chartData };
  }, [transactions, selectedPeriod]);

  const getAccountIcon = (accountType) => {
    switch (accountType?.toLowerCase()) {
      case 'credit':
        return <CreditCard size={16} />;
      case 'bank':
        return <Wallet size={16} />;
      default:
        return <Building2 size={16} />;
    }
  };

  const selectedAccountData = selectedAccount 
    ? accountData.accounts.find(a => a.key === selectedAccount)
    : null;

  return (
    <Card variant="elevated" className="chart-hover-zone">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 mb-2">
              <Building2 size={22} style={{ color: 'var(--accent-warm-bronze)' }} />
              Account Activity
            </CardTitle>
            <CardDescription>Transaction volume by account</CardDescription>
            {selectedAccountData && (
              <div className="mt-3 glass rounded-lg p-3 border border-[var(--accent-warm-bronze)] bg-gradient-to-r from-[var(--accent-warm-bronze)]/10 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  {getAccountIcon(selectedAccountData.accountType)}
                  <span className="font-medium text-[var(--text-primary)]">{selectedAccountData.display}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[var(--text-secondary)]">Total Activity: </span>
                    <span className="font-bold text-[var(--accent-warm-bronze)]">
                      ${selectedAccountData.totalActivity.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-secondary)]">Transactions: </span>
                    <span className="font-bold text-[var(--accent-steel-blue)]">
                      {selectedAccountData.transactionCount}
                    </span>
                  </div>
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
                    ? 'bg-[var(--accent-warm-bronze)] text-white shadow-md active' 
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
        <div className="h-80 flex items-center justify-center">
          {accountData.chartData ? (
            <div className="w-full flex flex-col items-center">
              <div className="w-80 h-80 relative">
                <Doughnut 
                  data={accountData.chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    animation: {
                      duration: 750,
                      easing: 'easeInOutQuart'
                    },
                    onClick: (event, elements) => {
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const accountKey = accountData.accounts[index].key;
                        setSelectedAccount(accountKey === selectedAccount ? null : accountKey);
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
                            const account = accountData.accounts[context.dataIndex];
                            const percentage = ((context.parsed / accountData.accounts.reduce((sum, a) => sum + a.totalActivity, 0)) * 100).toFixed(1);
                            return [
                              `${account.display}`,
                              `Activity: $${context.parsed.toLocaleString()}`,
                              `Share: ${percentage}%`,
                              `Type: ${account.accountType}`
                            ];
                          }
                        }
                      }
                    }
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold text-[var(--accent-warm-bronze)]">
                    {accountData.accounts.length}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    Active Accounts
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[var(--text-secondary)]">
              No account data available for {selectedPeriod}
            </div>
          )}
        </div>
        <div className="mt-4 space-y-2">
          {accountData.accounts.slice(0, 4).map((account, index) => (
            <button
              key={account.key}
              onClick={() => setSelectedAccount(account.key === selectedAccount ? null : account.key)}
              className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                selectedAccount === account.key 
                  ? 'bg-[var(--accent-warm-bronze)]/20 border border-[var(--accent-warm-bronze)]' 
                  : 'bg-[var(--surface-secondary)] hover:bg-[var(--surface-tertiary)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedAccount === account.key ? 'bg-[var(--accent-warm-bronze)]' : 'bg-[var(--surface-tertiary)]'}`}>
                  <span className={selectedAccount === account.key ? 'text-white' : 'text-[var(--text-secondary)]'}>
                    {getAccountIcon(account.accountType)}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium text-[var(--text-primary)]">
                    {account.display}
                  </div>
                  <div className="text-sm text-[var(--text-secondary)]">
                    {account.accountType} • {account.provider}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[var(--text-primary)]">
                  ${account.totalActivity.toLocaleString()}
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  {account.transactionCount} transactions
                </div>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
