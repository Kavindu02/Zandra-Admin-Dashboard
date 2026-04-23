import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Users, Search, Plus, Pencil, Trash2, 
  Mail, Phone, CreditCard, ChevronLeft, ChevronRight,
  MoreVertical, Filter, Download, ArrowUpDown
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Passengers() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    passport: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/passengers`);
      setPassengers(response.data);
    } catch (error) {
      console.error('Error fetching passengers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (passenger = null) => {
    if (passenger) {
      setEditId(passenger.id);
      setFormData({
        name: passenger.name || '',
        passport: passenger.passport || '',
        email: passenger.email || '',
        phone: passenger.phone || ''
      });
    } else {
      setEditId(null);
      setFormData({
        name: '',
        passport: '',
        email: '',
        phone: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/passengers/${editId}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/passengers`, formData);
      }
      fetchPassengers();
      closeModal();
    } catch (error) {
      console.error('Error saving passenger:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this passenger?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/passengers/${id}`);
        fetchPassengers();
      } catch (error) {
        console.error('Error deleting passenger:', error);
      }
    }
  };

  const filteredPassengers = useMemo(() => {
    return passengers.filter(p => 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
    );
  }, [passengers, searchTerm]);

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 ml-64 overflow-hidden flex flex-col">
        <TopHeaderActions />
        
        <div className="p-8 flex-1 overflow-y-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-[#1F2B3F]">Passengers</h2>
              <p className="text-gray-500 mt-1">Manage your passenger directory</p>
            </div>
            
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#101D42] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all cursor-pointer w-fit"
            >
              <Plus size={20} />
              Add Passenger
            </button>
          </div>

          {/* Search & Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="md:col-span-2 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Search by name, passport, email..." 
                className="w-full bg-white border border-gray-200 pl-12 pr-4 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500/30 transition-all text-sm font-medium shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-gray-100">
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Passenger</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Passport No</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Contact Info</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-5 text-right text-[11px] font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400">Loading passengers...</td>
                    </tr>
                  ) : filteredPassengers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-gray-400">No passengers found</td>
                    </tr>
                  ) : (
                    filteredPassengers.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm border border-orange-100 uppercase">
                              {p.name?.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{p.name}</div>
                              <div className="text-xs text-gray-500">ID: #{p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <CreditCard size={14} className="text-gray-400" />
                            {p.passport || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail size={13} className="text-gray-400" />
                              {p.email || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={13} className="text-gray-400" />
                              {p.phone || '-'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleOpenModal(p)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(p.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 pt-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-[#1F2B3F]">
                {editId ? 'Edit Passenger' : 'Add New Passenger'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-8 py-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Full Name *</label>
                  <input 
                    required 
                    placeholder="Full name" 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Passport No</label>
                  <input 
                    placeholder="N12345678" 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" 
                    value={formData.passport} 
                    onChange={e => setFormData({...formData, passport: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com" 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Phone</label>
                  <input 
                    placeholder="+94 7X XXX XXXX" 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div className="px-8 pb-8 flex items-center justify-end gap-4 border-t border-gray-100 pt-6 mt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-8 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#101D42] text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : editId ? 'Update Passenger' : 'Add Passenger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
