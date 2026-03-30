import React from 'react';

export default function DashboardCard(props) {
  const { title, value, icon, color } = props;
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2 min-w-[180px]">
      <div className="flex items-center gap-2">
        {icon && <span className={`rounded-full p-2 ${color || 'bg-blue-100'} text-xl`}>{icon}</span>}
        <span className="text-gray-500 text-xs font-medium">{title}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
