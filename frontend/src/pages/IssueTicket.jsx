
import React from 'react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

export default function IssueTicket() {
  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      <div className="flex-1 ml-64">
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-bold text-gray-800">Issue Ticket</h2>
          <TopHeaderActions />
        </div>
        <div className="p-8">
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-4xl mx-auto">
            <h3 className="font-bold text-2xl mb-1">Issue Ticket</h3>
            <p className="text-gray-400 mb-6">No tickets issued yet.</p>
          </div>
        </div>
      </div>
    </div>
  );
}