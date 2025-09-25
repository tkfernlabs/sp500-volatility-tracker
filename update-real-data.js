#!/usr/bin/env node
require('dotenv').config();
const YahooFinanceService = require('./services/yahooFinanceService');
const VolatilityAnalysisService = require('./services/volatilityAnalysisService');
const { pool } = require('./db/database');

async function updateRealData() {
  const yahooService = new YahooFinanceService();
  const volatilityService = new VolatilityAnalysisService();
  
  try {
    console.log(`[${new Date().toISOString()}] Updating real market data...`);
    
    // Get real-time quote
    const quote = await yahooService.getRealTimeQuote('SPY');
    console.log(`SPY: $${quote.price.toFixed(2)} (${quote.changePercent.toFixed(2)}%)`);
    
    // Save to database
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (symbol, timestamp) DO UPDATE
        SET open = $3, high = $4, low = $5, close = $6, volume = $7
      `, [
        quote.symbol,
        quote.timestamp,
        quote.open,
        quote.high,
        quote.low,
        quote.price,
        quote.volume
      ]);
      
      // Run volatility analysis
      await volatilityService.analyzeVolatility('SPY');
      
      console.log('✅ Data updated successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating data:', error.message);
  }
}

// Update immediately
updateRealData();

// Update every 5 minutes during market hours
setInterval(updateRealData, 5 * 60 * 1000);

console.log('Real-time data updater started. Updates every 5 minutes...');
