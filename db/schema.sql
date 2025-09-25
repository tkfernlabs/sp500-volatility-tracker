-- S&P 500 Tracker Database Schema

-- Market data table
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    open DECIMAL(10, 2),
    high DECIMAL(10, 2),
    low DECIMAL(10, 2),
    close DECIMAL(10, 2),
    volume BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, timestamp)
);

-- Volatility indicators table
CREATE TABLE IF NOT EXISTS volatility_indicators (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    realized_volatility DECIMAL(10, 6),
    har_forecast_daily DECIMAL(10, 6),
    har_forecast_weekly DECIMAL(10, 6),
    har_forecast_monthly DECIMAL(10, 6),
    garch_forecast DECIMAL(10, 6),
    vix_correlation DECIMAL(10, 6),
    atr_14 DECIMAL(10, 6),
    bollinger_band_width DECIMAL(10, 6),
    parkinson_volatility DECIMAL(10, 6),
    garman_klass_volatility DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, timestamp)
);

-- Trading signals table
CREATE TABLE IF NOT EXISTS trading_signals (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    signal_strength DECIMAL(5, 2),
    volatility_regime VARCHAR(20),
    recommended_action VARCHAR(20),
    confidence_level DECIMAL(5, 2),
    risk_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- HAR model parameters table
CREATE TABLE IF NOT EXISTS har_model_params (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    daily_coef DECIMAL(10, 6),
    weekly_coef DECIMAL(10, 6),
    monthly_coef DECIMAL(10, 6),
    intercept DECIMAL(10, 6),
    r_squared DECIMAL(10, 6),
    mse DECIMAL(10, 6),
    UNIQUE(symbol, updated_at)
);

-- Indices for better query performance
CREATE INDEX idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX idx_volatility_indicators_symbol_timestamp ON volatility_indicators(symbol, timestamp DESC);
CREATE INDEX idx_trading_signals_symbol_timestamp ON trading_signals(symbol, timestamp DESC);
CREATE INDEX idx_har_model_params_symbol ON har_model_params(symbol, updated_at DESC);
