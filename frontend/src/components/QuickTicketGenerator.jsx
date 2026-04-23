import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Upload, Download, Plane, Clock, Trash2, Plus } from 'lucide-react';
import { parseTicketFile } from '../utils/parseTicket';
import { generateFlightPDF } from '../utils/generateFlightPDF';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function QuickTicketGenerator() {
  const fileInputRef = useRef(null);
  const [passengers, setPassengers] = useState([]);
  
  const [formData, setFormData] = useState({
    passenger_id: '',
    passenger: '',
    passport: '',
    ticketNo: '',
    issuedDate: '',
    pnr: '',
    airlineRef: '',
    status: 'Pending',
    baggage: '',
    fareBasis: '',
    tripType: 'One Way',
    routeType: 'Direct',
    from: '',
    to: '',
    departureDate: '',
    departureTime: '',
    airline: '',
    flightNo: '',
    class: 'Economy',
    segments: [
      { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '', equipment: '', departureTerminal: '', arrivalTerminal: '' }
    ],
    returnSegments: []
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/passengers`);
      setPassengers(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...formData.segments];
    newSegments[index][field] = value;
    setFormData({ ...formData, segments: newSegments });
  };

  const parseDocument = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsedData = await parseTicketFile(buffer);
      
      setFormData(prev => {
        const newData = { ...prev };
        if (parsedData.passenger && !newData.passenger) newData.passenger = parsedData.passenger;
        if (parsedData.pnr) newData.pnr = parsedData.pnr;
        if (parsedData.ticketNo) newData.ticketNo = parsedData.ticketNo;
        if (parsedData.issuedDate) newData.issuedDate = parsedData.issuedDate;
        
        if (parsedData.segments && parsedData.segments.length > 0) {
           const mapSeg = (s) => ({
               departureDate: s.departureDate || '',
               departureTime: s.departureTime || '',
               arrivalDate: s.arrivalDate || '',
               arrivalTime: s.arrivalTime || '',
               from: s.from || '',
               to: s.to || '',
               airline: s.airline || '',
               flightNo: s.flightNo || '',
               duration: s.duration || '',
               equipment: s.equipment || '',
               departureTerminal: s.departureTerminal || '',
               arrivalTerminal: s.arrivalTerminal || '',
               airlineRef: s.airlineRef || '',
               baggage: s.baggage || '',
               status: s.status || '',
               fareBasis: s.fareBasis || ''
           });
           
           const newSegs = parsedData.segments.map(mapSeg);
           if (newSegs.length === 1) {
               newData.routeType = 'Direct';
               newData.tripType = 'One Way';
               newData.segments = newSegs;
               newData.returnSegments = [];
           } else if (newSegs.length === 2 && newSegs[0].from === newSegs[1].to && newSegs[0].to === newSegs[1].from) {
               newData.routeType = 'Direct';
               newData.tripType = 'Round Trip';
               newData.segments = [newSegs[0]];
               newData.returnSegments = [newSegs[1]];
           } else {
               newData.routeType = 'Transit';
               newData.tripType = 'One Way';
               newData.segments = newSegs;
               newData.returnSegments = [];
           }
        }
        return newData;
      });
      alert('E-Ticket read successfully! Please review the details before generating the PDF.');
    } catch(err) {
      console.error(err);
      alert(err.message || 'Error occurred during parse');
    }
    e.target.value = '';
  };

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!formData.passenger && !formData.passenger_id) {
        alert("Please specify or select a passenger!");
        return;
    }
    generateFlightPDF(formData);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
      <div className="pb-4 border-b border-gray-100 flex items-center justify-between mb-6">
        <div>
           <h2 className="text-xl font-bold text-[#1F2B3F]">Quick Ticket Parser & Generator</h2>
           <p className="text-sm text-gray-400">Upload a word document to auto-fill details, review them, and generate the ticket directly.</p>
        </div>
        <button 
           onClick={() => fileInputRef.current?.click()}
           className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition"
        >
           <Upload size={18} /> Upload Word E-Ticket
        </button>
        <input type="file" accept=".docx" ref={fileInputRef} style={{ display: 'none' }} onChange={parseDocument} />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Link Passenger (Optional)</label>
          <select 
            className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm"
            value={formData.passenger_id}
            onChange={(e) => {
              const p = passengers.find(x => x.id.toString() === e.target.value);
              setFormData({...formData, passenger_id: e.target.value, passenger: p ? p.name : '', passport: p ? p.passport : '' });
            }}
          >
            <option value="">-- Select Existing Passenger --</option>
            {passengers.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.passport || 'No PP'})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Passenger Name on Ticket</label>
          <input 
            className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm"
            value={formData.passenger}
            onChange={e => setFormData({...formData, passenger: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Number</label>
          <input 
            className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm"
            value={formData.ticketNo}
            onChange={e => setFormData({...formData, ticketNo: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">PNR / Booking Ref</label>
          <input 
            className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm"
            value={formData.pnr}
            onChange={e => setFormData({...formData, pnr: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Issued Date</label>
          <input 
            type="date"
            className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm"
            value={formData.issuedDate}
            onChange={e => setFormData({...formData, issuedDate: e.target.value})}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Trip Type</label>
          <select className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm" value={formData.tripType} onChange={e => setFormData({...formData, tripType: e.target.value})}>
             <option value="One Way">One Way</option>
             <option value="Round Trip">Round Trip</option>
             <option value="Multi City">Multi City</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-gray-800 text-sm">Outbound Segments ({formData.segments.length})</h3>
        {formData.segments.map((seg, idx) => (
          <div key={idx} className="bg-amber-50 rounded-xl p-4 border border-amber-100 grid grid-cols-4 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">From (IATA)</label>
                <input className="w-full h-9 px-2 text-sm border rounded" value={seg.from} onChange={e => handleSegmentChange(idx, 'from', e.target.value)} />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">To (IATA)</label>
                <input className="w-full h-9 px-2 text-sm border rounded" value={seg.to} onChange={e => handleSegmentChange(idx, 'to', e.target.value)} />
                 <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Dep Terminal</label>
                   <input className="w-full h-9 px-2 text-sm border rounded" value={seg.departureTerminal} onChange={e => {
                     const updated = [...formData.segments];
                     updated[idx].departureTerminal = e.target.value;
                     setFormData({...formData, segments: updated});
                     }} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Arr Terminal</label>
                   <input className="w-full h-9 px-2 text-sm border rounded" value={seg.arrivalTerminal} onChange={e => {
                     const updated = [...formData.segments];
                     updated[idx].arrivalTerminal = e.target.value;
                     setFormData({...formData, segments: updated});
                     }} />
                </div>
            </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                <input type="date" className="w-full h-9 px-2 text-sm border rounded" value={seg.departureDate} onChange={e => handleSegmentChange(idx, 'departureDate', e.target.value)} />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Flight No</label>
                <input className="w-full h-9 px-2 text-sm border rounded" value={seg.flightNo} onChange={e => handleSegmentChange(idx, 'flightNo', e.target.value)} />
             </div>
          </div>
        ))}
      </div>
      
      {formData.returnSegments && formData.returnSegments.length > 0 && (
         <div className="space-y-4 mb-6">
            <h3 className="font-bold text-gray-800 text-sm">Return Segments ({formData.returnSegments.length})</h3>
            {formData.returnSegments.map((seg, idx) => (
            <div key={idx} className="bg-blue-50 rounded-xl p-4 border border-blue-100 grid grid-cols-4 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">From (IATA)</label>
                   <input className="w-full h-9 px-2 text-sm border rounded" value={seg.from} onChange={e => {
                     const updated = [...formData.returnSegments];
                     updated[idx].from = e.target.value;
                     setFormData({...formData, returnSegments: updated});
                     }} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">To (IATA)</label>
                   <input className="w-full h-9 px-2 text-sm border rounded" value={seg.to} onChange={e => {
                     const updated = [...formData.returnSegments];
                     updated[idx].to = e.target.value;
                     setFormData({...formData, returnSegments: updated});
                     }} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Date</label>
                   <input type="date" className="w-full h-9 px-2 text-sm border rounded" value={seg.departureDate} onChange={e => {
                     const updated = [...formData.returnSegments];
                     updated[idx].departureDate = e.target.value;
                     setFormData({...formData, returnSegments: updated});
                     }} />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-600 mb-1">Flight No</label>
                   <input className="w-full h-9 px-2 text-sm border rounded" value={seg.flightNo} onChange={e => {
                     const updated = [...formData.returnSegments];
                     updated[idx].flightNo = e.target.value;
                     setFormData({...formData, returnSegments: updated});
                     }} />
                </div>
            </div>
            ))}
         </div>
      )}

      <div className="flex justify-end gap-4 border-t border-gray-100 pt-5">
         <button onClick={handleGenerate} className="bg-[#101D42] hover:bg-opacity-90 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
            <Download size={20} />
            Generate PDF Ticket Directly
         </button>
      </div>

    </div>
  );
}
