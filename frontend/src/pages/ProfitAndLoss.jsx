import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FileText, ChevronDown, TrendingUp, ShoppingBag, CreditCard, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProfitAndLoss() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPLData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/accounting/profit-loss?year=${year}`);
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch P&L data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPLData();
  }, [year]);

  const summary = data?.summary || { totalIncome: 0, totalCogs: 0, totalGrossProfit: 0, totalExpenses: 0, totalNetProfit: 0 };
  const monthlyData = data?.monthlyData || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(val);
  };

  const SummarySection = ({ title, icon: Icon, color, lines, totalLabel, totalValue }) => (
    <div className={`bg-white rounded-2xl border-t-4 shadow-sm p-6 mb-6`} style={{ borderTopColor: color }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} style={{ color }} />
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-3">
        {lines.map((line, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">{line.label}</span>
            <span className="text-gray-900 font-bold">{formatCurrency(line.value)}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-gray-900 font-black uppercase text-xs tracking-widest">{totalLabel}</span>
          <span className="text-lg font-black" style={{ color }}>{formatCurrency(totalValue)}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F1F5F9]">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <h2 className="font-bold text-gray-800 uppercase tracking-tighter text-xs">Accounting / Profit & Loss</h2>
          <TopHeaderActions />
        </div>

        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Profit & Loss</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Income statement and financial performance</p>
            </div>
            
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-sm">
              <FileText size={16} />
              <span>PDF Report</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="relative inline-block">
              <select 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-5 py-2.5 pr-10 text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>

            <div className="relative inline-block">
              <select className="appearance-none bg-white border border-gray-200 rounded-xl px-5 py-2.5 pr-10 text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 transition cursor-pointer">
                <option>Full Year</option>
                <option>Q1 (Jan - Mar)</option>
                <option>Q2 (Apr - Jun)</option>
                <option>Q3 (Jul - Sep)</option>
                <option>Q4 (Oct - Dec)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Summary Cards Column */}
            <div className="lg:col-span-4">
              <SummarySection 
                title="Income" 
                icon={TrendingUp} 
                color="#10B981" 
                lines={[
                  { label: "Ticket Sales", value: summary.totalIncome }
                ]}
                totalLabel="Total Income"
                totalValue={summary.totalIncome}
              />

              <SummarySection 
                title="Cost of Goods Sold" 
                icon={ShoppingBag} 
                color="#F59E0B" 
                lines={[
                  { label: "Ticket Cost", value: summary.totalCogs }
                ]}
                totalLabel="Gross Profit"
                totalValue={summary.totalGrossProfit}
              />

              <SummarySection 
                title="Operating Expenses" 
                icon={CreditCard} 
                color="#EF4444" 
                lines={[
                  { label: "General Expenses", value: summary.totalGeneralExpenses || 0 },
                  { label: "Salaries", value: summary.totalPayrollExpenses || 0 }
                ]}
                totalLabel="Total Expenses"
                totalValue={summary.totalExpenses}
              />

              <div className="bg-[#101D42] rounded-2xl p-6 shadow-lg shadow-blue-900/20 text-white">
                <div className="flex items-center gap-2 mb-2 opacity-60">
                   <DollarSign size={16} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Net Financial Result</span>
                </div>
                <h4 className="text-sm font-bold opacity-80 mb-1">Company Net Profit</h4>
                <div className="text-3xl font-black">
                   {formatCurrency(summary.totalNetProfit)}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${summary.totalNetProfit >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                   <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                     {summary.totalNetProfit >= 0 ? 'Profitable' : 'Loss'} for Year {year}
                   </span>
                </div>
              </div>
            </div>

            {/* Chart Column */}
            <div className="lg:col-span-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm h-full border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-lg font-black text-gray-900 tracking-tight">Monthly Overview — {year}</h3>
                </div>

                <div className="flex-1 min-h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="monthName" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                        tickFormatter={(val) => `${val / 1000}K`}
                      />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Legend 
                        iconType="rect" 
                        iconSize={10} 
                        wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                      />
                      <Bar name="Income" dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar name="Expenses" dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar name="Net Profit" dataKey="netProfit" radius={[4, 4, 0, 0]} barSize={12}>
                        {monthlyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.netProfit >= 0 ? '#3B82F6' : '#94A3B8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
