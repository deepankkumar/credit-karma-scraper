import React from 'react';
import { Card, CardContent } from './ui/Card';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'blue',
  trend 
}) => {
  const getColorStyles = (colorKey) => {
    const colorMap = {
      'steel-blue': { bg: '#6B8CAE', text: '#6B8CAE' },
      'soft-purple': { bg: '#8E7B9B', text: '#8E7B9B' },
      'sage-green': { bg: '#7BA05B', text: '#7BA05B' },
      'warm-bronze': { bg: '#A68B5B', text: '#A68B5B' },
      'cool-slate': { bg: '#7A8B9A', text: '#7A8B9A' },
      'olive-green': { bg: '#8B9B7A', text: '#8B9B7A' },
      'warm-clay': { bg: '#A68A7B', text: '#A68A7B' },
      'muted-red': { bg: '#B85450', text: '#B85450' },
      // Legacy support
      blue: { bg: '#6B8CAE', text: '#6B8CAE' },
      green: { bg: '#7BA05B', text: '#7BA05B' },
      red: { bg: '#B85450', text: '#B85450' },
      yellow: { bg: '#A68B5B', text: '#A68B5B' },
      purple: { bg: '#8E7B9B', text: '#8E7B9B' },
    };
    
    const colors = colorMap[colorKey] || colorMap['steel-blue'];
    return {
      backgroundColor: `${colors.bg}33`, // 20% opacity
      color: colors.text,
      border: `1px solid ${colors.bg}80` // 50% opacity
    };
  };

  const changeColorClasses = {
    positive: 'text-[var(--accent-sage-green)]',
    negative: 'text-[var(--accent-warm-clay)]',
    neutral: 'text-[var(--text-secondary)]',
  };

  return (
    <Card 
      variant="stat" 
      className="group relative animate-slide-up"
    >
      <CardContent className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="p-3 rounded-xl relative z-10 transition-all duration-300 group-hover:scale-110 flex items-center justify-center"
            style={getColorStyles(color)}
          >
            {Icon && <Icon size={18} strokeWidth={2.5} />}
          </div>
          {change && (
            <div className={`text-sm font-medium text-mono ${changeColorClasses[changeType]} flex items-center gap-1`}>
              <span className="text-xl font-bold">
                {changeType === 'positive' ? '↗' : changeType === 'negative' ? '↘' : '→'}
              </span>
              {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}{change}
            </div>
          )}
        </div>
        
        <div className="text-left">
          <p className="text-sm font-medium text-[var(--text-secondary)] mb-2 tracking-wide uppercase">
            {title}
          </p>
          <p className={`text-3xl font-bold text-mono tracking-tight ${
            title === 'Credit Debt' 
              ? 'text-[var(--accent-muted-red)]' 
              : title === 'Investments' || title === 'Cash Balance'
              ? 'text-[var(--accent-sage-green)]'
              : title === 'Net Worth' 
              ? (parseFloat(value.replace(/[$,]/g, '')) >= 0 ? 'text-[var(--accent-sage-green)]' : 'text-[var(--accent-muted-red)]')
              : 'text-[var(--text-accent)]'
          }`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
