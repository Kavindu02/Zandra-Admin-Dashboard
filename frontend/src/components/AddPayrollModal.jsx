import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, ChevronDown } from 'lucide-react';
import axios from 'axios';

export default function AddPayrollModal({ isOpen, onClose, record = null }) {
  const [employees, setEmployees] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    payrollMonth: '2026-04',
    payrollDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    basicSalary: 0,
    allowances: 0,
    overtime: 0,
    bonuses: 0,
    manualDeductions: 0,
    taxDeduction: 0,
    paymentStatus: 'Unpaid',
    notes: ''
  });

  const [payrollSettings, setPayrollSettings] = useState({
    epfEmployee: 8,
    epfEmployer: 12,
    etfEmployer: 3
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/employees`);
        setEmployees(res.data);
      } catch (error) {
        console.error('Failed to fetch employees:', error);
      }
    };

    const fetchSettings = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await axios.get(`${apiUrl}/api/settings/payroll`);
        setPayrollSettings(res.data);
      } catch (error) {
        console.error('Failed to fetch payroll settings:', error);
      }
    };

    if (isOpen) {
      fetchEmployees();
      fetchSettings();
    }
  }, [isOpen]);

  // Handle record population for editing
  useEffect(() => {
    if (record) {
      setFormData({
        ...record,
        payrollDate: record.payrollDate ? new Date(record.payrollDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        employeeId: String(record.employeeId)
      });
    } else {
      // Reset if no record (adding new)
      setFormData({
        employeeId: '',
        employeeName: '',
        payrollMonth: '2026-04',
        payrollDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        basicSalary: 0,
        allowances: 0,
        overtime: 0,
        bonuses: 0,
        manualDeductions: 0,
        taxDeduction: 0,
        paymentStatus: 'Unpaid',
        notes: ''
      });
    }
  }, [record, isOpen]);

  const calculations = useMemo(() => {
    const basic = Number(formData.basicSalary) || 0;
    const allowances = Number(formData.allowances) || 0;
    const overtime = Number(formData.overtime) || 0;
    const bonuses = Number(formData.bonuses) || 0;
    const manualDeductions = Number(formData.manualDeductions) || 0;
    const taxDeduction = Number(formData.taxDeduction) || 0;

    const gross = basic + allowances + overtime + bonuses;
    const epfEmp = basic * (payrollSettings.epfEmployee / 100);
    const epfEmpr = basic * (payrollSettings.epfEmployer / 100);
    const etf = basic * (payrollSettings.etfEmployer / 100);
    const totalDeductions = epfEmp + manualDeductions + taxDeduction;
    const netSalary = gross - totalDeductions;

    return {
      gross,
      epfEmp,
      epfEmpr,
      etf,
      totalDeductions,
      netSalary
    };
  }, [formData, payrollSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.employeeId) {
      alert('Please select an employee');
      return;
    }

    setIsSaving(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const payload = {
        ...formData,
        ...calculations
      };
      
      if (record?.id) {
        // Update existing record
        await axios.put(`${apiUrl}/api/payroll/${record.id}`, payload);
        alert('Payroll record updated successfully!');
      } else {
        // Save new record
        await axios.post(`${apiUrl}/api/payroll`, payload);
        alert('Payroll record saved successfully!');
      }

      onClose();
      // Trigger a refresh event
      window.dispatchEvent(new CustomEvent('payroll-updated'));
    } catch (error) {
      console.error('Failed to save payroll:', error);
      alert('Failed to save payroll record. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200 border border-gray-100">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">{record ? 'Edit Payroll Record' : 'Add Payroll Record'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employee Name *</label>
              <select
                name="employeeId"
                value={formData.employeeId}
                onChange={(e) => {
                  const emp = employees.find(em => em.id === Number(e.target.value));
                  setFormData(prev => ({ ...prev, employeeId: e.target.value, employeeName: emp ? emp.name : '' }));
                }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payroll Month *</label>
              <div className="relative">
                <select
                  name="payrollMonth"
                  value={formData.payrollMonth}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="2026-04">2026-04</option>
                  <option value="2026-03">2026-03</option>
                  <option value="2026-02">2026-02</option>
                  <option value="2026-01">2026-01</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payroll Date</label>
              <div className="relative">
                <input
                  type="date"
                  name="payrollDate"
                  value={formData.payrollDate}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Method</label>
              <div className="relative">
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              Earnings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Basic Salary (LKR)</label>
                <input
                  type="number"
                  name="basicSalary"
                  value={formData.basicSalary}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Allowances (LKR)</label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Overtime (LKR)</label>
                <input
                  type="number"
                  name="overtime"
                  value={formData.overtime}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Bonuses (LKR)</label>
                <input
                  type="number"
                  name="bonuses"
                  value={formData.bonuses}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Deductions Section */}
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-rose-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
              Deductions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Manual Deductions (LKR)</label>
                <input
                  type="number"
                  name="manualDeductions"
                  value={formData.manualDeductions}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tax Deduction (LKR)</label>
                <input
                  type="number"
                  name="taxDeduction"
                  value={formData.taxDeduction}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-white border border-rose-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Calculated Preview */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4">Calculated Preview (Auto)</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Gross</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">LKR {calculations.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">EPF (Emp {payrollSettings.epfEmployee}%)</p>
                <p className="text-xs font-bold text-rose-600 mt-1">LKR {calculations.epfEmp.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">EPF (Empr {payrollSettings.epfEmployer}%)</p>
                <p className="text-xs font-bold text-blue-600 mt-1">LKR {calculations.epfEmpr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">ETF (Empr {payrollSettings.etfEmployer}%)</p>
                <p className="text-xs font-bold text-orange-600 mt-1">LKR {calculations.etf.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-xl border border-gray-100 text-center shadow-sm">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Total Deductions</p>
                <p className="text-xs font-bold text-rose-600 mt-1">LKR {calculations.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl border border-emerald-600 text-center shadow-md">
                <p className="text-[10px] text-white/80 font-bold uppercase tracking-tighter">Net Salary</p>
                <p className="text-sm font-bold text-white mt-0.5">LKR {calculations.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Status</label>
              <div className="relative">
                <select
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional notes"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-[#101D42] text-white hover:bg-[#1e2e5a] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : record ? 'Update Payroll' : 'Save Payroll'}
          </button>
        </div>
      </div>
    </div>
  );
}
