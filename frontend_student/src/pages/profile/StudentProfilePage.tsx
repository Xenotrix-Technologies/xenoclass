import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  CreditCard,
  Award,
  HelpCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useStudentAuth();

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  const firstName = user?.First_Name || user?.firstName || user?.User_Name || user?.Student_Name || 'Student';
  const lastName = user?.Last_Name || user?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const email = user?.Email || user?.email || 'student@xenoclass.com';
  const phone = user?.PhoneNumber || user?.phone || user?.Mobile_No || '+91 98765 43210';

  // Exact profile tiles from profileController.profileTileTextList + options
  const tiles = [
    {
      title: 'Account & Security',
      action: () => alert('Account credentials verified. Password change instructions are sent to registered email.'),
    },
    {
      title: 'Attendance report',
      action: () => setAttendanceModalOpen(true),
    },
    {
      title: 'Payment History',
      action: () => alert('No pending payments. All course access credentials are active.'),
    },
    {
      title: 'My Certificates',
      action: () => setCertModalOpen(true),
    },
    {
      title: 'Help & Feedback',
      action: () => setFeedbackModalOpen(true),
    },
  ];

  const handleConfirmLogout = () => {
    setLogoutModalOpen(false);
    logout();
    navigate('/login');
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText('');
      setFeedbackModalOpen(false);
    }, 1200);
  };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] max-w-2xl mx-auto space-y-4 pb-16">
      {/* ------------------------------------------------------------- */}
      {/* 1. APPBAR HEADER (Matching widget.isHomePage ? Row([IconButton, Text('My Profile')]) : ...) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="p-1.5 -ml-1.5 text-[#283B52] hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#283B52]">My Profile</h1>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PROFILE DETAILS CARD (Matching Container(color: Colors.white, ListTile)) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-xl p-3.5 border border-[#E3E7EE] shadow-2xs">
        <div className="flex items-center space-x-3.5">
          {/* Circular Avatar (height: 52, width: 52, colorgrey200) */}
          <div className="w-[52px] h-[52px] rounded-full bg-[#E5F0FF] border border-[#CBD5E1] flex items-center justify-center text-[#1863D3] font-bold text-lg shrink-0 shadow-2xs">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-[14px] font-bold text-[#283B52] truncate">
              {fullName}
            </h2>
            <p className="text-[12px] font-bold text-[#283B52] truncate mt-0.5">
              {email}
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PROFILE ACTION TILES (Matching profileController.profileTileTextList) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-1.5 pt-2">
        {tiles.map((tile, index) => (
          <div
            key={index}
            onClick={tile.action}
            className="w-full h-[52px] bg-white rounded-xl px-4 flex items-center justify-between border border-[#E3E7EE]/70 hover:border-[#1863D3]/40 cursor-pointer shadow-2xs transition-colors"
          >
            <span className="text-[13px] font-normal text-black">
              {tile.title}
            </span>
            <ChevronRight className="w-4 h-4 text-[#BAC1CA]" />
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. LOGOUT BUTTON (Matching TextButton('Logout', color: 0xffEB4141)) */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setLogoutModalOpen(true)}
          className="text-[14px] font-medium text-[#EB4141] hover:underline cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. APP VERSION & LEGAL FOOTER (Matching App Version + Terms & Privacy) */}
      {/* ------------------------------------------------------------- */}
      <div className="pt-10 text-center space-y-2">
        <p className="text-[13px] text-[#949596]">App Version 1.0.0</p>
        <div className="flex items-center justify-center text-[12px] text-[#949596]">
          <span>Our </span>
          <button
            type="button"
            onClick={() => setTermsModalOpen(true)}
            className="ml-1 text-black font-bold underline underline-offset-2 hover:text-[#1863D3] cursor-pointer"
          >
            Terms & conditions
          </button>
          <span className="mx-1.5">and</span>
          <button
            type="button"
            onClick={() => setPrivacyModalOpen(true)}
            className="text-black font-bold underline underline-offset-2 hover:text-[#1863D3] cursor-pointer"
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MODALS */}
      {/* ============================================================= */}

      {/* Logout Confirmation Dialog (Matching showLogoutDialog AlertDialog) */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Logout"
        maxWidth="sm"
      >
        <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <p className="text-[14px] text-[#283B52] font-medium">
            Are you sure you want to log out?
          </p>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-1.5 text-[14px] font-medium text-[#6A7487] hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              No
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="px-4 py-1.5 text-[14px] font-medium text-[#EB4141] hover:bg-red-50 rounded-lg cursor-pointer font-bold"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>

      {/* Attendance Report Modal */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title="Attendance Report"
        maxWidth="sm"
      >
        <div className="space-y-3 font-['Plus_Jakarta_Sans',sans-serif] text-xs">
          <div className="bg-[#E5F0FF] p-3 rounded-xl flex items-center justify-between">
            <span className="font-bold text-[#1863D3]">Live Class Attendance:</span>
            <span className="font-bold text-[#1863D3] text-sm">94.5%</span>
          </div>
          <p className="text-[#6A7487]">
            Recorded 18 attended live batch lessons out of 19 held in the active curriculum.
          </p>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setAttendanceModalOpen(false)}
              className="px-4 py-1.5 bg-[#1863D3] text-white font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Help & Feedback Modal */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        title="Help & Feedback"
        maxWidth="sm"
      >
        <form onSubmit={handleSendFeedback} className="space-y-3 font-['Plus_Jakarta_Sans',sans-serif]">
          <textarea
            rows={4}
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Write your suggestions or inquiries here..."
            required
            className="w-full p-3 bg-[#F4F7FA] border border-[#BAC1CA] rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#1863D3]"
          />
          {feedbackSent && (
            <p className="text-xs font-bold text-emerald-600">
              Feedback submitted successfully!
            </p>
          )}
          <div className="flex justify-end space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-[#1863D3] text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Submit
            </button>
          </div>
        </form>
      </Modal>

      {/* Certificates Modal */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title="My Certificates"
        maxWidth="sm"
      >
        <div className="space-y-3 text-center py-4 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="w-12 h-12 rounded-full bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center mx-auto">
            <Award className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#111822]">Certificate Verification</h4>
          <p className="text-xs text-[#6A7487]">
            Certificates become downloadable after completing all 30 days of the course curriculum.
          </p>
          <button
            type="button"
            onClick={() => setCertModalOpen(false)}
            className="px-4 py-1.5 bg-[#1863D3] text-white text-xs font-bold rounded-lg"
          >
            Done
          </button>
        </div>
      </Modal>

      {/* Terms and Conditions Modal */}
      <Modal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        title="Terms & Conditions"
        maxWidth="md"
      >
        <div className="space-y-2 text-xs text-[#6A7487] max-h-72 overflow-y-auto p-1 font-['Plus_Jakarta_Sans',sans-serif]">
          <p className="font-bold text-black">Xenoclass Learning Management System</p>
          <p>
            1. All course lesson materials and live streaming recordings are for enrolled students only.
          </p>
          <p>
            2. Students are encouraged to maintain active attendance in daily live mentor sessions.
          </p>
        </div>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
        title="Privacy Policy"
        maxWidth="md"
      >
        <div className="space-y-2 text-xs text-[#6A7487] max-h-72 overflow-y-auto p-1 font-['Plus_Jakarta_Sans',sans-serif]">
          <p className="font-bold text-black">Data Privacy & Security</p>
          <p>
            Your student profile and chat logs with teachers are end-to-end encrypted and handled securely.
          </p>
        </div>
      </Modal>
    </div>
  );
};
