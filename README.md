# S&P 500 Volatility Tracker

A sophisticated S&P 500 tracking application with advanced volatility modeling, including HAR (Heterogeneous Autoregressive) models and multiple volatility indicators for trading strategies.

## Features

### Volatility Models & Indicators
- **HAR Model**: Implements daily, weekly, and monthly volatility components for forecasting
- **GARCH(1,1)**: Simple GARCH volatility forecasting
- **Realized Volatility**: Standard deviation-based volatility calculation
- **Parkinson Volatility**: Using high-low range estimator
- **Garman-Klass Volatility**: Advanced OHLC-based volatility estimator
- **ATR (Average True Range)**: 14-period ATR for volatility measurement
- **Bollinger Band Width**: Volatility indicator based on Bollinger Bands

### Trading Signals
- Volatility regime identification (low, normal, elevated, extreme)
- Mean reversion signals in extreme volatility
- Low volatility trend following signals
- Volatility breakout detection
- HAR model divergence alerts

### Market Data
- Real-time S&P 500 data integration via Alpha Vantage API
- Historical data storage and retrieval
- Automatic data updates every 15 minutes during market hours

## Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** (Neon) for data storage
- **Alpha Vantage API** for market data
- **Math.js** for matrix operations in HAR model
- **Simple-statistics** for statistical calculations
- **Node-cron** for scheduled updates

### Database Schema
- Market data (OHLC prices)
- Volatility indicators
- Trading signals
- HAR model parameters

## API Endpoints

### Health & Status
- `GET /api/health` - Health check

### Market Data
- `GET /api/market/analysis` - Get current market analysis with volatility indicators
- `GET /api/market/historical` - Get historical market data
- `GET /api/market/summary` - Get market summary with latest prices and volatility

### Volatility Analysis
- `GET /api/volatility/indicators` - Get historical volatility indicators
- `GET /api/models/har/:symbol` - Get HAR model parameters

### Trading Signals
- `GET /api/signals/latest` - Get latest trading signals

### Data Management
- `POST /api/market/update` - Trigger manual data update

## Environment Variables

Create a `.env` file with the following variables:

\`\`\`env
DATABASE_URL=your_neon_database_url
ALPHA_VANTAGE_API_KEY=your_api_key
PORT=3000
NODE_ENV=production
\`\`\`

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/tkfernlabs/sp500-volatility-tracker.git
cd sp500-volatility-tracker
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables in `.env` file

4. Run the application:
\`\`\`bash
npm start
\`\`\`

## Usage

The backend API is available at `http://localhost:3000/api`

### Example: Get Market Analysis
\`\`\`bash
curl http://localhost:3000/api/market/analysis?symbol=SPY
\`\`\`

### Example: Get Trading Signals
\`\`\`bash
curl http://localhost:3000/api/signals/latest?symbol=SPY&limit=5
\`\`\`

## HAR Model Implementation

The HAR model decomposes realized volatility into three components:
- Daily: RV(t-1)
- Weekly: Average of RV(t-5) to RV(t-1)
- Monthly: Average of RV(t-22) to RV(t-1)

The model equation:
\`\`\`
RV(t+1) = β₀ + β₁·RV_daily + β₂·RV_weekly + β₃·RV_monthly + ε(t)
\`\`\`

## Trading Strategy Integration

The application provides various signals that can be used in volatility-based trading strategies:

1. **Volatility Mean Reversion**: When volatility reaches extreme levels, the system signals potential mean reversion opportunities
2. **Low Volatility Trends**: Identifies trending markets in low volatility environments
3. **Volatility Breakouts**: Detects potential volatility expansions using Bollinger Band width
4. **HAR Divergence**: Signals when HAR forecasts significantly diverge from realized volatility

## License

MIT

## Author

Built with advanced quantitative finance techniques for sophisticated volatility trading strategies.
