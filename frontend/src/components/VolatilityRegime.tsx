import React from 'react';
import { AlertTriangle, TrendingUp, Activity, Shield } from 'lucide-react';

interface VolatilityRegimeProps {
  regime: 'low' | 'normal' | 'elevated' | 'extreme';
  currentVolatility?: number;
}

const VolatilityRegime: React.FC<VolatilityRegimeProps> = ({ regime, currentVolatility }) => {
  const getRegimeConfig = () => {
    switch (regime) {
      case 'extreme':
        return {
          color: 'bg-red-600',
          borderColor: 'border-red-600',
          textColor: 'text-red-600',
          icon: <AlertTriangle className="w-6 h-6" />,
          label: 'EXTREME VOLATILITY',
          description: 'Market is experiencing extreme volatility. High risk environment.',
          animation: 'animate-pulse'
        };
      case 'elevated':
        return {
          color: 'bg-orange-500',
          borderColor: 'border-orange-500',
          textColor: 'text-orange-500',
          icon: <TrendingUp className="w-6 h-6" />,
          label: 'ELEVATED VOLATILITY',
          description: 'Volatility is above normal levels. Exercise caution.',
          animation: ''
        };
      case 'normal':
        return {
          color: 'bg-blue-500',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-500',
          icon: <Activity className="w-6 h-6" />,
          label: 'NORMAL VOLATILITY',
          description: 'Market conditions are within normal range.',
          animation: ''
        };
      case 'low':
        return {
          color: 'bg-green-500',
          borderColor: 'border-green-500',
          textColor: 'text-green-500',
          icon: <Shield className="w-6 h-6" />,
          label: 'LOW VOLATILITY',
          description: 'Market is calm with minimal volatility.',
          animation: ''
        };
    }
  };

  const config = getRegimeConfig();

  return (
    <div className={`relative rounded-lg border-2 ${config.borderColor} bg-slate-900/50 backdrop-blur-sm p-6`}>
      <div className={`absolute top-0 right-0 w-2 h-2 m-3 ${config.color} rounded-full ${config.animation}`}></div>
      
      <div className="flex items-center space-x-4">
        <div className={`${config.textColor} p-3 bg-slate-800 rounded-lg`}>
          {config.icon}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${config.textColor}`}>
            {config.label}
          </h3>
          <p className="text-gray-400 text-sm mt-1">{config.description}</p>
          {currentVolatility !== undefined && (
            <div className="mt-2">
              <span className="text-gray-500 text-xs">Current Volatility: </span>
              <span className="text-white font-mono text-sm">
                {(currentVolatility * 100).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        {['low', 'normal', 'elevated', 'extreme'].map((level) => (
          <div
            key={level}
            className={`flex-1 h-2 rounded-full ${
              level === regime
                ? level === 'extreme' ? 'bg-red-600' :
                  level === 'elevated' ? 'bg-orange-500' :
                  level === 'normal' ? 'bg-blue-500' :
                  'bg-green-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default VolatilityRegime;
