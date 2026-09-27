import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FolderTree,
  BookOpen,
  GraduationCap,
  Users,
  FileSpreadsheet,
  Clock,
  Layers,
  Smartphone,
  Power,
  Menu,
  X,
  CalendarCheck,
  Video,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Exact Angular menu items from lms_frontend_admin/src/app/shared/components/navbar/
  const menuItems = [
    { Menu_Name: 'Dashboard', Route: '/dash', altPath: '/dashboard', icon: LayoutDashboard },
    { Menu_Name: 'Course', Route: '/course', altPath: '/courses', icon: BookOpen },
    { Menu_Name: 'Faculty', Route: '/Faculty', altPath: '/faculty', icon: GraduationCap },
    { Menu_Name: 'Student', Route: '/student', altPath: '/students', icon: Users },
    { Menu_Name: 'Teacher Report', Route: '/teacher_Report', altPath: '/reports/teachers', icon: FileSpreadsheet },
    { Menu_Name: 'Student Report', Route: '/student_Report', altPath: '/reports/students', icon: FileSpreadsheet },
    { Menu_Name: 'Exam Report', Route: '/report', altPath: '/reports/exams', icon: FileText },
    { Menu_Name: 'Attendance Report', Route: '/attendance_report', altPath: '/reports/attendance', icon: Video },
    { Menu_Name: 'Staff Attendance', Route: '/staff_attendance', altPath: '/reports/staff-attendance', icon: Clock },
    { Menu_Name: 'App Management', Route: '/app_management', altPath: '/app-management', icon: Layers },
  ];

  const getPageTitle = () => {
    const currentPath = location.pathname;
    const match = menuItems.find(
      (item) =>
        item.Route === currentPath ||
        item.altPath === currentPath ||
        (item.Route !== '/dash' && currentPath.startsWith(item.Route)) ||
        (item.altPath !== '/dashboard' && currentPath.startsWith(item.altPath))
    );
    if (match) return match.Menu_Name;
    if (currentPath.includes('/details/')) return 'Metric Details';
    return 'Dashboard';
  };

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  const firstName =
    user?.First_Name ||
    user?.User_Name ||
    localStorage.getItem('Name') ||
    'Admin';

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F9FB' }}>
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVBAR (Exact replication of navbar.component.html) */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed top-0 z-40 w-full">
        <div
          className="px-4 py-3 lg:px-4 lg:pl-0"
          style={{
            backgroundColor: '#F7F9FB',
            paddingBottom: '0 !important',
            paddingRight: '0 !important',
          }}
        >
          <div className="flex items-center justify-between">
            {/* Left Brand Container (w-64) matching Angular */}
            <div className="w-64 flex items-center">
              {/* Mobile Drawer Toggle Button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <span className="sr-only">Open sidebar</span>
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    clipRule="evenodd"
                    fillRule="evenodd"
                    d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
                  ></path>
                </svg>
              </button>

              {/* Logo in top left header */}
              <a href="/dash" className="flex ms-2 md:me-24 items-center">
                <img
                  src="/assets/images/xenoclass_logo.png"
                  className="h-12 w-auto object-contain"
                  alt="Xenoclass Logo"
                  onError={(e: any) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/assets/images/logo.png';
                  }}
                />
              </a>
            </div>

            {/* Right: Header Card with Title, Avatar, First_Name, and Power Logout icon */}
            <div className="flex-auto items-center">
              <div className="p-4 pb-2">
                <div className="bg-white shadow-md rounded-lg py-2 px-4 border flex items-center justify-between w-full border-gray-200">
                  {/* Title */}
                  <div className="hidden sm:block heading-text font-semibold text-base text-gray-800">
                    {getPageTitle()}
                  </div>

                  {/* Right Section */}
                  <div id="right-section">
                    <div className="flex gap-3 justify-center items-center">
                      <img
                        className="w-10 h-10 rounded-full object-cover"
                        src="/assets/images/icons/User.svg"
                        alt="user photo"
                        onError={(e: any) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="flex items-center justify-center">
                        <p className="text-left font-medium text-sm text-gray-800" style={{ margin: '0 !important' }}>
                          {firstName}
                        </p>
                      </div>

                      {/* Red Power Logout Button with border-l-2 matching Angular */}
                      <a
                        onClick={() => setLogoutModalOpen(true)}
                        className="px-4 cursor-pointer py-2 text-sm text-gray-700 flex justify-center items-center hover:bg-gray-100 border-l-2 border-gray-200 transition-colors"
                        role="menuitem"
                        title="Logout"
                      >
                        <Power className="w-5 h-5 text-red-600" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* FIXED SIDEBAR (Exact replication of navbar.component.html aside) */}
      {/* ------------------------------------------------------------- */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-50 w-64 h-screen pt-6 transition-transform bg-white border-r border-gray-200 sm:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white flex flex-col justify-between">
          <div>
            {/* Xenoclass Logo at Sidebar Top */}
            <div className="flex justify-center mb-4 pb-4 bg-white border-b border-gray-100">
              <img
                src="/assets/images/xenoclass_logo.png"
                style={{ width: '170px' }}
                className="h-auto w-auto object-contain"
                alt="Xenoclass Logo"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/logo.png';
                }}
              />
            </div>

            {/* Menu Items List */}
            <ul className="space-y-1.5 pt-1 font-medium">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.Route ||
                  location.pathname === item.altPath ||
                  (item.Route !== '/dash' && location.pathname.startsWith(item.Route)) ||
                  (item.altPath !== '/dashboard' && location.pathname.startsWith(item.altPath));

                return (
                  <li key={item.Route}>
                    <NavLink
                      to={item.Route}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center p-2 rounded-lg transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#7FC7D91A] text-[#0F1035] font-bold shadow-xs'
                          : 'text-gray-700 hover:bg-[#7FC7D91A] hover:text-[#0F1035] hover:font-bold'
                      }`}
                    >
                      <span className="flex gap-2 ms-3 h-5 whitespace-nowrap items-center text-blue-600">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}`} />
                        <span className="flex items-center pt-0.5 text-xs font-semibold text-gray-800">
                          {item.Menu_Name}
                        </span>
                      </span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <div className="sm:ml-64 pt-24 min-h-screen flex flex-col">
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm Logout"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Power className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Are you sure you want to log out?</p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Yes, Log Out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
