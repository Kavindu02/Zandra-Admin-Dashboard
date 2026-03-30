import React from 'react';

export default function IssueTicket() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-8">
        <h2 className="font-bold text-gray-800">Issue Ticket</h2>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-4xl mx-auto">
          <h3 className="font-bold text-2xl mb-1">Issue Ticket</h3>
          <p className="text-gray-400 mb-6">No tickets issued yet.</p>
        </div>
      </div>
    </div>
  );
}