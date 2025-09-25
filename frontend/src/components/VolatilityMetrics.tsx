import React from 'react';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Zap } from 'lucide-react';
import { VolatilityIndicators } from '../services/api';

interface VolatilityMetricsProps {
  indicators: VolatilityIndicators;
}

const VolatilityMetrics: React.FC<VolatilityMetricsProps> = ({ indicators }) => {
  const metrics = [
    {
      name: 'Realized Volatility',
      value: indicators.realized_volatility,
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      description: 'Historical volatility from returns'
    },
    {
      name: 'GARCH Forecast',
      value: indicators.garch_forecast,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      description: 'GARCH model prediction'
    },
    {
      name: 'ATR (14)',
      value: indicators.atr_14,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      description: 'Average True Range indicator'
    },
    {
      name: 'Bollinger Width',
      value: indicators.bollinger_band_width,
      icon: <Zap className="w-5 h-5" />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      description: 'Band width indicator'
    },
    {
      name: 'Parkinson Vol',
      value: indicators.parkinson_volatility,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      description: 'High-Low range estimator'
    },
    {
      name: 'Garman-Klass',
      value: indicators.garman_klass_volatility,
      icon: <TrendingDown className="w-5 h-5" />,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      description: 'OHLC volatility estimator'
    }
  ];

  const formatValue = (value: number, isPercentage: boolean = true) => {
    if (value === null || value === undefined) return 'N/A';
    if (isPercentage) {
      return `${(value * 100).toFixed(2)}%`;
    }
    return value.toFixed(2);
  };

  const getTrendIcon = (value: number, reference: number) => {
    const diff = value - reference;
    if (Math.abs(diff) < 0.001) return <Minus className="w-4 h-4 text-gray-400" />;
    if (diff > 0) return <TrendingUp className="w-4 h-4 text-red-400" />;
    return <TrendingDown className="w-4 h-4 text-green-400" />;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <h3 className="text-lg font-semibold mb-4 text-white">Volatility Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <div className={metric.color}>{metric.icon}</div>
              </div>
              {metric.name === 'Realized Volatility' && (
                getTrendIcon(metric.value, indicators.har_forecast_daily)
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-xs text-gray-400">{metric.name}</p>
              <p className="text-xl font-bold text-white font-mono">
                {formatValue(metric.value, !metric.name.includes('ATR'))}
              </p>
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Average Vol</p>
            <p className="text-sm font-mono text-white">
              {formatValue(
                (indicators.realized_volatility + 
                 indicators.parkinson_volatility + 
                 indicators.garman_klass_volatility) / 3
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">HAR Avg Forecast</p>
            <p className="text-sm font-mono text-white">
              {formatValue(
                (indicators.har_forecast_daily + 
                 indicators.har_forecast_weekly + 
                 indicators.har_forecast_monthly) / 3
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Vol Spread</p>
            <p className="text-sm font-mono text-white">
              {formatValue(
                Math.max(
                  indicators.realized_volatility,
                  indicators.parkinson_volatility,
                  indicators.garman_klass_volatility
                ) - Math.min(
                  indicators.realized_volatility,
                  indicators.parkinson_volatility,
                  indicators.garman_klass_volatility
                )
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Risk Level</p>
            <p className="text-sm font-mono text-white">
              {indicators.realized_volatility > 0.30 ? 'HIGH' :
               indicators.realized_volatility > 0.20 ? 'MEDIUM' :
               indicators.realized_volatility > 0.15 ? 'LOW' : 'MINIMAL'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolatilityMetrics;
