export const groupClassesByTimeAndCoach = (classes) => {
  const groups = {};
  
  classes.forEach(cls => {
    // Normalize time to ensure grouping works (remove spaces/dots)
    const timeKey = cls.time.replace(/\./g, ':').replace(/\s/g, '');
    const coachKey = cls.coach || 'Unassigned';
    
    if (!groups[timeKey]) groups[timeKey] = {};
    if (!groups[timeKey][coachKey]) groups[timeKey][coachKey] = [];
    
    groups[timeKey][coachKey].push(cls);
  });

  return groups; // Returns { "09:00": { "Jared": [ClassA, ClassB] } }
};