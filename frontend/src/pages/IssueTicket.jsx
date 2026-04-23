import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plane, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { generateFlightPDF } from '../utils/generateFlightPDF';
import QuickTicketGenerator from '../components/QuickTicketGenerator';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function IssueTicket() {
  const [customers, setCustomers] = useState([]);

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
      alert('Could not generate PDF. Make sure template.pdf is accessible in the public folder.');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Issue Ticket</h2>
          <TopHeaderActions />
        </div>
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1F2B3F]">Issue Ticket</h1>
              <p className="text-gray-400 text-sm">Download auto-generated airline tickets below</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div key={customer.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#FFF9E8] flex items-center justify-center text-[#B35A00] font-bold text-lg">
                      {(customer.passenger || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1F2B3F]">{customer.passenger}</h3>
                      <p className="text-xs text-gray-400">{customer.passport || 'No Passport'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap ${customer.status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {customer.status || 'Pending'}
                  </span>
                </div>
                <div className="bg-[#F9FAFB] rounded-xl p-3 mb-5 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Plane size={14} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-700">{customer.tripType || 'One Way'} - {customer.routeType || 'Direct'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-400">PNR</div>
                      <div className="font-bold text-gray-700">{customer.pnr || '-'}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Invoice</div>
                      <div className="font-bold text-gray-700">{customer.invoiceNo || '-'}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(customer)}
                  className="w-full py-2.5 bg-[#101D42] text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download Ticket PDF
                </button>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
                No customer flights found yet. Add customers in Customers and Flights section.
              </div>
            )}
          </div>
          
          <QuickTicketGenerator />
        </div>
      </div>
    </div>
  );
}