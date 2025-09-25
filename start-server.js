require('dotenv').config();
const express = require('express');
const cors = require('cors');
const MarketDataService = require('./services/marketDataService');
const VolatilityAnalysisService = require('./services/volatilityAnalysisService');
const { initDatabase, pool } = require('./db/database');

const app = express();
const marketDataService = new MarketDataService();
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
    const { symbol = 'SPY' } = req.query;
    
    // Try to get real-time quote
    let currentQuote = null;
    try {
      currentQuote = await marketDataService.fetchQuote(symbol);
      console.log('Fetched real-time quote:', currentQuote);
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
      timestamp: new Date(currentQuote.latestTradingDay),
      open: currentQuote.open,
      high: currentQuote.high,
      low: currentQuote.low,
      close: currentQuote.price,
      volume: currentQuote.volume,
      change: currentQuote.change,
      changePercent: currentQuote.changePercent,
      isRealTime: true
    } : (priceResult.rows[0] || null);
    
    res.json({
      success: true,
      data: {
        symbol,
        timestamp: new Date(),
        price: priceData,
        volatility: volResult.rows[0] || null,
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
    const { symbol = 'SPY' } = req.query;
    
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
    
    res.json({
      success: true,
      data: {
        symbol,
        historicalData: dataResult.rows,
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
    const { symbol = 'SPY' } = req.body;
    
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
      const marketData = await marketDataService.fetchSP500Data('SPY');
      await marketDataService.saveMarketData(marketData);
      console.log('Initial market data saved');
      
      // Run initial analysis
      console.log('Running initial analysis...');
      await volatilityAnalysisService.analyzeVolatility('SPY');
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
