import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { useCart } from '../../context/CartContext';
import {
  ShoppingCart,
  LogOut,
} from 'lucide-react';
import { Modal } from '../common/Modal';

export const StudentLayout: React.FC = () => {
  const { user, logout, isAuthenticated } = useStudentAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const studentName =
    user?.Student_Name ||
    user?.User_Name ||
    user?.First_Name ||
    user?.firstName ||
    'Student';

  // 4 Core Navigation Tabs matching Flutter custom_bottom_bar.dart exactly
  const navTabs = [
    {
      title: 'Home',
      path: '/home',
      iconOutline: '/assets/images/bottom_home.svg',
      iconFilled: '/assets/images/bottom_home_filled.svg',
    },
    {
      title: 'Faculty',
      path: '/faculty',
      iconOutline: '/assets/images/bottom_connect.svg',
      iconFilled: '/assets/images/bottom_connect_filled.svg',
    },
    {
      title: 'Chats',
      path: '/chats',
      iconOutline: '/assets/images/bottom_chat.svg',
      iconFilled: '/assets/images/bottom_chat_filled.svg',
    },
    {
      title: 'Profile',
      path: '/profile',
      iconOutline: '/assets/images/bottom_profile.svg',
      iconFilled: '/assets/images/bottom_profile_filled.svg',
    },
  ];

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col font-sans antialiased text-[#212A36]">
      {/* ------------------------------------------------------------- */}
      {/* TOP NAVBAR HEADER BAR (Exact 1:1 Parity) */}
      {/* ------------------------------------------------------------- */}
      <header className="bg-white border-b border-[#E3E7EE] sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <NavLink to="/home" className="flex items-center space-x-2 shrink-0">
              <img
                src="/assets/images/xenoclass_logo.png"
                alt="Xenoclass"
                className="h-9 w-auto object-contain"
                onError={(e: any) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/images/logo.png';
                }}
              />
            </NavLink>

            {/* Student Greeting */}
            <div className="hidden sm:block pl-3 border-l border-[#E3E7EE]">
              <p className="text-[11px] text-[#9299A2] font-semibold">Welcome back</p>
              <p className="text-[13px] font-bold text-[#111822] truncate max-w-[160px]">
                Hi, {studentName} 👋
              </p>
            </div>
          </div>

          {/* Center & Right Navigation buttons in navbar */}
          <div className="flex items-center space-x-3">
            {/* Desktop Navbar Buttons */}
            <nav className="hidden md:flex items-center space-x-1 mr-2">
              {navTabs.map((tab) => {
                const isActive =
                  location.pathname === tab.path ||
                  (tab.path !== '/home' && location.pathname.startsWith(tab.path));

                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-[13px] transition-all font-['Plus_Jakarta_Sans',sans-serif] ${
                      isActive
                        ? 'bg-[#E5F0FF] text-[#1863D3] font-bold shadow-2xs'
                        : 'text-[#9299A2] font-bold hover:text-[#1863D3] hover:bg-[#F4F7FA]'
                    }`}
                  >
                    <img
                      src={isActive ? tab.iconFilled : tab.iconOutline}
                      alt={tab.title}
                      className="w-4 h-4 object-contain"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span>{tab.title}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Cart Button */}
            <NavLink
              to="/cart"
              className="relative p-2 rounded-full text-[#9299A2] hover:bg-[#F4F7FA] hover:text-[#1863D3] transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#1863D3] text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                  {cart.length}
                </span>
              )}
            </NavLink>

            {/* Profile Avatar / Login */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <NavLink
                  to="/profile"
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-50 transition-colors"
                  title="My Profile"
                >
                  <div className="w-9 h-9 rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {studentName.charAt(0).toUpperCase()}
                  </div>
                </NavLink>

                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="p-2 text-[#9299A2] hover:text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <NavLink
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-[#1863D3] hover:bg-[#E5F0FF] rounded-full transition-colors"
                >
                  Login
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN CONTENT ROUTE CONTAINER */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5 pb-28 md:pb-10">
        <Outlet />
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE BOTTOM NAVIGATION BAR (Exact Match to CustomBottomBar.dart) */}
      {/* ------------------------------------------------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E3E7EE] shadow-[0_-2px_8px_rgba(0,0,0,0.06)] h-[78px] flex items-center justify-around px-2">
        {navTabs.map((tab) => {
          const isActive =
            location.pathname === tab.path ||
            (tab.path !== '/home' && location.pathname.startsWith(tab.path));

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer transition-all"
            >
              {/* Icon Image matching height: 24.adaptSize (unselected) / 26.adaptSize (selected) */}
              <div className="h-[26px] flex items-center justify-center mb-1">
                <img
                  src={isActive ? tab.iconFilled : tab.iconOutline}
                  alt={tab.title}
                  className={`object-contain transition-transform ${
                    isActive ? 'w-[26px] h-[26px] scale-105' : 'w-[24px] h-[24px] opacity-80 group-hover:opacity-100'
                  }`}
                  onError={(e: any) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              {/* Text matching GoogleFonts.plusJakartaSans fontSize: 13, colorBlue600 vs colorgrey500 */}
              <span
                className={`text-[13px] tracking-tight leading-none font-['Plus_Jakarta_Sans',sans-serif] transition-colors ${
                  isActive
                    ? 'text-[#1863D3] font-bold'
                    : 'text-[#9299A2] font-extrabold group-hover:text-[#1863D3]'
                }`}
              >
                {tab.title}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* LOGOUT CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Logout"
        maxWidth="sm"
      >
        <div className="space-y-4 font-sans">
          <p className="text-sm text-gray-700 font-medium">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
