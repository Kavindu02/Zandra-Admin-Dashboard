import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plane, Search } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AirportSelect({ value, onChange, placeholder, className, icon: Icon, hideIcon }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAirports = async (text) => {
    if (!text || text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/airports/search?q=${text}`);
      setResults(res.data || []);
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to search airports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    onChange(text); // Also emit standard change so typed values are still saved even if not clicked

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchAirports(text);
    }, 300);
  };

  const handleSelect = (airport) => {
    const formatted = `${airport.iata_code || ''} ${airport.name}, ${airport.city}, ${airport.country}`;
    setQuery(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {!hideIcon && Icon && <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />}
      {!hideIcon && !Icon && <Plane size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors pointer-events-none" />}
      
      <input
        type="text"
        placeholder={placeholder || "Search airport..."}
        className={className || "w-full h-11 bg-white border border-gray-200 pl-10 pr-4 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-200 transition-all font-medium"}
        value={query}
        onChange={handleInputChange}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
      />

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-100 shadow-xl rounded-xl max-h-64 overflow-y-auto w-full min-w-[300px]">
          {loading && <div className="p-3 text-center text-sm text-gray-400">Searching...</div>}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className="p-3 text-center text-sm text-gray-400">No airports found</div>
          )}
          {!loading && results.map((a, i) => (
            <div 
              key={i} 
              onClick={() => handleSelect(a)}
              className="px-4 py-3 hover:bg-[#F9FAFB] cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3"
            >
              <div className="bg-[#FFF9E8] text-[#B35A00] font-bold text-sm px-2 py-1 rounded">
                {a.iata_code || '---'}
              </div>
              <div className="flex-1">
                <div className="text-gray-800 font-semibold text-sm leading-tight mb-0.5">{a.name}</div>
                <div className="text-gray-500 text-xs">{a.city}, {a.country}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
