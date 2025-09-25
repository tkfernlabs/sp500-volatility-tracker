import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import MarketAPI, { MarketAnalysis, HistoricalData } from './services/api';
import VolatilityRegime from './components/VolatilityRegime';
import HARModelChart from './components/HARModelChart';
import TradingSignals from './components/TradingSignals';
import VolatilityMetrics from './components/VolatilityMetrics';
import HistoricalChart from './components/HistoricalChart';
import MarketSummary from './components/MarketSummary';

function App() {
  const [marketData, setMarketData] = useState<MarketAnalysis | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiHealth, setApiHealth] = useState(false);

  const fetchData = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);

    try {
      // Check API health first
      const health = await MarketAPI.checkHealth();
      setApiHealth(health);

      if (!health) {
        throw new Error('API is not responding. Please check the backend service.');
      }

      // Fetch all data in parallel
      const [analysis, historical] = await Promise.all([
        MarketAPI.getMarketAnalysis(),
        MarketAPI.getHistoricalData('SPY')
      ]);

      setMarketData(analysis);
      setHistoricalData(historical);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Trigger backend update first
      await MarketAPI.triggerUpdate('SPY');
      // Then fetch the updated data
      await fetchData(false);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data');
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchData(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  if (loading && !marketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading S&P 500 volatility data...</p>
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">S&P 500 Volatility Tracker</h1>
                <p className="text-sm text-gray-400">HAR Model & Advanced Analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${apiHealth ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-xs text-gray-400">
                  {apiHealth ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {marketData && (
          <div className="space-y-6">
            {/* Market Summary */}
            <MarketSummary 
              summary={marketData.market_summary} 
              lastUpdate={lastUpdate}
            />

            {/* Top Row - Volatility Regime and Signals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VolatilityRegime 
                regime={marketData.volatility_regime}
                currentVolatility={marketData.volatility_indicators.realized_volatility}
              />
              <TradingSignals signals={marketData.signals} />
            </div>

            {/* HAR Model Visualization */}
            <HARModelChart 
              volatilityIndicators={marketData.volatility_indicators}
              harModel={marketData.har_model}
            />

            {/* Volatility Metrics */}
            <VolatilityMetrics indicators={marketData.volatility_indicators} />

            {/* Historical Chart */}
            {historicalData.length > 0 && (
              <HistoricalChart data={historicalData} />
            )}

            {/* Footer Info */}
            <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center space-x-4">
                  <span>Symbol: SPY</span>
                  <span>•</span>
                  <span>Exchange: NYSE</span>
                  <span>•</span>
                  <span>Data Provider: Alpha Vantage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Last Update: {lastUpdate.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
