import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1F2B3F] to-[#121824] p-4 relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] opacity-60"></div>
      <div className="absolute bottom-[-100px] left-[-100px] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] opacity-60"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-white/10 p-4 rounded-3xl mx-auto mb-4 flex items-center justify-center backdrop-blur-lg border border-white/20">
            <img src="/zandralogo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Zandra Portal</h1>
          <p className="text-gray-300 font-medium">System Authentication Required</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-200 p-4 rounded-xl mb-6 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
             <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Username</label>
             <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  autoFocus
                  required
                  placeholder="Enter username"
                  className="w-full h-12 bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 text-white px-11 rounded-xl outline-none transition-all placeholder:text-gray-500"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
             </div>
          </div>
          
          <div>
             <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Password</label>
             <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="password" 
                  required
                  placeholder="Enter secure password"
                  className="w-full h-12 bg-white/5 border border-white/10 focus:border-orange-500 focus:bg-white/10 text-white px-11 rounded-xl outline-none transition-all placeholder:text-gray-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl outline-none transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
          >
            {loading ? 'Authenticating...' : (
              <>Secure Login <ArrowRight size={18}/></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-400 font-medium">Zandra Travelers Management System &copy; 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
