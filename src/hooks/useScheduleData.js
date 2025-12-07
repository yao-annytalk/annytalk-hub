// src/hooks/useScheduleData.js
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";

export default function useScheduleData() {
  const [students, setStudents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubStudents = onSnapshot(
      query(collection(db, "students")),
      (snap) => {
        setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("students snapshot error", err);
        setError(err);
        setLoading(false);
      }
    );

    const unsubTemplates = onSnapshot(
      query(collection(db, "schedule_templates")),
      (snap) => {
        setTemplates(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        // Not fatal — templates optional
        console.warn("schedule_templates snapshot error", err);
      }
    );

    return () => {
      try { unsubStudents(); } catch {}
      try { unsubTemplates(); } catch {}
    };
  }, []);

  const scheduleSlots = (() => {
    if (templates && templates.length > 0) return templates;
    const map = {};
    students.forEach((s) => {
      (s.weeklySchedule || []).forEach((slot) => {
        const key = `${slot.day}__${slot.time}__${slot.coach || "Unassigned"}`;
        if (!map[key]) {
          map[key] = { day: slot.day, time: slot.time, coach: slot.coach || "Unassigned", course: slot.course || "-", capacity: 12 };
        }
      });
    });
    return Object.values(map);
  })();

  return { students, scheduleSlots, loading, error };
}
