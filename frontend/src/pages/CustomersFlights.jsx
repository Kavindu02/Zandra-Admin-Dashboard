import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Plane, Search, Plus, Download, Eye, Edit2, Trash2, Mail, MapPin } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopHeaderActions from '../components/TopHeaderActions';

export default function CustomersFlights() {

  const initialFormData = {
    passenger: '',
    passport: '',
    email: '',
    phone: '',
    invoiceNo: '',
    ticketNo: '',
    pnr: '',
    status: 'Pending',
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
    notes: ''
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
      route: customer.route || { from, to, type: `${tripType} • ${routeType}` },
      adults: Number(customer.adults) || 1
    };
  };

  const [customers, setCustomers] = useState([]);
  // Fetch customers from backend
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/customersflights');
      setCustomers((res.data || []).map(normalizeCustomer));
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null); // Track editing customer
  const [viewCustomer, setViewCustomer] = useState(null); // Track viewing customer
  const [formData, setFormData] = useState(initialFormData);

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
        await axios.put(`http://localhost:5000/api/customersflights/${editId}`, payload);
        await fetchCustomers();
      } catch (err) {
        alert('Failed to update customer');
      }
    } else {
      try {
        await axios.post('http://localhost:5000/api/customersflights', payload);
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
      await axios.put(`http://localhost:5000/api/customersflights/${editId}`, payload);
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
        await axios.delete(`http://localhost:5000/api/customersflights/${id}`);
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
          <h2 className="font-semibold text-gray-700">Customers</h2>
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
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#101D42] text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 transition">
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
                                                <div className="text-gray-400 font-medium mb-1">TICKET NO</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.ticketNo || '-'}</div>
                                              </div>
                                              <div>
                                                <div className="text-gray-400 font-medium mb-1">PNR</div>
                                                <div className="bg-gray-50 rounded-lg p-2">{viewCustomer.pnr || '-'}</div>
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
                                  from: customer.from || customer.route?.from || '',
                                  to: customer.to || customer.route?.to || '',
                                  tripType: customer.tripType || customer.route?.type?.split(' • ')[0] || 'One Way',
                                  routeType: customer.routeType || customer.route?.type?.split(' • ')[1] || 'Direct',
                                  departureDate: customer.departureDate || customer.departure?.split(' ')[0] || '',
                                  departureTime: customer.departureTime || customer.departure?.split(' ')[1] || '',
                                  returnDate: customer.returnDate || customer.return?.split(' ')[0] || '',
                                  returnTime: customer.returnTime || customer.return?.split(' ')[1] || '',
                                  transitAirport: customer.transitAirport || '',
                                  transitTime: customer.transitTime || '',
                                  outboundSecondFlightNo: customer.outboundSecondFlightNo || '',
                                  returnSecondFlightNo: customer.returnSecondFlightNo || '',
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
          <div className={`w-full shadow-xl relative ${editId !== null ? 'max-w-4xl max-h-[90vh] rounded-3xl border border-white/80 bg-[#F3F4F6] p-7 overflow-hidden flex flex-col' : 'max-w-2xl max-h-[90vh] rounded-2xl bg-white p-8 overflow-hidden'}`}>
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

                <div className="flex items-center gap-4 mb-6 rounded-2xl bg-white border border-[#E2E6EE] px-4 py-3">
                  <div className="w-16 h-16 rounded-full bg-[#E6EAF1] text-[#40516E] flex items-center justify-center text-3xl font-bold">
                    {(formData.passenger || 'C').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xl font-semibold text-[#1F2B3F] leading-none truncate">{formData.passenger || 'Customer'}</div>
                    <div className="text-sm text-[#8FA0BA] mt-1 truncate">{formData.passport || '-'}</div>
                  </div>
                  <div className="ml-auto">
                    <select
                      className="px-4 py-1.5 rounded-full border border-orange-200 bg-orange-50 text-orange-500 text-xs font-semibold"
                      value={formData.status}
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Email</label>
                      <input type="email" placeholder="email@example.com" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Phone</label>
                      <input placeholder="+94 7X XXX XXXX" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Invoice No</label>
                      <input placeholder="ZT-INV-XXXXXXX" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Ticket No</label>
                      <input placeholder="" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.ticketNo} onChange={e => setFormData({...formData, ticketNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">PNR</label>
                      <input placeholder="6-char PNR" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.pnr} onChange={e => setFormData({...formData, pnr: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Trip Type</label>
                      <select className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.tripType} onChange={e => handleTripTypeChange(e.target.value)}>
                        {tripTypeOptions.map((tripType) => (
                          <option key={tripType} value={tripType}>{tripType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Route Type</label>
                      <select className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.routeType} onChange={e => handleRouteTypeChange(e.target.value)}>
                        {routeTypeOptions.map((routeType) => (
                          <option key={routeType} value={routeType}>{routeType}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">From</label>
                      <input placeholder="Departure airport" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">To</label>
                      <input placeholder="Arrival airport" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Departure Date</label>
                      <input type="date" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Departure Time</label>
                      <input type="time" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} />
                    </div>
                    {hasReturnLeg && (
                      <>
                        <div>
                          <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Return Date</label>
                          <input type="date" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Return Time</label>
                          <input type="time" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.returnTime} onChange={e => setFormData({...formData, returnTime: e.target.value})} />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Airline</label>
                      <input placeholder="e.g. Emirates" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Flight No</label>
                      <input placeholder="EK-501" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.flightNo} onChange={e => setFormData({...formData, flightNo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Class</label>
                      <select className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>
                        <option>Economy</option>
                        <option>Business</option>
                        <option>First</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Adults</label>
                      <input type="number" min="1" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Handled By</label>
                      <input placeholder="Select employee" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.handledBy} onChange={e => setFormData({...formData, handledBy: e.target.value})} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Notes</label>
                      <textarea placeholder="Additional notes..." className="w-full min-h-[88px] bg-white border border-[#D3D8E2] px-3 py-2 rounded-xl text-sm text-gray-700" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    </div>
                    {hasTransitRoute && (
                      <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-[#FFF9E8] p-4">
                        <h4 className="text-sm font-semibold text-[#B35A00] mb-3">Transit Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Transit Airport</label>
                            <div className="relative">
                              <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8FA0BA]" />
                              <input placeholder="Transit airport" className="w-full h-10 bg-white border border-[#D3D8E2] pl-9 pr-3 rounded-xl text-sm text-gray-700" value={formData.transitAirport} onChange={e => setFormData({...formData, transitAirport: e.target.value})} />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Transit Time</label>
                            <input placeholder="e.g. 2h 30m" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.transitTime} onChange={e => setFormData({...formData, transitTime: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Outbound 2nd Flight No</label>
                            <input placeholder="2nd outbound flight no" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.outboundSecondFlightNo} onChange={e => setFormData({...formData, outboundSecondFlightNo: e.target.value})} />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wide text-[#8FA0BA] font-semibold mb-1">Return 2nd Flight No</label>
                            <input placeholder="2nd return flight no" className="w-full h-10 bg-white border border-[#D3D8E2] px-3 rounded-xl text-sm text-gray-700" value={formData.returnSecondFlightNo} onChange={e => setFormData({...formData, returnSecondFlightNo: e.target.value})} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-7 pt-4 border-t border-[#DFE3EA]">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 border border-[#C9CFDA] rounded-xl text-[#1F2B3F] bg-[#ECEFF4] hover:bg-[#E2E6ED]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateSubmit}
                    className="px-6 py-2.5 bg-[#101D42] text-white rounded-xl hover:bg-[#0f1b3c]"
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

                <h3 className="text-xl font-bold mb-6">Add New Customer</h3>
                {/* Tab Navigation */}
                <div className="flex mb-6">
                  {['Passenger', 'Flight Info', 'Extra'].map(tab => (
                    <button
                      key={tab}
                      className={`flex-1 py-2 rounded-lg font-medium text-lg transition cursor-default ${activeTab === tab ? 'bg-blue-50 text-[#101D42] border border-[#101D42]' : 'bg-gray-100 text-gray-500'}`}
                      disabled
                      type="button"
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="max-h-[56vh] overflow-y-auto pr-1">
                    {/* Passenger Tab */}
                    {activeTab === 'Passenger' && (
                      <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Passenger Name *</label>
                        <input required placeholder="Full name" className="w-full border p-2 rounded-lg" value={formData.passenger} onChange={e => setFormData({...formData, passenger: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Passport No</label>
                        <input placeholder="N12345678" className="w-full border p-2 rounded-lg" value={formData.passport} onChange={e => setFormData({...formData, passport: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" placeholder="email@example.com" className="w-full border p-2 rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input placeholder="+94 7X XXX XXXX" className="w-full border p-2 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Invoice No</label>
                        <input placeholder="ZT-INV-XXXXXXX" className="w-full border p-2 rounded-lg" value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Ticket No</label>
                        <input placeholder="" className="w-full border p-2 rounded-lg" value={formData.ticketNo} onChange={e => setFormData({...formData, ticketNo: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">PNR</label>
                        <input placeholder="6-char PNR" className="w-full border p-2 rounded-lg" value={formData.pnr} onChange={e => setFormData({...formData, pnr: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select className="w-full border p-2 rounded-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option>Pending</option>
                          <option>Confirmed</option>
                          <option>Cancelled</option>
                        </select>
                      </div>
                      </div>
                    )}
                    {/* Flight Info Tab */}
                    {activeTab === 'Flight Info' && (
                      <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Trip Type</label>
                        <select className="w-full border p-2 rounded-lg" value={formData.tripType} onChange={e => handleTripTypeChange(e.target.value)}>
                          {tripTypeOptions.map((tripType) => (
                            <option key={tripType} value={tripType}>{tripType}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Route Type</label>
                        <select className="w-full border p-2 rounded-lg" value={formData.routeType} onChange={e => handleRouteTypeChange(e.target.value)}>
                          {routeTypeOptions.map((routeType) => (
                            <option key={routeType} value={routeType}>{routeType}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">From Airport</label>
                        <input placeholder="Departure airport" className="w-full border p-2 rounded-lg" value={formData.from} onChange={e => setFormData({...formData, from: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">To Airport</label>
                        <input placeholder="Arrival airport" className="w-full border p-2 rounded-lg" value={formData.to} onChange={e => setFormData({...formData, to: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Departure Date</label>
                        <input type="date" className="w-full border p-2 rounded-lg" value={formData.departureDate} onChange={e => setFormData({...formData, departureDate: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Departure Time</label>
                        <input type="time" className="w-full border p-2 rounded-lg" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} />
                      </div>
                      {hasReturnLeg && (
                        <>
                          <div className="col-span-1">
                            <label className="block text-sm font-medium mb-1">Return Date</label>
                            <input type="date" className="w-full border p-2 rounded-lg" value={formData.returnDate} onChange={e => setFormData({...formData, returnDate: e.target.value})} />
                          </div>
                          <div className="col-span-1">
                            <label className="block text-sm font-medium mb-1">Return Time</label>
                            <input type="time" className="w-full border p-2 rounded-lg" value={formData.returnTime} onChange={e => setFormData({...formData, returnTime: e.target.value})} />
                          </div>
                        </>
                      )}
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Airline</label>
                        <input placeholder="e.g. Emirates" className="w-full border p-2 rounded-lg" value={formData.airline} onChange={e => setFormData({...formData, airline: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Flight No</label>
                        <input placeholder="EK-501" className="w-full border p-2 rounded-lg" value={formData.flightNo} onChange={e => setFormData({...formData, flightNo: e.target.value})} />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Class</label>
                        <select className="w-full border p-2 rounded-lg" value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})}>
                          <option>Economy</option>
                          <option>Business</option>
                          <option>First</option>
                        </select>
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-medium mb-1">Adults</label>
                        <input type="number" min="1" className="w-full border p-2 rounded-lg" value={formData.adults} onChange={e => setFormData({...formData, adults: e.target.value})} />
                      </div>
                      {hasTransitRoute && (
                        <div className="col-span-2 rounded-2xl border border-amber-200 bg-[#FFF9E8] p-4">
                          <h4 className="text-sm font-semibold text-[#B35A00] mb-3">Transit Details</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-1">
                              <label className="block text-sm font-medium mb-1">Transit Airport</label>
                              <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input placeholder="Transit airport" className="w-full border p-2 pl-9 rounded-lg" value={formData.transitAirport} onChange={e => setFormData({...formData, transitAirport: e.target.value})} />
                              </div>
                            </div>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium mb-1">Transit Time</label>
                              <input placeholder="e.g. 2h 30m" className="w-full border p-2 rounded-lg" value={formData.transitTime} onChange={e => setFormData({...formData, transitTime: e.target.value})} />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium mb-1">Outbound 2nd Flight No</label>
                              <input className="w-full border p-2 rounded-lg" value={formData.outboundSecondFlightNo} onChange={e => setFormData({...formData, outboundSecondFlightNo: e.target.value})} />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-sm font-medium mb-1">Return 2nd Flight No</label>
                              <input className="w-full border p-2 rounded-lg" value={formData.returnSecondFlightNo} onChange={e => setFormData({...formData, returnSecondFlightNo: e.target.value})} />
                            </div>
                          </div>
                        </div>
                      )}
                      </div>
                    )}
                    {/* Extra Tab */}
                    {activeTab === 'Extra' && (
                      <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Handled By</label>
                        <input placeholder="Select employee" className="w-full border p-2 rounded-lg" value={formData.handledBy} onChange={e => setFormData({...formData, handledBy: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Notes</label>
                        <textarea placeholder="Additional notes..." className="w-full border p-2 rounded-lg" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                      </div>
                      </div>
                    )}
                  </div>
                  {/* Modal Actions */}
                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeTab === 'Passenger') {
                          closeModal();
                          return;
                        }

                        setActiveTab(activeTab === 'Extra' ? 'Flight Info' : 'Passenger');
                      }}
                      className="flex-1 py-2 border rounded-lg"
                    >{activeTab === 'Passenger' ? 'Cancel' : 'Previous'}</button>

                    {activeTab !== 'Extra' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveTab(activeTab === 'Passenger' ? 'Flight Info' : 'Extra');
                        }}
                        className="flex-1 py-2 bg-[#101D42] text-white rounded-lg"
                      >
                        Next
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} className="flex-1 py-2 bg-[#101D42] text-white rounded-lg">Add Customer</button>
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