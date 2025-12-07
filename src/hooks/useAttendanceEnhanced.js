import { useState, useMemo } from 'react';
import { useScheduleData } from './useScheduleData'; // Reusing your existing one
import { groupClassesByTimeAndCoach } from '../utils/attendanceUtils';

export const useAttendanceEnhanced = (date) => {
  const { classes, loading } = useScheduleData();
  const [attendanceState, setAttendanceState] = useState({}); // { "classId-studentId": "present" | "absent" }
  const [notes, setNotes] = useState({}); // { "classId-studentId": "Sick" }

  // Filter classes for the selected date's weekday
  const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
  
  const dailyClasses = useMemo(() => {
    return classes.filter(c => c.day === dayName);
  }, [classes, dayName]);

  // Grouping for UI
  const groupedSchedule = useMemo(() => {
    return groupClassesByTimeAndCoach(dailyClasses);
  }, [dailyClasses]);

  const toggleStatus = (classId, studentId) => {
    const key = `${classId}-${studentId}`;
    setAttendanceState(prev => ({
      ...prev,
      [key]: prev[key] === 'present' ? 'absent' : 'present' // Default toggle
    }));
  };

  const addNote = (classId, studentId, note) => {
    const key = `${classId}-${studentId}`;
    setNotes(prev => ({ ...prev, [key]: note }));
  };

  return { 
    loading, 
    dailyClasses, 
    groupedSchedule, 
    attendanceState, 
    notes, 
    toggleStatus, 
    addNote 
  };
};