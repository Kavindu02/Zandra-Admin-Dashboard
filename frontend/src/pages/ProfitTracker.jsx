import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Download, Pencil, RefreshCw, Search, Trash2, Plus, X, Calculator, DollarSign, Briefcase, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ProfitTracker() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const [formData, setFormData] = useState({
    invoiceNo: '',
    passenger: '',
    paymentMethod: 'Cash',
    sellCurrency: 'LKR',
    costCurrency: 'LKR',
    exchangeRate: 1,
    sellAmount: 0,
    costAmount: 0,
    companySharePercent: 60,
    employeeSharePercent: 40,
    status: 'Paid',
    handledBy: 'ZANDRA TRAVELERS'
  });

  const fetchProfitData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/profittracker`);
      const payload = res.data || {};
      setRows(Array.isArray(payload.records) ? payload.records : []);
      setSummary(payload.summary || { totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
    } catch (error) {
      console.error('Failed to load profit tracker data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, []);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => 
      String(row.invoiceNo || '').toLowerCase().includes(query) ||
      String(row.passenger || '').toLowerCase().includes(query) ||
      String(row.handledBy || '').toLowerCase().includes(query)
    );
  }, [rows, searchTerm]);

  const calculations = useMemo(() => {
    const sell = Number(formData.sellAmount) || 0;
    const cost = Number(formData.costAmount) || 0;
    const gross = Math.max(0, sell - cost);
    const coShare = (gross * (Number(formData.companySharePercent) || 0)) / 100;
    const empShare = (gross * (Number(formData.employeeSharePercent) || 0)) / 100;
    return { gross, coShare, empShare };
  }, [formData]);

  const handleOpenAddModal = () => {
    setSelectedRecord(null);
    setFormData({
      invoiceNo: '',
      passenger: '',
      paymentMethod: 'Cash',
      sellCurrency: 'LKR',
      costCurrency: 'LKR',
      exchangeRate: 1,
      sellAmount: 0,
      costAmount: 0,
      companySharePercent: 60,
      employeeSharePercent: 40,
      status: 'Paid',
      handledBy: 'ZANDRA TRAVELERS'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (record) => {
    setSelectedRecord(record);
    setFormData({
      ...record,
      sellAmount: record.sell || 0,
      costAmount: record.cost || 0,
      companySharePercent: record.companySharePercent || 60,
      employeeSharePercent: record.employeeSharePercent || 40,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (selectedRecord) {
        await axios.put(`${API_BASE_URL}/api/profittracker/${selectedRecord.id}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/profittracker`, formData);
      }
      setIsModalOpen(false);
      fetchProfitData();
    } catch (error) {
      alert('Failed to save record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/profittracker/${id}`);
      fetchProfitData();
    } catch (error) {
      alert('Failed to delete record');
    }
  };

  const handleExport = () => {
    const headers = ["Invoice", "Passenger", "Payment Method", "Currency", "Sell", "Cost", "Gross Profit", "Company Share", "Employee Share", "Status", "Handled By"];
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => [
        row.invoiceNo || '-',
        `"${row.passenger || '-'}"`,
        row.paymentMethod || '-',
        row.currencies || '-',
        row.sell || 0,
        row.cost || 0,
        row.gross || 0,
        row.companyShare || 0,
        row.employeeShare || 0,
        row.status || 'Pending',
        `"${row.handledBy || '-'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `profit_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await axios.post(`${API_BASE_URL}/api/profittracker/recalculate`);
      fetchProfitData();
    } catch (error) {
      alert('Recalculation failed');
    } finally {
      setIsRecalculating(false);
    }
  };

  const StatCard = ({ label, value, icon: Icon, colorClass }) => (
    <div className="bg-white border border-gray-100 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <h3 className={`text-2xl font-black ${colorClass}`}>LKR {Number(value || 0).toLocaleString()}</h3>
        <div className={`p-2 rounded-lg bg-gray-50 text-gray-400 opacity-20`}>
           <Icon size={20} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 overflow-hidden">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <h2 className="font-bold text-gray-800 uppercase tracking-tighter text-xs">Finances / Profit Tracker</h2>
          <TopHeaderActions />
        </div>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Profit Tracker</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1.5">{rows.length} records</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button 
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
              >
                <RefreshCw size={14} className={isRecalculating ? 'animate-spin text-blue-500' : ''} />
                <span>{isRecalculating ? 'Recalculating...' : 'Recalculate All'}</span>
              </button>
              
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold hover:bg-gray-50 transition-all shadow-sm"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>

              <button 
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 bg-[#101D42] text-white px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all"
              >
                <Plus size={18} />
                <span>Add Profit</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
            <StatCard label="Total Gross Profit" value={summary.totalGrossProfit} icon={DollarSign} colorClass="text-emerald-600" />
            <StatCard label="Company Share" value={summary.companyShare} icon={Briefcase} colorClass="text-blue-600" />
            <StatCard label="Employee Share" value={summary.employeeShare} icon={Users} colorClass="text-violet-600" />
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            {/* Search Top */}
            <div className="p-4 md:p-6 border-b border-gray-50">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search invoice, passenger, employee..."
                  className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-2.5 md:py-3 text-sm font-medium outline-none focus:bg-white focus:border-blue-500/20 transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto w-full border-t border-gray-50">
              <div className="min-w-fit">
                <table className="w-full text-left border-collapse min-w-[1100px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50">
                      <th className="px-4 md:px-6 py-4">Invoice</th>
                      <th className="px-4 md:px-6 py-4">Passenger</th>
                      <th className="px-4 md:px-6 py-4">Payment</th>
                      <th className="px-4 md:px-6 py-4">Currencies</th>
                      <th className="px-4 md:px-6 py-4 text-right">Sell</th>
                      <th className="px-4 md:px-6 py-4 text-right">Cost</th>
                      <th className="px-4 md:px-6 py-4 text-right">Gross</th>
                      <th className="px-4 md:px-6 py-4 text-right">Co. Share</th>
                      <th className="px-4 md:px-6 py-4 text-right">Emp. Share</th>
                      <th className="px-4 md:px-6 py-4">Status</th>
                      <th className="px-4 md:px-6 py-4">Handled</th>
                      <th className="px-4 md:px-6 py-4 text-right pr-6 md:pr-12">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="px-6 py-20 text-center text-gray-400">
                          <Calculator className="mx-auto mb-3 opacity-20" size={48} />
                          <p className="font-bold underline">No records found</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 md:px-6 py-4 font-bold text-gray-700 text-[10px] md:text-xs whitespace-nowrap">{row.invoiceNo || '-'}</td>
                          <td className="px-4 md:px-6 py-4 font-bold text-gray-800 text-sm">{row.passenger || '-'}</td>
                          <td className="px-4 md:px-6 py-4">
                            {row.paymentMethod ? (
                              <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[9px] md:text-[10px] font-black uppercase ring-1 ring-emerald-100 whitespace-nowrap">
                                {row.paymentMethod}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 md:px-6 py-4 text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter whitespace-nowrap">{row.currencies || '-'}</td>
                          <td className="px-4 md:px-6 py-4 text-right font-semibold text-gray-500 text-xs md:text-sm">{Number(row.sell || 0).toLocaleString()}</td>
                          <td className="px-4 md:px-6 py-4 text-right font-semibold text-gray-500 text-xs md:text-sm">{Number(row.cost || 0).toLocaleString()}</td>
                          <td className="px-4 md:px-6 py-4 text-right">
                            <span className="font-black text-emerald-600 text-xs md:text-sm">{Number(row.gross || 0).toLocaleString()}</span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right font-bold text-blue-600/70 text-xs md:text-sm">{Number(row.companyShare || 0).toLocaleString()}</td>
                          <td className="px-4 md:px-6 py-4 text-right font-bold text-violet-600/70 text-xs md:text-sm">{Number(row.employeeShare || 0).toLocaleString()}</td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
                              row.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                              row.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {row.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 font-bold text-gray-400 text-[9px] md:text-[10px] uppercase truncate max-w-[120px]">{row.handledBy || '-'}</td>
                          <td className="px-4 md:px-6 py-4 text-right pr-4 md:pr-6">
                            <div className="flex items-center justify-end gap-1 md:gap-2">
                              <button onClick={() => handleOpenEditModal(row)} className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => handleDelete(row.id)} className="p-1.5 md:p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Unified Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 my-auto">
              <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{selectedRecord ? 'Edit Profit Row' : 'Add Manual Profit'}</h2>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {selectedRecord ? `INVOICE: ${selectedRecord.invoiceNo}` : 'Create a brand new profit entry'}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   {/* Fields */}
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Invoice ID</label>
                      <input 
                        type="text" 
                        value={formData.invoiceNo} 
                        onChange={(e) => setFormData({...formData, invoiceNo: e.target.value})}
                        className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                        placeholder="ZT-INV-XXXX"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Passenger Name</label>
                      <input 
                        type="text" 
                        value={formData.passenger} 
                        onChange={(e) => setFormData({...formData, passenger: e.target.value})}
                        className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                        placeholder="John Doe"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                      <select 
                        value={formData.paymentMethod} 
                        onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                        className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      >
                         <option>Cash</option>
                         <option>Bank Transfer</option>
                         <option>Cheque</option>
                         <option>Card</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                      <select 
                        value={formData.status} 
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                      >
                         <option>Paid</option>
                         <option>Pending</option>
                      </select>
                   </div>
                </div>

                {/* Financials */}
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Financial Details</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Sell Amount (LKR)</label>
                        <input 
                          type="number" 
                          value={formData.sellAmount} 
                          onChange={(e) => setFormData({...formData, sellAmount: Number(e.target.value)})}
                          className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Cost Amount (LKR)</label>
                        <input 
                          type="number" 
                          value={formData.costAmount} 
                          onChange={(e) => setFormData({...formData, costAmount: Number(e.target.value)})}
                          className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-rose-600 outline-none focus:ring-2 focus:ring-rose-500/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Co. Share %</label>
                        <input 
                          type="number" 
                          value={formData.companySharePercent} 
                          onChange={(e) => setFormData({...formData, companySharePercent: Number(e.target.value)})}
                          className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-500/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Emp. Share %</label>
                        <input 
                          type="number" 
                          value={formData.employeeSharePercent} 
                          onChange={(e) => setFormData({...formData, employeeSharePercent: Number(e.target.value)})}
                          className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 text-sm font-bold text-violet-600 outline-none focus:ring-2 focus:ring-violet-500/10"
                        />
                      </div>
                   </div>

                   {/* Live Calculation */}
                   <div className="mt-6 flex items-center justify-between bg-[#101D42] rounded-xl p-4 text-white">
                      <div>
                         <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Est. Gross Profit</p>
                         <p className="text-lg font-black tracking-tight">LKR {calculations.gross.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Company / Employee</p>
                         <p className="font-bold">LKR {calculations.coShare.toLocaleString()} / {calculations.empShare.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Handled By</label>
                  <input 
                    type="text" 
                    value={formData.handledBy} 
                    onChange={(e) => setFormData({...formData, handledBy: e.target.value})}
                    className="w-full h-11 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-gray-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-3 border-t border-gray-50">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-[#101D42] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : (selectedRecord ? 'Update Record' : 'Save Record')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
