require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initDatabase } = require('./db/database');
const MarketDataService = require('./services/marketDataService');
const VolatilityAnalysisService = require('./services/volatilityAnalysisService');

const app = express();
const PORT = process.env.PORT || 3000;

// Services
const marketDataService = new MarketDataService();
const volatilityAnalysisService = new VolatilityAnalysisService();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Get current market data and volatility analysis
app.get('/api/market/analysis', async (req, res) => {
  try {
    const symbol = req.query.symbol || 'SPY';
    
    // Fetch and save latest market data
    const marketData = await marketDataService.fetchSP500Data(symbol);
    await marketDataService.saveMarketData(marketData);
    
    // Perform volatility analysis
    const analysis = await volatilityAnalysisService.analyzeVolatility(symbol);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error in market analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get historical market data
app.get('/api/market/historical', async (req, res) => {
  try {
    const { symbol = 'SPY', startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const data = await marketDataService.getHistoricalData(symbol, start, end);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get volatility indicators
app.get('/api/volatility/indicators', async (req, res) => {
  try {
    const { symbol = 'SPY', days = 30 } = req.query;
    
    const indicators = await volatilityAnalysisService.getHistoricalAnalysis(symbol, days);
    
    res.json({
      success: true,
      data: indicators
    });
  } catch (error) {
    console.error('Error fetching volatility indicators:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get trading signals
app.get('/api/signals/latest', async (req, res) => {
  try {
    const { symbol = 'SPY', limit = 10 } = req.query;
    
    const signals = await volatilityAnalysisService.getLatestSignals(symbol, limit);
    
    res.json({
      success: true,
      data: signals
    });
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger manual data update
app.post('/api/market/update', async (req, res) => {
  try {
    const { symbol = 'SPY' } = req.body;
    
    // Fetch fresh data
    const marketData = await marketDataService.fetchSP500Data(symbol);
    const savedData = await marketDataService.saveMarketData(marketData);
    
    // Run analysis
    const analysis = await volatilityAnalysisService.analyzeVolatility(symbol);
    
    res.json({
      success: true,
      message: 'Data updated successfully',
      dataPoints: savedData.count,
      analysis
    });
  } catch (error) {
    console.error('Error updating data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get HAR model parameters
app.get('/api/models/har/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { pool } = require('./db/database');
    
    const query = `
      SELECT * FROM har_model_params
      WHERE symbol = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [symbol]);
    
    res.json({
      success: true,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error fetching HAR model:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get market summary
app.get('/api/market/summary', async (req, res) => {
  try {
    const { symbol = 'SPY' } = req.query;
    const { pool } = require('./db/database');
    
    // Get latest price data
    const priceQuery = `
      SELECT * FROM market_data
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    // Get latest volatility data
    const volQuery = `
      SELECT * FROM volatility_indicators
      WHERE symbol = $1
      ORDER BY timestamp DESC
      LIMIT 1
    `;
    
    // Get active signals count
    const signalsQuery = `
      SELECT COUNT(*) as active_signals
      FROM trading_signals
      WHERE symbol = $1
        AND timestamp >= NOW() - INTERVAL '24 hours'
    `;
    
    const [priceResult, volResult, signalsResult] = await Promise.all([
      pool.query(priceQuery, [symbol]),
      pool.query(volQuery, [symbol]),
      pool.query(signalsQuery, [symbol])
    ]);
    
    const summary = {
      symbol,
      timestamp: new Date(),
      price: priceResult.rows[0] || {},
      volatility: volResult.rows[0] || {},
      active_signals: parseInt(signalsResult.rows[0]?.active_signals || 0),
      last_update: priceResult.rows[0]?.timestamp || null
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching market summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Schedule periodic updates (every 15 minutes during market hours)
cron.schedule('*/15 9-16 * * 1-5', async () => {
  console.log('Running scheduled market data update...');
  try {
    const marketData = await marketDataService.fetchSP500Data('SPY');
    await marketDataService.saveMarketData(marketData);
    await volatilityAnalysisService.analyzeVolatility('SPY');
    console.log('Scheduled update completed');
  } catch (error) {
    console.error('Error in scheduled update:', error);
  }
}, {
  timezone: "America/New_York"
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    console.log('Database initialized');
    
    // Populate initial data
    console.log('Fetching initial market data...');
    const initialData = await marketDataService.fetchSP500Data('SPY');
    await marketDataService.saveMarketData(initialData);
    console.log('Initial market data saved');
    
    // Run initial analysis
    console.log('Running initial volatility analysis...');
    await volatilityAnalysisService.analyzeVolatility('SPY');
    console.log('Initial analysis completed');
    
    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`S&P 500 Volatility Tracker Backend running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
      console.log('\nAvailable endpoints:');
      console.log('  GET  /api/health - Health check');
      console.log('  GET  /api/market/analysis - Get current analysis');
      console.log('  GET  /api/market/historical - Get historical data');
      console.log('  GET  /api/market/summary - Get market summary');
      console.log('  GET  /api/volatility/indicators - Get volatility indicators');
      console.log('  GET  /api/signals/latest - Get latest trading signals');
      console.log('  GET  /api/models/har/:symbol - Get HAR model parameters');
      console.log('  POST /api/market/update - Trigger manual update');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
