import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomSelect = ({ label, options, value, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getOptionLabel = (val) => {
    const opt = options.find(o => (o.value ?? o) == val);
    return opt?.label ?? opt ?? val ?? 'Select...';
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1 transition-colors">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-[#F9FAFB] border border-gray-200 rounded-xl text-sm transition-all duration-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 group ${isOpen ? "ring-2 ring-orange-500/20 border-orange-200 shadow-sm" : ""}`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          {Icon && (
            <Icon
              size={18}
              className="text-gray-400 group-hover:text-gray-600 transition-colors shrink-0"
            />
          )}
          <span className="text-gray-700 font-medium truncate">
            {getOptionLabel(value)}
          </span>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-gray-600" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-[60] left-0 mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 italic">No options available</div>
            ) : (
              options.map((option, idx) => {
                const optValue = option.value ?? option;
                const optLabel = option.label ?? option;
                const isSelected = optValue == value;
                
                return (
                  <button
                    key={`${optValue}-${idx}`}
                    type="button"
                    onClick={() => {
                      onChange(optValue);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer
                      ${
                        isSelected
                          ? "bg-orange-500 text-white font-semibold"
                          : "text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                  >
                    <span className="truncate">{optLabel}</span>
                    {isSelected && <Check size={16} strokeWidth={3} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
