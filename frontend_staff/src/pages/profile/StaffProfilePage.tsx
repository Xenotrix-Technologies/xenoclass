import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import {
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Briefcase,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const StaffProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useStaffAuth();

  const [profileData, setProfileData] = useState<any>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string>('Pending');
  const [punchingAttendance, setPunchingAttendance] = useState(false);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [showExperience, setShowExperience] = useState(false);
  const [showQualification, setShowQualification] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Profile Details Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [firstNameInput, setFirstNameInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [addressInput, setAddressInput] = useState('');

  // Add Qualification Modal
  const [qualModalOpen, setQualModalOpen] = useState(false);
  const [degreeInput, setDegreeInput] = useState('');
  const [instituteInput, setInstituteInput] = useState('');
  const [yearInput, setYearInput] = useState('');

  // Add Experience Modal
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [roleInput, setRoleInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');
  const [yearsInput, setYearsInput] = useState('');

  // Logout Dialog
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  useEffect(() => {
    loadFullTeacherProfile();
  }, []);

  const loadFullTeacherProfile = async () => {
    try {
      setLoading(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;

      const [profRes, attRes, qualRes, expRes] = await Promise.all([
        teacherService.getProfile(teacherId).catch(() => null),
        teacherService.getStaffAttendance(new Date().toISOString().substring(0, 10)).catch(() => null),
        teacherService.getTeacherQualifications(teacherId).catch(() => []),
        teacherService.getTeacherExperience(teacherId).catch(() => []),
      ]);

      if (profRes && Array.isArray(profRes) && profRes.length > 0) {
        setProfileData(profRes[0]);
        setFirstNameInput(profRes[0].First_Name || '');
        setLastNameInput(profRes[0].Last_Name || '');
        setAddressInput(profRes[0].Address || '');
      } else if (profRes) {
        setProfileData(profRes);
        setFirstNameInput(profRes.First_Name || '');
        setLastNameInput(profRes.Last_Name || '');
        setAddressInput(profRes.Address || '');
      }

      // Check current day attendance status
      if (attRes && attRes.success && Array.isArray(attRes.rows) && attRes.rows.length > 0) {
        const myRow = attRes.rows.find(
          (r: any) => String(r.Teacher_ID || r.User_ID) === String(teacherId)
        );
        if (myRow) {
          if (myRow.Check_Out_Time) {
            setAttendanceStatus('Checked Out');
          } else if (myRow.Check_In_Time) {
            setAttendanceStatus('Checked In');
          }
        }
      }

      setQualifications(Array.isArray(qualRes) ? qualRes : []);
      setExperiences(Array.isArray(expRes) ? expRes : []);
    } catch (err) {
      console.error('Error loading full teacher profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async () => {
    try {
      setPunchingAttendance(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      await teacherService.saveStaffAttendance(teacherId);

      if (attendanceStatus === 'Pending' || attendanceStatus === 'Checked Out') {
        setAttendanceStatus('Checked In');
      } else {
        setAttendanceStatus('Checked Out');
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
    } finally {
      setPunchingAttendance(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
    try {
      await teacherService.editProfile({
        User_ID: teacherId,
        First_Name: firstNameInput,
        Last_Name: lastNameInput,
        Address: addressInput,
      });
      setEditModalOpen(false);
      loadFullTeacherProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
    try {
      await teacherService.saveTeacherQualification({
        Teacher_ID: teacherId,
        Course_Name: degreeInput,
        Institution_Name: instituteInput,
        Passout_Date: yearInput || new Date().toISOString(),
      });
      setQualModalOpen(false);
      setDegreeInput('');
      setInstituteInput('');
      setYearInput('');
      loadFullTeacherProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQualification = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this qualification?')) return;
    const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
    try {
      await teacherService.deleteTeacherQualification(id, teacherId);
      loadFullTeacherProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
    try {
      await teacherService.saveTeacherExperience({
        Teacher_ID: teacherId,
        Job_Role: roleInput,
        Organization_Name: companyInput,
        Years_Of_Experience: Number(yearsInput) || 1,
      });
      setExpModalOpen(false);
      setRoleInput('');
      setCompanyInput('');
      setYearsInput('');
      loadFullTeacherProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExperience = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this work experience?')) return;
    const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
    try {
      await teacherService.deleteTeacherExperience(id, teacherId);
      loadFullTeacherProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const firstName = profileData?.First_Name || user?.First_Name || 'Faculty';
  const lastName = profileData?.Last_Name || user?.Last_Name || 'Member';
  const email = profileData?.Email || user?.Email || 'teacher@xenoclass.com';
  const address = profileData?.Address || '';
  const regDateRaw = profileData?.Created_Date || profileData?.Registered_Date || '2026-01-15';

  const formatRegDate = (rawStr: string) => {
    try {
      return new Date(rawStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return rawStr;
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-2xl mx-auto pb-12">
      {/* Screen Title matching Flutter Text("My Profile", fontSize: 24.sp, fontWeight: FontWeight.w700) */}
      <div>
        <h1 className="text-[24px] font-bold text-[#283B52] tracking-tight">My Profile</h1>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PROFILE CARD (Matching Flutter Container with CircleAvatar) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white rounded-[12px] p-6 text-center border border-[#E3E7EE] shadow-xs space-y-3">
        {/* CircleAvatar radius: 30.w backgroundColor: ColorResources.colorBlue500 */}
        <div className="w-[60px] h-[60px] rounded-full bg-[#1A7AE8] text-white flex items-center justify-center font-bold text-[22px] mx-auto shadow-sm">
          {firstName.charAt(0).toUpperCase()}
        </div>

        {/* Full Name */}
        <h2 className="text-[18px] font-bold text-[#111822]">
          {firstName} {lastName}
        </h2>

        {/* Email */}
        <p className="text-[12px] text-[#6A7487] font-normal">{email}</p>

        {/* Optional Address */}
        {address && <p className="text-[12px] text-[#6A7487] font-normal">{address}</p>}

        {/* Registered Date */}
        <p className="text-[12px] text-[#6A7487] font-semibold">
          Registered Date: {formatRegDate(regDateRaw)}
        </p>

        {/* Edit Details TextButton */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="text-[13px] font-bold text-[#1863D3] hover:underline"
          >
            Edit Details
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. ATTENDANCE SECTION (Matching Flutter _buildAttendanceSection) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white rounded-[12px] px-4 py-3.5 border border-[#E3E7EE] shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-semibold text-[#212A36]">Attendance</h3>
          <p
            className={`text-[12px] font-medium mt-0.5 ${
              attendanceStatus === 'Checked In' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {attendanceStatus === 'Checked In' ? 'Checked In' : 'Not Checked In'}
          </p>
        </div>

        {/* Attendance Button (Matching ElevatedButton styleFrom backgroundColor) */}
        {punchingAttendance ? (
          <div className="w-6 h-6 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#1863D3]" />
          </div>
        ) : attendanceStatus === 'Checked In' ? (
          <button
            onClick={handleToggleAttendance}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-semibold rounded-[8px] transition-colors shadow-xs"
          >
            Check Out
          </button>
        ) : (
          <button
            onClick={handleToggleAttendance}
            className="px-4 py-2 bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-[12px] font-semibold rounded-[8px] transition-colors shadow-xs"
          >
            Check In
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ASSIGNED BATCHES TILE (Matching Flutter profileTileWidget) */}
      {/* ------------------------------------------------------------- */}
      <div
        onClick={() => navigate('/students')}
        className="w-full h-[65px] bg-white rounded-[12px] px-4 flex items-center justify-between border border-[#E3E7EE] shadow-xs hover:border-[#1863D3]/40 cursor-pointer transition-colors"
      >
        <div className="flex items-center space-x-3.5">
          <div className="w-[25px] h-[25px] flex items-center justify-center">
            <img
              src="/assets/images/ic_connect.svg"
              alt="Batches"
              className="w-[25px] h-[25px] object-contain"
              onError={(e: any) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <span className="text-[14px] font-medium text-[#283B52]">Assigned Batches</span>
        </div>

        <ChevronRight className="w-5 h-5 text-[#BAC1CA]" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. WORK EXPERIENCE ACCORDION (Matching Flutter workExperienceSection) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white rounded-[12px] border border-[#E3E7EE] shadow-xs overflow-hidden">
        <div
          onClick={() => {
            setShowExperience(!showExperience);
            if (!showExperience) setShowQualification(false);
          }}
          className="h-[65px] px-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
        >
          <span className="text-[14px] font-bold text-[#283B52]">Work Experience</span>
          <ChevronRight
            className={`w-5 h-5 text-[#BAC1CA] transition-transform ${
              showExperience ? 'rotate-90' : ''
            }`}
          />
        </div>

        {showExperience && (
          <div className="p-4 border-t border-[#F4F7FA] bg-[#F4F7FA] space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setExpModalOpen(true)}
                className="px-3 py-1.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Experience</span>
              </button>
            </div>

            {experiences.length === 0 ? (
              <p className="text-xs text-[#808B9A] text-center py-4">No work experience added.</p>
            ) : (
              experiences.map((exp, idx) => (
                <div
                  key={exp.Experience_ID || exp.id || idx}
                  className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#212A36]">{exp.Job_Role || exp.role}</h4>
                    <p className="text-[11px] text-[#6A7487] mt-0.5">
                      {exp.Organization_Name || exp.company} • {exp.Years_Of_Experience || exp.duration} Years
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteExperience(exp.Experience_ID || exp.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. QUALIFICATION ACCORDION (Matching Flutter qualificationSection) */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-white rounded-[12px] border border-[#E3E7EE] shadow-xs overflow-hidden">
        <div
          onClick={() => {
            setShowQualification(!showQualification);
            if (!showQualification) setShowExperience(false);
          }}
          className="h-[65px] px-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
        >
          <span className="text-[14px] font-bold text-[#283B52]">Qualification</span>
          <ChevronRight
            className={`w-5 h-5 text-[#BAC1CA] transition-transform ${
              showQualification ? 'rotate-90' : ''
            }`}
          />
        </div>

        {showQualification && (
          <div className="p-4 border-t border-[#F4F7FA] bg-[#F4F7FA] space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setQualModalOpen(true)}
                className="px-3 py-1.5 bg-[#1863D3] hover:bg-[#1A7AE8] text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Qualification</span>
              </button>
            </div>

            {qualifications.length === 0 ? (
              <p className="text-xs text-[#808B9A] text-center py-4">No qualification records found.</p>
            ) : (
              qualifications.map((qual, idx) => (
                <div
                  key={qual.Qualification_ID || qual.id || idx}
                  className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-[#212A36]">{qual.Course_Name || qual.degree}</h4>
                    <p className="text-[11px] text-[#6A7487] mt-0.5">
                      {qual.Institution_Name || qual.institute} ({String(qual.Passout_Date || qual.year).substring(0, 4)})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteQualification(qual.Qualification_ID || qual.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#E3E7EE] pt-2" />

      {/* ------------------------------------------------------------- */}
      {/* 6. LOG OUT LINK & APP VERSION FOOTER */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setLogoutDialogOpen(true)}
          className="text-[13px] font-bold text-red-600 hover:underline block"
        >
          Log Out
        </button>

        <div className="text-center pt-2">
          <p className="text-[12px] text-[#949596]">App Version 1.0.0</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. MODALS */}
      {/* ------------------------------------------------------------- */}
      {/* Edit Profile Details Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Profile Details"
        maxWidth="sm"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              value={firstNameInput}
              onChange={(e) => setFirstNameInput(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              value={lastNameInput}
              onChange={(e) => setLastNameInput(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
            <textarea
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1863D3] text-white text-xs font-bold rounded-xl"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Qualification Modal */}
      <Modal
        isOpen={qualModalOpen}
        onClose={() => setQualModalOpen(false)}
        title="Add Qualification"
        maxWidth="sm"
      >
        <form onSubmit={handleAddQualification} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Degree / Course Name</label>
            <input
              type="text"
              value={degreeInput}
              onChange={(e) => setDegreeInput(e.target.value)}
              placeholder="e.g. Master of Arts in English"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Institution Name</label>
            <input
              type="text"
              value={instituteInput}
              onChange={(e) => setInstituteInput(e.target.value)}
              placeholder="e.g. Oxford University"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Passout Year</label>
            <input
              type="text"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              placeholder="2022"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQualModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1863D3] text-white text-xs font-bold rounded-xl"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Experience Modal */}
      <Modal
        isOpen={expModalOpen}
        onClose={() => setExpModalOpen(false)}
        title="Add Work Experience"
        maxWidth="sm"
      >
        <form onSubmit={handleAddExperience} className="space-y-4 font-sans">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Job Role</label>
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              placeholder="e.g. Senior IELTS Trainer"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label>
            <input
              type="text"
              value={companyInput}
              onChange={(e) => setCompanyInput(e.target.value)}
              placeholder="e.g. Cambridge Language Academy"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Years of Experience</label>
            <input
              type="number"
              value={yearsInput}
              onChange={(e) => setYearsInput(e.target.value)}
              placeholder="3"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setExpModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1863D3] text-white text-xs font-bold rounded-xl"
            >
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Logout Confirmation Dialog (Matching Flutter showLogoutDialog) */}
      <Modal
        isOpen={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
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
              onClick={() => setLogoutDialogOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              No
            </button>
            <button
              type="button"
              onClick={() => {
                setLogoutDialogOpen(false);
                logout();
                navigate('/login');
              }}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Yes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
