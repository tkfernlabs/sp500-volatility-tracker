require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MarketDataService = require('./services/marketDataService');
const YahooFinanceService = require('./services/yahooFinanceService');
const VolatilityAnalysisService = require('./services/volatilityAnalysisService');
const { initDatabase, pool } = require('./db/database');

const app = express();
const marketDataService = new MarketDataService();
const yahooFinanceService = new YahooFinanceService();
const volatilityAnalysisService = new VolatilityAnalysisService();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Get market summary with real-time data
app.get('/api/market/summary', async (req, res) => {
  try {
    const { symbol = '^GSPC' } = req.query;
    
    // Get real-time quote from Yahoo Finance
    let currentQuote = null;
    try {
      currentQuote = await yahooFinanceService.getRealTimeQuote(symbol);
      console.log('Fetched real-time quote from Yahoo:', currentQuote);
    } catch (error) {
      console.log('Could not fetch real-time quote:', error.message);
    }
    
    // Get data from database
    const priceQuery = `
      SELECT * FROM market_data 
      WHERE symbol = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    const volQuery = `
      SELECT * FROM volatility_indicators 
      WHERE symbol = $1 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
    
    const [priceResult, volResult] = await Promise.all([
      pool.query(priceQuery, [symbol]),
      pool.query(volQuery, [symbol])
    ]);
    
    // Use real-time data if available
    const priceData = currentQuote ? {
      symbol: currentQuote.symbol,
      timestamp: currentQuote.timestamp || new Date().toISOString(),
      open: String((currentQuote.open || 0).toFixed(2)),
      high: String((currentQuote.high || 0).toFixed(2)),
      low: String((currentQuote.low || 0).toFixed(2)),
      close: String((currentQuote.price || 0).toFixed(2)),
      volume: String(currentQuote.volume || 0),
      change: currentQuote.change || 0,
      changePercent: currentQuote.changePercent || 0,
      isRealTime: true
    } : (priceResult.rows[0] || null);
    
    // Clean up volatility data to handle NaN values
    let volatilityData = volResult.rows[0] || null;
    if (volatilityData) {
      Object.keys(volatilityData).forEach(key => {
        if (typeof volatilityData[key] === 'string' && 
            (volatilityData[key] === 'NaN' || volatilityData[key] === 'null')) {
          volatilityData[key] = null;
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        symbol,
        timestamp: new Date(),
        price: priceData,
        volatility: volatilityData,
        dataSource: currentQuote ? 'real-time' : 'database'
      }
    });
  } catch (error) {
    console.error('Error in market summary:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get analysis
app.get('/api/market/analysis', async (req, res) => {
  try {
    const { symbol = '^GSPC' } = req.query;
    
    // Get recent data and analysis
    const dataQuery = `
      SELECT * FROM market_data 
      WHERE symbol = $1 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    
    const signalsQuery = `
      SELECT * FROM trading_signals 
      WHERE symbol = $1 
      AND timestamp >= NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
    `;
    
    const harQuery = `
      SELECT * FROM har_model_params 
      WHERE symbol = $1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const [dataResult, signalsResult, harResult] = await Promise.all([
      pool.query(dataQuery, [symbol]),
      pool.query(signalsQuery, [symbol]),
      pool.query(harQuery, [symbol])
    ]);
    
    // Filter and validate historical data
    const validHistoricalData = dataResult.rows.filter(row => {
      const year = new Date(row.timestamp).getFullYear();
      return year >= 2024 && year <= 2025 && !isNaN(Date.parse(row.timestamp));
    });
    
    res.json({
      success: true,
      data: {
        symbol,
        historicalData: validHistoricalData,
        signals: signalsResult.rows,
        harModel: harResult.rows[0] || null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error in analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Manual data update
app.post('/api/market/update', async (req, res) => {
  try {
    const { symbol = '^GSPC' } = req.body;
    
    console.log(`Manual update requested for ${symbol}`);
    
    // Fetch and save market data
    const marketData = await marketDataService.fetchSP500Data(symbol);
    const saveResult = await marketDataService.saveMarketData(marketData);
    
    // Run analysis
    const analysis = await volatilityAnalysisService.analyzeVolatility(symbol);
    
    res.json({
      success: true,
      message: 'Data updated successfully',
      dataPoints: saveResult.count,
      analysis: analysis
    });
  } catch (error) {
    console.error('Error in manual update:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;

// Initialize database and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await initDatabase();
    console.log('Database initialized');
    
    // Fetch initial data with error handling
    try {
      console.log('Fetching initial market data...');
      const marketData = await marketDataService.fetchSP500Data('^GSPC');
      await marketDataService.saveMarketData(marketData);
      console.log('Initial market data saved');
      
      // Run initial analysis
      console.log('Running initial analysis...');
      await volatilityAnalysisService.analyzeVolatility('^GSPC');
      console.log('Initial analysis completed');
    } catch (dataError) {
      console.error('Error loading initial data:', dataError.message);
      console.log('Server will start without initial data - use /api/market/update to load data');
    }
    
    app.listen(PORT, () => {
      console.log(`\nServer running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log('\nEndpoints:');
      console.log('GET  /api/health - Health check');
      console.log('GET  /api/market/summary - Get real-time market summary');
      console.log('GET  /api/market/analysis - Get analysis and signals');
      console.log('POST /api/market/update - Trigger manual data update');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
