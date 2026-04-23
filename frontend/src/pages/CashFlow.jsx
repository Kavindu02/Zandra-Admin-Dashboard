import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, ArrowDownCircle, ArrowUpCircle, 
  ChevronDown, FileDown, Plus
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

export default function CashFlow() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [data, setData] = useState({
    summary: { totalCashIn: 0, totalCashOut: 0, netCashFlow: 0 },
    monthlyData: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCashFlowData = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/accounting/cashflow?year=${selectedYear}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch cash flow data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashFlowData();
  }, [selectedYear]);

  const formatLKR = (val) => `LKR ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  const formatShortLKR = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val;
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="font-bold text-gray-800">Accounting</h2>
          <TopHeaderActions />
        </div>

        <div className="p-8 font-sans">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cash Flow</h1>
              <p className="text-gray-500 text-sm mt-1">Cash inflows and outflows</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm pr-10"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
                <FileDown size={18} />
                <span>PDF Report</span>
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-5">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-600">
                <ArrowDownCircle size={32} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Total Cash In</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatLKR(data.summary.totalCashIn)}</h3>
                <p className="text-xs text-emerald-600/70 font-medium mt-1">From all sources</p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 flex items-center gap-5">
              <div className="p-4 bg-rose-500/10 rounded-full text-rose-600">
                <ArrowUpCircle size={32} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-rose-600 uppercase tracking-widest">Total Cash Out</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatLKR(data.summary.totalCashOut)}</h3>
                <p className="text-xs text-rose-600/70 font-medium mt-1">All expenses & payroll</p>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 flex items-center gap-5">
              <div className="p-4 bg-blue-500/10 rounded-full text-blue-600">
                <TrendingUp size={32} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">Net Cash Flow</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatLKR(data.summary.netCashFlow)}</h3>
                <p className="text-xs text-blue-600/70 font-medium mt-1">
                  {data.summary.netCashFlow >= 0 ? 'Positive flow' : 'Negative flow'}
                </p>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 text-[11px]">
            {/* Cash In vs Cash Out Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center justify-between">
                Cash In vs Cash Out — {selectedYear}
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span>Cash In</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span>Cash Out</span>
                  </div>
                </div>
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="monthName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={formatShortLKR}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val) => [`LKR ${val.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cashIn" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorIn)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cashOut" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorOut)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cumulative Balance Chart */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-6 flex items-center justify-between">
                Cumulative Cash Balance — {selectedYear}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>Running Balance</span>
                </div>
              </h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="monthName" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      tickFormatter={formatShortLKR}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(val) => [`LKR ${val.toLocaleString()}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="runningBalance" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorBalance)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-12">
            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800">Monthly Cash Flow Statement — {selectedYear}</h3>
              <button className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest">
                Expand View
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-[10px]">Month</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-[10px] text-emerald-600">Cash In (LKR)</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-[10px] text-rose-600">Cash Out (LKR)</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-[10px] text-blue-600">Net (LKR)</th>
                    <th className="px-8 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.monthlyData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-4 font-bold text-gray-700">{row.monthName}</td>
                      <td className="px-8 py-4 font-medium text-emerald-600">{row.cashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-8 py-4 font-medium text-rose-600">{row.cashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className={`px-8 py-4 font-bold ${row.net >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                        {row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-4 font-bold text-gray-900 text-right">
                        LKR {row.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50/80">
                  <tr className="font-bold text-gray-900">
                    <td className="px-8 py-5 uppercase tracking-wider text-xs">TOTAL</td>
                    <td className="px-8 py-5 text-emerald-600">{data.summary.totalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5 text-rose-600">{data.summary.totalCashOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5 text-blue-600">{data.summary.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-5"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
