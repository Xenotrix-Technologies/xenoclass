import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AdminLayout } from './components/layout/AdminLayout';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { DeactivateAccountPage } from './pages/auth/DeactivateAccountPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MetricDetailsPage } from './pages/dashboard/MetricDetailsPage';
import { CategoriesPage } from './pages/categories/CategoriesPage';
import { CoursesPage } from './pages/courses/CoursesPage';
import { BatchManagementPage } from './pages/courses/BatchManagementPage';
import { ModuleManagementPage } from './pages/courses/ModuleManagementPage';
import { AdminExamPage } from './pages/courses/AdminExamPage';
import { FacultyPage } from './pages/faculty/FacultyPage';
import { StudentsPage } from './pages/students/StudentsPage';
import { StudentAppInfoPage } from './pages/students/StudentAppInfoPage';
import { TeacherReportPage } from './pages/reports/TeacherReportPage';
import { StudentReportPage } from './pages/reports/StudentReportPage';
import { ExamReportPage } from './pages/reports/ExamReportPage';
import { AttendanceReportPage } from './pages/reports/AttendanceReportPage';
import { StaffAttendancePage } from './pages/reports/StaffAttendancePage';
import { AppManagementPage } from './pages/app-management/AppManagementPage';

import { LoadingSpinner } from './components/common/LoadingSpinner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Authenticating session..." size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth" element={<LoginPage />} />
          <Route path="/auth/user" element={<LoginPage />} />
          <Route path="/deactivate-account" element={<DeactivateAccountPage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dash" replace />} />
            
            {/* Angular Routes */}
            <Route path="dash" element={<DashboardPage />} />
            <Route path="dash/details/:type" element={<MetricDetailsPage />} />
            <Route path="category" element={<CategoriesPage />} />
            <Route path="course" element={<CoursesPage />} />
            <Route path="Faculty" element={<FacultyPage />} />
            <Route path="student" element={<StudentsPage />} />
            <Route path="teacher_Report" element={<TeacherReportPage />} />
            <Route path="student_Report" element={<StudentReportPage />} />
            <Route path="report" element={<ExamReportPage />} />
            <Route path="attendance_report" element={<AttendanceReportPage />} />
            <Route path="staff_attendance" element={<StaffAttendancePage />} />
            <Route path="student_appInfo" element={<StudentAppInfoPage />} />
            <Route path="app_management" element={<AppManagementPage />} />

            {/* Aliases for clean URL navigation */}
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/details/:type" element={<MetricDetailsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="courses" element={<CoursesPage />} />
            <Route path="batches" element={<BatchManagementPage />} />
            <Route path="modules" element={<ModuleManagementPage />} />
            <Route path="exams" element={<AdminExamPage />} />
            <Route path="faculty" element={<FacultyPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="student-app-info" element={<StudentAppInfoPage />} />
            <Route path="reports/teachers" element={<TeacherReportPage />} />
            <Route path="reports/students" element={<StudentReportPage />} />
            <Route path="reports/exams" element={<ExamReportPage />} />
            <Route path="reports/attendance" element={<AttendanceReportPage />} />
            <Route path="reports/staff-attendance" element={<StaffAttendancePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dash" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
