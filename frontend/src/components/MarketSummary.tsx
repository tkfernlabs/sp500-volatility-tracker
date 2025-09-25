import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, BarChart2, Clock } from 'lucide-react';
import { MarketSummary as MarketSummaryType } from '../services/api';

interface MarketSummaryProps {
  summary: MarketSummaryType;
  lastUpdate?: Date;
}

const MarketSummary: React.FC<MarketSummaryProps> = ({ summary, lastUpdate }) => {
  const formatVolume = (volume: string) => {
    const num = parseFloat(volume);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(0);
  };

  const isPositive = (value: number) => value >= 0;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart2 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">S&P 500 Market Summary</h3>
        </div>
        {lastUpdate && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Last Close</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            ${parseFloat(summary.last_close).toFixed(2)}
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            {isPositive(summary.change_1d) ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-gray-500">1 Day</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            isPositive(summary.change_1d) ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositive(summary.change_1d) ? '+' : ''}{summary.change_1d.toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            {isPositive(summary.change_5d) ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs text-gray-500">5 Day</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${
            isPositive(summary.change_5d) ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositive(summary.change_5d) ? '+' : ''}{summary.change_5d.toFixed(2)}%
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">Volume</span>
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {formatVolume(summary.volume)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Market Status: OPEN</span>
          </div>
          <span className="text-xs text-gray-500">
            Data updates every 15 minutes during market hours
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketSummary;
