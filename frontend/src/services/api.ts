import axios from 'axios';

const API_BASE_URL = 'https://backend-morphvm-elaa2g3p.http.cloud.morph.so/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface VolatilityIndicators {
  realized_volatility: number;
  har_forecast_daily: number;
  har_forecast_weekly: number;
  har_forecast_monthly: number;
  garch_forecast: number;
  atr_14: number;
  bollinger_band_width: number;
  parkinson_volatility: number;
  garman_klass_volatility: number;
}

export interface HARModel {
  dailyCoef: number;
  weeklyCoef: number;
  monthlyCoef: number;
  rSquared: number;
  intercept?: number;
}

export interface Signal {
  id?: string;
  type: string;
  action: string;
  strength: number;
  reason: string;
  timestamp?: string;
}

export interface MarketSummary {
  last_close: string;
  change_1d: number;
  change_5d: number;
  volume: string;
  timestamp?: string;
}

export interface MarketAnalysis {
  symbol: string;
  volatility_indicators: VolatilityIndicators;
  har_model: HARModel;
  volatility_regime: 'low' | 'normal' | 'elevated' | 'extreme';
  signals: Signal[];
  market_summary: MarketSummary;
  timestamp?: string;
}

export interface HistoricalData {
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  realized_volatility?: number;
  timestamp?: string;
}

export interface VolatilityHistory {
  date: string;
  realized_volatility: number;
  har_forecast_daily?: number;
  har_forecast_weekly?: number;
  har_forecast_monthly?: number;
  garch_forecast?: number;
  atr_14?: number;
}

class MarketAPI {
  async getMarketAnalysis(): Promise<MarketAnalysis> {
    const response = await api.get('/market/analysis');
    return response.data.data || response.data;
  }

  async getHistoricalData(
    symbol: string = 'SPY',
    startDate?: string,
    endDate?: string
  ): Promise<HistoricalData[]> {
    const params = new URLSearchParams();
    params.append('symbol', symbol);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await api.get(`/market/historical?${params.toString()}`);
    const data = response.data.data || response.data;
    
    // Map timestamp to date field and convert string values to numbers
    return data.map((item: any) => ({
      date: item.timestamp || item.date,
      close: parseFloat(item.close),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      volume: parseInt(item.volume),
      realized_volatility: item.realized_volatility
    }));
  }

  async getMarketSummary(): Promise<MarketSummary> {
    const response = await api.get('/market/summary');
    return response.data.data || response.data;
  }

  async getVolatilityIndicators(
    symbol: string = 'SPY',
    days: number = 30
  ): Promise<VolatilityHistory[]> {
    const response = await api.get(`/volatility/indicators?symbol=${symbol}&days=${days}`);
    return response.data.data || response.data;
  }

  async getLatestSignals(
    symbol: string = 'SPY',
    limit: number = 10
  ): Promise<Signal[]> {
    const response = await api.get(`/signals/latest?symbol=${symbol}&limit=${limit}`);
    return response.data.data || response.data;
  }

  async getHARModel(symbol: string = 'SPY'): Promise<HARModel> {
    const response = await api.get(`/models/har/${symbol}`);
    return response.data.data || response.data;
  }

  async triggerUpdate(symbol: string = 'SPY'): Promise<any> {
    const response = await api.post('/market/update', { symbol });
    return response.data;
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await api.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export default new MarketAPI();
