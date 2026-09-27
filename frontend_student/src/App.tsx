import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StudentAuthProvider, useStudentAuth } from './context/StudentAuthContext';
import { CartProvider } from './context/CartContext';
import { StudentLayout } from './components/layout/StudentLayout';

// Pages
import { StudentLoginPage } from './pages/auth/StudentLoginPage';
import { StudentRegisterPage } from './pages/auth/StudentRegisterPage';
import { HomePage } from './pages/home/HomePage';
import { ExploreCoursesPage } from './pages/explore/ExploreCoursesPage';
import { CourseDetailPage } from './pages/course-details/CourseDetailPage';
import { CartCheckoutPage } from './pages/cart/CartCheckoutPage';
import { MyCoursesPage } from './pages/learning/MyCoursesPage';
import { CoursePlayerPage } from './pages/learning/CoursePlayerPage';
import { ExamsListPage } from './pages/exams/ExamsListPage';
import { ExamRunnerPage } from './pages/exams/ExamRunnerPage';
import { ExamResultPage } from './pages/exams/ExamResultPage';
import { StudentLiveSessionsPage } from './pages/live/StudentLiveSessionsPage';
import { MentorsPage } from './pages/mentors/MentorsPage';
import { StudentSupportChatPage } from './pages/chat/StudentSupportChatPage';
import { StudentProfilePage } from './pages/profile/StudentProfilePage';

const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useStudentAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-[#1863D3] font-semibold text-sm">
        Authenticating learning session...
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
    <StudentAuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth */}
            <Route path="/login" element={<StudentLoginPage />} />
            <Route path="/register" element={<StudentRegisterPage />} />

            {/* Student App Shell */}
            <Route path="/" element={<StudentLayout />}>
              <Route index element={<HomePage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="explore" element={<ExploreCoursesPage />} />
              <Route path="courses/:courseId" element={<CourseDetailPage />} />
              <Route path="courses/:courseId/learn" element={<CourseDetailPage />} />
              <Route path="cart" element={<CartCheckoutPage />} />

              {/* 4 Core Tab Routes */}
              <Route path="faculty" element={<MentorsPage />} />
              <Route path="mentors" element={<MentorsPage />} />
              <Route path="chats" element={<StudentSupportChatPage />} />
              <Route path="chat" element={<StudentSupportChatPage />} />

              <Route
                path="profile"
                element={
                  <ProtectedStudentRoute>
                    <StudentProfilePage />
                  </ProtectedStudentRoute>
                }
              />

              {/* Protected Learning Routes */}
              <Route
                path="my-courses"
                element={
                  <ProtectedStudentRoute>
                    <MyCoursesPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="learn/:courseId"
                element={
                  <ProtectedStudentRoute>
                    <CoursePlayerPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="exams"
                element={
                  <ProtectedStudentRoute>
                    <ExamsListPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="exams/:examId/run"
                element={
                  <ProtectedStudentRoute>
                    <ExamRunnerPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="exams/:examId/result"
                element={
                  <ProtectedStudentRoute>
                    <ExamResultPage />
                  </ProtectedStudentRoute>
                }
              />
              <Route
                path="live"
                element={
                  <ProtectedStudentRoute>
                    <StudentLiveSessionsPage />
                  </ProtectedStudentRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </StudentAuthProvider>
  );
};
