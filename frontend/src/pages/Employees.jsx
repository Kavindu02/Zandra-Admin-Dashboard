import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, Search, Download, Edit2, Trash2, X 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData = {
    name: '',
    phone: '',
    email: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/employees/${editId}`, formData);
      } else {
        await axios.post(`${API_BASE_URL}/api/employees`, formData);
      }
      fetchEmployees();
      closeModal();
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const openModal = (employee = null) => {
    if (employee) {
      setEditId(employee.id);
      setFormData({
        name: employee.name,
        phone: employee.phone || '',
        email: employee.email || ''
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

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone?.includes(searchTerm)
  );

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-[#101D42]">Employees</h2>
          </div>
          <TopHeaderActions />
        </div>

        <div className="p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#101D42]">Employees</h1>
              <p className="text-sm text-gray-500 mt-1">Manage staff details and records</p>
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
                Add Employee
              </button>
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
                    placeholder="Search by name, email or phone..." 
                    className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-400">{filteredEmployees.length} employees</div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC]">
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">ID</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Employee Name</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Phone Number</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Date Added</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                        #{employee.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                            {employee.name.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-[#101D42]">{employee.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {employee.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          <button 
                            onClick={() => openModal(employee)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(employee.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                        No employees found.
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
              <h3 className="text-xl font-bold text-[#101D42]">{editId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Employee Name</label>
                <input 
                  placeholder="Full Name" 
                  required
                  className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                <input 
                  placeholder="+94 77 XXXXXXX" 
                  className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                <input 
                  type="email"
                  placeholder="employee@domain.com" 
                  className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  {editId ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
