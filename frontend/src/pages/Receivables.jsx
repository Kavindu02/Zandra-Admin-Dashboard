import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Download, Edit2, Trash2, X 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import CustomSelect from '../components/CustomSelect';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Receivables() {
  const [receivables, setReceivables] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const initialFormData = {
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    payment_method: 'Cash',
    description: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/receivables`);
      setReceivables(res.data);
    } catch (err) {
      console.error('Error fetching receivables:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/receivables/${editId}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/receivables`, formData);
      }
      fetchReceivables();
      closeModal();
    } catch (err) {
      console.error('Error saving receivable:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receivable?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/receivables/${id}`);
        fetchReceivables();
      } catch (err) {
        console.error('Error deleting receivable:', err);
      }
    }
  };

  const openModal = (receivable = null) => {
    if (receivable) {
      setEditId(receivable.id);
      setFormData({
        date: receivable.date.split('T')[0],
        category: receivable.category,
        amount: receivable.amount,
        payment_method: receivable.payment_method,
        description: receivable.description,
        notes: receivable.notes
      });
    } else {
      setEditId(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData(initialFormData);
  };

  const filteredReceivables = receivables.filter(rec => {
    const matchesSearch = rec.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          rec.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || rec.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...new Set(receivables.map(r => r.category))];

  const totalAmount = filteredReceivables.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-[#101D42]">Receivables</h2>
          </div>
          <TopHeaderActions />
        </div>

        <div className="p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#101D42]">Receivables</h1>
              <p className="text-sm text-gray-500 mt-1">Track outstanding incoming payments</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                <Download size={18} />
                Export
              </button>
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#101D42] text-white rounded-xl text-sm font-semibold hover:bg-[#1a2b5a] transition-all shadow-lg shadow-blue-900/20"
              >
                <Plus size={18} />
                Add Receivable
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Outstanding</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#101D42]">LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Records</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#101D42]">{receivables.length}</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filtered Total</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#101D42]">LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-[#F9FBFF]">
              <div className="flex flex-col md:row gap-4 justify-between">
                <div className="relative group max-w-md w-full">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#101D42] transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search description, category..." 
                    className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-400">{filteredReceivables.length} records</div>
                  <div className="h-8 w-px bg-gray-200 mx-2"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#101D42]">Total:</span>
                    <span className="text-sm font-bold text-emerald-500">LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-48">
                    <CustomSelect 
                      value={categoryFilter}
                      options={categories}
                      onChange={setCategoryFilter}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Date</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Category</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Description</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Amount</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Payment Method</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredReceivables.map((receivable) => (
                    <tr key={receivable.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {new Date(receivable.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                          {receivable.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {receivable.description || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-800">
                          LKR {parseFloat(receivable.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {receivable.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          <button 
                            onClick={() => openModal(receivable)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(receivable.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReceivables.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                        No receivables found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#F9FBFF]">
              <h3 className="text-xl font-bold text-[#101D42]">{editId ? 'Edit Receivable' : 'Add Receivable'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Category</label>
                  <input 
                    placeholder="e.g. Booking, Service" 
                    required 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    required 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-bold" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <CustomSelect 
                    label="Payment Method"
                    value={formData.payment_method}
                    options={['Cash', 'Bank Transfer', 'Card', 'Cheque']}
                    onChange={(val) => setFormData({...formData, payment_method: val})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                <input 
                  placeholder="Short description" 
                  className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Notes</label>
                <textarea 
                  placeholder="Any extra details..." 
                  className="w-full min-h-[100px] bg-[#F9FAFB] border border-gray-200 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium resize-none" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-[#F3A91B] text-[#101D42] font-bold rounded-xl text-sm shadow-lg shadow-orange-500/10 hover:bg-[#d98b06] transition-all"
                >
                  {editId ? 'Update Receivable' : 'Save Receivable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
