import React from 'react';
import { Plane } from 'lucide-react';

export default function Notifications() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-16 bg-white border-b border-gray-100 flex items-center px-8">
        <h2 className="font-bold text-gray-800">Notifications</h2>
      </div>
      <div className="p-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm max-w-4xl mx-auto">
          <h3 className="font-bold text-2xl mb-1">Notifications</h3>
          <p className="text-gray-400 mb-6">0 unread notifications</p>
          <div className="flex gap-2 mb-6">
            <button className="px-4 py-1 rounded-full bg-[#101D42] text-white font-semibold text-sm">All (1)</button>
            <button className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">Unread (0)</button>
            <button className="px-4 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">Read (1)</button>
          </div>
          <div className="bg-[#F8FAFC] rounded-xl p-4 flex items-center justify-between border border-gray-100 mb-2">
            <div className="flex items-center gap-4">
              <span className="bg-blue-50 text-blue-500 rounded-full p-2"><Plane size={20} /></span>
              <div>
                <div className="font-semibold text-gray-800">New Customer Added</div>
                <div className="text-gray-400 text-xs">sandeepa — ZT-INV-MMKGUOEG</div>
              </div>
            </div>
            <div className="text-gray-400 text-xs">20 days ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
