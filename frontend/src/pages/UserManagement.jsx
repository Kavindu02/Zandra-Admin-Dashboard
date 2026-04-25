import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, Trash2, Plus, Users, Shield, User } from 'lucide-react';
import TopHeaderActions from '../components/TopHeaderActions';
import Sidebar from '../components/Sidebar';

const UserManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ username: '', password: '', role: 'employee' });
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setUsers(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setSuccess(`Successfully created ${formData.role} account for ${formData.username}`);
      setFormData({ username: '', password: '', role: 'employee' });
      fetchUsers();
    } catch(err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id, username) => {
    if (window.confirm(`Are you sure you want to completely delete the user ${username}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/auth/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchUsers();
      } catch(err) {
        alert(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">User Management</h2>
          <TopHeaderActions />
        </header>
        
        <div className="p-8 max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#1F2B3F] mb-2 tracking-tight">Admin & Staff Access</h1>
              <p className="text-sm text-gray-500 font-medium">Create and manage access levels for your company.</p>
            </div>
            <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl flex items-center gap-2 font-bold text-sm">
              <ShieldAlert size={18} /> Admin Only Access
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Plus size={18} className="text-blue-500"/> Create New User</h2>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-semibold mb-4 border border-red-100">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm font-semibold mb-4 border border-green-100">{success}</div>}

                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                    <input 
                      required type="text"
                      className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none transition-all"
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                    <input 
                      required type="password" minLength={6}
                      className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 outline-none transition-all"
                      value={formData.password}
                      onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role Status</label>
                    <select 
                      className="w-full h-11 bg-[#f8fafc] border border-gray-200 px-4 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer"
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="employee">Employee (Restricted Access)</option>
                      <option value="admin">Administrator (Full Access)</option>
                    </select>
                  </div>
                  <button 
                    disabled={createLoading}
                    type="submit"
                    className="w-full h-11 mt-4 bg-[#1F2B3F] hover:bg-[#283854] text-white font-bold rounded-xl outline-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                     {createLoading ? 'Creating...' : 'Create Account'}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users size={18} className="text-orange-500"/> Existing Accounts</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                    {users.filter(u => u.username !== 'admin').length} Total Staff
                  </span>
                </div>
                
                {loading ? (
                   <div className="p-8 text-center text-gray-500">Loading users...</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-[#f8fafc]">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Role Access</th>
                        <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.filter(u => u.username !== 'admin').map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black">
                                {u.username.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-gray-800">{u.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {u.role === 'admin' ? (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-600 rounded-lg text-xs font-bold border border-orange-200">
                                 <Shield size={12}/> Administrator
                               </span>
                            ) : (
                               <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200">
                                 <User size={12}/> Employee
                               </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                             {u.id !== user.id && (
                                <button onClick={() => handleDelete(u.id, u.username)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={16} />
                                </button>
                             )}
                          </td>
                        </tr>
                      ))}
                      {users.filter(u => u.username !== 'admin').length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No staff found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default UserManagement;
