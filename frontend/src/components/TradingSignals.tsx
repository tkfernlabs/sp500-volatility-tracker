import React from 'react';
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, TrendingUp, Shield, DollarSign } from 'lucide-react';
import { Signal } from '../services/api';
import { format } from 'date-fns';

interface TradingSignalsProps {
  signals: Signal[];
}

const TradingSignals: React.FC<TradingSignalsProps> = ({ signals }) => {
  const getSignalIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'buy':
      case 'prepare_to_buy':
        return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
      case 'sell':
      case 'prepare_to_sell':
        return <ArrowDownCircle className="w-5 h-5 text-red-500" />;
      case 'hedge':
      case 'reduce_exposure':
        return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'hold':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSignalColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'buy':
      case 'prepare_to_buy':
        return 'border-green-500 bg-green-500/10';
      case 'sell':
      case 'prepare_to_sell':
        return 'border-red-500 bg-red-500/10';
      case 'hedge':
      case 'reduce_exposure':
        return 'border-yellow-500 bg-yellow-500/10';
      case 'hold':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getStrengthLabel = (strength: number) => {
    if (strength >= 0.8) return { label: 'STRONG', color: 'text-green-400' };
    if (strength >= 0.6) return { label: 'MODERATE', color: 'text-yellow-400' };
    if (strength >= 0.4) return { label: 'WEAK', color: 'text-orange-400' };
    return { label: 'MINIMAL', color: 'text-gray-400' };
  };

  if (!signals || signals.length === 0) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Trading Signals</h3>
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active signals at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <DollarSign className="w-4 h-4" />
          <span>{signals.length} Active</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {signals.map((signal, index) => {
          const strengthInfo = getStrengthLabel(signal.strength);
          
          return (
            <div
              key={signal.id || index}
              className={`border rounded-lg p-4 transition-all hover:shadow-lg ${getSignalColor(signal.action)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getSignalIcon(signal.action)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-white uppercase text-sm">
                        {signal.action.replace('_', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${strengthInfo.color}`}>
                        {strengthInfo.label}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 text-sm mt-1">
                      {signal.reason}
                    </p>
                    
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Type:</span>
                        <span className="text-xs text-gray-300 font-mono">
                          {signal.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-gray-500">Confidence:</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${signal.strength * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-300 font-mono">
                            {(signal.strength * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {signal.timestamp && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(signal.timestamp), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TradingSignals;
