import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Bell, Plus, Trash2, CheckCircle, Clock, 
  Filter, Calendar, AlertCircle, Check, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('All'); // All, Pending, Completed

  const initialForm = {
    title: '',
    description: '',
    reminder_date: new Date().toISOString().split('T')[0],
    priority: 'Medium'
  };
  const [formData, setFormData] = useState(initialForm);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reminders`);
      setReminders(res.data);
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/reminders`, formData);
      fetchReminders();
      setIsModalOpen(false);
      setFormData(initialForm);
    } catch (err) {
      console.error('Failed to add reminder:', err);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/reminders/${id}/toggle`, { is_completed: !currentStatus });
      fetchReminders();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/reminders/${id}`);
      fetchReminders();
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'Pending') return !r.is_completed;
    if (filter === 'Completed') return r.is_completed;
    return true;
  });

  const getPriorityColor = (p) => {
    switch (p) {
      case 'High': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="font-bold text-[#101D42]">Reminders</h2>
          <TopHeaderActions />
        </div>

        <div className="p-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#101D42]">Task Reminders</h1>
              <p className="text-gray-500 text-sm mt-1">Manage special dates and important follow-ups</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-white p-1 rounded-xl border border-gray-200">
                {['All', 'Pending', 'Completed'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setFilter(opt)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      filter === opt ? 'bg-[#101D42] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-[#F3A91B] text-[#101D42] px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/10 hover:bg-[#d98b06] transition-all"
              >
                <Plus size={18} />
                Add New
              </button>
            </div>
          </div>

          {/* Reminders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredReminders.map((row) => (
              <div 
                key={row.id} 
                className={`bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group ${
                  row.is_completed ? 'opacity-70' : ''
                }`}
              >
                {/* Priority Indicator */}
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-bold border-l border-b uppercase ${getPriorityColor(row.priority)}`}>
                  {row.priority}
                </div>

                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    row.is_completed ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {row.is_completed ? <CheckCircle size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-gray-900 border-b border-gray-50 pb-2 mb-3 mr-12 truncate ${row.is_completed ? 'line-through text-gray-400' : ''}`}>
                      {row.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                      {row.description || 'No description provided.'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Calendar size={14} className="text-orange-400" />
                        {new Date(row.reminder_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleToggle(row.id, row.is_completed)}
                          className={`p-2 rounded-lg transition-all ${
                            row.is_completed ? 'text-gray-400 hover:text-blue-600' : 'text-emerald-500 hover:bg-emerald-50'
                          }`}
                          title={row.is_completed ? 'Mark as Pending' : 'Mark as Done'}
                        >
                          {row.is_completed ? <Clock size={16} /> : <Check size={18} />}
                        </button>
                        <button 
                          onClick={() => handleDelete(row.id)}
                          className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredReminders.length === 0 && (
              <div className="col-span-full py-20 bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                <Bell size={48} className="mb-4 opacity-20" />
                <p className="font-medium">No {filter !== 'All' ? filter.toLowerCase() : ''} reminders found.</p>
                <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-500 font-bold hover:underline">Add your first reminder</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-[#F9FBFF]">
              <h3 className="text-xl font-bold text-[#101D42]">New Reminder</h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="What needs to be reminded?"
                  className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-bold" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Description</label>
                <textarea 
                  placeholder="Extra details..." 
                  className="w-full min-h-[100px] bg-[#F9FAFB] border border-gray-200 p-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium resize-none text-gray-600" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium" 
                    value={formData.reminder_date}
                    onChange={(e) => setFormData({...formData, reminder_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Priority</label>
                  <select 
                    className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-bold" 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-12 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 h-12 bg-[#101D42] text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-900/10 hover:bg-[#1a2b5a] transition-all"
                >
                  Create Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}