import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  MessageSquare,
  Video,
  Loader2,
  RefreshCw,
  User,
} from 'lucide-react';

export const BatchStudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStaffAuth();

  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      const res = await teacherService.getOneToOneBatches(teacherId);
      const list = Array.isArray(res) ? res : [];
      setBatches(list);
    } catch (err) {
      console.error('Error loading batches:', err);
      setBatches([]);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSelectBatch = async (batch: any) => {
    setSelectedBatch(batch);
    setSearchQuery('');
    try {
      setLoadingStudents(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      const batchId = batch.Batch_IDs || batch.batchId || batch.id;
      const res = await teacherService.getStudentsByBatch(batchId, teacherId);
      setStudents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error loading students for batch:', err);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredBatches = batches.filter((b) => {
    const name = (b.Batch_Names || b.batchNames || b.Course_Name || b.courseName || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.First_Name || s.firstName || ''} ${
      s.Last_Name || s.lastName || ''
    }`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const handleStartMeet = () => {
    window.open('https://meet.google.com/new?authuser=0', '_blank');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: BATCH LIST (Exact Match to Flutter StudentBatchListScreen) */}
      {/* ------------------------------------------------------------- */}
      {!selectedBatch ? (
        <div className="space-y-4">
          {/* Custom AppBar Header matching Flutter CustomAppBar */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-[24px] font-bold text-[#283B52] tracking-tight">Batches</h1>
              <button
                onClick={fetchBatches}
                className="p-1.5 text-gray-400 hover:text-[#1863D3] rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh Batches"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBatches ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search TextField (Matching textFieldWidget(labelText: 'Search Batch')) */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Batch"
                className="w-full h-[43px] pl-11 pr-4 bg-[#F4F7FA] text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
              />
            </div>
          </div>

          {/* Batch Cards Feed */}
          {loadingBatches ? (
            <div className="py-20 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading batches...</p>
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E3E7EE] text-[#808B9A]">
              <p className="text-[14px]">
                {searchQuery ? 'No matching batches' : 'No batches found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBatches.map((batch, index) => {
                const batchTitle = batch.Batch_Names || batch.batchNames || batch.Course_Name || batch.courseName;
                const courseTitle = batch.Course_Name || batch.courseName || 'Assigned Course';
                const startFormatted = formatDate(batch.Batch_Start || batch.batchStart);
                const endFormatted = formatDate(batch.Batch_End || batch.batchEnd);

                return (
                  <div
                    key={batch.Batch_IDs || index}
                    onClick={() => handleSelectBatch(batch)}
                    className="bg-white rounded-2xl border border-[#E3E7EE] p-5 shadow-xs hover:shadow-md hover:border-[#1863D3]/40 transition-all cursor-pointer space-y-3"
                  >
                    {/* Header Row: Batch Name + Arrow Icon */}
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-[18px] font-bold text-[#111822] truncate">
                        {batchTitle}
                      </h2>
                      <ChevronRight className="w-4 h-4 text-[#BAC1CA] shrink-0" />
                    </div>

                    <div className="border-t border-[#F4F7FA] pt-3 space-y-2">
                      {/* Course Row: Book Icon + Course Name */}
                      <div className="flex items-center text-[14px] font-medium text-[#283B52]">
                        <BookOpen className="w-4 h-4 text-[#1863D3] mr-2 shrink-0" />
                        <span className="truncate">Course: {courseTitle}</span>
                      </div>

                      {/* Duration Row: Calendar Icon + Start - End */}
                      <div className="flex items-center text-[13px]">
                        <Calendar className="w-4 h-4 text-orange-500 mr-2 shrink-0" />
                        <span className="text-[#6A7487] font-medium mr-1.5">Duration:</span>
                        <span className="text-[#212A36] font-semibold">
                          {startFormatted} - {endFormatted}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW 2: STUDENT ROSTER IN BATCH (Exact Match to BatchStudentListScreen) */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {/* Custom AppBar Header matching Flutter CustomAppBar(isStudentList: true) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-xs space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedBatch(null)}
                className="w-[30px] h-[30px] rounded-full bg-[#E5F0FF] text-[#6A7487] hover:text-[#1863D3] flex items-center justify-center transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h1 className="text-[20px] font-bold text-[#283B52] truncate">
                {selectedBatch.Batch_Names || selectedBatch.batchNames || selectedBatch.Course_Name}
              </h1>
            </div>

            {/* Search TextField (Matching textFieldWidget(labelText: 'Search Student')) */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Student"
                className="w-full h-[43px] pl-11 pr-4 bg-[#F4F7FA] text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
              />
            </div>
          </div>

          {/* Student Cards List matching callStudentWidget */}
          {loadingStudents ? (
            <div className="py-20 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading student roster...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E3E7EE] text-[#808B9A]">
              <p className="text-[14px]">
                {searchQuery ? 'No matching students' : 'No students found'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student, idx) => {
                const fullName = `${student.First_Name || student.firstName || 'Student'} ${
                  student.Last_Name || student.lastName || ''
                }`.trim();
                const courseName = student.Course_Name || student.courseName || selectedBatch.Course_Name || '';

                return (
                  <div
                    key={student.Student_ID || student.studentId || idx}
                    className="bg-white rounded-xl border border-[#E3E7EE] p-3.5 sm:px-4 flex items-center justify-between shadow-xs hover:border-[#1863D3]/30 transition-all"
                  >
                    {/* Left: Avatar + Name + Course */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                      <div className="w-[46px] h-[46px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-bold text-[#000000] truncate">
                          {fullName}
                        </h3>
                        {courseName && (
                          <p className="text-[12px] font-medium text-[#6A7487] truncate mt-0.5">
                            {courseName}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions (Direct Chat & 1:1 Live Call) */}
                    <div className="flex items-center space-x-2 shrink-0">
                      {/* Chat Action matching ic_icon_profile_chat.svg */}
                      <button
                        onClick={() => navigate('/chat')}
                        className="w-[35px] h-[35px] rounded-full bg-[#2B83D5] hover:bg-[#1863D3] text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      {/* Video Call Action */}
                      <button
                        onClick={handleStartMeet}
                        className="w-[35px] h-[35px] rounded-full bg-[#1863D3] hover:bg-[#1A7AE8] text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Start Live Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
