import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Phone, Mail, Upload, FileText, CheckCircle, AlertCircle, Loader2, TrendingUp 
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    phone: '',
    email: ''
  });

  const [files, setFiles] = useState({
    cv: null,
    agreement1: null,
    agreement2: null
  });

  const [payrollHistory, setPayrollHistory] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [payrollFilter, setPayrollFilter] = useState('');

  useEffect(() => {
    fetchProfile();
    if (user.role === 'employee') {
      fetchPayrollHistory();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProfile(res.data);
      setFormData({
        phone: res.data.phone || '',
        email: res.data.email || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_BASE_URL}/api/auth/profile`, formData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFiles(prev => ({ ...prev, [field]: file }));
    } else {
      toast.error('Please upload a PDF file');
      e.target.value = null;
    }
  };

  const handleUploadFiles = async () => {
    if (!files.cv && !files.agreement1 && !files.agreement2) {
      toast.error('No files selected for upload');
      return;
    }

    setUploading(true);
    const uploadData = new FormData();
    if (files.cv) uploadData.append('cv', files.cv);
    if (files.agreement1) uploadData.append('agreement1', files.agreement1);
    if (files.agreement2) uploadData.append('agreement2', files.agreement2);

    try {
      await axios.post(`${API_BASE_URL}/api/auth/upload-files`, uploadData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}` 
        }
      });
      toast.success('Files uploaded successfully');
      setFiles({ cv: null, agreement1: null, agreement2: null });
      fetchProfile();
    } catch (err) {
      console.error('Error uploading files:', err);
      toast.error(err.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const fetchPayrollHistory = async () => {
    setPayrollLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/payroll/my-payroll`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setPayrollHistory(res.data || []);
    } catch (err) {
      console.error('Error fetching payroll history:', err);
    } finally {
      setPayrollLoading(false);
    }
  };

  const filteredPayroll = payrollHistory.filter(p => 
    !payrollFilter || p.payrollMonth.includes(payrollFilter)
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F3F4F6]">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#101D42]" size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F3F4F6]">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="font-bold text-[#101D42] uppercase tracking-widest text-xs">My Profile</h2>
          <TopHeaderActions />
        </div>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1">
          {/* Header Card */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-[#101D42] h-32 relative">
              <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full shadow-lg">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-black uppercase">
                  {user.username.charAt(0)}
                </div>
              </div>
            </div>
            <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-black text-[#101D42] tracking-tight">{user.username}</h1>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">{user.role} — Account Verified</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase ring-1 ring-emerald-100">
                <CheckCircle size={14} />
                Active Account
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              {/* Personal Details */}
              <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-black text-[#101D42] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <User size={18} className="text-[#F3A91B]" />
                  Personal Info
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="text"
                        className="w-full h-12 bg-gray-50 border border-transparent pl-12 pr-4 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-[#101D42]"
                        placeholder="+94 77 XXXXXXX"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input 
                        type="email"
                        className="w-full h-12 bg-gray-50 border border-transparent pl-12 pr-4 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all font-bold text-[#101D42]"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                  <button 
                    disabled={saving}
                    type="submit"
                    className="w-full h-12 bg-[#101D42] text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : 'Update My Profile'}
                  </button>
                </form>
              </div>

              {/* Documents Upload */}
              {user.role === 'employee' && (
                <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-black text-[#101D42] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-[#F3A91B]" />
                    Documents
                  </h3>
                  
                  <div className="space-y-4">
                    {['cv', 'agreement1', 'agreement2'].map(field => (
                      <div key={field}>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">
                          {field === 'cv' ? 'Curriculum Vitae' : field === 'agreement1' ? 'Service Agreement 1' : 'Service Agreement 2'}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className={`flex-1 h-12 bg-gray-50 border border-dashed ${files[field] ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} rounded-xl flex items-center px-4 overflow-hidden`}>
                            <span className="text-[10px] font-bold text-gray-500 truncate">{files[field] ? files[field].name : 'No file selected'}</span>
                          </div>
                          <label className="cursor-pointer h-12 w-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#101D42] hover:border-blue-500 transition-all shadow-sm">
                            <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileChange(e, field)} />
                            <Upload size={18} />
                          </label>
                        </div>
                      </div>
                    ))}

                    <button 
                      onClick={handleUploadFiles}
                      disabled={uploading || (!files.cv && !files.agreement1 && !files.agreement2)}
                      className="w-full h-12 bg-[#F3A91B] text-[#101D42] font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-[#e29d1a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="animate-spin" size={16} /> : 'Upload My PDF Files'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-8">
               {/* Salary History Section */}
               {user.role === 'employee' && (
                 <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                       <div>
                          <h3 className="text-xl font-black text-[#101D42] tracking-tight">Salary History</h3>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Full statement of past records</p>
                       </div>
                       
                       <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                          <input 
                            type="month" 
                            className="bg-transparent border-none outline-none text-xs font-bold text-[#101D42] px-3"
                            value={payrollFilter}
                            onChange={e => setPayrollFilter(e.target.value)}
                          />
                          {payrollFilter && (
                            <button onClick={() => setPayrollFilter('')} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                               <AlertCircle size={14} className="text-gray-400" />
                            </button>
                          )}
                       </div>
                    </div>

                    <div className="flex-1 overflow-x-auto">
                       {payrollLoading ? (
                         <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
                            <Loader2 className="animate-spin" size={32} />
                            <p className="text-xs font-bold uppercase tracking-widest">Loading records...</p>
                         </div>
                       ) : filteredPayroll.length === 0 ? (
                         <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <FileText size={48} className="opacity-10 mb-4" />
                            <p className="text-xs font-bold uppercase tracking-widest">No salary records found for this period</p>
                         </div>
                       ) : (
                         <div className="divide-y divide-gray-50">
                            {filteredPayroll.map(record => (
                              <div key={record.id} className="p-6 hover:bg-gray-50/50 transition-all group">
                                 <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex gap-4">
                                       <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                                          <TrendingUp size={20} />
                                       </div>
                                       <div>
                                          <h4 className="font-black text-gray-800 text-sm">{record.payrollMonth}</h4>
                                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Paid on: {new Date(record.payrollDate).toLocaleDateString()}</p>
                                       </div>
                                    </div>

                                    <div className="flex items-center justify-between md:justify-end gap-6">
                                       <div className="text-right">
                                          <p className="text-[9px] font-black text-emerald-600/50 uppercase tracking-widest">Net Salary</p>
                                          <p className="font-black text-emerald-600 text-lg leading-none">{formatCurrency(record.netSalary)}</p>
                                       </div>
                                       <button 
                                         onClick={() => setSelectedPayroll(record)}
                                         className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#101D42] hover:text-white hover:border-[#101D42] transition-all shadow-sm"
                                       >
                                          View Report
                                       </button>
                                    </div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Payslip Modal */}
        {selectedPayroll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
             <div id="printable-payslip" className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl my-auto border border-white/20">
                <div className="p-8 md:p-12">
                   <div className="flex justify-between items-start mb-12">
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 bg-[#101D42] rounded-lg flex items-center justify-center text-white font-black text-xs">Z</div>
                            <h2 className="text-xl font-black text-[#101D42] tracking-tighter uppercase">Salary Report</h2>
                         </div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Zandra Travelers (Pvt) Ltd</p>
                      </div>
                      <button onClick={() => setSelectedPayroll(null)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors">
                         <AlertCircle size={20} className="rotate-45" />
                      </button>
                   </div>

                   <div className="grid grid-cols-2 gap-12 mb-12">
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Employee Details</p>
                         <h4 className="font-black text-[#101D42] text-lg">{selectedPayroll.employeeName}</h4>
                         <p className="text-sm font-bold text-gray-500">ID: EMP-{selectedPayroll.employeeId.toString().padStart(4, '0')}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Statement Period</p>
                         <h4 className="font-black text-[#101D42] text-lg">{selectedPayroll.payrollMonth}</h4>
                         <p className="text-sm font-bold text-gray-500">Paid: {new Date(selectedPayroll.payrollDate).toLocaleDateString()}</p>
                      </div>
                   </div>

                   <div className="space-y-6 mb-12">
                      <div className="bg-gray-50/50 rounded-3xl p-6 md:p-8 space-y-4">
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-500">Basic Salary</span>
                            <span className="font-black text-gray-900">{formatCurrency(selectedPayroll.basicSalary)}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-500">Allowances</span>
                            <span className="font-black text-emerald-600">+ {formatCurrency(selectedPayroll.allowances)}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-500">Overtime / Bonuses</span>
                            <span className="font-black text-emerald-600">+ {formatCurrency(Number(selectedPayroll.overtime || 0) + Number(selectedPayroll.bonuses || 0))}</span>
                         </div>
                         <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                            <span className="font-black text-gray-900 uppercase tracking-widest text-[10px]">Gross Salary</span>
                            <span className="font-black text-gray-900">{formatCurrency(selectedPayroll.gross)}</span>
                         </div>
                         <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-rose-400">Total Deductions (EPF/Tax/Other)</span>
                            <span className="font-black text-rose-500">- {formatCurrency(selectedPayroll.totalDeductions)}</span>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#101D42] rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white shadow-xl shadow-blue-900/20 mb-8">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Net Salary Paid (LKR)</p>
                         <h3 className="text-4xl font-black tracking-tight text-[#F3A91B] drop-shadow-sm">{formatCurrency(selectedPayroll.netSalary)}</h3>
                      </div>
                      <div className="px-6 py-2 bg-white/10 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest">
                         {selectedPayroll.paymentMethod}
                      </div>
                   </div>

                   {selectedPayroll.notes && (
                     <div className="mb-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Notes</p>
                        <p className="text-xs font-bold text-amber-700 italic">"{selectedPayroll.notes}"</p>
                     </div>
                   )}

                   <div className="flex flex-col md:flex-row items-center justify-center gap-4 border-t border-gray-100 pt-8 no-print">
                      <button 
                        onClick={() => {
                          const oldTitle = document.title;
                          document.title = `${selectedPayroll.employeeName}_${selectedPayroll.payrollMonth}_Salary_Report`;
                          window.print();
                          document.title = oldTitle;
                        }}
                        className="flex items-center gap-3 px-8 py-4 bg-[#F3A91B] text-[#101D42] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#e29d1a] transition-all shadow-xl shadow-orange-500/20"
                      >
                         <Upload size={16} className="rotate-180" />
                         Download Salary Report (PDF)
                      </button>
                      <button 
                        onClick={() => setSelectedPayroll(null)}
                        className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                      >
                         Close Window
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
