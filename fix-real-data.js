#!/usr/bin/env node
require('dotenv').config();
const YahooFinanceService = require('./services/yahooFinanceService');
const VolatilityAnalysisService = require('./services/volatilityAnalysisService');
const { initDatabase } = require('./db/database');

async function fixRealData() {
  console.log('='.repeat(60));
  console.log('🔧 FIXING S&P 500 DATA - REPLACING WITH REAL DATA');
  console.log('='.repeat(60));
  
  try {
    // Initialize services
    const yahooService = new YahooFinanceService();
    const volatilityService = new VolatilityAnalysisService();
    
    // Initialize database
    console.log('\n1. Initializing database...');
    await initDatabase();
    
    // Get real-time quote first
    console.log('\n2. Fetching real-time SPY quote...');
    const quote = await yahooService.getRealTimeQuote('SPY');
    console.log(`   ✅ Current SPY Price: $${quote.price.toFixed(2)}`);
    console.log(`   ✅ Change: ${quote.change > 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)`);
    console.log(`   ✅ Volume: ${quote.volume.toLocaleString()}`);
    console.log(`   ✅ 52-Week Range: $${quote.fiftyTwoWeekLow.toFixed(2)} - $${quote.fiftyTwoWeekHigh.toFixed(2)}`);
    
    // Replace fake data with real data
    console.log('\n3. Replacing fake data with real historical data...');
    const realData = await yahooService.replaceWithRealData('SPY');
    console.log(`   ✅ Loaded ${realData.length} days of real data`);
    
    // Get VIX for correlation
    console.log('\n4. Fetching VIX data...');
    const vix = await yahooService.getVIXData();
    if (vix) {
      console.log(`   ✅ VIX: ${vix.value.toFixed(2)} (${vix.changePercent.toFixed(2)}%)`);
    }
    
    // Recalculate all volatility indicators with real data
    console.log('\n5. Recalculating volatility indicators with real data...');
    const analysis = await volatilityService.analyzeVolatility('SPY');
    
    if (analysis.volatilityIndicators) {
      console.log(`   ✅ Realized Volatility: ${analysis.volatilityIndicators.realizedVolatility.toFixed(4)}`);
      console.log(`   ✅ ATR(14): ${analysis.volatilityIndicators.atr.toFixed(2)}`);
      console.log(`   ✅ Bollinger Band Width: ${analysis.volatilityIndicators.bollingerBandWidth.toFixed(4)}`);
    }
    
    if (analysis.harModel) {
      console.log(`   ✅ HAR Model R²: ${(analysis.harModel.rSquared * 100).toFixed(2)}%`);
      console.log(`   ✅ HAR Forecast: ${analysis.harModel.forecast.toFixed(4)}`);
    }
    
    if (analysis.garchModel) {
      console.log(`   ✅ GARCH Forecast: ${analysis.garchModel.forecast.toFixed(4)}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ SUCCESS: Real S&P 500 data has been loaded!');
    console.log('='.repeat(60));
    console.log('\n📊 Current Real Market Data:');
    console.log(`   SPY: $${quote.price.toFixed(2)}`);
    console.log(`   Market Time: ${quote.timestamp.toLocaleString()}`);
    console.log(`   Data Points: ${realData.length} days of historical data`);
    console.log('\n🔄 The application is now using REAL market data from Yahoo Finance');
    console.log('🌐 Frontend URL: https://sp500-frontend-morphvm-elaa2g3p.http.cloud.morph.so');
    console.log('🌐 Backend API: https://backend-morphvm-elaa2g3p.http.cloud.morph.so/api');
    console.log('='.repeat(60));
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the fix
fixRealData();
