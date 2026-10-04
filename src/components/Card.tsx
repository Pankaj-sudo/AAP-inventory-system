import React from 'react';
import './components.css';

interface CardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendType?: 'up' | 'down';
  meta?: string;
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  title,
  value,
  icon,
  trend,
  trendType,
  meta,
  glow = false,
  className = '',
  onClick
}) => {
  return (
    <div 
      className={`card ${glow ? 'card-glow' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="card-header">
        <span className="card-title">{title}</span>
        {icon && <span className="card-icon">{icon}</span>}
      </div>
      <div className="card-body">
        <div className="card-value">{value}</div>
        {(trend || meta) && (
          <div className="card-meta">
            {trend && (
              <span className={trendType === 'up' ? 'card-trend-up' : 'card-trend-down'}>
                {trendType === 'up' ? '↑' : '↓'} {trend}
              </span>
            )}
            {meta && <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{meta}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
export default Card;
