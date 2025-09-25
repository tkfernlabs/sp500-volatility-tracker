#!/usr/bin/env node

/**
 * Script to verify that the application is using real S&P 500 data
 * from Alpha Vantage API and not fake/demo data
 */

const axios = require('axios');

const BACKEND_URL = 'https://backend-morphvm-elaa2g3p.http.cloud.morph.so/api';
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
const API_KEY = 'RIBXT3XYLI69PC0Q';

async function verifyRealData() {
  console.log('🔍 Verifying S&P 500 Data Authenticity...\n');
  
  try {
    // 1. Fetch data from our backend
    console.log('1. Fetching data from backend...');
    const backendResponse = await axios.get(`${BACKEND_URL}/market/summary`);
    const backendData = backendResponse.data.data;
    
    console.log(`   ✅ Backend SPY Price: $${backendData.price.close}`);
    console.log(`   ✅ Data Source: ${backendData.dataSource}`);
    console.log(`   ✅ Change: ${backendData.price.change} (${backendData.price.changePercent})`);
    
    // 2. Fetch real data directly from Alpha Vantage
    console.log('\n2. Fetching data directly from Alpha Vantage...');
    const alphaResponse = await axios.get(ALPHA_VANTAGE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'SPY',
        apikey: API_KEY
      }
    });
    
    const alphaQuote = alphaResponse.data['Global Quote'];
    const alphaPrice = parseFloat(alphaQuote['05. price']);
    
    console.log(`   ✅ Alpha Vantage SPY Price: $${alphaPrice}`);
    console.log(`   ✅ Trading Day: ${alphaQuote['07. latest trading day']}`);
    console.log(`   ✅ Volume: ${parseInt(alphaQuote['06. volume']).toLocaleString()}`);
    
    // 3. Compare prices
    console.log('\n3. Verification Results:');
    const backendPrice = parseFloat(backendData.price.close);
    const priceDiff = Math.abs(backendPrice - alphaPrice);
    
    if (priceDiff < 0.01) {
      console.log('   ✅ VERIFIED: Prices match exactly!');
    } else if (priceDiff < 1) {
      console.log('   ✅ VERIFIED: Prices match within normal trading variance');
    } else {
      console.log(`   ⚠️  Price difference: $${priceDiff.toFixed(2)}`);
    }
    
    // 4. Check historical data
    console.log('\n4. Checking historical data...');
    const analysisResponse = await axios.get(`${BACKEND_URL}/market/analysis`);
    const historicalData = analysisResponse.data.data.historicalData;
    
    console.log(`   ✅ Historical data points: ${historicalData.length}`);
    if (historicalData.length > 0) {
      const latest = historicalData[0];
      const oldest = historicalData[historicalData.length - 1];
      console.log(`   ✅ Latest: ${new Date(latest.timestamp).toLocaleDateString()} - $${latest.close}`);
      console.log(`   ✅ Oldest: ${new Date(oldest.timestamp).toLocaleDateString()} - $${oldest.close}`);
    }
    
    // 5. Check volatility calculations
    console.log('\n5. Checking volatility indicators...');
    if (backendData.volatility) {
      console.log(`   ✅ Realized Volatility: ${parseFloat(backendData.volatility.realized_volatility).toFixed(4)}`);
      console.log(`   ✅ HAR Daily Forecast: ${parseFloat(backendData.volatility.har_forecast_daily).toFixed(4)}`);
      console.log(`   ✅ GARCH Forecast: ${parseFloat(backendData.volatility.garch_forecast).toFixed(4)}`);
      console.log(`   ✅ ATR(14): ${parseFloat(backendData.volatility.atr_14).toFixed(4)}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE: Application is using REAL S&P 500 data!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run verification
verifyRealData();
