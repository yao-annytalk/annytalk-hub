export const getStatusColor = (status) => {
  switch (status) {
    case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'Trial Set': return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'Won': return 'bg-green-100 text-green-700 border-green-200';
    case 'Lost': return 'bg-gray-100 text-gray-500 border-gray-200';
    default: return 'bg-gray-50 text-gray-600';
  }
};

export const calculateHealth = (capacity, current) => {
  const ratio = current / capacity;
  if (ratio >= 0.8) return { color: 'text-green-500', label: 'Healthy' };
  if (ratio >= 0.5) return { color: 'text-yellow-500', label: 'Moderate' };
  return { color: 'text-red-500', label: 'At Risk' };
};