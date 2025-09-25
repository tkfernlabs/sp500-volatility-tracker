import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts';
import { VolatilityIndicators, HARModel } from '../services/api';

interface HARModelChartProps {
  volatilityIndicators: VolatilityIndicators;
  harModel: HARModel;
}

const HARModelChart: React.FC<HARModelChartProps> = ({ volatilityIndicators, harModel }) => {
  const forecastData = [
    {
      name: 'Daily',
      forecast: volatilityIndicators.har_forecast_daily * 100,
      coefficient: harModel.dailyCoef,
      color: '#3b82f6'
    },
    {
      name: 'Weekly',
      forecast: volatilityIndicators.har_forecast_weekly * 100,
      coefficient: harModel.weeklyCoef,
      color: '#8b5cf6'
    },
    {
      name: 'Monthly',
      forecast: volatilityIndicators.har_forecast_monthly * 100,
      coefficient: harModel.monthlyCoef,
      color: '#ec4899'
    }
  ];

  const coefficientData = [
    { name: 'Daily', value: harModel.dailyCoef, fill: '#3b82f6' },
    { name: 'Weekly', value: harModel.weeklyCoef, fill: '#8b5cf6' },
    { name: 'Monthly', value: harModel.monthlyCoef, fill: '#ec4899' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded shadow-lg">
          <p className="text-white font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(3)}
              {entry.name === 'Forecast' ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* HAR Volatility Forecasts */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-white">HAR Model Forecasts</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" label={{ value: 'Volatility (%)', angle: -90, position: 'insideLeft', style: { fill: '#94a3b8' } }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="forecast" fill="#3b82f6" radius={[8, 8, 0, 0]}>
              {forecastData.map((entry, index) => (
                <Bar key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Model R-Squared:</span>
            <span className="text-white font-mono">{(harModel.rSquared * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{ width: `${harModel.rSquared * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Model Coefficients */}
      <div className="bg-slate-900/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-white">Model Coefficients</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={coefficientData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {coefficientData.map((item) => (
            <div key={item.name} className="bg-slate-800 rounded p-2">
              <div className="text-xs text-gray-400">{item.name}</div>
              <div className="text-sm font-mono text-white">{item.value.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HARModelChart;
