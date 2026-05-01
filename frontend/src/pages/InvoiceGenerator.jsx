import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  Check
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { generateInvoicePDF } from '../utils/generateInvoicePDF';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const InvoiceManager = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/invoices`);
      setInvoices(res.data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_BASE_URL}/api/invoices/${id}/status`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/invoices/${id}`);
        toast.success('Invoice deleted successfully');
        fetchInvoices();
      } catch (err) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesTab = inv.status === activeTab;
    const matchesSearch = inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.billToName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 overflow-hidden">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <h2 className="font-bold text-gray-800 uppercase tracking-tighter text-xs">Finances / Invoice Generator</h2>
          <TopHeaderActions />
        </div>

        <div className="p-4 md:p-8">
          {/* Page Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Invoice Generator</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1.5">Manage and generate professional invoices</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <div className="flex bg-white border border-gray-200 p-1 rounded-2xl shadow-sm">
                {['Pending', 'Approve'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 md:px-8 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all ${
                      activeTab === tab 
                        ? 'bg-[#101D42] text-white shadow-lg shadow-blue-900/20' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
            {/* Search Top */}
            <div className="p-4 md:p-6 border-b border-gray-50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search invoice or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-2.5 md:py-3 text-sm font-medium outline-none focus:bg-white focus:border-blue-500/20 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto w-full border-t border-gray-50">
              <div className="min-w-fit">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-widest border-b border-gray-50">
                    <th className="px-6 py-4">Invoice Details</th>
                    <th className="px-6 py-4">Bill To</th>
                    <th className="px-6 py-4">Route Info</th>
                    <th className="px-6 py-4">Amount (LKR)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400">Loading invoices...</td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400">No invoices found for this status.</td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#101D42]">{inv.invoiceNo}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{new Date(inv.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-700">{inv.billToName}</div>
                          <div className="text-xs text-gray-400">{inv.phone}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-600">{inv.destination}</div>
                          <div className="text-xs text-gray-400">{inv.travelDate}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-orange-600">
                            {Number(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase">QTY: {inv.qty}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            inv.status === 'Approve' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => generateInvoicePDF(inv, inv.status !== 'Approve')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </button>
                            {inv.status === 'Pending' && (
                              <button 
                                onClick={() => handleUpdateStatus(inv.id, 'Approve')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(inv.id)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
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
    </div>
  </div>
  );
};

export default InvoiceManager;
