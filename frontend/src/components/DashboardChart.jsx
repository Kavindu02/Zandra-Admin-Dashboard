import React from 'react';

export default function DashboardChart(props) {
  const { title } = props;
  return (
    <div className="bg-white rounded-lg shadow p-4 h-56 flex flex-col">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <div className="flex-1 flex items-center justify-center text-gray-400">[Chart Placeholder]</div>
    </div>
  );
}
