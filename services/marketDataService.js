const axios = require('axios');
const { pool } = require('../db/database');

class MarketDataService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    this.baseUrl = 'https://www.alphavantage.co/query';
  }

  /**
   * Fetch S&P 500 data from Alpha Vantage
   */
  async fetchSP500Data(symbol = 'SPY') {
    try {
      // Fetch daily data
      const dailyResponse = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol,
          apikey: this.apiKey,
          outputsize: 'compact'
        }
      });

      if (dailyResponse.data['Error Message']) {
        throw new Error('Invalid API response');
      }

      const timeSeries = dailyResponse.data['Time Series (Daily)'];
      if (!timeSeries) {
        // If demo key, return sample data
        return this.generateSampleData(symbol);
      }

      return this.parseAlphaVantageData(timeSeries, symbol);
    } catch (error) {
      console.error('Error fetching market data:', error.message);
      // Return sample data for demo purposes
      return this.generateSampleData(symbol);
    }
  }

  /**
   * Fetch intraday data for more granular analysis
   */
  async fetchIntradayData(symbol = 'SPY', interval = '5min') {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'TIME_SERIES_INTRADAY',
          symbol: symbol,
          interval: interval,
          apikey: this.apiKey,
          outputsize: 'compact'
        }
      });

      const timeSeries = response.data[`Time Series (${interval})`];
      if (!timeSeries) {
        return this.generateSampleIntradayData(symbol);
      }

      return this.parseAlphaVantageData(timeSeries, symbol);
    } catch (error) {
      console.error('Error fetching intraday data:', error.message);
      return this.generateSampleIntradayData(symbol);
    }
  }

  /**
   * Parse Alpha Vantage data format
   */
  parseAlphaVantageData(timeSeries, symbol) {
    const data = [];
    
    for (const [timestamp, values] of Object.entries(timeSeries)) {
      data.push({
        symbol: symbol,
        timestamp: new Date(timestamp),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      });
    }

    return data.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate sample data for demo/testing
   */
  generateSampleData(symbol, days = 100) {
    const data = [];
    const now = new Date();
    let price = 450; // Starting price for SPY
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic price movements
      const change = (Math.random() - 0.48) * 10; // Slight upward bias
      price = Math.max(price + change, 400); // Floor at 400
      
      const dailyVolatility = Math.random() * 5 + 2;
      const open = price + (Math.random() - 0.5) * dailyVolatility;
      const close = price + (Math.random() - 0.5) * dailyVolatility;
      const high = Math.max(open, close) + Math.random() * dailyVolatility;
      const low = Math.min(open, close) - Math.random() * dailyVolatility;
      
      data.push({
        symbol,
        timestamp: date,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 100000000 + 50000000)
      });
      
      price = close; // Set next day's base price
    }
    
    return data;
  }

  /**
   * Generate sample intraday data
   */
  generateSampleIntradayData(symbol, periods = 78) {
    const data = [];
    const now = new Date();
    let price = 450;
    
    for (let i = periods - 1; i >= 0; i--) {
      const timestamp = new Date(now);
      timestamp.setMinutes(timestamp.getMinutes() - (i * 5));
      
      const change = (Math.random() - 0.5) * 2;
      price += change;
      
      const volatility = Math.random() * 1 + 0.5;
      const open = price + (Math.random() - 0.5) * volatility;
      const close = price + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * volatility * 0.5;
      
      data.push({
        symbol,
        timestamp,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000 + 1000000)
      });
    }
    
    return data;
  }

  /**
   * Save market data to database
   */
  async saveMarketData(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const item of data) {
        await client.query(`
          INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (symbol, timestamp) DO UPDATE
          SET open = $3, high = $4, low = $5, close = $6, volume = $7
        `, [item.symbol, item.timestamp, item.open, item.high, item.low, item.close, item.volume]);
      }
      
      await client.query('COMMIT');
      return { success: true, count: data.length };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get historical market data from database
   */
  async getHistoricalData(symbol, startDate, endDate) {
    const query = `
      SELECT * FROM market_data
      WHERE symbol = $1 
        AND timestamp >= $2 
        AND timestamp <= $3
      ORDER BY timestamp ASC
    `;
    
    const result = await pool.query(query, [symbol, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get latest market data
   */
  async getLatestData(symbol, limit = 100) {
    const query = `
      SELECT * FROM market_data
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [symbol, limit]);
    return result.rows.reverse();
  }
}

module.exports = MarketDataService;
