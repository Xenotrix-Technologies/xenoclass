import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { liveService } from '../../services/liveService';
import { useStudentAuth } from '../../context/StudentAuthContext';
import {
  ChevronLeft,
  Phone,
  Video,
  Loader2,
  Clock,
} from 'lucide-react';

export const MentorsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStudentAuth();

  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFacultyList();
  }, []);

  const loadFacultyList = async () => {
    try {
      setLoading(true);
      const res = await liveService.getAvailableMentors();
      const rawList = Array.isArray(res) && Array.isArray(res[0]) ? res[0] : (Array.isArray(res) ? res : []);
      const formatted = rawList
        .map((m: any) => {
          const id = Number(m.userId || m.User_ID || m.Teacher_ID || m.teacher_id || m.Id || m.id || 0);
          return {
            ...m,
            userId: id,
            teacherId: id,
            firstName: m.First_Name || m.firstName || 'Faculty',
            lastName: m.Last_Name || m.lastName || '',
            userTypeId: m.User_Type_Id || m.userTypeId || 2,
            courseName: m.Course_Name || m.courseName || '',
            startTime: m.start_time || m.startTime || '',
            endTime: m.end_time || m.endTime || '',
            profilePhotoPath: m.Profile_Photo_Path || m.profilePhotoPath || '',
          };
        })
        .filter((m: any) => m.userId > 0);

      setMentors(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open('https://meet.google.com/new?authuser=0', '_blank');
  };

  const handleOpenChat = (teacher: any) => {
    const tid = Number(teacher.teacherId || teacher.userId || teacher.User_ID || teacher.teacher_id || 0);
    if (tid > 0) {
      navigate('/chats', { state: { selectedTeacher: { ...teacher, teacherId: tid } } });
    }
  };

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] max-w-3xl mx-auto space-y-4 pb-14">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP APPBAR (Matching Flutter widget.isBottomBar ? Row([IconButton, Text('Faculty')]) : ...) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center space-x-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/home')}
          className="p-1.5 -ml-1.5 text-[#283B52] hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
        </button>
        <h1 className="text-[18px] font-bold text-[#283B52]">Faculty</h1>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FACULTY LIST (Matching Flutter ListView.builder with TeacherWidget) */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading faculty members...</p>
        </div>
      ) : mentors.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#E3E7EE] text-[#6A7487]">
          <p className="text-sm font-medium">No mentors available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {mentors.map((teacher, index) => {
            const isHod = teacher.userTypeId !== 2;
            const isBatchAndOne = teacher.isBatch === 1 && teacher.isOneonOne === 1;
            const isLive = teacher.isBatch === 1 && teacher.isOneonOne === 0;
            const isOneOnOne = teacher.isBatch === 0 && teacher.isOneonOne === 1;

            // Banner text & color matching Flutter teacher_list_page.dart
            let bannerText = 'Live';
            let bannerBg = 'bg-[#757575]'; // Grey for Batch/Live

            if (isHod) {
              bannerText = 'HOD';
              bannerBg = 'bg-[#FF1818]'; // Red for HOD
            } else if (isBatchAndOne) {
              bannerText = 'Batch and One to One';
              bannerBg = 'bg-[#00B9DA]'; // Cyan for Batch & 1:1
            } else if (isOneOnOne) {
              bannerText = 'One to One';
              bannerBg = 'bg-[#00853C]'; // Green for One to One
            }

            const name = isHod
              ? teacher.courseName || 'HOD'
              : `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Faculty';

            const timeSlotText = isHod
              ? 'Available at : 24 x 7'
              : `Available at : ${teacher.startTime || '10:00 AM'} - ${teacher.endTime || '11:30 AM'}`;

            return (
              <div
                key={teacher.userId || index}
                onClick={() => handleOpenChat(teacher)}
                className="relative bg-white rounded-xl shadow-[0_3px_9px_rgba(0,0,0,0.08)] border border-[#E3E7EE]/60 hover:shadow-md cursor-pointer transition-all overflow-hidden"
              >
                {/* Top-Right Banner Badge (Matching Positioned in TeacherWidget) */}
                <div
                  className={`absolute top-0 right-0 ${bannerBg} text-white text-[11px] font-bold px-3 py-0.5 rounded-bl-xl rounded-tr-md shadow-2xs`}
                >
                  {bannerText}
                </div>

                <div className="p-4 flex items-center justify-between space-x-3">
                  {/* Left: Circular Avatar & Teacher Info */}
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1 pr-2">
                    <div className="w-[46px] h-[46px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14px] font-bold text-[#000000] truncate leading-tight">
                        {name}
                      </h3>
                      <p className="text-[12px] text-[#6A7487] font-medium mt-1 truncate">
                        {timeSlotText}
                      </p>
                    </div>
                  </div>

                  {/* Right: Audio & Video Call Circular Buttons (Matching trailing in TeacherWidget) */}
                  <div className="flex items-center space-x-2.5 shrink-0 pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="w-[28px] h-[28px] rounded-full bg-[#2B83D5] hover:bg-[#1863D3] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      title="Audio Call"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="w-[28px] h-[28px] rounded-full bg-[#2B83D5] hover:bg-[#1863D3] text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
                      title="Video Call"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
