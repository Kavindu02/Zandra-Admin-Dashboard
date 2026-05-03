import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Plane, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { generateFlightPDF } from '../utils/generateFlightPDF';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function IssueTicket() {
  const [customers, setCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customersflights`);
      const normalizedData = (res.data || []).map(customer => {
        let parsedSegments = [];
        let parsedReturnSegments = [];
        try { parsedSegments = typeof customer.segments === 'string' ? JSON.parse(customer.segments) : (customer.segments || []); } catch(e) {}
        try { parsedReturnSegments = typeof customer.returnSegments === 'string' ? JSON.parse(customer.returnSegments) : (customer.returnSegments || []); } catch(e) {}
        return { ...customer, segments: parsedSegments, returnSegments: parsedReturnSegments };
      });
      setCustomers(normalizedData);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  const handleDownload = async (customer) => {
    try {
      await generateFlightPDF(customer);
    } catch (err) {
      console.error('Failed to generate PDF ticket:', err);
      toast.error('Could not generate PDF. Make sure template.pdf is accessible in the public folder.');
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(customers.length / itemsPerPage);
  const currentCustomers = customers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800 uppercase tracking-tighter text-xs">Ticketing / Issue Ticket</h2>
          <TopHeaderActions />
        </div>
        
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#1F2B3F] tracking-tight">Issue Ticket</h1>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-1">Download auto-generated airline tickets</p>
            </div>
            
            {/* Pagination Top */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                <button 
                  onClick={goToPrevPage} 
                  disabled={currentPage === 1}
                  className="p-1.5 hover:bg-gray-50 rounded-lg disabled:opacity-20 transition-colors text-gray-400"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-[10px] font-black text-gray-400 px-3 border-x border-gray-50 uppercase tracking-widest">
                  Page {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={goToNextPage} 
                  disabled={currentPage === totalPages}
                  className="p-1.5 hover:bg-gray-50 rounded-lg disabled:opacity-20 transition-colors text-gray-400"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentCustomers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 group">
                <div className="flex justify-between items-start mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-black text-lg shadow-inner">
                      {(customer.passenger || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2B3F] text-sm truncate max-w-[120px]">{customer.passenger}</h3>
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{customer.passport || 'No Passport'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${customer.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'}`}>
                    {customer.status || 'Pending'}
                  </span>
                </div>

                <div className="bg-gray-50/50 rounded-2xl p-4 mb-5 border border-gray-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Plane size={14} className="text-blue-500" />
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{customer.tripType || 'One Way'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">PNR</div>
                      <div className="font-bold text-gray-700 text-xs">{customer.pnr || '-'}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Invoice</div>
                      <div className="font-bold text-gray-700 text-xs truncate">{customer.invoiceNo || '-'}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(customer)}
                  className="w-full py-3 bg-[#101D42] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#1a2b5a] hover:shadow-lg hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Download Ticket
                </button>
              </div>
            ))}
          </div>

          {currentCustomers.length === 0 && (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed">
               <Plane size={48} className="mx-auto text-gray-100 mb-4" />
               <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No tickets found for this page</p>
            </div>
          )}

          {/* Pagination Bottom */}
          {totalPages > 1 && (
            <div className="mt-12 flex items-center justify-center gap-3">
              <button 
                onClick={goToPrevPage} 
                disabled={currentPage === 1}
                className="px-6 py-2.5 bg-white rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      currentPage === i + 1 
                        ? 'bg-[#101D42] text-white shadow-lg shadow-blue-900/20' 
                        : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages}
                className="px-6 py-2.5 bg-white rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}