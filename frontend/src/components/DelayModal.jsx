import React from 'react';
import { Clock } from 'lucide-react';

export default function DelayModal({ isOpen, onClose, customer, delayTimes, setDelayTimes, handleSendEmail, sendingEmail }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-orange-500 p-6 text-white text-center">
          <Clock size={40} className="mx-auto mb-2 opacity-90" />
          <h3 className="text-xl font-bold">Flight Delay Alert</h3>
          <p className="text-orange-100 text-sm opacity-90">Notify passenger of the new schedule</p>
        </div>
        
        <div className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">New Departure Time</label>
              <input 
                type="text" 
                value={delayTimes.newDepartureTime}
                onChange={e => setDelayTimes({...delayTimes, newDepartureTime: e.target.value})}
                placeholder="e.g. 14:30" 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Expected Arrival Time</label>
              <input 
                type="text" 
                value={delayTimes.newArrivalTime}
                onChange={e => setDelayTimes({...delayTimes, newArrivalTime: e.target.value})}
                placeholder="e.g. 21:45" 
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-8">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="button"
              onClick={() => handleSendEmail(customer, delayTimes)}
              disabled={sendingEmail === customer?.id}
              className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-orange-500/30 cursor-pointer disabled:opacity-50"
            >
              {sendingEmail === customer?.id ? 'Sending...' : 'Send Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
