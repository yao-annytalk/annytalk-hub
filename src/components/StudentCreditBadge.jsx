import React from 'react';

const StudentCreditBadge = ({ credits }) => {
  let color = 'bg-green-100 text-green-700';
  if (credits < 5) color = 'bg-red-100 text-red-700';
  else if (credits < 10) color = 'bg-yellow-100 text-yellow-700';

  return (
    <span className={`px-2 py-1 rounded text-xs font-bold ${color}`}>
      {credits} hrs
    </span>
  );
};
export default StudentCreditBadge;