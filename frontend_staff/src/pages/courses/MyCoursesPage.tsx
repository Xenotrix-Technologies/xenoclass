import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import { contentService } from '../../services/contentService';
import {
  Search,
  BookOpen,
  Users,
  Layers,
  Loader2,
  RefreshCw,
  ChevronLeft,
  MessageSquare,
  Video,
} from 'lucide-react';

const R2_PUBLIC_URL = 'https://pub-11714a99f3bd420ca95f23dda2af714b.r2.dev/';

export const MyCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useStaffAuth();

  const [courses, setCourses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Dedicated "View Students" Screen State matching StudentsWithCourseScreen
  const [viewingCourseStudents, setViewingCourseStudents] = useState<any | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const getMediaUrl = (path?: string) => {
    if (!path || path === 'null' || path === 'undefined' || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = R2_PUBLIC_URL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      let list = await teacherService.getTeacherCoursesWithBatch(teacherId);
      if (!Array.isArray(list) || list.length === 0) {
        const hodList = await contentService.getHodCourse();
        if (Array.isArray(hodList) && hodList.length > 0) {
          list = hodList;
        }
      }
      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenViewStudents = async (course: any) => {
    setViewingCourseStudents(course);
    setStudentSearchQuery('');
    try {
      setLoadingStudents(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      const courseId = course.courseId || course.Course_ID || 0;
      const res = await teacherService.getTeacherStudents(teacherId, courseId);
      const list = Array.isArray(res) ? res : [];
      setCourseStudents(list);
    } catch (err) {
      console.error(err);
      setCourseStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const name = (c.courseName || c.Course_Name || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const filteredStudents = courseStudents.filter((s) => {
    const fullName = `${s.firstName || s.First_Name || ''} ${
      s.lastName || s.Last_Name || ''
    }`.toLowerCase();
    return fullName.includes(studentSearchQuery.toLowerCase());
  });

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto pb-10">
      {/* ------------------------------------------------------------- */}
      {/* VIEW 1: COURSES LIST (Exact Match to Flutter CourseListPage) */}
      {/* ------------------------------------------------------------- */}
      {!viewingCourseStudents ? (
        <div className="space-y-4">
          {/* Custom AppBar Header (Matching CustomAppBar(title: 'Courses', labelText: 'Search Course')) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="text-[24px] font-bold text-[#283B52] tracking-tight">Courses</h1>
              <button
                onClick={fetchCourses}
                className="p-1.5 text-gray-400 hover:text-[#1863D3] rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh Courses"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Search TextField (Matching textFieldWidget(labelText: 'Search Course')) */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Course"
                className="w-full h-[43px] pl-11 pr-4 bg-[#F4F7FA] text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
              />
            </div>
          </div>

          {/* Course Cards List */}
          {loading ? (
            <div className="py-20 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading courses...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E3E7EE] text-gray-500 space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center mx-auto">
                <BookOpen className="w-7 h-7" />
              </div>
              <p className="text-[16px] font-medium text-[#6A7487]">
                {searchQuery
                  ? `No courses found for "${searchQuery}"`
                  : 'No assigned courses available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCourses.map((course, index) => {
                const courseId = course.courseId || course.Course_ID || index;
                const courseName = course.courseName || course.Course_Name || 'No Name';
                const price =
                  course.price != null
                    ? course.price === '0.00' || course.price === 0
                      ? 'Free'
                      : `₹ ${course.price}`
                    : '';

                return (
                  <div
                    key={courseId}
                    className="bg-white rounded-2xl border border-[#E3E7EE] shadow-xs p-4 sm:p-5 hover:shadow-md transition-all space-y-4"
                  >
                    {/* Course Thumbnail & Title Row */}
                    <div className="flex items-start space-x-4">
                      <div className="w-[110px] h-[80px] rounded-2xl bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                        {(course.thumbnailPath || course.Thumbnail_Path) ? (
                          <img
                            src={getMediaUrl(course.thumbnailPath || course.Thumbnail_Path)}
                            alt={courseName}
                            className="w-full h-full object-cover"
                            onError={(e: any) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <BookOpen className="w-8 h-8 text-[#1863D3]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-[15px] sm:text-[16px] font-bold text-[#111822] leading-snug line-clamp-2">
                          {courseName}
                        </h3>
                        {price && (
                          <p className="text-[13px] font-bold text-[#1863D3] mt-1.5">{price}</p>
                        )}
                      </div>
                    </div>

                    {/* Two Action Buttons: View Students & Course Details */}
                    <div className="border-t border-[#F4F7FA] pt-3.5 flex items-center justify-between gap-3">
                      {/* Button 1: View Students */}
                      <button
                        type="button"
                        onClick={() => handleOpenViewStudents(course)}
                        className="flex-1 h-[35px] bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-[12px] font-bold rounded-full transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Students</span>
                      </button>

                      {/* Button 2: Course Details */}
                      <button
                        type="button"
                        onClick={() => navigate(`/courses/${courseId}/content`)}
                        className="flex-1 h-[35px] bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-[12px] font-bold rounded-full transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Course Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* VIEW 2: STUDENTS IN COURSE (Exact Match to StudentsWithCourseScreen) */
        /* ------------------------------------------------------------- */
        <div className="space-y-4">
          {/* Custom AppBar (Matching CustomAppBar(title: 'Student list', isStudentList: true, labelText: 'Search Student')) */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-xs space-y-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewingCourseStudents(null)}
                className="w-[30px] h-[30px] rounded-full bg-[#E5F0FF] text-[#6A7487] hover:text-[#1863D3] flex items-center justify-center transition-colors shrink-0"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div>
                <h1 className="text-[20px] font-bold text-[#283B52] truncate">Student list</h1>
                <p className="text-[11px] text-[#1863D3] font-semibold">
                  {viewingCourseStudents.courseName || viewingCourseStudents.Course_Name}
                </p>
              </div>
            </div>

            {/* Search TextField (Matching textFieldWidget(labelText: 'Search Student')) */}
            <div className="relative">
              <Search className="w-5 h-5 text-[#BAC1CA] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                placeholder="Search Student"
                className="w-full h-[43px] pl-11 pr-4 bg-[#F4F7FA] text-[#212A36] text-[14px] font-medium rounded-xl border border-[#BAC1CA] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3] transition-colors"
              />
            </div>
          </div>

          {/* Student List View */}
          {loadingStudents ? (
            <div className="py-20 text-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
              <p className="text-xs font-semibold">Loading enrolled students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E3E7EE] text-[#808B9A]">
              <p className="text-[14px]">
                {studentSearchQuery ? 'No matching students' : 'No students available'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((slot, idx) => {
                const fullName = `${slot.firstName || slot.First_Name || 'Student'} ${
                  slot.lastName || slot.Last_Name || ''
                }`.trim();

                return (
                  <div
                    key={slot.studentId || idx}
                    className="bg-white rounded-xl border border-[#E3E7EE] p-3.5 sm:px-4 flex items-center justify-between shadow-xs hover:border-[#1863D3]/30 transition-all"
                  >
                    {/* Student Info */}
                    <div className="flex items-center space-x-3 min-w-0 flex-1 pr-3">
                      <div className="w-[46px] h-[46px] rounded-full bg-[#1863D3] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                        {fullName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[14px] font-bold text-[#000000] truncate">
                          {fullName}
                        </h3>
                        {slot.startTime && slot.endTime ? (
                          <p className="text-[12px] font-medium text-[#6A7487] truncate mt-0.5">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        ) : (
                          <p className="text-[12px] font-medium text-[#6A7487] truncate mt-0.5">
                            Enrolled Student
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions: Direct Chat & Call */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => navigate('/chat')}
                        className="w-[35px] h-[35px] rounded-full bg-[#2B83D5] hover:bg-[#1863D3] text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Open Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => window.open('https://meet.google.com/new?authuser=0', '_blank')}
                        className="w-[35px] h-[35px] rounded-full bg-[#1863D3] hover:bg-[#1A7AE8] text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Start Call"
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
