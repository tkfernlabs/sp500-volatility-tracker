const yahooFinance = require('yahoo-finance2').default;
const { pool } = require('../db/database');

class YahooFinanceService {
  constructor() {
    // Yahoo Finance doesn't require an API key
    console.log('Yahoo Finance Service initialized');
  }

  /**
   * Fetch real S&P 500 data from Yahoo Finance
   */
  async fetchRealSP500Data(symbol = 'SPY') {
    try {
      console.log(`Fetching real-time data for ${symbol} from Yahoo Finance...`);
      
      // Get current quote
      const quote = await yahooFinance.quote(symbol);
      
      console.log('Current real-time data:', {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        marketTime: new Date(quote.regularMarketTime * 1000)
      });
      
      // Get historical data for the last 100 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 100);
      
      const historical = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });
      
      console.log(`Fetched ${historical.length} days of historical data`);
      
      // Format data for our database
      const formattedData = historical.map(day => ({
        symbol: symbol,
        timestamp: day.date,
        open: day.open,
        high: day.high,
        low: day.low,
        close: day.close,
        volume: day.volume
      }));
      
      // Add current quote as the most recent data point
      formattedData.push({
        symbol: symbol,
        timestamp: new Date(quote.regularMarketTime * 1000),
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        close: quote.regularMarketPrice,
        volume: quote.regularMarketVolume
      });
      
      return formattedData;
    } catch (error) {
      console.error('Error fetching Yahoo Finance data:', error);
      throw error;
    }
  }

  /**
   * Get real-time quote
   */
  async getRealTimeQuote(symbol = 'SPY') {
    try {
      const quote = await yahooFinance.quote(symbol);
      
      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePercent: quote.regularMarketChangePercent,
        volume: quote.regularMarketVolume,
        previousClose: quote.regularMarketPreviousClose,
        open: quote.regularMarketOpen,
        high: quote.regularMarketDayHigh,
        low: quote.regularMarketDayLow,
        marketCap: quote.marketCap,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
        timestamp: new Date(quote.regularMarketTime * 1000)
      };
    } catch (error) {
      console.error('Error fetching real-time quote:', error);
      throw error;
    }
  }

  /**
   * Clear fake data and save real data
   */
  async replaceWithRealData(symbol = 'SPY') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Clear all fake data
      console.log('Clearing fake data from database...');
      await client.query('DELETE FROM market_data WHERE symbol = $1', [symbol]);
      await client.query('DELETE FROM volatility_indicators WHERE symbol = $1', [symbol]);
      await client.query('DELETE FROM trading_signals WHERE symbol = $1', [symbol]);
      
      // Fetch real data
      const realData = await this.fetchRealSP500Data(symbol);
      
      // Insert real data
      console.log('Inserting real market data...');
      for (const dataPoint of realData) {
        await client.query(`
          INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (symbol, timestamp) DO UPDATE
          SET open = $3, high = $4, low = $5, close = $6, volume = $7
        `, [
          dataPoint.symbol,
          dataPoint.timestamp,
          dataPoint.open,
          dataPoint.high,
          dataPoint.low,
          dataPoint.close,
          dataPoint.volume
        ]);
      }
      
      await client.query('COMMIT');
      console.log(`Successfully replaced fake data with ${realData.length} real data points`);
      
      return realData;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get VIX data for volatility correlation
   */
  async getVIXData() {
    try {
      const vix = await yahooFinance.quote('^VIX');
      
      return {
        value: vix.regularMarketPrice,
        change: vix.regularMarketChange,
        changePercent: vix.regularMarketChangePercent,
        timestamp: new Date(vix.regularMarketTime * 1000)
      };
    } catch (error) {
      console.error('Error fetching VIX data:', error);
      return null;
    }
  }
}

module.exports = YahooFinanceService;
