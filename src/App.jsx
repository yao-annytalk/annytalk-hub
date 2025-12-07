import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ModalProvider } from './context/ModalContext'; // ✅ Import the provider
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import AttendancePage from './pages/AttendancePage';
import StudentsPage from './pages/StudentsPage';
import MakeupPage from './pages/MakeupPage';
import SchedulePage from './pages/SchedulePage';
import ScholarshipPage from './pages/ScholarshipPage';
import CurriculumPage from './pages/CurriculumPage';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Outlet />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider> {/* ✅ Wrapped here to cover all pages */}
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Navigate to="/attendance" />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/makeup" element={<MakeupPage />} />
              <Route path="/scholarship" element={<ScholarshipPage />} />
              <Route path="/curriculum" element={<CurriculumPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ModalProvider>
    </AuthProvider>
  );
}