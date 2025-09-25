const { pool } = require('../db/database');
const VolatilityModels = require('../models/volatilityModels');
const MarketDataService = require('./marketDataService');

class VolatilityAnalysisService {
  constructor() {
    this.marketDataService = new MarketDataService();
  }

  /**
   * Perform comprehensive volatility analysis
   */
  async analyzeVolatility(symbol = 'SPY') {
    try {
      // Get market data
      const marketData = await this.marketDataService.getLatestData(symbol, 252);
      
      if (marketData.length < 30) {
        throw new Error('Insufficient data for volatility analysis');
      }

      // Extract price arrays
      const closes = marketData.map(d => d.close);
      const highs = marketData.map(d => d.high);
      const lows = marketData.map(d => d.low);
      const opens = marketData.map(d => d.open);
      
      // Calculate returns
      const returns = VolatilityModels.calculateReturns(closes, 'log');
      
      // Calculate various volatility measures
      const realizedVol = VolatilityModels.calculateRealizedVolatility(returns);
      const parkinsonVol = VolatilityModels.calculateParkinsonVolatility(highs, lows);
      const garmanKlassVol = VolatilityModels.calculateGarmanKlassVolatility(opens, highs, lows, closes);
      const atr = VolatilityModels.calculateATR(highs, lows, closes);
      const bollingerWidth = VolatilityModels.calculateBollingerBandWidth(closes);
      
      // Calculate rolling volatilities for HAR model
      const rollingVols = this.calculateRollingVolatilities(returns, 20);
      
      // Fit HAR model
      const harModel = VolatilityModels.fitHARModel(rollingVols);
      
      // Generate forecasts
      let harForecastDaily = null;
      let harForecastWeekly = null;
      let harForecastMonthly = null;
      
      if (harModel && rollingVols.length >= 22) {
        harForecastDaily = VolatilityModels.forecastHAR(harModel, rollingVols);
        
        // Weekly forecast (5 days ahead)
        harForecastWeekly = harForecastDaily * Math.sqrt(5);
        
        // Monthly forecast (22 days ahead)
        harForecastMonthly = harForecastDaily * Math.sqrt(22);
      }
      
      // GARCH forecast
      const garchForecast = VolatilityModels.forecastGARCH(returns, realizedVol);
      
      // Identify volatility regime
      const regime = VolatilityModels.identifyVolatilityRegime(realizedVol, rollingVols);
      
      // Calculate trend
      const trend = this.calculateTrend(closes);
      
      // Generate trading signals
      const volatilityData = {
        realized_volatility: realizedVol,
        har_forecast: harForecastDaily,
        regime: regime,
        bollinger_width: bollingerWidth,
        historical_avg_width: 0.1 // Placeholder
      };
      
      const priceData = {
        trend: trend,
        current_price: closes[closes.length - 1]
      };
      
      const signals = VolatilityModels.generateVolatilitySignals(volatilityData, priceData);
      
      // Prepare result
      const analysis = {
        symbol,
        timestamp: new Date(),
        volatility_indicators: {
          realized_volatility: realizedVol,
          har_forecast_daily: harForecastDaily,
          har_forecast_weekly: harForecastWeekly,
          har_forecast_monthly: harForecastMonthly,
          garch_forecast: garchForecast,
          atr_14: atr,
          bollinger_band_width: bollingerWidth,
          parkinson_volatility: parkinsonVol,
          garman_klass_volatility: garmanKlassVol
        },
        har_model: harModel,
        volatility_regime: regime,
        trend: trend,
        signals: signals,
        market_summary: {
          last_close: closes[closes.length - 1],
          change_1d: ((closes[closes.length - 1] - closes[closes.length - 2]) / closes[closes.length - 2]) * 100,
          change_5d: closes.length >= 5 ? ((closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6]) * 100 : null,
          volume: marketData[marketData.length - 1].volume
        }
      };
      
      // Save to database
      await this.saveVolatilityIndicators(analysis);
      await this.saveHARModel(symbol, harModel);
      await this.saveTradingSignals(symbol, signals, regime);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing volatility:', error);
      throw error;
    }
  }

  /**
   * Calculate rolling volatilities for HAR model
   */
  calculateRollingVolatilities(returns, window = 20) {
    const volatilities = [];
    
    for (let i = window - 1; i < returns.length; i++) {
      const windowReturns = returns.slice(i - window + 1, i + 1);
      const vol = VolatilityModels.calculateRealizedVolatility(windowReturns, 1);
      volatilities.push(vol);
    }
    
    return volatilities;
  }

  /**
   * Calculate price trend
   */
  calculateTrend(prices) {
    if (prices.length < 20) return 'unknown';
    
    const sma20 = prices.slice(-20).reduce((a, b) => a + b) / 20;
    const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b) / 50 : sma20;
    const currentPrice = prices[prices.length - 1];
    
    if (currentPrice > sma20 && sma20 > sma50) return 'up';
    if (currentPrice < sma20 && sma20 < sma50) return 'down';
    return 'sideways';
  }

  /**
   * Save volatility indicators to database
   */
  async saveVolatilityIndicators(analysis) {
    const query = `
      INSERT INTO volatility_indicators (
        symbol, timestamp, realized_volatility, har_forecast_daily,
        har_forecast_weekly, har_forecast_monthly, garch_forecast,
        atr_14, bollinger_band_width, parkinson_volatility, garman_klass_volatility
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (symbol, timestamp) DO UPDATE SET
        realized_volatility = $3,
        har_forecast_daily = $4,
        har_forecast_weekly = $5,
        har_forecast_monthly = $6,
        garch_forecast = $7,
        atr_14 = $8,
        bollinger_band_width = $9,
        parkinson_volatility = $10,
        garman_klass_volatility = $11
    `;
    
    const values = [
      analysis.symbol,
      analysis.timestamp,
      analysis.volatility_indicators.realized_volatility,
      analysis.volatility_indicators.har_forecast_daily,
      analysis.volatility_indicators.har_forecast_weekly,
      analysis.volatility_indicators.har_forecast_monthly,
      analysis.volatility_indicators.garch_forecast,
      analysis.volatility_indicators.atr_14,
      analysis.volatility_indicators.bollinger_band_width,
      analysis.volatility_indicators.parkinson_volatility,
      analysis.volatility_indicators.garman_klass_volatility
    ];
    
    await pool.query(query, values);
  }

  /**
   * Save HAR model parameters
   */
  async saveHARModel(symbol, model) {
    if (!model) return;
    
    const query = `
      INSERT INTO har_model_params (
        symbol, updated_at, daily_coef, weekly_coef, 
        monthly_coef, intercept, r_squared, mse
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (symbol, updated_at) DO UPDATE SET
        daily_coef = $3,
        weekly_coef = $4,
        monthly_coef = $5,
        intercept = $6,
        r_squared = $7,
        mse = $8
    `;
    
    await pool.query(query, [
      symbol,
      new Date(),
      model.dailyCoef,
      model.weeklyCoef,
      model.monthlyCoef,
      model.intercept,
      model.rSquared,
      model.mse
    ]);
  }

  /**
   * Save trading signals
   */
  async saveTradingSignals(symbol, signals, regime) {
    for (const signal of signals) {
      const query = `
        INSERT INTO trading_signals (
          symbol, timestamp, signal_type, signal_strength,
          volatility_regime, recommended_action, confidence_level, risk_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      
      const confidence = signal.strength * 100;
      const riskScore = regime === 'extreme' ? 90 : 
                        regime === 'elevated' ? 70 :
                        regime === 'normal' ? 50 : 30;
      
      await pool.query(query, [
        symbol,
        new Date(),
        signal.type,
        signal.strength * 100,
        regime,
        signal.action,
        confidence,
        riskScore
      ]);
    }
  }

  /**
   * Get historical volatility analysis
   */
  async getHistoricalAnalysis(symbol, days = 30) {
    const query = `
      SELECT * FROM volatility_indicators
      WHERE symbol = $1
        AND timestamp >= NOW() - INTERVAL '${days} days'
      ORDER BY timestamp DESC
    `;
    
    const result = await pool.query(query, [symbol]);
    return result.rows;
  }

  /**
   * Get latest signals
   */
  async getLatestSignals(symbol, limit = 10) {
    const query = `
      SELECT * FROM trading_signals
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [symbol, limit]);
    return result.rows;
  }
}

module.exports = VolatilityAnalysisService;
