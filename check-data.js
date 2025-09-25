require('dotenv').config();
const { pool } = require('./db/database');

async function checkData() {
  try {
    // Check for any corrupted timestamps
    const result = await pool.query(`
      SELECT id, timestamp, symbol, close
      FROM market_data 
      WHERE symbol = 'SPY'
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    
    console.log('Recent market data:');
    result.rows.forEach(row => {
      const ts = new Date(row.timestamp);
      console.log(`ID: ${row.id}, Timestamp: ${row.timestamp}, Year: ${ts.getFullYear()}, Close: ${row.close}`);
    });
    
    // Check for invalid years
    const invalidResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM market_data
      WHERE EXTRACT(YEAR FROM timestamp) > 2025 OR EXTRACT(YEAR FROM timestamp) < 2024
    `);
    
    console.log(`\nRecords with invalid years: ${invalidResult.rows[0].count}`);
    
    // Check volatility indicators for NaN
    const volResult = await pool.query(`
      SELECT id, bollinger_band_width, atr_14
      FROM volatility_indicators
      WHERE symbol = 'SPY'
      ORDER BY timestamp DESC
      LIMIT 5
    `);
    
    console.log('\nVolatility indicators:');
    volResult.rows.forEach(row => {
      console.log(`ID: ${row.id}, BB Width: ${row.bollinger_band_width}, ATR: ${row.atr_14}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkData();
