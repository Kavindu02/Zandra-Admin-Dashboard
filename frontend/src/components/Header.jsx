import React from 'react';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200">
      <div className="font-semibold text-lg">Dashboard</div>
      <div className="flex items-center gap-6">
        <button className="relative">
          <span className="inline-block w-5 h-5 bg-gray-300 rounded-full" />
        </button>
        <button>
          <span className="inline-block w-5 h-5 bg-gray-300 rounded-full" />
        </button>
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-[#172554]">2</div>
      </div>
    </header>
  );
}
