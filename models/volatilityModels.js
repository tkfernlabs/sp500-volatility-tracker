const math = require('mathjs');
const ss = require('simple-statistics');

class VolatilityModels {
  /**
   * Calculate realized volatility
   */
  static calculateRealizedVolatility(returns, annualizationFactor = 252) {
    if (returns.length < 2) return null;
    
    const mean = ss.mean(returns);
    const squaredDeviations = returns.map(r => Math.pow(r - mean, 2));
    const variance = ss.mean(squaredDeviations);
    const dailyVol = Math.sqrt(variance);
    
    return dailyVol * Math.sqrt(annualizationFactor);
  }

  /**
   * HAR (Heterogeneous Autoregressive) Model Implementation
   * Forecasts volatility using daily, weekly, and monthly components
   */
  static fitHARModel(volatilities) {
    if (volatilities.length < 22) {
      return null;
    }

    // Prepare HAR components
    const features = [];
    const targets = [];

    for (let i = 22; i < volatilities.length; i++) {
      // Daily RV (t-1)
      const dailyRV = volatilities[i - 1];
      
      // Weekly RV (average of past 5 days)
      const weeklyRV = ss.mean(volatilities.slice(i - 5, i));
      
      // Monthly RV (average of past 22 days)
      const monthlyRV = ss.mean(volatilities.slice(i - 22, i));
      
      features.push([1, dailyRV, weeklyRV, monthlyRV]); // Including intercept
      targets.push(volatilities[i]);
    }

    // Perform OLS regression
    const coefficients = this.ordinaryLeastSquares(features, targets);
    
    // Calculate R-squared and MSE
    const predictions = features.map(f => 
      f.reduce((sum, val, idx) => sum + val * coefficients[idx], 0)
    );
    
    const rSquared = this.calculateRSquared(targets, predictions);
    const mse = ss.mean(predictions.map((pred, i) => Math.pow(pred - targets[i], 2)));

    return {
      intercept: coefficients[0],
      dailyCoef: coefficients[1],
      weeklyCoef: coefficients[2],
      monthlyCoef: coefficients[3],
      rSquared,
      mse
    };
  }

  /**
   * Forecast using HAR model
   */
  static forecastHAR(model, recentVolatilities) {
    if (!model || recentVolatilities.length < 22) return null;

    const dailyRV = recentVolatilities[recentVolatilities.length - 1];
    const weeklyRV = ss.mean(recentVolatilities.slice(-5));
    const monthlyRV = ss.mean(recentVolatilities.slice(-22));

    return model.intercept + 
           model.dailyCoef * dailyRV + 
           model.weeklyCoef * weeklyRV + 
           model.monthlyCoef * monthlyRV;
  }

  /**
   * Simple GARCH(1,1) volatility forecast
   */
  static forecastGARCH(returns, currentVolatility) {
    if (returns.length < 30) return null;

    // GARCH(1,1) parameters (simplified estimation)
    const omega = 0.000001; // Long-term variance
    const alpha = 0.08; // Weight on previous shock
    const beta = 0.90; // Weight on previous volatility
    
    const lastReturn = returns[returns.length - 1];
    const shock = Math.pow(lastReturn, 2);
    
    return Math.sqrt(omega + alpha * shock + beta * Math.pow(currentVolatility, 2));
  }

  /**
   * Parkinson's volatility estimator (using high-low range)
   */
  static calculateParkinsonVolatility(highPrices, lowPrices, n = 252) {
    if (highPrices.length !== lowPrices.length || highPrices.length < 2) return null;

    const ratios = highPrices.map((high, i) => Math.log(high / lowPrices[i]));
    const squaredRatios = ratios.map(r => r * r);
    const meanSquaredRatio = ss.mean(squaredRatios);
    
    return Math.sqrt(meanSquaredRatio / (4 * Math.log(2))) * Math.sqrt(n);
  }

  /**
   * Garman-Klass volatility estimator
   */
  static calculateGarmanKlassVolatility(open, high, low, close, n = 252) {
    if (open.length < 2) return null;

    const volatilities = [];
    for (let i = 1; i < open.length; i++) {
      const u = Math.log(high[i] / low[i]);
      const c = Math.log(close[i] / open[i]);
      
      const gk = 0.5 * u * u - (2 * Math.log(2) - 1) * c * c;
      volatilities.push(Math.sqrt(gk));
    }

    return ss.mean(volatilities) * Math.sqrt(n);
  }

  /**
   * Calculate Bollinger Band Width (volatility measure)
   */
  static calculateBollingerBandWidth(prices, period = 20, numStd = 2) {
    if (prices.length < period) return null;

    const sma = ss.mean(prices.slice(-period));
    const std = ss.standardDeviation(prices.slice(-period));
    
    const upperBand = sma + numStd * std;
    const lowerBand = sma - numStd * std;
    
    return (upperBand - lowerBand) / sma;
  }

  /**
   * Calculate Average True Range (ATR)
   */
  static calculateATR(high, low, close, period = 14) {
    if (high.length < period + 1) return null;

    const trueRanges = [];
    for (let i = 1; i < high.length; i++) {
      const highLow = high[i] - low[i];
      const highClose = Math.abs(high[i] - close[i - 1]);
      const lowClose = Math.abs(low[i] - close[i - 1]);
      
      trueRanges.push(Math.max(highLow, highClose, lowClose));
    }

    // Use EMA for ATR calculation
    return this.calculateEMA(trueRanges, period);
  }

  /**
   * Identify volatility regime
   */
  static identifyVolatilityRegime(currentVol, historicalVols) {
    const percentile25 = ss.quantile(historicalVols, 0.25);
    const percentile75 = ss.quantile(historicalVols, 0.75);
    const percentile90 = ss.quantile(historicalVols, 0.90);

    if (currentVol < percentile25) return 'low';
    if (currentVol < percentile75) return 'normal';
    if (currentVol < percentile90) return 'elevated';
    return 'extreme';
  }

  /**
   * Generate trading signals based on volatility analysis
   */
  static generateVolatilitySignals(volatilityData, priceData) {
    const signals = [];
    
    // Mean reversion signal
    if (volatilityData.regime === 'extreme' && volatilityData.har_forecast < volatilityData.realized_volatility) {
      signals.push({
        type: 'volatility_mean_reversion',
        action: 'prepare_to_buy',
        strength: 0.8,
        reason: 'Extreme volatility likely to revert'
      });
    }

    // Trend following in low volatility
    if (volatilityData.regime === 'low' && priceData.trend === 'up') {
      signals.push({
        type: 'low_vol_trend',
        action: 'buy',
        strength: 0.7,
        reason: 'Uptrend in low volatility environment'
      });
    }

    // Volatility breakout signal
    if (volatilityData.bollinger_width > volatilityData.historical_avg_width * 1.5) {
      signals.push({
        type: 'volatility_breakout',
        action: 'wait',
        strength: 0.6,
        reason: 'Potential volatility expansion'
      });
    }

    // HAR model divergence
    const harDivergence = Math.abs(volatilityData.har_forecast - volatilityData.realized_volatility);
    if (harDivergence > volatilityData.realized_volatility * 0.2) {
      signals.push({
        type: 'har_divergence',
        action: 'hedge',
        strength: 0.65,
        reason: 'HAR model shows significant divergence'
      });
    }

    return signals;
  }

  // Helper functions
  static ordinaryLeastSquares(features, targets) {
    const X = math.matrix(features);
    const y = math.matrix(targets);
    
    // Calculate coefficients: β = (X'X)^(-1)X'y
    const Xt = math.transpose(X);
    const XtX = math.multiply(Xt, X);
    const XtX_inv = math.inv(XtX);
    const Xty = math.multiply(Xt, y);
    
    return math.multiply(XtX_inv, Xty).toArray();
  }

  static calculateRSquared(actual, predicted) {
    const meanActual = ss.mean(actual);
    const totalSS = actual.reduce((sum, val) => sum + Math.pow(val - meanActual, 2), 0);
    const residualSS = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    
    return 1 - (residualSS / totalSS);
  }

  static calculateEMA(values, period) {
    if (values.length === 0) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = values[0];
    
    for (let i = 1; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }
    
    return ema;
  }

  /**
   * Calculate returns from prices
   */
  static calculateReturns(prices, type = 'simple') {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      if (type === 'log') {
        returns.push(Math.log(prices[i] / prices[i - 1]));
      } else {
        returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
    return returns;
  }
}

module.exports = VolatilityModels;
