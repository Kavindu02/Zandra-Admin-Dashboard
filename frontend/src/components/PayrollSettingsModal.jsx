import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert } from 'lucide-react';
import axios from 'axios';

export default function PayrollSettingsModal({ isOpen, onClose, onSave }) {
  const [rates, setRates] = useState({
    epfEmployee: 8,
    epfEmployer: 12,
    etfEmployer: 3
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/settings/payroll`);
      setRates(res.data);
    } catch (error) {
      console.error('Failed to fetch payroll settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${apiUrl}/api/settings/payroll`, rates);
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update payroll settings:', error);
      alert('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payroll Settings</h2>
            <p className="text-gray-500 text-sm mt-1">Configure global EPF & ETF rates</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
            <ShieldAlert className="text-amber-600 shrink-0" size={20} />
            <p className="text-xs text-amber-700 leading-relaxed">
              Changing these rates will affect all future payroll calculations. Existing records will remain unchanged for historical accuracy.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Employee EPF (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rates.epfEmployee}
                  onChange={(e) => setRates({ ...rates, epfEmployee: Number(e.target.value) })}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="8"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Employer EPF (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rates.epfEmployer}
                  onChange={(e) => setRates({ ...rates, epfEmployer: Number(e.target.value) })}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Employer ETF (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rates.etfEmployer}
                  onChange={(e) => setRates({ ...rates, etfEmployer: Number(e.target.value) })}
                  className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  placeholder="3"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8 pt-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#101D42] text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-[#1a2b5a] transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
