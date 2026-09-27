import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { GraduationCap, Power } from 'lucide-react';
import { Modal } from '../common/Modal';

export const StaffLayout: React.FC = () => {
  const { user, logout } = useStaffAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Exact 5 Navigation Tabs from Flutter lms_frontend_staff (home_screen.dart)
  const navTabs = [
    {
      name: 'Chats',
      path: '/chat',
      svg: '/assets/images/ic_icon_chat.svg',
      svgFilled: '/assets/images/ic_icon_chat_filled.svg',
      useLucide: false,
    },
    {
      name: 'Students',
      path: '/students',
      svg: '/assets/images/ic_connect.svg',
      svgFilled: '/assets/images/ic_connect_filled.svg',
      useLucide: false,
    },
    {
      name: 'Exams',
      path: '/exams',
      svg: null,
      svgFilled: null,
      useLucide: true,
    },
    {
      name: 'Courses',
      path: '/courses',
      svg: '/assets/images/batch.svg',
      svgFilled: '/assets/images/batch_filled.svg',
      useLucide: false,
    },
    {
      name: 'Profile',
      path: '/profile',
      svg: '/assets/images/ic_icon_profile.svg',
      svgFilled: '/assets/images/ic_icon_profile_filled.svg',
      useLucide: false,
    },
  ];

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.startsWith('/chat')) return 'Chats';
    if (p.startsWith('/students') || p.startsWith('/batches')) return 'Students';
    if (p.startsWith('/exams')) return 'Exams';
    if (p.startsWith('/courses')) return 'Courses';
    if (p.startsWith('/live-classes')) return 'Live Classes';
    if (p.startsWith('/attendance')) return 'Staff Attendance';
    if (p.startsWith('/profile')) return 'My Profile';
    if (p.startsWith('/dashboard')) return 'Faculty Dashboard';
    return 'Staff Portal';
  };

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  const teacherName =
    user?.First_Name ||
    user?.User_Name ||
    localStorage.getItem('Name') ||
    'Faculty Member';

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER (Matching Flutter CustomAppBar / Header) */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E3E7EE] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo on Left */}
          <div className="flex items-center space-x-3">
            <NavLink to="/chat" className="flex items-center space-x-2">
              <img
                src="/assets/images/xenoclass_logo.png"
                alt="Xenoclass"
                className="h-10 w-auto object-contain"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/logo.png';
                }}
              />
            </NavLink>
          </div>

          {/* Dynamic Screen Title matching Flutter CustomAppBar */}
          <div className="font-bold text-lg text-[#283B52]">
            {getPageTitle()}
          </div>

          {/* User Profile Info & Power Logout Icon */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-[#F4F7FA] px-3 py-1.5 rounded-xl border border-[#E3E7EE]">
              <div className="w-8 h-8 rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {teacherName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#111822] leading-tight">{teacherName}</p>
                <p className="text-[10px] text-[#6A7487] font-medium">Faculty</p>
              </div>
            </div>

            <button
              onClick={() => setLogoutModalOpen(true)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Logout"
            >
              <Power className="w-5 h-5 text-red-500" />
            </button>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN PAGE BODY & DESKTOP SIDEBAR */}
      {/* ------------------------------------------------------------- */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row pb-24 md:pb-6">
        {/* Desktop / Tablet Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#E3E7EE] p-4 space-y-2 shrink-0">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-1">
            Navigation
          </div>

          {navTabs.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path !== '/chat' && location.pathname.startsWith(tab.path)) ||
              (tab.path === '/students' && location.pathname.startsWith('/batches'));

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#1863D3] text-white shadow-md shadow-[#1863D3]/20'
                    : 'text-[#6A7487] hover:bg-[#E5F0FF] hover:text-[#1863D3]'
                }`}
              >
                {tab.useLucide ? (
                  <GraduationCap
                    className={`w-6 h-6 mr-3 ${isActive ? 'text-white' : 'text-[#9299A2]'}`}
                  />
                ) : (
                  <img
                    src={isActive ? tab.svgFilled! : tab.svg!}
                    alt={tab.name}
                    className="w-6 h-6 mr-3 object-contain"
                    style={{
                      filter: isActive ? 'brightness(0) invert(1)' : 'none',
                    }}
                  />
                )}
                <span>{tab.name}</span>
              </NavLink>
            );
          })}
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-5xl">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. MOBILE & TABLET BOTTOM NAVBAR (Exact Match to Flutter BottomNavigationBar) */}
      {/* ------------------------------------------------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E3E7EE] h-[78px] flex items-center justify-around px-2 shadow-lg">
        {navTabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path !== '/chat' && location.pathname.startsWith(tab.path)) ||
            (tab.path === '/students' && location.pathname.startsWith('/batches'));

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-colors"
            >
              {tab.useLucide ? (
                <div className="w-[25px] h-[25px] flex items-center justify-center">
                  <GraduationCap
                    className={`w-[24px] h-[24px] ${
                      isActive ? 'text-[#1863D3]' : 'text-[#9299A2]'
                    }`}
                  />
                </div>
              ) : (
                <div className="w-[25px] h-[25px] flex items-center justify-center">
                  <img
                    src={isActive ? tab.svgFilled! : tab.svg!}
                    alt={tab.name}
                    className="w-[25px] h-[25px] object-contain"
                  />
                </div>
              )}
              <span
                className={`text-[12px] mt-1 font-semibold ${
                  isActive ? 'text-[#1863D3]' : 'text-[#9299A2]'
                }`}
              >
                {tab.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 4. LOGOUT CONFIRMATION DIALOG (Matching Flutter showLogoutDialog) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Logout"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            Are you sure you want to log out?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#283B52] hover:bg-gray-100 rounded-lg"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="px-5 py-2 bg-[#EB4141] hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
