import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Banknote, CheckCircle, Calculator, 
  ChevronDown, Plus, FileDown, Pencil, Trash2, Settings
} from 'lucide-react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import AddPayrollModal from '../components/AddPayrollModal';
import PayrollSettingsModal from '../components/PayrollSettingsModal';

export default function Payroll() {
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPayrolls = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios.get(`${apiUrl}/api/payroll/${selectedMonth}`);
      setPayrolls(res.data);
    } catch (error) {
      console.error('Failed to fetch payrolls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchPayrolls();
    window.addEventListener('payroll-updated', fetchPayrolls);
    return () => window.removeEventListener('payroll-updated', fetchPayrolls);
  }, [fetchPayrolls]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.delete(`${apiUrl}/api/payroll/${id}`);
      fetchPayrolls();
      alert('Payroll record deleted successfully');
    } catch (error) {
      console.error('Failed to delete payroll:', error);
      alert('Failed to delete record');
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedRecord(null);
    setIsModalOpen(true);
  };

  const summary = payrolls.reduce((acc, curr) => {
    acc.totalStaff += 1;
    acc.gross += Number(curr.gross);
    acc.net += Number(curr.netSalary);
    acc.employerCost += Number(curr.gross) + Number(curr.epfEmpr) + Number(curr.etf);
    if (curr.paymentStatus === 'Paid') acc.paidCount += 1;
    return acc;
  }, { totalStaff: 0, gross: 0, net: 0, employerCost: 0, paidCount: 0 });

  const stats = [
    { 
      label: 'Total Staff', 
      value: summary.totalStaff.toString(), 
      subtext: `${summary.paidCount} paid`, 
      icon: Users, 
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500' 
    },
    { 
      label: 'Gross Salaries', 
      value: `LKR ${summary.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      subtext: null, 
      icon: Banknote, 
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-400' 
    },
    { 
      label: 'Net Payout', 
      value: `LKR ${summary.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      subtext: null, 
      icon: CheckCircle, 
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-emerald-500' 
    },
    { 
      label: 'Employer Cost', 
      value: `LKR ${summary.employerCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 
      subtext: 'incl. EPF/ETF', 
      icon: Calculator, 
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-rose-500' 
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 ml-64">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-20">
          <h2 className="font-bold text-gray-800">Payroll</h2>
          <TopHeaderActions />
        </div>

        <div className="p-8 font-sans">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
              <p className="text-gray-500 text-sm mt-1">Monthly salary processing & EPF/ETF management</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer shadow-sm pr-10"
                >
                  <option value="2026-04">2026-04</option>
                  <option value="2026-03">2026-03</option>
                  <option value="2026-02">2026-02</option>
                  <option value="2026-01">2026-01</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
              </div>

              <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all shadow-sm">
                <FileDown size={18} />
                <span>Summary PDF</span>
              </button>

              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 bg-white border border-gray-200 text-gray-400 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                title="Payroll Settings"
              >
                <Settings size={20} />
              </button>

              <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-[#101D42] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#1e2e5a] transition-all shadow-sm"
              >
                <Plus size={18} />
                <span>Add Payroll</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl p-6 border-t-4 ${stat.borderColor} shadow-sm transition-transform hover:translate-y-[-2px]`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                    {stat.subtext && (
                      <p className="text-xs text-gray-400 mt-1 font-medium">{stat.subtext}</p>
                    )}
                  </div>
                  <div className={`p-3 ${stat.bgColor} rounded-xl`}>
                    <stat.icon className={stat.iconColor} size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500">
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Employee</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Month</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Gross</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">EPF (Emp)</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">EPF (Empr)</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">ETF</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Net Salary</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payrolls.length > 0 ? (
                    payrolls.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 font-semibold text-gray-700">{row.employeeName}</td>
                        <td className="px-6 py-4 text-gray-500">{row.payrollMonth}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">LKR {Number(row.gross).toLocaleString()}</td>
                        <td className="px-6 py-4 text-rose-600 font-medium">{Number(row.epfEmp).toLocaleString()}</td>
                        <td className="px-6 py-4 text-blue-600 font-medium">{Number(row.epfEmpr).toLocaleString()}</td>
                        <td className="px-6 py-4 text-orange-600 font-medium">{Number(row.etf).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold text-gray-900 font-mono text-xs">LKR {Number(row.netSalary).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                            row.paymentStatus === 'Paid' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 transition-opacity">
                            <button 
                              onClick={() => handleEdit(row)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Edit Record"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(row.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="group">
                      <td colSpan="9" className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <p className="text-sm font-medium text-gray-400">
                            {isLoading ? 'Loading records...' : `No payroll records for ${selectedMonth}`}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reference Note */}
          <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-bold">EPF/ETF Reference:</span> Employee EPF = 8% of basic | Employer EPF = 12% of basic | Employer ETF = 3% of basic. Net Salary = Gross - EPF(Employee) - Deductions - Tax
            </p>
          </div>
        </div>
      </div>
      <AddPayrollModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        record={selectedRecord}
      />
      <PayrollSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={() => window.dispatchEvent(new CustomEvent('payroll-settings-updated'))}
      />
    </div>
  );
}
