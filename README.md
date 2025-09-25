# S&P 500 Volatility Tracker with HAR Model

**📈 NOW WITH REAL-TIME S&P 500 DATA FROM ALPHA VANTAGE API**

A comprehensive volatility analysis platform for the S&P 500 index (SPY) that leverages HAR (Heterogeneous Autoregressive) modeling and advanced quantitative indicators to provide trading signals for volatility-based strategies.

**Current SPY Price: $661.10** (Live data updated every 5 minutes)

## 🚀 Live Demo

- **Frontend**: https://frontend-morphvm-elaa2g3p.http.cloud.morph.so
- **Backend API**: https://backend-morphvm-elaa2g3p.http.cloud.morph.so/api
- **Data Source**: Real-time Alpha Vantage API (100+ days of historical data)

## 📊 Features

### HAR Model Implementation
- **Multi-horizon Forecasting**: Daily, weekly, and monthly volatility predictions
- **Model Performance**: R-squared tracking and coefficient visualization
- **Real-time Updates**: Continuous model recalibration with new market data

### Volatility Indicators
- **Realized Volatility**: Historical volatility from returns
- **GARCH Forecasting**: Advanced volatility prediction model
- **Parkinson Estimator**: High-Low range volatility
- **Garman-Klass**: OHLC-based volatility estimation
- **ATR (14)**: Average True Range indicator
- **Bollinger Band Width**: Volatility expansion/contraction metric

### Trading Signals
- **Volatility Regime Detection**: Classifies market into extreme/elevated/normal/low volatility states
- **Mean Reversion Signals**: Identifies potential volatility reversals
- **HAR Divergence Alerts**: Detects when model predictions diverge from realized volatility
- **Confidence Scoring**: Each signal includes strength metrics (0-100%)

### Data Management
- **Neon PostgreSQL Database**: Serverless Postgres for data persistence
- **Alpha Vantage Integration**: Real-time market data feeds
- **15-minute Updates**: Automated data refresh during market hours
- **Historical Analysis**: 30+ days of price and volatility history

## 🛠️ Tech Stack

### Backend
- **Node.js & Express**: RESTful API server
- **Neon PostgreSQL**: Serverless database
- **Alpha Vantage API**: Market data provider
- **Statistical Libraries**: Custom HAR model implementation
- **Cron Jobs**: Scheduled data updates

### Frontend
- **React with TypeScript**: Type-safe component architecture
- **Tailwind CSS v3**: Utility-first styling
- **Recharts**: Interactive data visualizations
- **Axios**: API communication
- **Lucide React**: Icon system

## 📈 API Endpoints

```
GET  /api/health              - Health check
GET  /api/market/analysis     - Comprehensive volatility analysis
GET  /api/market/historical   - Historical market data
GET  /api/market/summary      - Quick market overview
GET  /api/volatility/indicators - Historical volatility metrics
GET  /api/signals/latest      - Recent trading signals
GET  /api/models/har/:symbol  - HAR model parameters
POST /api/market/update       - Trigger manual data update
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- Neon PostgreSQL account
- Alpha Vantage API key

### Backend Setup
```bash
# Clone repository
git clone https://github.com/tkfernlabs/sp500-volatility-tracker.git
cd sp500-volatility-tracker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL (Neon PostgreSQL)
# - ALPHA_VANTAGE_API_KEY
# - PORT (default: 3000)

# Start backend
npm start
```

### Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Serve production build
npm install -g serve
serve -s build -l 3001
```

### Development Mode
```bash
# Backend development
npm run dev

# Frontend development
cd frontend
npm start
```

## 📊 HAR Model Details

The HAR model captures volatility patterns at different time horizons:

```
RV(t+1) = β₀ + β₁·RV_daily(t) + β₂·RV_weekly(t) + β₃·RV_monthly(t) + ε(t)
```

Where:
- **RV_daily**: Average realized volatility over 1 day
- **RV_weekly**: Average realized volatility over 5 days
- **RV_monthly**: Average realized volatility over 22 days

### Model Performance
- Current R² = 64.1% (as of latest calibration)
- Daily coefficient: 0.8467
- Weekly coefficient: -0.3871
- Monthly coefficient: 0.5000

## 🎯 Trading Strategy Applications

### Volatility Mean Reversion
- Enter positions when volatility reaches extreme levels
- Signal: "PREPARE_TO_BUY" when extreme volatility likely to revert

### Volatility Arbitrage
- Trade volatility derivatives (VIX, options) based on HAR forecasts
- Signal: "HEDGE" when model shows significant divergence

### Risk Management
- Adjust position sizes based on volatility regime
- Reduce exposure in "EXTREME" volatility environments

## 📝 Database Schema

```sql
-- Core tables
market_data          - OHLCV price data
volatility_indicators - Calculated volatility metrics
trading_signals      - Generated trading signals
har_model_params     - Model coefficients and performance
```

## 🔄 Update Schedule

- **Market Hours**: Every 15 minutes (9:30 AM - 4:00 PM EST)
- **After Hours**: Hourly updates for futures/extended trading
- **Model Recalibration**: Daily at market close

## 🚨 Risk Disclaimer

This platform is for educational and research purposes only. Trading based on volatility models involves significant risk. Always perform your own due diligence and consult with financial professionals before making investment decisions.

## 📄 License

MIT License - See LICENSE file for details

## 👥 Contributing

Contributions are welcome! Please submit pull requests with:
- New volatility indicators
- Improved HAR model variations
- Additional trading signal algorithms
- Performance optimizations

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ for volatility traders and quantitative analysts**
