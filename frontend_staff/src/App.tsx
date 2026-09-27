import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StaffAuthProvider, useStaffAuth } from './context/StaffAuthContext';
import { StaffLayout } from './components/layout/StaffLayout';

// Pages
import { StaffLoginPage } from './pages/auth/StaffLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import { StaffDashboardPage } from './pages/dashboard/StaffDashboardPage';
import { MyCoursesPage } from './pages/courses/MyCoursesPage';
import { BatchStudentsPage } from './pages/courses/BatchStudentsPage';
import { CourseContentPage } from './pages/courses/CourseContentPage';
import { MockExamReviewPage } from './pages/courses/MockExamReviewPage';
import { LiveClassesPage } from './pages/live/LiveClassesPage';
import { StaffChatPage } from './pages/chat/StaffChatPage';
import { CallLogsPage } from './pages/calls/CallLogsPage';
import { StaffAttendancePage } from './pages/attendance/StaffAttendancePage';
import { StaffProfilePage } from './pages/profile/StaffProfilePage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useStaffAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1C2348] text-white text-sm">
        Authenticating faculty session...
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
    <StaffAuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<StaffLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected Faculty Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            {/* Index defaults to /chat matching Tab 0 of Flutter home_screen */}
            <Route index element={<Navigate to="/chat" replace />} />
            
            {/* Core 5 Flutter Tabs */}
            <Route path="chat" element={<StaffChatPage />} />
            <Route path="students" element={<BatchStudentsPage />} />
            <Route path="batches" element={<BatchStudentsPage />} />
            <Route path="batches/:batchId/students" element={<BatchStudentsPage />} />
            <Route path="exams" element={<MockExamReviewPage />} />
            <Route path="courses" element={<MyCoursesPage />} />
            <Route path="courses/:courseId/content" element={<CourseContentPage />} />
            <Route path="courses/:courseId/exams" element={<MockExamReviewPage />} />
            <Route path="profile" element={<StaffProfilePage />} />
            
            {/* Extra Faculty Features */}
            <Route path="dashboard" element={<StaffDashboardPage />} />
            <Route path="live-classes" element={<LiveClassesPage />} />
            <Route path="calls" element={<CallLogsPage />} />
            <Route path="attendance" element={<StaffAttendancePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    </StaffAuthProvider>
  );
};
