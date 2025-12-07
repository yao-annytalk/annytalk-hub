export const calculateDeduction = (durationMinutes) => {
  // Simple rule: 1 hour (60 mins) = 1 credit, 2 hours (120 mins) = 2 credits
  // Adjust logic here if you have 1.5 hr classes
  if (durationMinutes <= 60) return 1;
  if (durationMinutes <= 90) return 1.5;
  return 2;
};

export const formatCurrency = (num) => `฿${num.toLocaleString()}`;