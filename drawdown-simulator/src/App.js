import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ReferenceArea } from 'recharts';

const DrawdownSimulator = () => {
  const [data, setData] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [winRate, setWinRate] = useState(55);
  const [rMultiple, setRMultiple] = useState(2.0);
  const [riskPerTrade, setRiskPerTrade] = useState(2);

  const generatePortfolioData = useCallback(() => {
    const initialDeposit = 10000;
    const numTrades = 200;
    let equity = initialDeposit;
    let portfolioData = [];
    let wins = 0;
    let losses = 0;
    
    portfolioData.push({
      day: 0,
      equity: parseFloat(equity.toFixed(2)),
      tradeResult: null
    });
    
    for (let i = 1; i <= numTrades; i++) {
      const riskAmount = equity * (riskPerTrade / 100);
      const isWin = Math.random() * 100 < winRate;
      
      let tradeResult;
      if (isWin) {
        tradeResult = riskAmount * rMultiple;
        equity += tradeResult;
        wins++;
      } else {
        tradeResult = -riskAmount;
        equity += tradeResult;
        losses++;
      }
      
      equity = Math.max(equity, 0);
      
      portfolioData.push({
        day: i,
        equity: parseFloat(equity.toFixed(2)),
        tradeResult: parseFloat(tradeResult.toFixed(2)),
        isWin
      });
    }

    const equities = portfolioData.map(d => d.equity);
    const maxEquity = Math.max(...equities);
    const minEquity = Math.min(...equities);
    
    const absoluteDD = initialDeposit - minEquity;
    
    let maxDD = 0;
    let maxDDStart = 0;
    let maxDDEnd = 0;
    let runningMax = equities[0];
    let currentDDStart = 0;
    
    for (let i = 0; i < equities.length; i++) {
      if (equities[i] > runningMax) {
        runningMax = equities[i];
        currentDDStart = i;
      }
      
      const currentDD = runningMax - equities[i];
      if (currentDD > maxDD) {
        maxDD = currentDD;
        maxDDStart = currentDDStart;
        maxDDEnd = i;
      }
    }
    
    const lastPeakIdx = equities.lastIndexOf(maxEquity);
    let relativeDDEnd = lastPeakIdx;
    let relativeDD = 0;
    
    for (let i = lastPeakIdx; i < equities.length; i++) {
      const dd = maxEquity - equities[i];
      if (dd > relativeDD) {
        relativeDD = dd;
        relativeDDEnd = i;
      }
    }

    setMetrics({
      initialDeposit,
      maxEquity: maxEquity.toFixed(2),
      minEquity: minEquity.toFixed(2),
      finalEquity: equities[equities.length - 1].toFixed(2),
      totalReturn: ((equities[equities.length - 1] - initialDeposit) / initialDeposit * 100).toFixed(2),
      absoluteDD: absoluteDD.toFixed(2),
      maxDD: maxDD.toFixed(2),
      maxDDPercent: ((maxDD / equities[maxDDStart]) * 100).toFixed(2),
      maxDDStart,
      maxDDEnd,
      maxDDPeak: equities[maxDDStart].toFixed(2),
      relativeDD: relativeDD.toFixed(2),
      relativeDDPercent: ((relativeDD / maxEquity) * 100).toFixed(2),
      relativeDDStart: lastPeakIdx,
      relativeDDEnd,
      actualWinRate: ((wins / (wins + losses)) * 100).toFixed(2),
      totalTrades: wins + losses,
      wins,
      losses
    });

    setData(portfolioData);
  }, [winRate, rMultiple, riskPerTrade]);

  useEffect(() => {
    generatePortfolioData();
  }, [generatePortfolioData]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border-2 border-gray-300 rounded shadow-lg">
          <p className="font-semibold">Trade #{data.day}</p>
          <p className="text-blue-600 font-bold">Equity: ${payload[0].value.toFixed(2)}</p>
          {data.tradeResult !== null && (
            <p className={data.isWin ? "text-green-600" : "text-red-600"}>
              {data.isWin ? "Win" : "Loss"}: {data.tradeResult > 0 ? "+" : ""}${data.tradeResult.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Portfolio Drawdown Analysis with Trading Simulation
      </h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Trading Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Win Rate: {winRate}%
            </label>
            <input
              type="range"
              min="30"
              max="80"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30%</span>
              <span>80%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              R-Multiple (Reward/Risk): {rMultiple.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={rMultiple}
              onChange={(e) => setRMultiple(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1.0</span>
              <span>5.0</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Risk Per Trade: {riskPerTrade}%
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={riskPerTrade}
              onChange={(e) => setRiskPerTrade(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0.5%</span>
              <span>5%</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-700">
            Expected Value per Trade: 
            <span className={
              (winRate/100 * rMultiple * riskPerTrade) - ((100-winRate)/100 * riskPerTrade) > 0 
                ? "text-green-600 ml-2" 
                : "text-red-600 ml-2"
            }>
              {((winRate/100 * rMultiple * riskPerTrade) - ((100-winRate)/100 * riskPerTrade)).toFixed(3)}%
            </span>
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Formula: (WinRate × R-Multiple × Risk%) - (LossRate × Risk%)
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <h2 className="text-xl font-bold mb-4">Performance Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Initial Balance</p>
            <p className="text-2xl font-bold">${metrics.initialDeposit}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Final Balance</p>
            <p className="text-2xl font-bold">${metrics.finalEquity}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Total Return</p>
            <p className={`text-2xl font-bold ${parseFloat(metrics.totalReturn) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {metrics.totalReturn}%
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">Win Rate</p>
            <p className="text-2xl font-bold">{metrics.actualWinRate}%</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white border-opacity-30">
          <p className="text-sm">
            Total Trades: {metrics.totalTrades} | 
            Wins: <span className="font-bold text-green-300">{metrics.wins}</span> | 
            Losses: <span className="font-bold text-red-300">{metrics.losses}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <LineChart width={1000} height={500} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="day" 
            label={{ value: 'Number of Trades', position: 'insideBottom', offset: -10 }}
            stroke="#666"
          />
          <YAxis 
            label={{ value: 'Account Equity ($)', angle: -90, position: 'insideLeft' }}
            stroke="#666"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <ReferenceLine 
            y={metrics.initialDeposit} 
            stroke="#ef4444" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'Initial Deposit', position: 'right', fill: '#ef4444', fontWeight: 'bold' }}
          />
          
          <ReferenceLine 
            y={metrics.maxEquity} 
            stroke="#10b981" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'MAX (Equity Peak)', position: 'right', fill: '#10b981', fontWeight: 'bold' }}
          />
          
          <ReferenceLine 
            y={metrics.minEquity} 
            stroke="#f59e0b" 
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ value: 'MIN (Equity Trough)', position: 'right', fill: '#f59e0b', fontWeight: 'bold' }}
          />
          
          {metrics.maxDDStart !== undefined && (
            <ReferenceArea
              x1={metrics.maxDDStart}
              x2={metrics.maxDDEnd}
              fill="#8b5cf6"
              fillOpacity={0.15}
              label={{ value: 'Max DD', position: 'top' }}
            />
          )}
          
          {metrics.relativeDDStart !== undefined && (
            <ReferenceArea
              x1={metrics.relativeDDStart}
              x2={metrics.relativeDDEnd}
              fill="#06b6d4"
              fillOpacity={0.15}
              label={{ value: 'Relative DD', position: 'top' }}
            />
          )}
          
          <Line 
            type="monotone" 
            dataKey="equity" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={false}
            name="Portfolio Equity"
          />
        </LineChart>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Absolute Drawdown
          </h3>
          <p className="text-3xl font-bold text-red-600 mb-2">${metrics.absoluteDD}</p>
          <p className="text-sm text-gray-600 mb-3">
            Loss from initial deposit (${metrics.initialDeposit})
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">Definition:</p>
            <p>The difference between the initial deposit and the lowest point the account reaches.</p>
            <p className="mt-2 italic">Formula: Initial Deposit - Minimum Equity</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            Maximum Drawdown
          </h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">${metrics.maxDD}</p>
          <p className="text-sm text-gray-600 mb-1">
            ({metrics.maxDDPercent}% loss)
          </p>
          <p className="text-xs text-gray-500 mb-3">
            Peak: ${metrics.maxDDPeak} → Trough
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">Definition:</p>
            <p>The largest peak-to-trough decline in portfolio value during the entire period.</p>
            <p className="mt-2 italic">Formula: Running Peak - Current Value (maximum)</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-cyan-500">
          <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
            <span className="w-3 h-3 bg-cyan-500 rounded-full mr-2"></span>
            Relative Drawdown
          </h3>
          <p className="text-3xl font-bold text-cyan-600 mb-2">${metrics.relativeDD}</p>
          <p className="text-sm text-gray-600 mb-1">
            ({metrics.relativeDDPercent}% from peak)
          </p>
          <p className="text-xs text-gray-500 mb-3">
            From highest peak (${metrics.maxEquity})
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-semibold mb-1">Definition:</p>
            <p>The drawdown from the highest equity peak to the subsequent trough.</p>
            <p className="mt-2 italic">Formula: Maximum Equity - Current Trough</p>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <h4 className="font-bold text-blue-900 mb-2">Understanding Drawdowns:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Absolute DD</strong>: Shows how far below your starting capital you've gone</li>
          <li>• <strong>Maximum DD</strong>: Shows the worst peak-to-valley loss you've experienced</li>
          <li>• <strong>Relative DD</strong>: Shows your current drawdown from the all-time high</li>
        </ul>
      </div>

      <button
        onClick={generatePortfolioData}
        className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200"
      >
        Generate New Portfolio Simulation
      </button>
    </div>
  );
};

export default DrawdownSimulator;