import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, Phone, Mail, Upload, FileText, CheckCircle, AlertCircle, Loader2 
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

  useEffect(() => {
    fetchProfile();
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
      <div className="flex-1 ml-64 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="font-bold text-[#101D42]">My Profile</h2>
          <TopHeaderActions />
        </div>

        <div className="p-8 max-w-4xl mx-auto w-full">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="bg-[#101D42] h-32 relative">
              <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-full">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-[#101D42] text-4xl font-bold uppercase">
                  {user.username.charAt(0)}
                </div>
              </div>
            </div>
            <div className="pt-16 pb-8 px-8 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-[#101D42]">{user.username}</h1>
                <p className="text-gray-500 font-medium capitalize">{user.role}</p>
              </div>
              <div className="px-4 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
                Active Account
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-[#101D42] mb-6 flex items-center gap-2">
                <User size={20} className="text-[#F3A91B]" />
                Personal Details
              </h3>
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      className="w-full h-11 bg-[#F9FAFB] border border-gray-200 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium"
                      placeholder="+94 77 XXXXXXX"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="email"
                      className="w-full h-11 bg-[#F9FAFB] border border-gray-200 pl-10 pr-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-300 transition-all font-medium"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <button 
                  disabled={saving}
                  type="submit"
                  className="w-full h-12 bg-[#101D42] text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-900/10 hover:bg-[#1a2b5a] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Documents Upload (Employees Only) */}
            {user.role === 'employee' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-[#101D42] mb-6 flex items-center gap-2">
                  <FileText size={20} className="text-[#F3A91B]" />
                  Documents & Agreements
                </h3>
                
                <div className="space-y-6">
                  {/* CV Upload */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Curriculum Vitae (CV)</label>
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 h-11 bg-[#F9FAFB] border border-dashed ${files.cv ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} rounded-xl flex items-center px-4 overflow-hidden`}>
                        <span className="text-xs text-gray-500 truncate">{files.cv ? files.cv.name : 'No file selected'}</span>
                      </div>
                      <label className="cursor-pointer h-11 w-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#101D42] hover:border-gray-300 transition-all">
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileChange(e, 'cv')} />
                        <Upload size={18} />
                      </label>
                      {profile?.cv_path && !files.cv && (
                        <div className="h-11 w-11 bg-green-50 text-green-500 rounded-xl flex items-center justify-center border border-green-100">
                          <CheckCircle size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agreement 1 */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Service Agreement 1</label>
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 h-11 bg-[#F9FAFB] border border-dashed ${files.agreement1 ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} rounded-xl flex items-center px-4 overflow-hidden`}>
                        <span className="text-xs text-gray-500 truncate">{files.agreement1 ? files.agreement1.name : 'No file selected'}</span>
                      </div>
                      <label className="cursor-pointer h-11 w-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#101D42] hover:border-gray-300 transition-all">
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileChange(e, 'agreement1')} />
                        <Upload size={18} />
                      </label>
                      {profile?.agreement1_path && !files.agreement1 && (
                        <div className="h-11 w-11 bg-green-50 text-green-500 rounded-xl flex items-center justify-center border border-green-100">
                          <CheckCircle size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agreement 2 */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Service Agreement 2</label>
                    <div className="flex items-center gap-3">
                      <div className={`flex-1 h-11 bg-[#F9FAFB] border border-dashed ${files.agreement2 ? 'border-blue-400 bg-blue-50' : 'border-gray-200'} rounded-xl flex items-center px-4 overflow-hidden`}>
                        <span className="text-xs text-gray-500 truncate">{files.agreement2 ? files.agreement2.name : 'No file selected'}</span>
                      </div>
                      <label className="cursor-pointer h-11 w-11 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-[#101D42] hover:border-gray-300 transition-all">
                        <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileChange(e, 'agreement2')} />
                        <Upload size={18} />
                      </label>
                      {profile?.agreement2_path && !files.agreement2 && (
                        <div className="h-11 w-11 bg-green-50 text-green-500 rounded-xl flex items-center justify-center border border-green-100">
                          <CheckCircle size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={handleUploadFiles}
                    disabled={uploading || (!files.cv && !files.agreement1 && !files.agreement2)}
                    className="w-full h-12 bg-[#F3A91B] text-[#101D42] font-bold rounded-xl text-sm shadow-lg shadow-orange-500/10 hover:bg-[#d98b06] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none"
                  >
                    {uploading ? <Loader2 className="animate-spin" size={18} /> : 'Upload Documents'}
                  </button>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="text-blue-500 shrink-0" size={18} />
                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                      Please ensure all documents are in PDF format. Uploaded documents will be reviewed by the administration.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
