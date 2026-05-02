import React, { useState, useEffect } from 'react';
import { Clock, Plane, ArrowRight, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';

export default function DelayModal({ isOpen, onClose, customer, handleSendEmail, sendingEmail }) {
  const [step, setStep] = useState(1); // 1: Select Flight, 2: Fill Details
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [delayInfo, setDelayInfo] = useState({
    newDepartureDate: '',
    newDepartureTime: '',
    newArrivalDate: '',
    newArrivalTime: ''
  });

  // Reset modal state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedSegment(null);
      setDelayInfo({
        newDepartureDate: '',
        newDepartureTime: '',
        newArrivalDate: '',
        newArrivalTime: ''
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Combine outbound and return segments for selection
  const allSegments = [
    ...(customer?.segments || []).map(s => ({ ...s, type: 'Outbound' })),
    ...(customer?.returnSegments || []).map(s => ({ ...s, type: 'Return' }))
  ].filter(s => s.from && s.to);

  const handleSelectSegment = (segment) => {
    setSelectedSegment(segment);
    // Pre-fill with current values as starting point
    setDelayInfo({
      newDepartureDate: segment.departureDate || '',
      newDepartureTime: segment.departureTime || '',
      newArrivalDate: segment.arrivalDate || '',
      newArrivalTime: segment.arrivalTime || ''
    });
    setStep(2);
  };

  const handleConfirm = () => {
    if (!delayInfo.newDepartureDate || !delayInfo.newDepartureTime) {
      alert('Please fill at least the new departure details.');
      return;
    }
    // Pass both the specific segment and the delay info to the email handler
    handleSendEmail(customer, { 
      ...delayInfo, 
      affectedSegment: selectedSegment 
    });
  };

  return (
    <div className="fixed inset-0 bg-[#101D42]/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#F59E0B] p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">Flight Delay Notification</h3>
            </div>
            <p className="text-white/80 font-medium text-sm">
              {step === 1 ? 'Select the flight segment that is delayed' : `Updating schedule for ${selectedSegment?.from} to ${selectedSegment?.to}`}
            </p>
          </div>
          {/* Abstract background shape */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Available Flight Segments</div>
              {allSegments.length === 0 ? (
                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Plane size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No flight segments found for this customer.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {allSegments.map((seg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectSegment(seg)}
                      className="group w-full flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl hover:border-[#F59E0B] hover:shadow-xl hover:shadow-orange-500/5 transition-all text-left"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-xl ${seg.type === 'Outbound' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                          <Plane size={20} className={seg.type === 'Return' ? 'rotate-180' : ''} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-black text-[#101D42]">{seg.from}</span>
                            <ArrowRight size={16} className="text-gray-300" />
                            <span className="text-lg font-black text-[#101D42]">{seg.to}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-bold text-gray-400">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {seg.departureDate}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {seg.departureTime}</span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded uppercase tracking-tighter">{seg.flightNo}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex gap-3">
                <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                <p className="text-sm text-orange-800 font-medium">
                  Enter the new expected schedule for this flight. This information will be sent to the passenger via email.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">New Departure</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Departure Date</label>
                    <input 
                      type="date" 
                      value={delayInfo.newDepartureDate}
                      onChange={e => setDelayInfo({...delayInfo, newDepartureDate: e.target.value})}
                      className="w-full h-12 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-[#101D42] outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Departure Time</label>
                    <input 
                      type="time" 
                      value={delayInfo.newDepartureTime}
                      onChange={e => setDelayInfo({...delayInfo, newDepartureTime: e.target.value})}
                      className="w-full h-12 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-[#101D42] outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Expected Arrival</h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Arrival Date</label>
                    <input 
                      type="date" 
                      value={delayInfo.newArrivalDate}
                      onChange={e => setDelayInfo({...delayInfo, newArrivalDate: e.target.value})}
                      className="w-full h-12 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-[#101D42] outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Arrival Time</label>
                    <input 
                      type="time" 
                      value={delayInfo.newArrivalTime}
                      onChange={e => setDelayInfo({...delayInfo, newArrivalTime: e.target.value})}
                      className="w-full h-12 bg-gray-50 border border-transparent rounded-xl px-4 text-sm font-bold text-[#101D42] outline-none focus:bg-white focus:ring-4 focus:ring-orange-500/10 focus:border-orange-200 transition-all" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-4">
          <button 
            type="button"
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="flex-1 h-14 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
          >
            {step === 1 ? 'Cancel' : 'Back to Selection'}
          </button>
          
          {step === 2 && (
            <button 
              type="button"
              onClick={handleConfirm}
              disabled={sendingEmail === customer?.id}
              className="flex-[1.5] h-14 bg-[#F59E0B] text-white rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 hover:bg-[#d98b06] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {sendingEmail === customer?.id ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Sending Alert...</span>
                </>
              ) : (
                <>
                  <Clock size={18} />
                  <span>Send Notification Email</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
