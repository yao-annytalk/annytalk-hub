// src/pages/CRM/StudentProfile.jsx
import React from "react";
import { useParams } from "react-router-dom";
import useStudentProfile from "../../hooks/useStudentProfile";
import Card from "../../components/Card";

export default function StudentProfile() {
  const { id } = useParams();
  const { student, loading } = useStudentProfile(id);

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>Student not found</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{student.name}</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card title="Basic Info">
          <div><strong>Code:</strong> {student.studentCode}</div>
          <div><strong>Phone:</strong> {student.parentPhone || "-"}</div>
          <div><strong>Hours Remaining:</strong> {student.remainingHours || 0}</div>
        </Card>

        <Card title="Attendance">
          <div>Attendance history and charts will go here</div>
        </Card>

        <Card title="Billing">
          <div>Package & payment details</div>
        </Card>
      </div>
    </div>
  );
}
