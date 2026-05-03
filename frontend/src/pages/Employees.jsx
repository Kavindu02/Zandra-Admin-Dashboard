import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, Download, Edit2, Trash2, X, FileDown, FileText, Phone, Mail 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const initialFormData = {
    username: '',
    phone: '',
    email: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/users`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Only show employees
      setEmployees(res.data.filter(u => u.role === 'employee'));
    } catch (err) {
      console.error('Error fetching employees:', err);
      toast.error('Failed to fetch employees');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/auth/profile/${editId}`, {
        phone: formData.phone,
        email: formData.email
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Employee updated successfully');
      fetchEmployees();
      closeModal();
    } catch (err) {
      console.error('Error saving employee:', err);
      toast.error('Failed to save employee');
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete employee ${username}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/api/auth/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success('Employee deleted');
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
        toast.error('Failed to delete employee');
      }
    }
  };

  const openModal = (employee) => {
    setEditId(employee.id);
    setFormData({
      username: employee.username,
      phone: employee.phone || '',
      email: employee.email || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData(initialFormData);
  };

  const downloadFile = (filePath) => {
    if (!filePath) {
      toast.error("File path not found");
      return;
    }
    
    // Normalize path: replace backslashes with forward slashes
    // and ensure it starts with /public if it doesn't already
    let normalizedPath = filePath.replace(/\\/g, '/');
    if (!normalizedPath.startsWith('public/') && !normalizedPath.startsWith('/public/')) {
      normalizedPath = 'public/' + normalizedPath;
    }
    
    // Ensure no double slashes at the start of the relative path
    normalizedPath = normalizedPath.replace(/^\/+/, '');
    
    const fileUrl = `${API_BASE_URL}/${normalizedPath}`;
    
    // Open in new tab
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.download = ''; // Optional: force download instead of open
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <p className="text-sm text-gray-500 mt-1">Manage staff details and view uploaded documents</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm">
                <Download size={18} />
                Export
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
                    placeholder="Search by username, email or phone..." 
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
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Username</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Contact Info</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-50">Documents</th>
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
                            {employee.username.charAt(0)}
                          </div>
                          <span className="text-sm font-bold text-[#101D42]">{employee.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone size={12} className="text-gray-400" />
                            {employee.phone || '-'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Mail size={12} className="text-gray-400" />
                            {employee.email || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={!employee.cv_path}
                            onClick={() => downloadFile(employee.cv_path)}
                            title="Download CV"
                            className={`p-2 rounded-lg transition-all ${employee.cv_path ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                          >
                            <FileDown size={16} />
                          </button>
                          <button 
                            disabled={!employee.agreement1_path}
                            onClick={() => downloadFile(employee.agreement1_path)}
                            title="Download Agreement 1"
                            className={`p-2 rounded-lg transition-all ${employee.agreement1_path ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                          >
                            <FileText size={16} />
                          </button>
                          <button 
                            disabled={!employee.agreement2_path}
                            onClick={() => downloadFile(employee.agreement2_path)}
                            title="Download Agreement 2"
                            className={`p-2 rounded-lg transition-all ${employee.agreement2_path ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-300 bg-gray-50 cursor-not-allowed'}`}
                          >
                            <FileText size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(employee.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openModal(employee)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(employee.id, employee.username)}
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

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#F9FBFF]">
              <h3 className="text-xl font-bold text-[#101D42]">Edit Employee</h3>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Username (Read-only)</label>
                <input 
                  disabled
                  className="w-full h-11 bg-gray-50 border border-gray-200 px-4 rounded-xl text-sm outline-none font-medium text-gray-500" 
                  value={formData.username}
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
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
