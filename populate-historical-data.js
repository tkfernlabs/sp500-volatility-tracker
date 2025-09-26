require('dotenv').config();
const yahooFinance = require('yahoo-finance2').default;
const { pool } = require('./db/database');

async function populateHistoricalData() {
  try {
    console.log('Fetching historical data from Yahoo Finance...');
    
    // Get 60 days of historical data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    const result = await yahooFinance.chart('^GSPC', {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    if (!result || !result.quotes) {
      throw new Error('No historical data received');
    }
    
    console.log(`Fetched ${result.quotes.length} days of historical data`);
    
    // Insert into database
    for (const quote of result.quotes) {
      const timestamp = new Date(quote.date);
      
      // Insert market data
      const marketQuery = `
        INSERT INTO market_data (symbol, timestamp, open, high, low, close, volume)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (symbol, timestamp) DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume
      `;
      
      await pool.query(marketQuery, [
        '^GSPC',
        timestamp,
        quote.open,
        quote.high,
        quote.low,
        quote.close,
        quote.volume || 0
      ]);
      
      // Calculate simple volatility metrics
      if (quote.high && quote.low && quote.close) {
        const dailyReturn = quote.close && result.quotes[result.quotes.indexOf(quote) - 1]?.close ?
          Math.abs((quote.close - result.quotes[result.quotes.indexOf(quote) - 1].close) / 
          result.quotes[result.quotes.indexOf(quote) - 1].close) : 0;
        
        const parkisonVol = quote.high && quote.low ? 
          Math.sqrt(Math.pow(Math.log(quote.high / quote.low), 2) / (4 * Math.log(2))) : 0;
        
        const volQuery = `
          INSERT INTO volatility_indicators (
            symbol, timestamp, realized_volatility, garch_forecast, 
            atr_14, parkinson_volatility, garman_klass_volatility
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (symbol, timestamp) DO UPDATE SET
            realized_volatility = EXCLUDED.realized_volatility,
            garch_forecast = EXCLUDED.garch_forecast,
            atr_14 = EXCLUDED.atr_14,
            parkinson_volatility = EXCLUDED.parkinson_volatility,
            garman_klass_volatility = EXCLUDED.garman_klass_volatility
        `;
        
        await pool.query(volQuery, [
          '^GSPC',
          timestamp,
          dailyReturn * Math.sqrt(252) * 100, // Annualized volatility
          dailyReturn * Math.sqrt(252) * 100 * 0.95, // Simple GARCH estimate
          (quote.high - quote.low), // Simple ATR proxy
          parkisonVol,
          parkisonVol * 1.05 // Simple GK proxy
        ]);
      }
    }
    
    console.log('Historical data populated successfully');
    
    // Verify data
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM market_data WHERE symbol = $1',
      ['^GSPC']
    );
    
    console.log(`Total records in database: ${countResult.rows[0].count}`);
    
  } catch (error) {
    console.error('Error populating historical data:', error);
  } finally {
    await pool.end();
  }
}

populateHistoricalData();
