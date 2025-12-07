// src/pages/CRM/StudentsList.jsx
import React, { useState } from "react";
import useStudents from "../../hooks/useStudents";
import Card from "../../components/Card";
import { Link } from "react-router-dom";

export default function StudentsList() {
  const students = useStudents();
  const [q, setQ] = useState("");
  const filtered = students.filter(s => !q || (s.name || "").toLowerCase().includes(q.toLowerCase()) || (s.studentCode || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Students (CRM)</h1>
      </div>

      <Card>
        <div className="flex items-center mb-4 gap-3">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name or code" className="border p-2 rounded w-full" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {filtered.map(s => (
            <Link to={`/students/${s.id}`} key={s.id} className="block">
              <div className="bg-white p-3 rounded shadow">
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-slate-500">{s.studentCode || "-"}</div>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
