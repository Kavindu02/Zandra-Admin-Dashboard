export const exportToCSV = (data, filename, headerMapping) => {
  const headers = Object.keys(headerMapping);
  const csvHeaders = Object.values(headerMapping);

  const csvRows = [
    csvHeaders.join(','),
    ...data.map(row => headers.map(key => {
      let val = row[key] ?? '';
      // Handle dates and nested objects if needed
      if (key === 'date') val = new Date(val).toLocaleDateString();
      return `"${val.toString().replace(/"/g, '""')}"`;
    }).join(','))
  ];

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
