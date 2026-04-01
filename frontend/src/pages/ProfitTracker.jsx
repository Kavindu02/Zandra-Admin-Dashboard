import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Download, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

export default function ProfitTracker() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editForm, setEditForm] = useState({
    paymentMethod: '',
    status: '',
    sellCurrency: '',
    costCurrency: '',
    exchangeRate: '',
    sellAmount: '',
    costAmount: '',
    companySharePercent: '',
    employeeSharePercent: ''
  });

  const fetchProfitData = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/profittracker');
      const payload = res.data || {};
      setRows(Array.isArray(payload.records) ? payload.records : []);
      setSummary(payload.summary || { totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
    } catch (error) {
      console.error('Failed to load profit tracker data:', error);
      setRows([]);
      setSummary({ totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfitData();
  }, []);

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return rows;
    }

    return rows.filter((row) => {
      return (
        String(row.invoiceNo || '').toLowerCase().includes(query) ||
        String(row.passenger || '').toLowerCase().includes(query) ||
        String(row.handledBy || '').toLowerCase().includes(query)
      );
    });
  }, [rows, searchTerm]);

  const preview = useMemo(() => {
    const sell = Number(editForm.sellAmount);
    const cost = Number(editForm.costAmount);
    const companyPercent = Number(editForm.companySharePercent);
    const employeePercent = Number(editForm.employeeSharePercent);

    const gross = Number.isFinite(sell) && Number.isFinite(cost) ? Math.max(0, sell - cost) : 0;
    const companyShare = Number.isFinite(companyPercent) ? Math.round((gross * companyPercent) / 100) : 0;
    const employeeShare = Number.isFinite(employeePercent) ? Math.round((gross * employeePercent) / 100) : 0;

    return {
      gross,
      companyShare,
      employeeShare
    };
  }, [editForm.sellAmount, editForm.costAmount, editForm.companySharePercent, editForm.employeeSharePercent]);

  const formatNumber = (value) => Number(value || 0).toLocaleString();
  const displayText = (value) => (value === null || value === undefined || value === '' ? '-' : value);

  const handleExport = () => {
    const header = 'Invoice,Passenger,Payment,Currencies,Sell,Cost,Gross,Company Share,Employee Share,Status,Handled\n';
    const lines = filteredRows
      .map(
        (row) =>
          `${row.invoiceNo || ''},${row.passenger || ''},${row.paymentMethod || ''},${row.currencies || ''},${row.sell || ''},${row.cost || ''},${row.gross || ''},${row.companyShare || ''},${row.employeeShare || ''},${row.status || ''},${row.handledBy || ''}`
      )
      .join('\n');

    const blob = new Blob([header + lines], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profit-tracker.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const res = await axios.post('http://localhost:5000/api/profittracker/recalculate');
      const payload = res.data || {};
      setRows(Array.isArray(payload.records) ? payload.records : []);
      setSummary(payload.summary || { totalGrossProfit: 0, companyShare: 0, employeeShare: 0 });
    } catch (error) {
      console.error('Failed to recalculate profit tracker:', error);
      alert('Failed to recalculate records');
    } finally {
      setIsRecalculating(false);
    }
  };

  const openEditModal = (row) => {
    setEditRow(row);
    setEditForm({
      paymentMethod: row.paymentMethod || '',
      status: row.status || '',
      sellCurrency: row.sellCurrency || '',
      costCurrency: row.costCurrency || '',
      exchangeRate: row.exchangeRate ?? '',
      sellAmount: row.sell ?? '',
      costAmount: row.cost ?? '',
      companySharePercent: row.companySharePercent ?? '',
      employeeSharePercent: row.employeeSharePercent ?? ''
    });
  };

  const closeEditModal = () => {
    setEditRow(null);
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editRow) {
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`http://localhost:5000/api/profittracker/${editRow.id}`, {
        paymentMethod: editForm.paymentMethod,
        sellCurrency: editForm.sellCurrency,
        costCurrency: editForm.costCurrency,
        exchangeRate: editForm.exchangeRate,
        sellAmount: editForm.sellAmount,
        costAmount: editForm.costAmount,
        companySharePercent: editForm.companySharePercent,
        employeeSharePercent: editForm.employeeSharePercent
      });

      closeEditModal();
      await fetchProfitData();
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this profit record?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/profittracker/${id}`);
      await fetchProfitData();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('Failed to delete record');
    }
  };

  const statusPillClass = (status) => {
    if (!status) {
      return 'bg-gray-100 text-gray-500';
    }

    const value = String(status).toLowerCase();
    if (value === 'paid') {
      return 'bg-emerald-100 text-emerald-600';
    }

    if (value === 'pending') {
      return 'bg-orange-100 text-orange-600';
    }

    return 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Profit Tracker</h2>
          <TopHeaderActions />
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-4xl font-bold text-gray-800 leading-tight">Profit Tracker</h3>
              <p className="text-3xl text-gray-500 mt-1">{rows.length} records</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-[#EDEFF3] text-gray-700 font-medium hover:bg-gray-200"
              >
                <RefreshCw size={18} />
                {isRecalculating ? 'Recalculating...' : 'Recalculate All'}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-[#EDEFF3] text-gray-700 font-medium hover:bg-gray-200"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Gross Profit</p>
              <p className="text-4xl font-bold text-emerald-600 mt-2">LKR {formatNumber(summary.totalGrossProfit)}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Company Share</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">LKR {formatNumber(summary.companyShare)}</p>
            </div>
            <div className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Employee Share</p>
              <p className="text-4xl font-bold text-violet-600 mt-2">LKR {formatNumber(summary.employeeShare)}</p>
            </div>
          </div>

          <div className="mb-4 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice, passenger, employee..."
              className="w-full bg-[#ECEFF3] border border-gray-300 rounded-xl pl-11 pr-4 py-2.5 text-gray-700 outline-none"
            />
          </div>

          <div className="bg-white border border-gray-300 rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full min-w-[1140px]">
              <thead className="bg-[#ECEFF3] text-gray-500 text-sm font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Invoice</th>
                  <th className="px-4 py-3 text-left">Passenger</th>
                  <th className="px-4 py-3 text-left">Payment</th>
                  <th className="px-4 py-3 text-left">Currencies</th>
                  <th className="px-4 py-3 text-right">Sell</th>
                  <th className="px-4 py-3 text-right">Cost</th>
                  <th className="px-4 py-3 text-right">Gross</th>
                  <th className="px-4 py-3 text-right">Co. Share</th>
                  <th className="px-4 py-3 text-right">Emp. Share</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Handled</th>
                  <th className="px-4 py-3 text-center"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {!isLoading && filteredRows.map((row) => (
                  <tr key={row.id} className="text-sm text-gray-700">
                    <td className="px-4 py-3 font-semibold text-gray-600">{displayText(row.invoiceNo)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{displayText(row.passenger)}</td>
                    <td className="px-4 py-3">
                      {row.paymentMethod ? (
                        <span className="px-3 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-600">
                          {row.paymentMethod}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{displayText(row.currencies)}</td>
                    <td className="px-4 py-3 text-right">{row.sell === null || row.sell === undefined ? '-' : formatNumber(row.sell)}</td>
                    <td className="px-4 py-3 text-right">{row.cost === null || row.cost === undefined ? '-' : formatNumber(row.cost)}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{row.gross === null || row.gross === undefined ? '-' : formatNumber(row.gross)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-600">{row.companyShare === null || row.companyShare === undefined ? '-' : formatNumber(row.companyShare)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-violet-600">{row.employeeShare === null || row.employeeShare === undefined ? '-' : formatNumber(row.employeeShare)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full font-semibold ${statusPillClass(row.status)}`}>
                        {displayText(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{displayText(row.handledBy)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-3 text-gray-500">
                        <button type="button" className="hover:text-gray-800" onClick={() => openEditModal(row)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="hover:text-red-500" onClick={() => handleDelete(row.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {isLoading && (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={12}>
                      Loading records...
                    </td>
                  </tr>
                )}

                {!isLoading && filteredRows.length === 0 && (
                  <tr>
                    <td className="px-4 py-8 text-center text-gray-500" colSpan={12}>
                      No profit records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {editRow && (
            <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-[#F3F4F6] rounded-3xl border border-white/70 shadow-2xl">
                <div className="px-6 pt-6 pb-3 flex items-center justify-between">
                  <h3 className="text-2xl leading-tight font-semibold text-[#1F2937]">
                    Edit Profit Row - {displayText(editRow.invoiceNo)}
                  </h3>
                  <button type="button" className="text-gray-500 hover:text-gray-700 text-3xl leading-none" onClick={closeEditModal}>
                    &times;
                  </button>
                </div>

                <div className="px-6 pb-5 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <label className="text-sm text-gray-700 font-medium">
                    Payment Method
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => handleEditFieldChange('paymentMethod', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                    >
                      <option value="">Select payment</option>
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Status
                    <select
                      value={editForm.status}
                      disabled
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-gray-100 px-3 text-sm text-gray-500 outline-none"
                    >
                      <option value="">Select status</option>
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Sell Currency
                    <select
                      value={editForm.sellCurrency}
                      onChange={(e) => handleEditFieldChange('sellCurrency', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                    >
                      <option value="">Select currency</option>
                      <option value="LKR">LKR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Cost Currency
                    <select
                      value={editForm.costCurrency}
                      onChange={(e) => handleEditFieldChange('costCurrency', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                    >
                      <option value="">Select currency</option>
                      <option value="LKR">LKR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Exchange Rate
                    <input
                      type="number"
                      value={editForm.exchangeRate}
                      onChange={(e) => handleEditFieldChange('exchangeRate', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                      placeholder="1"
                      step="0.0001"
                    />
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Sell Amount (LKR)
                    <input
                      type="number"
                      value={editForm.sellAmount}
                      onChange={(e) => handleEditFieldChange('sellAmount', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                      placeholder="0"
                    />
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Cost Amount (LKR)
                    <input
                      type="number"
                      value={editForm.costAmount}
                      onChange={(e) => handleEditFieldChange('costAmount', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                      placeholder="0"
                    />
                  </label>

                  <label className="text-sm text-gray-700 font-medium">
                    Company Share %
                    <input
                      type="number"
                      value={editForm.companySharePercent}
                      onChange={(e) => handleEditFieldChange('companySharePercent', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                      placeholder="60"
                    />
                  </label>

                  <label className="text-sm text-gray-700 font-medium md:col-span-1">
                    Employee Share %
                    <input
                      type="number"
                      value={editForm.employeeSharePercent}
                      onChange={(e) => handleEditFieldChange('employeeSharePercent', e.target.value)}
                      className="mt-1.5 w-full h-10 rounded-xl border border-[#C6CAD3] bg-white px-3 text-sm text-[#111827] outline-none"
                      placeholder="40"
                    />
                  </label>

                  <div className="hidden md:block" />

                  <div className="md:col-span-2 bg-[#EAECF1] rounded-2xl px-4 py-3 mt-1">
                    <div className="flex items-center justify-between text-base text-gray-500">
                      <span>Gross Profit</span>
                      <span className="font-semibold text-[#059669]">{formatNumber(preview.gross)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base text-gray-500 mt-1">
                      <span>Company Share</span>
                      <span className="font-semibold text-[#2563EB]">{formatNumber(preview.companyShare)}</span>
                    </div>
                    <div className="flex items-center justify-between text-base text-gray-500 mt-1">
                      <span>Employee Share</span>
                      <span className="font-semibold text-[#9333EA]">{formatNumber(preview.employeeShare)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-7 py-2.5 rounded-2xl border border-[#C9CDD6] bg-[#ECEEF2] text-[#1F2937] font-semibold hover:bg-[#E3E6EC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="px-7 py-2.5 rounded-2xl bg-[#182B5C] text-white font-semibold hover:bg-[#122247] disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
