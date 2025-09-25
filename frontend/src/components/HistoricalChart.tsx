import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';

interface DataPoint {
  date: string;
  close: number;
  volume: number;
  realized_volatility?: number;
  har_forecast?: number;
}

interface HistoricalChartProps {
  data: DataPoint[];
}

const HistoricalChart: React.FC<HistoricalChartProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'price' | 'volatility' | 'combined'>('combined');

  const formattedData = data.map(item => {
    try {
      const dateValue = item.date ? new Date(item.date) : new Date();
      return {
        ...item,
        date: format(dateValue, 'MMM dd'),
        displayDate: format(dateValue, 'MMM dd, yyyy'),
        realized_vol_pct: item.realized_volatility ? item.realized_volatility * 100 : null,
        har_forecast_pct: item.har_forecast ? item.har_forecast * 100 : null,
        volume_millions: item.volume / 1000000
      };
    } catch (error) {
      // Fallback if date parsing fails
      return {
        ...item,
        date: 'N/A',
        displayDate: 'N/A',
        realized_vol_pct: item.realized_volatility ? item.realized_volatility * 100 : null,
        har_forecast_pct: item.har_forecast ? item.har_forecast * 100 : null,
        volume_millions: item.volume / 1000000
      };
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg">
          <p className="text-white font-semibold mb-2">{dataPoint.displayDate}</p>
          {chartType !== 'volatility' && (
            <>
              <p className="text-sm text-blue-400">
                Close: ${dataPoint.close?.toFixed(2)}
              </p>
              <p className="text-sm text-gray-400">
                Volume: {dataPoint.volume_millions?.toFixed(2)}M
              </p>
            </>
          )}
          {chartType !== 'price' && dataPoint.realized_vol_pct && (
            <>
              <p className="text-sm text-purple-400">
                Realized Vol: {dataPoint.realized_vol_pct.toFixed(2)}%
              </p>
              {dataPoint.har_forecast_pct && (
                <p className="text-sm text-pink-400">
                  HAR Forecast: {dataPoint.har_forecast_pct.toFixed(2)}%
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Historical Analysis</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('price')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              chartType === 'price'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Price
          </button>
          <button
            onClick={() => setChartType('volatility')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              chartType === 'volatility'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Volatility
          </button>
          <button
            onClick={() => setChartType('combined')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              chartType === 'combined'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Combined
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'price' ? (
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="price"
              stroke="#94a3b8"
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <YAxis 
              yAxisId="volume"
              orientation="right"
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              label={{ value: 'Volume (M)', angle: 90, position: 'insideRight', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="volume" dataKey="volume_millions" fill="#475569" opacity={0.3} name="Volume (M)" />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="S&P 500"
            />
          </ComposedChart>
        ) : chartType === 'volatility' ? (
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              label={{ value: 'Volatility (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="realized_vol_pct" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={false}
              name="Realized Volatility"
            />
            <Line 
              type="monotone" 
              dataKey="har_forecast_pct" 
              stroke="#ec4899" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="HAR Forecast"
            />
          </LineChart>
        ) : (
          <ComposedChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="price"
              stroke="#94a3b8"
              domain={['dataMin - 5', 'dataMax + 5']}
              tick={{ fontSize: 12 }}
              label={{ value: 'Price ($)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }}
            />
            <YAxis 
              yAxisId="volatility"
              orientation="right"
              stroke="#94a3b8"
              tick={{ fontSize: 12 }}
              label={{ value: 'Volatility (%)', angle: 90, position: 'insideRight', style: { fill: '#94a3b8' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              yAxisId="volatility"
              type="monotone"
              dataKey="realized_vol_pct"
              fill="#8b5cf6"
              stroke="#8b5cf6"
              fillOpacity={0.1}
              name="Volatility %"
            />
            <Line 
              yAxisId="price"
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={false}
              name="S&P 500"
            />
          </ComposedChart>
        )}
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-xs text-gray-400">Latest Price</p>
          <p className="text-sm font-mono text-white">
            ${formattedData[formattedData.length - 1]?.close?.toFixed(2)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Change (1D)</p>
          <p className={`text-sm font-mono ${
            formattedData.length > 1 && 
            formattedData[formattedData.length - 1]?.close > formattedData[formattedData.length - 2]?.close
              ? 'text-green-400' : 'text-red-400'
          }`}>
            {formattedData.length > 1 
              ? `${((formattedData[formattedData.length - 1]?.close - formattedData[formattedData.length - 2]?.close) / formattedData[formattedData.length - 2]?.close * 100).toFixed(2)}%`
              : 'N/A'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Avg Volume</p>
          <p className="text-sm font-mono text-white">
            {(formattedData.reduce((acc, item) => acc + (item.volume_millions || 0), 0) / formattedData.length).toFixed(1)}M
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-400">Current Vol</p>
          <p className="text-sm font-mono text-purple-400">
            {formattedData[formattedData.length - 1]?.realized_vol_pct?.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalChart;
