// src/hooks/useAbsenceAnalytics.js
import { useMemo } from "react";
import { startOfWeek, addWeeks, differenceInCalendarWeeks } from "../utils/dateUtils";

function slotKey(slot) {
  return `${slot.day}__${slot.time}__${slot.coach || ""}`;
}

function buildAbsenceSeries(slot, logs, weeksBack = 12) {
  const now = new Date();
  const start = startOfWeek(addWeeks(now, -weeksBack + 1));
  const buckets = Array.from({ length: weeksBack }, (_, i) => ({ start: addWeeks(start, i), count: 0 }));
  logs.forEach((log) => {
    if (!log.timestamp) return;
    if (log.day !== slot.day) return;
    // match by starting time token or exact match
    if (!log.time || !slot.time) return;
    const logTimeToken = log.time.split(" ")[0];
    const slotTimeToken = slot.time.split(" ")[0];
    if (!log.time.includes(slot.time) && logTimeToken !== slotTimeToken) return;
    const ts = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    const diffWeeks = differenceInCalendarWeeks(ts, start);
    if (diffWeeks >= 0 && diffWeeks < weeksBack) {
      if (log.status === "absent" || log.type === "absent") buckets[diffWeeks].count += 1;
    }
  });
  return { weeks: buckets.map(b => b.start.toISOString().slice(0,10)), counts: buckets.map(b => b.count) };
}

function detectSpikes(values, k = 1.5) {
  if (!values || !values.length) return [];
  const n = values.length;
  const mean = values.reduce((a,b)=>a+b,0)/n;
  const variance = values.reduce((a,b)=>a + Math.pow(b-mean,2),0)/n;
  const std = Math.sqrt(variance);
  const thresh = mean + k*std;
  return values.map((v,i)=> v > thresh ? i : -1).filter(i => i>=0);
}

export default function useAbsenceAnalytics({ students, scheduleSlots, logs }) {
  return useMemo(() => {
    const enrollmentMap = new Map();
    students.forEach((s) => {
      (s.weeklySchedule || []).forEach(slot => {
        const k = `${slot.day}__${slot.time}__${slot.coach || ""}`;
        enrollmentMap.set(k, (enrollmentMap.get(k) || 0) + 1);
      });
    });

    const slotSummaries = scheduleSlots.map(slot => {
      const key = `${slot.day}__${slot.time}__${slot.coach || ""}`;
      const enrolled = enrollmentMap.get(key) || 0;
      const capacity = slot.capacity || 12;
      const occupancyRate = capacity > 0 ? enrolled / capacity : 0;
      const timeseries = buildAbsenceSeries(slot, logs, 12);
      const spikes = detectSpikes(timeseries.counts, 1.5);
      return { key, ...slot, enrolled, capacity, occupancyRate, timeseries, spikes };
    });

    const coachMap = {};
    slotSummaries.forEach(s => {
      const coach = s.coach || "Unassigned";
      if (!coachMap[coach]) coachMap[coach] = { coach, totalEnrolled: 0, totalAbsences: 0, slots: [] };
      coachMap[coach].totalEnrolled += s.enrolled;
      coachMap[coach].totalAbsences += s.timeseries.counts.reduce((a,b)=>a+b,0);
      coachMap[coach].slots.push(s);
    });

    Object.values(coachMap).forEach(c => {
      c.avgAbsences = c.slots.length ? Math.round((c.totalAbsences / c.slots.length) * 100) / 100 : 0;
      c.popularSlots = c.slots.slice().sort((a,b)=>b.enrolled - a.enrolled).slice(0,3);
    });

    return { slotSummaries, coachSummaries: coachMap };
  }, [students, scheduleSlots, logs]);
}
