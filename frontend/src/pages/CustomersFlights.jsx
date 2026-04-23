import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Plane, Search, Plus, Download, Eye, Edit2, Trash2, Mail, MapPin, Clock, Users } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import AirportSelect from '../components/AirportSelect';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';
import { parseTicketFile } from '../utils/parseTicket';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CustomersFlights() {

  const initialFormData = {
    passenger_id: '',
    passenger: '',
    passport: '',
    email: '',
    phone: '',
    invoiceNo: '',
    ticketNo: '',
    issuedDate: '',
    bookingRef: '',
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
    returnDate: '',
    returnTime: '',
    transitAirport: '',
    transitTime: '',
    outboundSecondFlightNo: '',
    returnSecondFlightNo: '',
    airline: '',
    flightNo: '',
    class: 'Economy',
    adults: 1,
    handledBy: '',
    notes: '',
    segments: [
      { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '', equipment: '', departureTerminal: '', arrivalTerminal: '' }
    ],
    returnSegments: [
      { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '', equipment: '', departureTerminal: '', arrivalTerminal: '' }
    ]
  };

  const tripTypeOptions = ['One Way', 'Round Trip', 'Multi City'];
  const routeTypeOptions = ['Direct', 'Transit'];

  const normalizeCustomer = (customer) => {
    const tripType = customer.tripType || customer.route?.type?.split(' • ')[0] || 'One Way';
    const routeType = customer.routeType || customer.route?.type?.split(' • ')[1] || 'Direct';
    const from = customer.from || customer.route?.from || '';
    const to = customer.to || customer.route?.to || '';
    const departureDate = customer.departureDate || customer.departure?.split(' ')[0] || '';
    const departureTime = customer.departureTime || customer.departure?.split(' ')[1] || '';
    const departure = customer.departure || [departureDate, departureTime].filter(Boolean).join(' ');
    const returnDate = customer.returnDate || customer.return?.split(' ')[0] || '';
    const returnTime = customer.returnTime || customer.return?.split(' ')[1] || '';
    const returnValue = customer.return || [returnDate, returnTime].filter(Boolean).join(' ');
    const transitAirport = customer.transitAirport || '';
    const transitTime = customer.transitTime || '';
    const outboundSecondFlightNo = customer.outboundSecondFlightNo || '';
    const returnSecondFlightNo = customer.returnSecondFlightNo || '';

    const enrichSegment = (segment = {}) => ({
      from: segment.from || '',
      to: segment.to || '',
      departureDate: segment.departureDate || '',
      departureTime: segment.departureTime || '',
      arrivalDate: segment.arrivalDate || '',
      arrivalTime: segment.arrivalTime || '',
      duration: segment.duration || '',
      airline: segment.airline || '',
      flightNo: segment.flightNo || '',
      airlineRef: segment.airlineRef || '',
      baggage: segment.baggage || '',
      status: segment.status || customer.status || 'Pending',
      fareBasis: segment.fareBasis || customer.fareBasis || '',
      equipment: segment.equipment || '',
      departureTerminal: segment.departureTerminal || '',
      arrivalTerminal: segment.arrivalTerminal || ''
    });

    let segments = customer.segments || [
      enrichSegment({})
    ];

    if (typeof segments === 'string') {
      try {
        segments = JSON.parse(segments);
      } catch (e) {
        segments = [enrichSegment({ from, to, departureDate, departureTime, airline: customer.airline || '', flightNo: customer.flightNo || '' })];
      }
    }

    segments = (Array.isArray(segments) ? segments : []).map(enrichSegment);
    if (segments.length === 0) {
      segments = [enrichSegment({ from, to, departureDate, departureTime, airline: customer.airline || '', flightNo: customer.flightNo || '' })];
    }

    let returnSegments = customer.returnSegments || [
      enrichSegment({})
    ];

    if (typeof returnSegments === 'string') {
      try {
        returnSegments = JSON.parse(returnSegments);
      } catch (e) {
        returnSegments = [enrichSegment({})];
      }
    }

    returnSegments = (Array.isArray(returnSegments) ? returnSegments : []).map(enrichSegment);
    if (returnSegments.length === 0) {
      returnSegments = [enrichSegment({})];
    }

    return {
      ...customer,
      tripType,
      routeType,
      from,
      to,
      departureDate,
      departureTime,
      departure,
      returnDate,
      returnTime,
      return: returnValue,
      transitAirport,
      transitTime,
      outboundSecondFlightNo,
      returnSecondFlightNo,
      segments,
      returnSegments,
      route: customer.route || { from, to, type: `${tripType} • ${routeType}` },
      adults: Number(customer.adults) || 1
    };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // Track editing customer
  const [viewCustomer, setViewCustomer] = useState(null); // Track viewing customer
  const [customers, setCustomers] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch customers and passengers from backend
  useEffect(() => {
    fetchCustomers();
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/passengers`);
      setPassengers(res.data || []);
    } catch (err) {
      console.error('Failed to fetch passengers:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/customersflights`);
      setCustomers((res.data || []).map(normalizeCustomer));
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  
  const [activeTab, setActiveTab] = useState('Passenger');
  const [customerView, setCustomerView] = useState('all');
  const hasReturnLeg = formData.tripType === 'Round Trip' || formData.tripType === 'Multi City';
  const hasTransitRoute = formData.routeType === 'Transit';
  // Status filter dropdown
  const [statusFilter, setStatusFilter] = useState('All');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleTripTypeChange = (tripType) => {
    setFormData((prev) => ({
      ...prev,
      tripType,
      ...(tripType === 'One Way' ? { returnDate: '', returnTime: '' } : {})
    }));
  };

  const handleRouteTypeChange = (routeType) => {
    setFormData((prev) => ({
      ...prev,
      routeType,
      ...(routeType !== 'Transit'
        ? {
            transitAirport: '',
            transitTime: '',
            outboundSecondFlightNo: '',
            returnSecondFlightNo: ''
          }
        : {})
    }));
  };


  const addSegment = () => {
    setFormData({
      ...formData,
      segments: [...formData.segments, { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '', equipment: '', departureTerminal: '', arrivalTerminal: '' }]
    });
  };

  const removeSegment = (index) => {
    const newSegments = formData.segments.filter((_, i) => i !== index);
    setFormData({ ...formData, segments: newSegments });
  };

  const handleSegmentChange = (index, field, value) => {
    const newSegments = [...formData.segments];
    newSegments[index][field] = value;
    setFormData({ ...formData, segments: newSegments });
  };

  const addReturnSegment = () => {
    setFormData({
      ...formData,
      returnSegments: [...formData.returnSegments, { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '', equipment: '', departureTerminal: '', arrivalTerminal: '' }]
    });
  };

  const removeReturnSegment = (index) => {
    if (formData.returnSegments.length > 1) {
      const newSegments = formData.returnSegments.filter((_, i) => i !== index);
      setFormData({ ...formData, returnSegments: newSegments });
    }
  };

  const handleReturnSegmentChange = (index, field, value) => {
    const newSegments = [...formData.returnSegments];
    newSegments[index][field] = value;
    setFormData({ ...formData, returnSegments: newSegments });
  };

  const emailCustomers = customers.filter((customer) => String(customer.email || '').trim());

  const formatDateDisplay = (value) => {
    if (!value) {
      return '-';
    }

    const text = String(value);
    if (text.includes('T')) {
      return text.split('T')[0];
    }

    return text.split(' ')[0] || '-';
  };

  const formatTimeDisplay = (value) => {
    if (!value) {
      return '-';
    }

    const text = String(value).trim();

    if (text.includes('T')) {
      const timePart = text.split('T')[1] || '';
      return timePart.replace('Z', '').split('.')[0].slice(0, 5) || '-';
    }

    return text.replace('Z', '').split('.')[0].slice(0, 5) || '-';
  };

  const getDepartureParts = (customer) => {
    const dateSource = customer.departureDate || customer.departure || '';
    const timeSource = customer.departureTime || customer.departureDate || customer.departure || '';
    const date = formatDateDisplay(dateSource);
    const time = formatTimeDisplay(timeSource);

    return { date, time };
  };

  const generateCustomerPDF = async (customer) => {
    try {
      const existingPdfBytes = await fetch('/template.pdf').then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      let page = pdfDoc.getPages()[0];

      // Neutral gray palette for PDF tables.
      const yellowHeader = rgb(0.93, 0.94, 0.95);
      const yellowSoft = rgb(0.96, 0.97, 0.98);
      const yellowAccent = rgb(0.88, 0.89, 0.91);
      const warmBorder = rgb(0.76, 0.79, 0.84);
      const warmText = rgb(0.24, 0.28, 0.34);

      const valueOrDash = (value) => {
        const text = String(value ?? '').trim();
        return text || '-';
      };

      const clampMeta = (value, max = 24) => {
        const text = valueOrDash(value);
        return text.length > max ? `${text.slice(0, max - 3)}...` : text;
      };
      
      // E-Ticket Default Text
      page.drawText('E-Ticket', { x: 30, y: 640, size: 22, font, color: rgb(0, 0, 0) });
      
      // Passenger Name
      const paxName = (customer.passenger || '').toUpperCase();
      page.drawText(paxName, { x: 30, y: 618, size: 14, font, color: rgb(0.18, 0.31, 0.45) });
      
      // Travel Details Grey Box
      page.drawRectangle({
        x: 30, y: 575,
        width: 320, height: 26,
        color: yellowHeader,
        borderColor: warmBorder,
        borderWidth: 0.8
      });
      
      // Travel Details Title
      page.drawText('Travel Details', { x: 42, y: 583, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
      
      // Booking Ref
      const bookingRefText = `Booking Ref: ${customer.bookingRef || customer.pnr || '-'}`;
      page.drawText(bookingRefText, { x: 42, y: 545, size: 10, font, color: rgb(0.18, 0.28, 0.38) });

      // ---- TICKET NUMBER & ISSUED DATE TABLE ----
      const tableY = 500;
      
      // Table Header Background
      page.drawRectangle({
        x: 30, y: tableY,
        width: 535, height: 26,
        color: yellowHeader,
        borderColor: warmBorder,
        borderWidth: 0.8
      });
      // Table Header Text
      page.drawText('Ticket Number', { x: 42, y: tableY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
      page.drawText('Issued Date', { x: 380, y: tableY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
      
      // Table Data Row Borders (Left, Right, Bottom)
      const rowHeight = 32;
      const dataY = tableY - rowHeight;
      page.drawLine({ start: { x: 30, y: dataY }, end: { x: 565, y: dataY }, thickness: 1, color: warmBorder }); // Bottom
      page.drawLine({ start: { x: 30, y: dataY }, end: { x: 30, y: tableY }, thickness: 1, color: warmBorder }); // Left
      page.drawLine({ start: { x: 565, y: dataY }, end: { x: 565, y: tableY }, thickness: 1, color: warmBorder }); // Right
      
      // Table Data Text
      page.drawText(customer.ticketNo || '-', { x: 42, y: dataY + 12, size: 10, font, color: rgb(0.18, 0.28, 0.38) });
      page.drawText(customer.issuedDate || '-', { x: 380, y: dataY + 12, size: 10, font, color: rgb(0.18, 0.28, 0.38) });
      // -------------------------------------------
      
      const formatPDFDate = (dateStr) => {
          if (!dateStr) return '';
          try {
              const d = new Date(dateStr);
              if(isNaN(d.getTime())) return dateStr;
              const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
              return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
          } catch(e) { return dateStr; }
      };

      const parseAirport = (str) => {
          if (!str) return { code: '', rest: '' };
          const parts = str.split(' ');
          if (parts.length > 1 && parts[0].length === 3 && parts[0] === parts[0].toUpperCase()) {
              return { code: parts[0], rest: parts.slice(1).join(' ') };
          }
          return { code: str.substring(0,3).toUpperCase(), rest: str };
      };

      const renderFlights = [];
      const addLeg = (leg) => { if(leg.from || leg.to) renderFlights.push(leg); };

      // 1. Use Outbound Segments
      if (customer.segments && customer.segments.length > 0) {
        customer.segments.forEach(seg => {
          if (seg.from || seg.to) {
            addLeg({ 
              ...seg, 
              date: seg.departureDate, 
              time: seg.departureTime, 
              airline: (seg.airline || '').trim() ? seg.airline : customer.airline, 
              flightNo: (seg.flightNo || '').trim() ? seg.flightNo : customer.flightNo, 
              class: customer.class, 
              airlineRef: (seg.airlineRef || '').trim() ? seg.airlineRef : customer.airlineRef, 
              baggage: (seg.baggage || '').trim() ? seg.baggage : customer.baggage, 
              status: (seg.status || '').trim() ? seg.status : customer.status, 
              fareBasis: (seg.fareBasis || '').trim() ? seg.fareBasis : customer.fareBasis,
              equipment: seg.equipment || '',
              departureTerminal: seg.departureTerminal || '',
              arrivalTerminal: seg.arrivalTerminal || ''
            });
          }
        });
      }

      // 2. Use Return Segments (if applicable)
      if (customer.tripType === 'Round Trip' || customer.tripType === 'Multi City') {
        if (customer.returnSegments && customer.returnSegments.length > 0) {
          customer.returnSegments.forEach(seg => {
            if (seg.from || seg.to) {
              addLeg({ 
                ...seg, 
                date: seg.departureDate, 
                time: seg.departureTime, 
                arrivalDate: seg.arrivalDate,
                arrivalTime: seg.arrivalTime,
                duration: seg.duration,
                airline: (seg.airline || '').trim() ? seg.airline : customer.airline, 
                flightNo: (seg.flightNo || '').trim() ? seg.flightNo : customer.flightNo, 
                class: customer.class, 
                airlineRef: (seg.airlineRef || '').trim() ? seg.airlineRef : customer.airlineRef, 
                baggage: (seg.baggage || '').trim() ? seg.baggage : customer.baggage, 
                status: (seg.status || '').trim() ? seg.status : customer.status, 
                fareBasis: (seg.fareBasis || '').trim() ? seg.fareBasis : customer.fareBasis,
                equipment: seg.equipment || '',
                departureTerminal: seg.departureTerminal || '',
                arrivalTerminal: seg.arrivalTerminal || ''
              });
            }
          });
        }
      }

      // 3. Fallbacks if segments arrays were somehow empty
      if (renderFlights.length === 0) {
        if (customer.routeType === 'Direct') {
           addLeg({ date: customer.departureDate, time: customer.departureTime, from: customer.from, to: customer.to, airline: customer.airline, flightNo: customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
           if (customer.tripType === 'Round Trip') {
             addLeg({ date: customer.returnDate, time: customer.returnTime, from: customer.to, to: customer.from, airline: customer.airline, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
           }
        } else if (customer.routeType === 'Transit') {
           addLeg({ date: customer.departureDate, time: customer.departureTime, from: customer.from, to: customer.transitAirport, airline: customer.airline, flightNo: customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
           if (customer.transitAirport) {
             addLeg({ date: customer.departureDate, time: customer.transitTime, from: customer.transitAirport, to: customer.to, airline: customer.airline, flightNo: customer.outboundSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
           }
           if (customer.tripType === 'Round Trip') {
             addLeg({ date: customer.returnDate, time: customer.returnTime, from: customer.to, to: customer.transitAirport, airline: customer.airline, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
               if (customer.transitAirport) {
               addLeg({ date: customer.returnDate, time: '', from: customer.transitAirport, to: customer.from, airline: customer.airline, flightNo: customer.returnSecondFlightNo || customer.flightNo, class: customer.class, airlineRef: customer.airlineRef, baggage: customer.baggage, status: customer.status, fareBasis: customer.fareBasis });
               }
           }
        }
      }

      let currentY = dataY - 30; // Space below the Ticket Number table
      let pageIdx = 0; // Track which page we are on

      for (let i = 0; i < renderFlights.length; i++) {
        if (currentY < 180) {
            // Overflow! Try to use next existing template page first
            pageIdx++;
            if (pageIdx < pdfDoc.getPageCount()) {
                page = pdfDoc.getPages()[pageIdx];
            } else {
                // Out of pre-existing template pages, append a clone of the second (blank) template page
                const doc2 = await PDFDocument.load(existingPdfBytes);
                const [newPage] = await pdfDoc.copyPages(doc2, [1]);
                pdfDoc.addPage(newPage);
                page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
            }
            currentY = 750; // Reset Y to top for the blank watermark page
        }
      
        const fl = renderFlights[i];
        const blockTopY = currentY;
        
        // Header
        page.drawRectangle({ x: 30, y: currentY, width: 535, height: 26, color: yellowHeader, borderColor: warmBorder, borderWidth: 0.8 });
        const fDate = formatPDFDate(fl.date);
        page.drawText(fDate, { x: 40, y: currentY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(fl.class || 'Economy', { x: 510, y: currentY + 8, size: 10, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
        
        currentY -= 65; // move down for flight details
        
        // Flight info 
        const flBoxTitle = (fl.flightNo || '').substring(0,10).trim();
        page.drawRectangle({ x: 38, y: currentY + 40, width: 68, height: 18, color: yellowAccent, borderColor: warmBorder, borderWidth: 0.6 });
        page.drawText(flBoxTitle, { x: 42, y: currentY + 45, size: 11, font, color: rgb(0.18, 0.28, 0.38) });
        
        // Airline text placed cleanly below the flight number box
        page.drawText(fl.airline || '', { x: 38, y: currentY + 25, size: 8, font, color: rgb(0.18, 0.28, 0.38) });
        if (fl.equipment) {
          page.drawText(`Equipment: ${fl.equipment}`, { x: 38, y: currentY + 13, size: 8, font, color: rgb(0.18, 0.28, 0.38) });
        }
        
        const origin = parseAirport(fl.from);
        page.drawText(origin.code, { x: 130, y: currentY + 45, size: 12, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(origin.rest.substring(0, 30), { x: 130, y: currentY + 31, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(`${fDate} ${fl.time || ''}`, { x: 130, y: currentY + 19, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        if (fl.departureTerminal) {
          page.drawText(`Terminal: ${fl.departureTerminal}`, { x: 130, y: currentY + 7, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        }

        page.drawText('Duration', { x: 320, y: currentY + 45, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
        page.drawText(fl.duration || '-', { x: 320, y: currentY + 33, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
        
        const dest = parseAirport(fl.to);
        page.drawText(dest.code, { x: 420, y: currentY + 45, size: 12, font: fontBold, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(dest.rest.substring(0, 30), { x: 420, y: currentY + 31, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        const arrivalFDate = formatPDFDate(fl.arrivalDate);
        const arrivalStr = (`${arrivalFDate} ${fl.arrivalTime || ''}`).trim();
        page.drawText(arrivalStr || '-', { x: 420, y: currentY + 19, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        if (fl.arrivalTerminal) {
          page.drawText(`Terminal: ${fl.arrivalTerminal}`, { x: 420, y: currentY + 7, size: 9, font, color: rgb(0.18, 0.28, 0.38) });
        }
        
        currentY -= 35; // move down for footer
        
        // Horizontal divider above meta text
        const dividerY = currentY + 12;
        page.drawLine({ start: { x: 30, y: dividerY }, end: { x: 565, y: dividerY }, thickness: 1, color: warmBorder });

        // Simple meta text for every flight block.
        const metaXLeft = 38;
        const metaXMid = 200;
        const metaYTop = currentY - 4;
        const metaYBottom = currentY - 18;

        page.drawText(`Airline Ref:   ${clampMeta(fl.airlineRef || customer.airlineRef)}`, { x: metaXLeft, y: metaYTop, size: 9, font: font, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(`Baggage:   ${clampMeta(fl.baggage || customer.baggage)}`, { x: metaXMid, y: metaYTop, size: 9, font: font, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(`Status:   ${clampMeta(fl.status || customer.status)}`, { x: metaXLeft, y: metaYBottom, size: 9, font: font, color: rgb(0.18, 0.28, 0.38) });
        page.drawText(`Fare Basis:   ${clampMeta(fl.fareBasis || customer.fareBasis)}`, { x: metaXMid, y: metaYBottom, size: 9, font: font, color: rgb(0.18, 0.28, 0.38) });
        
        // Bottom border
        const blockBottomY = metaYBottom - 12;
        page.drawLine({ start: { x: 30, y: blockBottomY }, end: { x: 565, y: blockBottomY }, thickness: 1, color: warmBorder }); // Bottom
        page.drawLine({ start: { x: 30, y: blockTopY }, end: { x: 30, y: blockBottomY }, thickness: 1, color: warmBorder }); // Left 
        page.drawLine({ start: { x: 565, y: blockTopY }, end: { x: 565, y: blockBottomY }, thickness: 1, color: warmBorder }); // Right
        
        currentY -= 65; // Fixed gap: ensures next block starts cleanly below previous block
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${customer.passenger || 'Customer'}_Ticket.pdf`;
      link.click();
    } catch (err) {
      console.error('Failed to generate PDF ticket:', err);
      alert('Could not generate PDF. Make sure template.pdf is accessible in the public folder.');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  
  const exportToCSV = () => {
    const headers = ["Passenger,Passport,Invoice No,Route,Departure,Status,Handled By\n"];
    const rows = customers.map(c => 
      `${c.passenger || ''},${c.passport || ''},${c.invoiceNo || ''},${c.from || ''}-${c.to || ''},${c.departure || ''},${c.status || ''},${c.handledBy || ''}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_list.csv';
    a.click();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData(initialFormData);
    setActiveTab('Passenger');
  };


  const handleSubmit = async () => {
    if (activeTab !== 'Extra') {
      return;
    }

    const payload = {
      ...formData,
      invoiceNo: formData.invoiceNo || `ZT-INV-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
      adults: Number(formData.adults) || 1
    };

    if (editId !== null) {
      try {
        await axios.put(`${API_BASE_URL}/api/customersflights/${editId}`, payload);
        await fetchCustomers();
      } catch (err) {
        alert('Failed to update customer');
      }
    } else {
      try {
        await axios.post(`${API_BASE_URL}/api/customersflights`, payload);
        await fetchCustomers();
      } catch (err) {
        alert('Failed to add customer');
      }
    }
    closeModal();
  };

  const handleUpdateSubmit = async () => {
    if (editId === null) {
      return;
    }

    const payload = {
      ...formData,
      invoiceNo: formData.invoiceNo || `ZT-INV-${Math.random().toString(36).toUpperCase().substring(2, 10)}`,
      adults: Number(formData.adults) || 1
    };

    try {
      await axios.put(`${API_BASE_URL}/api/customersflights/${editId}`, payload);
      await fetchCustomers();
      closeModal();
    } catch (err) {
      alert('Failed to update customer');
    }
  };

  // Delete customer
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/customersflights/${id}`);
        fetchCustomers();
      } catch (err) {
        alert('Failed to delete customer');
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-[#E5E7EB]">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Top Header Section */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <h2 className="font-semibold text-gray-700">Customers (v2)</h2>
          <TopHeaderActions />
        </header>

        <div className="p-8">
          {/* Title and Action Buttons */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Customers & Flights</h1>
              <p className="text-gray-400 text-sm">{customers.length} total customers</p>
            </div>
            <div className="flex gap-3">
              <button onClick={exportToCSV} className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition">
                <Download size={18} /> Export
              </button>
              <button 
                onClick={() => {
                  setEditId(null);
                  setFormData(initialFormData);
                  setIsModalOpen(true);
                  setActiveTab('Passenger');
                }} 
                className="flex items-center gap-2 px-5 py-2.5 bg-[#101D42] text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition cursor-pointer"
              >
                <Plus size={18} /> Add Customer
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setCustomerView('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${customerView === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              All Customers
            </button>
            <button
              type="button"
              onClick={() => setCustomerView('email')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${customerView === 'email' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400'}`}
            >
              Email List
            </button>
          </div>

          {customerView === 'all' ? (
            <>
              {/* Search Bar */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" placeholder="Search name, passport, email, invoice, PNR..." className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {/* Custom Dropdown */}
                <div className="relative min-w-[180px]" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none"
                    onClick={() => setDropdownOpen((open) => !open)}
                  >
                    {statusFilter}
                    <svg className={`ml-2 w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                      {['All', 'Booked', 'Pending', 'Cancelled'].map(option => (
                        <button
                          key={option}
                          className={`w-full px-4 py-2 text-left text-sm transition
                        ${statusFilter === option ? 'bg-gray-100 text-[#101D42] font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                          onClick={() => { setStatusFilter(option); setDropdownOpen(false); }}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Table Container */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#ECEFF3] border-b border-gray-200 text-gray-500 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-6 py-4">Passenger</th>
                      <th className="px-6 py-4">Invoice No</th>
                      <th className="px-6 py-4">Route</th>
                      <th className="px-6 py-4">Departure</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Handled By</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {customers
                      .filter(c => statusFilter === 'All' ? true : c.status === statusFilter)
                      .map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{customer.passenger}</div>
                          <div className="text-gray-400 text-xs">{customer.passport}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{customer.invoiceNo}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="font-medium text-gray-800 flex items-center gap-1">
                            {customer.from || '-'} <Plane size={14} className="rotate-90" /> {customer.to || '-'}
                          </div>
                          <div className="text-gray-400 text-[11px]">{`${customer.tripType || 'One Way'} • ${customer.routeType || 'Direct'}`}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="font-medium text-gray-700">{getDepartureParts(customer).date}</div>
                          <div className="text-gray-500">{getDepartureParts(customer).time}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-orange-50 text-orange-500 px-3 py-1 rounded-full text-xs font-semibold border border-orange-100">
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{customer.handledBy}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3 text-gray-400">
                            <Download
                              size={18}
                              className="cursor-pointer hover:text-blue-500"
                              onClick={() => generateCustomerPDF(customer)}
                              title="Download Ticket PDF"
                            />
                            <Eye
                              size={18}
                              className="cursor-pointer hover:text-gray-600"
                              onClick={() => setViewCustomer(customer)}
                            />
                                  {/* View Customer Details Modal */}
                                  {viewCustomer && (
                                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                        <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl relative max-h-[80vh] flex flex-col">
                                          <button
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
                                            onClick={() => setViewCustomer(null)}
                                          >
                                            &times;
                                          </button>
                                          <h3 className="text-2xl font-bold mb-4">Customer Details</h3>
                                          <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600">
                                              {viewCustomer.passenger?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                              <div className="text-lg font-semibold text-gray-800">{viewCustomer.passenger}</div>
                                              <div className="text-gray-400 text-sm">{viewCustomer.passport}</div>
                                            </div>
                                            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold border ${viewCustomer.status === 'Pending' ? 'bg-orange-50 text-orange-500 border-orange-100' : viewCustomer.status === 'Confirmed' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}`}>{viewCustomer.status}</span>
                                          </div>
                                          <div className="overflow-y-auto flex-1">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">EMAIL</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.email || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">PHONE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.phone || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">INVOICE NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.invoiceNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">ISSUED DATE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.issuedDate || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">TICKET NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.ticketNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">BOOKING REF</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.bookingRef || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">PNR</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.pnr || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">AIRLINE REF</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.airlineRef || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">BAGGAGE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.baggage || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">FARE BASIS</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.fareBasis || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">STATUS</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.status || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">TRIP TYPE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.tripType || (viewCustomer.route?.type?.split(' • ')[0] || '-')}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">ROUTE TYPE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.routeType || (viewCustomer.route?.type?.split(' • ')[1] || '-')}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">FROM</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.from || viewCustomer.route?.from || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">TO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.to || viewCustomer.route?.to || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">DEPARTURE DATE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.departureDate || viewCustomer.departure?.split(' ')[0] || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">DEPARTURE TIME</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.departureTime || viewCustomer.departure?.split(' ')[1] || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">RETURN DATE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.returnDate || viewCustomer.return?.split(' ')[0] || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">RETURN TIME</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.returnTime || viewCustomer.return?.split(' ')[1] || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">TRANSIT AIRPORT</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.transitAirport || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">TRANSIT TIME</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.transitTime || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">OUTBOUND 2ND FLIGHT NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.outboundSecondFlightNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">RETURN 2ND FLIGHT NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.returnSecondFlightNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">AIRLINE</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.airline || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">FLIGHT NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.flightNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">CLASS</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.class || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">ADULTS</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.adults || '-'}</div>
                                              </div>
                                              <div className="col-span-2">
                                                <div className="text-gray-400 font-medium mb-1">HANDLED BY</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.handledBy || '-'}</div>
                                              </div>
                                              <div className="col-span-2">
                                                <div className="text-gray-400 font-medium mb-1">NOTES</div>
                                                <div className="bg-gray-50 rounded-lg p-2 whitespace-pre-wrap">{viewCustomer.notes || '-'}</div>
                                              </div>
                                              
                                              {viewCustomer.segments && viewCustomer.segments.length > 0 && (viewCustomer.tripType === 'Multi City' || viewCustomer.routeType === 'Transit' || viewCustomer.routeType === 'Direct') && (
                                                <div className="col-span-2 mt-4">
                                                  <div className="text-[#101D42] font-bold text-sm mb-3 flex items-center gap-2">
                                                    <Plane size={14} className="text-orange-500" />
                                                    OUTBOUND FLIGHT SEGMENTS
                                                  </div>
                                                  <div className="space-y-3">
                                                    {viewCustomer.segments.map((seg, i) => (
                                                      <div key={i} className="bg-orange-50/50 border border-orange-100 rounded-xl p-3">
                                                        <div className="text-[10px] font-bold text-orange-600/60 uppercase mb-2">Segment {i+1}</div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                          <div><span className="text-gray-400">From:</span> <span className="font-semibold text-gray-700">{seg.from}</span></div>
                                                          <div><span className="text-gray-400">To:</span> <span className="font-semibold text-gray-700">{seg.to}</span></div>
                                                          <div><span className="text-gray-400">Date:</span> <span className="font-semibold text-gray-700">{seg.departureDate}</span></div>
                                                          <div><span className="text-gray-400">Time:</span> <span className="font-semibold text-gray-700">{seg.departureTime}</span></div>
                                                          <div><span className="text-gray-400">Airline:</span> <span className="font-semibold text-gray-700">{seg.airline}</span></div>
                                                          <div><span className="text-gray-400">Flight No:</span> <span className="font-semibold text-gray-700">{seg.flightNo}</span></div>
                                                          <div><span className="text-gray-400">Airline Ref:</span> <span className="font-semibold text-gray-700">{seg.airlineRef || viewCustomer.airlineRef || '-'}</span></div>
                                                          <div><span className="text-gray-400">Baggage:</span> <span className="font-semibold text-gray-700">{seg.baggage || viewCustomer.baggage || '-'}</span></div>
                                                          <div><span className="text-gray-400">Equipment:</span> <span className="font-semibold text-gray-700">{seg.equipment || '-'}</span></div>
                                                          <div><span className="text-gray-400">Dep Terminal:</span> <span className="font-semibold text-gray-700">{seg.departureTerminal || '-'}</span></div>
                                                          <div><span className="text-gray-400">Arr Terminal:</span> <span className="font-semibold text-gray-700">{seg.arrivalTerminal || '-'}</span></div>
                                                          <div><span className="text-gray-400">Status:</span> <span className="font-semibold text-gray-700">{seg.status || viewCustomer.status || '-'}</span></div>
                                                          <div><span className="text-gray-400">Fare Basis:</span> <span className="font-semibold text-gray-700">{seg.fareBasis || viewCustomer.fareBasis || '-'}</span></div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                              
                                              {viewCustomer.returnSegments && viewCustomer.returnSegments.length > 0 && (viewCustomer.tripType === 'Multi City' || viewCustomer.routeType === 'Transit' || viewCustomer.routeType === 'Direct') && (
                                                <div className="col-span-2 mt-4">
                                                  <div className="text-[#101D42] font-bold text-sm mb-3 flex items-center gap-2">
                                                    <Plane size={14} className="text-orange-500" />
                                                    RETURN FLIGHT SEGMENTS
                                                  </div>
                                                  <div className="space-y-3">
                                                    {viewCustomer.returnSegments.map((seg, i) => (
                                                      <div key={i} className="bg-orange-50/50 border border-orange-100 rounded-xl p-3">
                                                        <div className="text-[10px] font-bold text-orange-600/60 uppercase mb-2">Segment {i+1}</div>
                                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                                          <div><span className="text-gray-400">From:</span> <span className="font-semibold text-gray-700">{seg.from}</span></div>
                                                          <div><span className="text-gray-400">To:</span> <span className="font-semibold text-gray-700">{seg.to}</span></div>
                                                          <div><span className="text-gray-400">Date:</span> <span className="font-semibold text-gray-700">{seg.departureDate}</span></div>
                                                          <div><span className="text-gray-400">Time:</span> <span className="font-semibold text-gray-700">{seg.departureTime}</span></div>
                                                          <div><span className="text-gray-400">Airline:</span> <span className="font-semibold text-gray-700">{seg.airline}</span></div>
                                                          <div><span className="text-gray-400">Flight No:</span> <span className="font-semibold text-gray-700">{seg.flightNo}</span></div>
                                                          <div><span className="text-gray-400">Airline Ref:</span> <span className="font-semibold text-gray-700">{seg.airlineRef || viewCustomer.airlineRef || '-'}</span></div>
                                                          <div><span className="text-gray-400">Baggage:</span> <span className="font-semibold text-gray-700">{seg.baggage || viewCustomer.baggage || '-'}</span></div>
                                                          <div><span className="text-gray-400">Equipment:</span> <span className="font-semibold text-gray-700">{seg.equipment || '-'}</span></div>
                                                          <div><span className="text-gray-400">Dep Terminal:</span> <span className="font-semibold text-gray-700">{seg.departureTerminal || '-'}</span></div>
                                                          <div><span className="text-gray-400">Arr Terminal:</span> <span className="font-semibold text-gray-700">{seg.arrivalTerminal || '-'}</span></div>
                                                          <div><span className="text-gray-400">Status:</span> <span className="font-semibold text-gray-700">{seg.status || viewCustomer.status || '-'}</span></div>
                                                          <div><span className="text-gray-400">Fare Basis:</span> <span className="font-semibold text-gray-700">{seg.fareBasis || viewCustomer.fareBasis || '-'}</span></div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          <div className="mt-4 flex justify-end">
                                            <button
                                              className="px-5 py-2 bg-[#101D42] text-white rounded-lg hover:bg-[#22306e]"
                                              onClick={() => setViewCustomer(null)}
                                            >Back</button>
                                          </div>
                                        </div>
                                      </div>
                                  )}
                            <Edit2
                              size={18}
                              className="cursor-pointer hover:text-gray-600"
                              onClick={() => {
                                setEditId(customer.id);
                                setIsModalOpen(true);
                                setActiveTab('Passenger');
                                setFormData({
                                  ...initialFormData,
                                  ...customer,
                                  passenger_id: customer.passenger_id || '',
                                  from: customer.from || customer.route?.from || '',
                                  to: customer.to || customer.route?.to || '',
                                  tripType: customer.tripType || customer.route?.type?.split(' • ')[0] || 'One Way',
                                  routeType: customer.routeType || customer.route?.type?.split(' • ')[1] || 'Direct',
                                  departureDate: customer.departureDate || customer.departure?.split(' ')[0] || '',
                                  departureTime: customer.departureTime || customer.departure?.split(' ')[1] || '',
                                  returnDate: customer.returnDate || customer.return?.split(' ')[0] || '',
                                  returnTime: customer.returnTime || customer.return?.split(' ')[1] || '',
                                  airlineRef: customer.airlineRef || '',
                                  baggage: customer.baggage || '',
                                  fareBasis: customer.fareBasis || '',
                                  transitAirport: customer.transitAirport || '',
                                  transitTime: customer.transitTime || '',
                                  outboundSecondFlightNo: customer.outboundSecondFlightNo || '',
                                  returnSecondFlightNo: customer.returnSecondFlightNo || '',
                                  segments: customer.segments || [
                                    { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '' }
                                  ],
                                  returnSegments: customer.returnSegments || [
                                    { from: '', to: '', departureDate: '', departureTime: '', arrivalDate: '', arrivalTime: '', duration: '', airline: '', flightNo: '', airlineRef: '', baggage: '', status: 'Pending', fareBasis: '' }
                                  ]
                                });
                              }}
                            />
                            <Trash2
                              size={18}
                              className="cursor-pointer hover:text-red-500"
                              onClick={() => handleDelete(customer.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-400 mb-5">All customer emails - {emailCustomers.length} with email</p>

              {emailCustomers.length === 0 ? (
                <div className="text-sm text-gray-400">No customer emails found.</div>
              ) : (
                <div>
                  {emailCustomers.map((customer, index) => (
                    <div
                      key={customer.id}
                      className={`flex items-center justify-between py-3 ${index !== emailCustomers.length - 1 ? 'border-b border-gray-200' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold">
                          {(customer.passenger || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-gray-700 leading-tight">{customer.passenger || 'Unknown'}</div>
                          <div className="text-sm text-gray-500 leading-tight mt-1">{customer.email}</div>
                        </div>
                      </div>

                      <a
                        href={`mailto:${customer.email}`}
                        className="flex items-center gap-1 text-[#253A73] hover:text-[#101D42] font-medium"
                      >
                        <Mail size={16} />
                        <span className="text-sm">Send</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Customer Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full shadow-xl relative flex flex-col overflow-hidden max-h-[90vh] ${editId !== null ? 'max-w-4xl rounded-3xl border border-white/80 bg-[#F3F4F6] p-7' : 'max-w-2xl rounded-2xl bg-white p-8'}`}>
            {editId !== null ? (
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-5 right-7 text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  &times;
                </button>

                <h3 className="text-3xl font-bold text-[#1F2B3F] mb-5">Customer Details</h3>

                <div className="flex items-center gap-4 mb-6 rounded-2xl bg-white border border-[#E2E6EE] px-5 py-4">
                  <div className="w-16 h-16 rounded-full bg-[#E6EAF1] text-[#40516E] flex items-center justify-center text-3xl font-bold">
                    {(formData.passenger || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xl font-semibold text-[#1F2B3F] leading-tight truncate">{formData.passenger || 'Customer'}</div>
                    <div className="text-sm text-[#8FA0BA] mt-1 truncate">{formData.passport || '-'}</div>
                  </div>
                  <div className="ml-4">
                    <CustomSelect 
                      value={formData.status}
                      options={['Pending', 'Confirmed', 'Cancelled']}
                      onChange={val => setFormData({...formData, status: val})}
                    />
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Email</label>
                      <input type="email" placeholder="email@example.com" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Phone</label>
                      <input placeholder="+94 7X XXX XXXX" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Invoice No</label>
                      <input placeholder="ZT-INV-XXXXXXX" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Ticket No</label>
                      <input placeholder="" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.ticketNo} onChange={e => setFormData({...formData, ticketNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Issued Date</label>
                      <input type="date" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.issuedDate} onChange={e => setFormData({...formData, issuedDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Booking Ref</label>
                      <input placeholder="Booking Ref" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.bookingRef} onChange={e => setFormData({...formData, bookingRef: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">PNR</label>
                      <input placeholder="6-char PNR" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.pnr} onChange={e => setFormData({...formData, pnr: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Airline Ref</label>
                      <input placeholder="Airline Ref" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.airlineRef} onChange={e => setFormData({...formData, airlineRef: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Baggage</label>
                      <input placeholder="e.g. 30kg" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.baggage} onChange={e => setFormData({...formData, baggage: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Fare Basis</label>
                      <input placeholder="e.g. YOW" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.fareBasis} onChange={e => setFormData({...formData, fareBasis: e.target.value})} />
                    </div>
                    <div>
                      <CustomSelect 
                        label="Trip Type"
                        value={formData.tripType}
                        options={tripTypeOptions}
                        onChange={handleTripTypeChange}
                      />
                    </div>
                    <div>
                      <CustomSelect 
                        label="Route Type"
                        value={formData.routeType}
                        options={routeTypeOptions}
                        onChange={handleRouteTypeChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">From</label>
                      <AirportSelect 
                        placeholder="Departure airport" 
                        className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all outline-none" 
                        value={formData.from} 
                        onChange={val => setFormData({...formData, from: val})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">To</label>
                      <AirportSelect 
                        placeholder="Arrival airport" 
                        className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all outline-none" 
                        value={formData.to} 
                        onChange={val => setFormData({...formData, to: val})} 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Departure Date</label>
                      <input type="date" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Departure Time</label>
                      <div className="relative group">
                        <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                        <input type="time" className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} />
                      </div>
                    </div>
                    {hasReturnLeg && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Return Date</label>
                          <input type="date" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Return Time</label>
                          <div className="relative group">
                            <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                            <input type="time" className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.returnTime} onChange={e => setFormData({...formData, returnTime: e.target.value})} />
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Airline</label>
                      <input placeholder="e.g. Emirates" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all outline-none" value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Flight No</label>
                      <input placeholder="EK-501" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all outline-none" value={formData.flightNo} onChange={e => setFormData({...formData, flightNo: e.target.value})} />
                    </div>
                    <div>
                      <CustomSelect 
                        label="Class"
                        value={formData.class}
                        options={['Economy', 'Business', 'First']}
                        onChange={val => setFormData({...formData, class: val})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Adults</label>
                      <input type="number" min="1" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all outline-none" value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Handled By</label>
                      <input placeholder="Select employee" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.handledBy} onChange={e => setFormData({...formData, handledBy: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Notes</label>
                      <textarea placeholder="Additional notes..." className="w-full min-h-[120px] bg-white border border-gray-200 p-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                    {hasTransitRoute && (
                      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-[#FFF9E8] p-4">
                        <h4 className="text-sm font-semibold text-[#B35A00] mb-3">Transit Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Transit Airport</label>
                            <div className="relative group">
                              <AirportSelect 
                                placeholder="Transit airport" 
                                className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" 
                                value={formData.transitAirport} 
                                onChange={val => setFormData({...formData, transitAirport: val})} 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Transit Time</label>
                            <div className="relative group">
                              <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                              <input placeholder="e.g. 2h 30m" className="w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.transitTime} onChange={e => setFormData({...formData, transitTime: e.target.value})} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Outbound 2nd Flight No</label>
                            <input placeholder="2nd outbound flight no" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.outboundSecondFlightNo} onChange={e => setFormData({...formData, outboundSecondFlightNo: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Return 2nd Flight No</label>
                            <input placeholder="2nd return flight no" className="w-full h-11 bg-white border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.returnSecondFlightNo} onChange={e => setFormData({...formData, returnSecondFlightNo: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-7 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-8 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSubmit}
                    className="px-8 py-3 bg-[#101D42] text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all cursor-pointer"
                  >
                    Update Customer
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 text-3xl leading-none"
                >
                  &times;
                </button>

                <h3 className="text-2xl font-bold text-[#1F2B3F] mb-6">Add New Customer</h3>
                {/* Tab Navigation */}
                <div className="flex bg-[#F3F4F6] p-1.5 rounded-2xl mb-8">
                  {['Passenger', 'Flight Info', 'Extra'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab ? 'bg-white text-[#1F2B3F] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => e.preventDefault()} className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    {/* Passenger Tab */}
                    {activeTab === 'Passenger' && (
                      <div className="flex flex-col gap-6 px-1 pb-4">
                        <div className="bg-[#FFF9E8] border border-amber-200 rounded-2xl p-5 mb-2">
                          <h4 className="text-sm font-semibold text-[#B35A00] mb-3">Passenger Selection</h4>
                          <CustomSelect 
                            label="Select Registered Passenger"
                            value={formData.passenger_id}
                            options={passengers.map(p => ({ label: `${p.name} (${p.passport || 'No Passport'})`, value: p.id }))}
                            onChange={val => {
                              const selected = passengers.find(p => p.id === parseInt(val));
                              if (selected) {
                                setFormData({
                                  ...formData, 
                                  passenger_id: selected.id,
                                  passenger: selected.name,
                                  passport: selected.passport,
                                  email: selected.email,
                                  phone: selected.phone
                                });
                              }
                            }}
                          />
                          <p className="text-[11px] text-[#B35A00]/70 mt-2 ml-1 italic">
                            * Register new passengers in the 'Passengers' section from the sidebar.
                          </p>
                        </div>
                        
                        {formData.passenger && (
                          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                              <Users size={16} className="text-gray-400" />
                              Selected Passenger Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                                <div className="text-sm font-medium text-gray-700">{formData.passenger}</div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Passport</label>
                                <div className="text-sm font-medium text-gray-700">{formData.passport || '-'}</div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                                <div className="text-sm font-medium text-gray-700 lowercase">{formData.email || '-'}</div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                                <div className="text-sm font-medium text-gray-700">{formData.phone || '-'}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Flight Info Tab */}
                    {activeTab === 'Flight Info' && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-1 pb-4">
                        <div className="col-span-1">
                          <CustomSelect 
                            label="Trip Type"
                            value={formData.tripType}
                            options={tripTypeOptions}
                            onChange={handleTripTypeChange}
                          />
                        </div>
                        <div className="col-span-1">
                          <CustomSelect 
                            label="Route Type"
                            value={formData.routeType}
                            options={routeTypeOptions}
                            onChange={handleRouteTypeChange}
                          />
                        </div>
                        
                        {hasReturnLeg && (
                          <>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Return Date</label>
                              <input type="date" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Return Time</label>
                              <div className="relative group">
                                <Clock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />
                                <input type="time" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.returnTime} onChange={e => setFormData({...formData, returnTime: e.target.value})} />
                              </div>
                            </div>
                          </>
                        )}
                        <div className="col-span-2 mt-2 mb-4 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-blue-900 mb-1">Upload E-Ticket (.docx)</h4>
                            <p className="text-xs text-blue-700">Auto-fill this form easily by uploading the standard E-Ticket word document.</p>
                          </div>
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                          >
                            Upload File
                          </button>
                          <input 
                            type="file" 
                            accept=".docx"
                            ref={fileInputRef} 
                            style={{ display: 'none' }}
                            onChange={async (e) => {
                               const file = e.target.files[0];
                               if (!file) return;
                               try {
                                 const buffer = await file.arrayBuffer();
                                 const parsedData = await parseTicketFile(buffer);
                                 
                                 setFormData(prev => {
                                   const newData = { ...prev };
                                   if (parsedData.passenger) newData.passenger = parsedData.passenger;
                                   if (parsedData.pnr) newData.pnr = parsedData.pnr;
                                   if (parsedData.ticketNo) newData.ticketNo = parsedData.ticketNo;
                                   if (parsedData.issuedDate) newData.issuedDate = parsedData.issuedDate;
                                   
                                   if (parsedData.segments && parsedData.segments.length > 0) {
                                      const fallbackSeg = parsedData.segments[0];
                                      newData.airline = fallbackSeg.airline || newData.airline;
                                      newData.flightNo = fallbackSeg.flightNo || newData.flightNo;
                                      newData.departureDate = fallbackSeg.departureDate || newData.departureDate;
                                      newData.departureTime = fallbackSeg.departureTime || newData.departureTime;
                                      newData.from = fallbackSeg.from || newData.from;
                                      newData.to = fallbackSeg.to || newData.to;
                                      newData.class = fallbackSeg.class || newData.class;
                                      newData.airlineRef = fallbackSeg.airlineRef || newData.airlineRef;
                                      newData.baggage = fallbackSeg.baggage || newData.baggage;
                                      newData.status = fallbackSeg.status || newData.status;
                                      newData.fareBasis = fallbackSeg.fareBasis || newData.fareBasis;
                                      
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
                                      } else if (newSegs.length === 2) {
                                          if (newSegs[0].from === newSegs[1].to && newSegs[0].to === newSegs[1].from) {
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
                                      } else {
                                          newData.tripType = 'Multi City';
                                          newData.routeType = 'Direct';
                                          newData.segments = newSegs;
                                      }
                                   }
                                   return newData;
                                 });
                                 alert('E-Ticket data successfully loaded! Form is filled.');
                               } catch (err) {
                                 console.error(err);
                                 alert(err.message || 'Failed to parse file.');
                               }
                               e.target.value = ''; 
                            }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                               e.preventDefault();
                               generateCustomerPDF(formData);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition ml-2 flex items-center"
                          >
                            <Download size={16} className="mr-1" /> Generate PDF
                          </button>
                        </div>
                        <div className="col-span-1">
                          <CustomSelect 
                            label="Class"
                            value={formData.class}
                            options={['Economy', 'Business', 'First']}
                            onChange={val => setFormData({...formData, class: val})}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Adults</label>
                          <input type="number" min="1" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Ticket No</label>
                          <input placeholder="" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.ticketNo} onChange={e => setFormData({...formData, ticketNo: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Issued Date</label>
                          <input type="date" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.issuedDate} onChange={e => setFormData({...formData, issuedDate: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Booking Ref</label>
                          <input placeholder="Booking Ref" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.bookingRef} onChange={e => setFormData({...formData, bookingRef: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">PNR</label>
                          <input placeholder="6-char PNR" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.pnr} onChange={e => setFormData({...formData, pnr: e.target.value})} />
                        </div>
                      { (formData.tripType === 'Multi City' || formData.routeType === 'Transit' || formData.routeType === 'Direct') && (
                        <div className="col-span-2 space-y-4 pt-2">
                          <div className="flex items-center justify-between px-1">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Plane size={16} className="text-orange-500" />
                              Outbound Flight Segments
                            </h4>
                            <button 
                              type="button"
                              onClick={addSegment}
                              className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1.5"
                            >
                              <Plus size={14} /> Add Segment
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {formData.segments.map((segment, index) => (
                              <div key={index} className="relative bg-[#FFF9E8] border border-amber-200 rounded-2xl p-5 shadow-sm group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100/50">
                                  <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.2em]">Segment {index + 1}</span>
                                  {formData.segments.length > 1 && (
                                    <button 
                                      type="button"
                                      onClick={() => removeSegment(index)}
                                      className="p-1.5 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">From</label>
                                    <div className="relative">
                                      <AirportSelect 
                                        placeholder="City/Airport" 
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.from}
                                        onChange={val => handleSegmentChange(index, 'from', val)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">To</label>
                                    <div className="relative">
                                      <AirportSelect 
                                        placeholder="City/Airport" 
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.to}
                                        onChange={val => handleSegmentChange(index, 'to', val)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Departure Date</label>
                                    <input 
                                      type="date"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.departureDate || ''}
                                      onChange={e => handleSegmentChange(index, 'departureDate', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Departure Time</label>
                                    <div className="relative">
                                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/40" />
                                      <input 
                                        type="time"
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.departureTime || ''}
                                        onChange={e => handleSegmentChange(index, 'departureTime', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arrival Date</label>
                                    <input 
                                      type="date"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.arrivalDate || ''}
                                      onChange={e => handleSegmentChange(index, 'arrivalDate', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arrival Time</label>
                                    <div className="relative">
                                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/40" />
                                      <input 
                                        type="time"
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.arrivalTime || ''}
                                        onChange={e => handleSegmentChange(index, 'arrivalTime', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Airline</label>
                                    <input 
                                      placeholder="Airline" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.airline || ''}
                                      onChange={e => handleSegmentChange(index, 'airline', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Flight No</label>
                                    <input 
                                      placeholder="EK-501" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.flightNo || ''}
                                      onChange={e => handleSegmentChange(index, 'flightNo', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Airline Ref</label>
                                    <input 
                                      placeholder="Airline Ref" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.airlineRef || ''}
                                      onChange={e => handleSegmentChange(index, 'airlineRef', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Baggage</label>
                                    <input 
                                      placeholder="e.g. 30kg" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.baggage || ''}
                                      onChange={e => handleSegmentChange(index, 'baggage', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Fare Basis</label>
                                    <input 
                                      placeholder="Fare Basis" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.fareBasis || ''}
                                      onChange={e => handleSegmentChange(index, 'fareBasis', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                    <input
                                      placeholder="Status"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.status ?? 'Pending'}
                                      onChange={e => handleSegmentChange(index, 'status', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Equipment</label>
                                    <input
                                      placeholder="e.g. 73H"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.equipment || ''}
                                      onChange={e => handleSegmentChange(index, 'equipment', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Dep Terminal</label>
                                    <input
                                      placeholder="e.g. 1"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.departureTerminal || ''}
                                      onChange={e => handleSegmentChange(index, 'departureTerminal', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arr Terminal</label>
                                    <input
                                      placeholder="e.g. 2"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.arrivalTerminal || ''}
                                      onChange={e => handleSegmentChange(index, 'arrivalTerminal', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Duration</label>
                                    <input 
                                      placeholder="e.g. 4h 30m" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.duration || ''}
                                      onChange={e => handleSegmentChange(index, 'duration', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between px-1 mt-6">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <Plane size={16} className="text-orange-500" />
                              Return Flight Segments
                            </h4>
                            <button 
                              type="button"
                              onClick={addReturnSegment}
                              className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 transition-colors flex items-center gap-1.5"
                            >
                              <Plus size={14} /> Add Segment
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                            {formData.returnSegments.map((segment, index) => (
                              <div key={index} className="relative bg-[#FFF9E8] border border-amber-200 rounded-2xl p-5 shadow-sm group">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-amber-100/50">
                                  <span className="text-[10px] font-black text-amber-600/50 uppercase tracking-[0.2em]">Segment {index + 1}</span>
                                  {formData.returnSegments.length > 1 && (
                                    <button 
                                      type="button"
                                      onClick={() => removeReturnSegment(index)}
                                      className="p-1.5 text-amber-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">From</label>
                                    <div className="relative">
                                      <AirportSelect 
                                        placeholder="City/Airport" 
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.from}
                                        onChange={val => handleReturnSegmentChange(index, 'from', val)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">To</label>
                                    <div className="relative">
                                      <AirportSelect 
                                        placeholder="City/Airport" 
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.to}
                                        onChange={val => handleReturnSegmentChange(index, 'to', val)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Departure Date</label>
                                    <input 
                                      type="date"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.departureDate || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'departureDate', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Departure Time</label>
                                    <div className="relative">
                                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/40" />
                                      <input 
                                        type="time"
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.departureTime || ''}
                                        onChange={e => handleReturnSegmentChange(index, 'departureTime', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arrival Date</label>
                                    <input 
                                      type="date"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.arrivalDate || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'arrivalDate', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arrival Time</label>
                                    <div className="relative">
                                      <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/40" />
                                      <input 
                                        type="time"
                                        className="w-full h-10 bg-white/50 border border-amber-200/50 pl-9 pr-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                        value={segment.arrivalTime || ''}
                                        onChange={e => handleReturnSegmentChange(index, 'arrivalTime', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Airline</label>
                                    <input 
                                      placeholder="Airline" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.airline || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'airline', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Flight No</label>
                                    <input 
                                      placeholder="EK-501" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.flightNo || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'flightNo', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Airline Ref</label>
                                    <input 
                                      placeholder="Airline Ref" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.airlineRef || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'airlineRef', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Baggage</label>
                                    <input 
                                      placeholder="e.g. 30kg" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.baggage || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'baggage', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Fare Basis</label>
                                    <input 
                                      placeholder="Fare Basis" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.fareBasis || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'fareBasis', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Status</label>
                                    <input
                                      placeholder="Status"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.status ?? 'Pending'}
                                      onChange={e => handleReturnSegmentChange(index, 'status', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Equipment</label>
                                    <input
                                      placeholder="e.g. 73H"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.equipment || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'equipment', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Dep Terminal</label>
                                    <input
                                      placeholder="e.g. 1"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.departureTerminal || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'departureTerminal', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-1">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Arr Terminal</label>
                                    <input
                                      placeholder="e.g. 2"
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.arrivalTerminal || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'arrivalTerminal', e.target.value)}
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mb-1.5 ml-1">Duration</label>
                                    <input 
                                      placeholder="e.g. 4h 30m" 
                                      className="w-full h-10 bg-white/50 border border-amber-200/50 px-3 rounded-xl text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 outline-none transition-all"
                                      value={segment.duration || ''}
                                      onChange={e => handleReturnSegmentChange(index, 'duration', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <p className="text-[10px] text-gray-400 italic px-1">
                            * Use segments to record all flight legs for direct, transit, or multi-city bookings.
                          </p>
                        </div>
                      )}
                      </div>
                    )}
                    {/* Extra Tab */}
                    {activeTab === 'Extra' && (
                      <div className="space-y-6 px-1 pb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Handled By</label>
                          <input placeholder="Select employee" className="w-full h-11 bg-[#F9FAFB] border border-gray-200 px-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium" value={formData.handledBy} onChange={e => setFormData({...formData, handledBy: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">Notes</label>
                          <textarea placeholder="Additional notes..." className="w-full h-32 bg-[#F9FAFB] border border-gray-200 p-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Modal Actions */}
                  <div className="flex gap-4 mt-8 pt-6 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'Passenger') {
                          closeModal();
                          return;
                        }
                        setActiveTab(activeTab === 'Extra' ? 'Flight Info' : 'Passenger');
                      }}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      {activeTab === 'Passenger' ? 'Cancel' : 'Previous'}
                    </button>

                    {activeTab !== 'Extra' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab(activeTab === 'Passenger' ? 'Flight Info' : 'Extra');
                        }}
                        className="flex-1 py-3 bg-[#101D42] text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 hover:bg-[#1a2b5a] transition-all cursor-pointer"
                      >
                        Next
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleSubmit} 
                        className="flex-1 py-3 bg-[#F59E0B] text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:bg-[#d98b06] transition-all cursor-pointer"
                      >
                        Add Customer
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}