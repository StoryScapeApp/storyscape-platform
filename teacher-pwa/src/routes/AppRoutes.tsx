import { Navigate, Route, Routes } from 'react-router-dom';
import { PlaceholderPage } from '../components/PlaceholderPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { StudentsPage } from '../pages/StudentsPage';
import { StudentDetailPage } from '../pages/StudentDetailPage';
import { SessionDetailPage } from '../pages/SessionDetailPage';
import { ProgressPage } from '../pages/ProgressPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/students/:studentId" element={<StudentDetailPage />} />
      <Route path="/sessions/:sessionId" element={<SessionDetailPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
    </Routes>
  );
}
