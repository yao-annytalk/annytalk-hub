// src/hooks/useAttendance.js
import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

export default function useAttendance() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "class_logs"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("class_logs snapshot error", err);
    });
    return () => unsub();
  }, []);
  return logs;
}
