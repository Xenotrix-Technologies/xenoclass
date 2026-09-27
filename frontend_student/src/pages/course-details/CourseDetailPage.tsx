import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { examService } from '../../services/examService';
import { useCart } from '../../context/CartContext';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { R2_PUBLIC_URL } from '../../config/constants';
import {
  ChevronLeft,
  Play,
  FileText,
  Headphones,
  CheckSquare,
  Lock,
  ExternalLink,
  Calendar,
  X,
  Download,
  Key,
  Maximize2,
  Volume2,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Video,
  BookOpen,
  HelpCircle,
  Award,
  FastForward,
  Rewind,
  Sparkles,
} from 'lucide-react';

interface BatchDay {
  Days_Id: number;
  Day_Name: string;
  is_day_unlocked: number;
  is_exam_day: number;
  isToday: number;
}

interface Section {
  sectionId: number;
  sectionName: string;
  examTypeId?: number;
}

interface ContentExam {
  Exam_ID?: number;
  examName?: string;
  file_name?: string;
  file_type?: string;
  questions?: any;
  timeLimit?: number;
  passingScore?: number;
  Main_Question?: string;
  totalQuestions?: number;
  Answer_Key_Name?: string;
  Answer_Key_Path?: string;
  is_Exam_Unlocked?: number;
  Supporting_Document_Name?: string;
  Supporting_Document_Path?: string;
  Is_Question_Media_Unlocked?: number;
  Is_Question_Unlocked?: number;
  Is_Answer_Unlocked?: number;
}

interface ContentItem {
  Content_ID: number;
  contentName: string;
  file?: string;
  file_name?: string;
  file_type?: string;
  contentThumbnail_Path?: string;
  contentThumbnail_name?: string;
  Is_Exam_Test?: number;
  External_Link?: string;
  exams?: ContentExam[];
}

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useStudentAuth();

  // Navigation / Tabs State
  const [activeTab, setActiveTab] = useState<'modules' | 'exams' | 'results'>('modules');
  const [activeView, setActiveView] = useState<'days' | 'categories' | 'content'>('days');

  // Course Data
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modules & Days Data
  const [modulesList, setModulesList] = useState<any[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('0');
  const [batchDays, setBatchDays] = useState<BatchDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<BatchDay | null>(null);

  // Categories / Sections Data
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Content Details Data
  const [dayContents, setDayContents] = useState<ContentItem[]>([]);
  const [activeContentIndex, setActiveContentIndex] = useState<number>(0);
  const [isContentLoading, setIsContentLoading] = useState<boolean>(false);

  // Video Player States
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [watchedSeconds, setWatchedSeconds] = useState<Set<number>>(new Set());
  const [attendanceMarked, setAttendanceMarked] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Exams & Results Tab Data
  const [courseExams, setCourseExams] = useState<any[]>([]);
  const [studentResults, setStudentResults] = useState<any[]>([]);
  const [isExamsLoading, setIsExamsLoading] = useState<boolean>(false);
  const [isResultsLoading, setIsResultsLoading] = useState<boolean>(false);

  // PDF Viewer Modal
  const [pdfModalOpen, setPdfModalOpen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfTitle, setPdfTitle] = useState<string>('');
  const [pdfAudioUrl, setPdfAudioUrl] = useState<string>('');
  const [answerKeyUrl, setAnswerKeyUrl] = useState<string>('');
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(false);

  // Guidance / Enrollment Modal
  const [guidanceModalOpen, setGuidanceModalOpen] = useState<boolean>(false);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | string>('0');

  // Toast / Notification banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getMediaUrl = (path?: string) => {
    if (!path || path === 'null' || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = R2_PUBLIC_URL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  };

  useEffect(() => {
    loadInitialData();
  }, [courseId]);

  const loadInitialData = async () => {
    const cid = Number(courseId || 1);
    setIsLoading(true);
    try {
      // 1. Fetch Real Course Info from Backend
      const infoRes = await courseService.getCourseInfo(cid);
      let courseObj = null;
      if (Array.isArray(infoRes)) {
        if (infoRes.length > 0 && Array.isArray(infoRes[0])) {
          courseObj = infoRes[0][0];
        } else if (infoRes.length > 0) {
          courseObj = infoRes[0];
        }
      } else if (infoRes && typeof infoRes === 'object') {
        courseObj = infoRes;
      }

      setCourseInfo(courseObj);

      // 2. Check Enrollment Status
      try {
        const enrollRes = await courseService.checkStudentEnrollment(cid);
        const enrolledList = Array.isArray(enrollRes) ? enrollRes : [enrollRes];
        const hasEnrolled =
          enrolledList.length > 0 &&
          enrolledList[0]?.studentCourseId !== 0 &&
          enrolledList[0]?.Student_Course_ID !== 0 &&
          enrolledList[0]?.studentCourseId !== undefined;
        setIsEnrolled(hasEnrolled || true); // default true for study preview
      } catch (e) {
        setIsEnrolled(true);
      }

      // 3. Fetch Real Modules
      let firstModId = '0';
      try {
        const modulesRes = await courseService.getCoursesModules(cid);
        const modArr = Array.isArray(modulesRes)
          ? Array.isArray(modulesRes[0])
            ? modulesRes[0]
            : modulesRes
          : [];
        setModulesList(modArr);
        if (modArr.length > 0 && (modArr[0].Module_ID || modArr[0].moduleId)) {
          firstModId = String(modArr[0].Module_ID || modArr[0].moduleId);
        }
        setSelectedModuleId(firstModId);
      } catch (e) {
        console.warn('Modules load error:', e);
      }

      // 4. Fetch Real Batch Days
      const validityDays = courseObj?.Validity || 30;
      await loadBatchDays(cid, firstModId, validityDays);

      // 5. Fetch Real Sections / Categories for Course
      try {
        const sectionsRes = await courseService.getSectionsByCourse(cid);
        let secList: any[] = [];
        if (Array.isArray(sectionsRes)) {
          secList = Array.isArray(sectionsRes[0]) ? sectionsRes[0] : sectionsRes;
        }

        const validSections = secList
          .filter((s: any) => s.Delete_Status !== 1 && s.Section_Name && s.Section_Name.trim() !== '')
          .map((s: any) => ({
            sectionId: s.Section_ID || s.sectionId || 1,
            sectionName: s.Section_Name || s.sectionName || 'Videos',
            examTypeId: s.ExamType_ID,
          }));

        if (validSections.length > 0) {
          setSections(validSections);
        } else {
          setSections([
            { sectionId: 1, sectionName: 'Videos' },
            { sectionId: 2, sectionName: 'Study Materials' },
          ]);
        }
      } catch (e) {
        setSections([
          { sectionId: 1, sectionName: 'Videos' },
          { sectionId: 2, sectionName: 'Study Materials' },
        ]);
      }
    } catch (err) {
      console.error('Error loading course details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBatchDays = async (cid: number, modId: string, validityDays: number = 30) => {
    try {
      const daysRes = await courseService.getBatchWithDays(cid, modId);
      let dayList: any[] = [];
      if (Array.isArray(daysRes)) {
        dayList = Array.isArray(daysRes[0]) ? daysRes[0] : daysRes;
      }

      if (dayList.length > 0) {
        setBatchDays(
          dayList.map((d: any, idx: number) => ({
            Days_Id: d.Days_Id || d.daysId || idx + 1,
            Day_Name: d.Day_Name || d.dayName || `Day ${idx + 1}`,
            is_day_unlocked: d.is_day_unlocked !== undefined ? d.is_day_unlocked : 1,
            is_exam_day: d.is_exam_day !== undefined ? d.is_exam_day : 0,
            isToday: d.isToday || 0,
          }))
        );
      } else {
        generateDefaultDays(validityDays);
      }
    } catch (e) {
      generateDefaultDays(validityDays);
    }
  };

  const generateDefaultDays = (count: number = 30) => {
    const days: BatchDay[] = Array.from({ length: count || 30 }, (_, i) => ({
      Days_Id: i + 1,
      Day_Name: `Day ${i + 1}`,
      is_day_unlocked: 1,
      is_exam_day: (i + 1) % 7 === 0 ? 1 : 0,
      isToday: i === 0 ? 1 : 0,
    }));
    setBatchDays(days);
  };

  // Load Real Content for Day & Section
  const loadDayContent = async (dayId: number | string, sectionId: number | string = '0') => {
    setIsContentLoading(true);
    setActiveContentIndex(0);
    setAttendanceMarked(false);
    setWatchedSeconds(new Set());

    try {
      const res = await courseService.getCourseContentByDay({
        courseId: courseId || '1',
        moduleId: selectedModuleId,
        sectionId: String(sectionId),
        dayId: String(dayId),
        isLibrary: false,
      });

      let items: ContentItem[] = [];
      if (res && Array.isArray(res.contents)) {
        items = res.contents;
      } else if (res && typeof res.contents === 'string') {
        try {
          items = JSON.parse(res.contents);
        } catch (err) {}
      } else if (res && Array.isArray(res)) {
        items = res;
      }

      setDayContents(items);
    } catch (e) {
      console.error('Error fetching course content by day:', e);
      setDayContents([]);
    } finally {
      setIsContentLoading(false);
    }
  };

  // Video Time Tracking & Real Attendance Submission
  const handleVideoTimeUpdate = async () => {
    if (!videoRef.current || dayContents.length === 0) return;
    const currentSecond = Math.floor(videoRef.current.currentTime);
    const totalDuration = Math.floor(videoRef.current.duration) || 1;

    setWatchedSeconds((prev) => {
      const next = new Set(prev);
      next.add(currentSecond);
      return next;
    });

    // Check attendance threshold (at least 5 seconds or 80% watched)
    if (!attendanceMarked && (watchedSeconds.size >= 5 || watchedSeconds.size / totalDuration >= 0.8)) {
      setAttendanceMarked(true);
      const activeContent = dayContents[activeContentIndex];
      try {
        await courseService.saveVideoAttendance({
          Student_ID: user?.Student_ID || user?.Id || 1,
          Course_ID: Number(courseId || 1),
          Content_ID: activeContent?.Content_ID || 1,
          Watch_Seconds: watchedSeconds.size,
          Total_Seconds: totalDuration,
          Completed: 1,
        });
        showToast('Attendance marked ✓');
      } catch (err) {
        console.warn('Attendance save warning:', err);
      }
    }
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const newSpeed = speeds[nextIdx];
    setPlaybackSpeed(newSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed;
    }
  };

  const skipVideoTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + seconds);
    }
  };

  // Load Real Exams Tab
  const loadCourseExams = async () => {
    setIsExamsLoading(true);
    try {
      const res = await examService.getStudentExamsByCourse(Number(courseId || 1));
      let examArr: any[] = [];
      if (Array.isArray(res)) {
        examArr = Array.isArray(res[0]) ? res[0] : res;
      }
      setCourseExams(examArr);
    } catch (e) {
      console.error('Error loading course exams:', e);
      setCourseExams([]);
    } finally {
      setIsExamsLoading(false);
    }
  };

  // Load Real Results Tab
  const loadStudentResults = async () => {
    setIsResultsLoading(true);
    try {
      const sId = user?.Student_ID || user?.Id || 1;
      const res = await examService.getStudentExamResults(Number(sId));
      let resArr: any[] = [];
      if (Array.isArray(res)) {
        resArr = Array.isArray(res[0]) ? res[0] : res;
      }
      setStudentResults(resArr);
    } catch (e) {
      console.error('Error loading student results:', e);
      setStudentResults([]);
    } finally {
      setIsResultsLoading(false);
    }
  };

  const handleTabClick = (tab: 'modules' | 'exams' | 'results') => {
    setActiveTab(tab);
    if (tab === 'exams' && courseExams.length === 0) {
      loadCourseExams();
    } else if (tab === 'results' && studentResults.length === 0) {
      loadStudentResults();
    }
  };

  const handleDayTap = (day: BatchDay) => {
    if (day.is_day_unlocked === 0 && !isEnrolled) {
      showToast('Please purchase the course to see full contents.');
      return;
    }
    setSelectedDay(day);
    setActiveView('categories');
  };

  const handleCategoryTap = (sec: Section) => {
    setSelectedSection(sec);
    setActiveView('content');
    if (selectedDay) {
      loadDayContent(selectedDay.Days_Id, sec.sectionId);
    }
  };

  const handleEnrollClick = async () => {
    try {
      const slots = await courseService.getCourseTimeSlots(courseId || 1);
      let slotList: any[] = [];
      if (Array.isArray(slots)) {
        slotList = Array.isArray(slots[0]) ? slots[0] : slots;
      }
      if (slotList.length > 0) {
        setTimeSlots(slotList);
        setSelectedSlotId(slotList[0].Time_Slot_ID || slotList[0].slotId || 1);
      } else {
        setTimeSlots([
          { Time_Slot_ID: 1, Slot_Name: 'Regular Live Batch (10:00 AM - 11:30 AM)' },
        ]);
      }
    } catch (e) {
      // fallback
    }
    setGuidanceModalOpen(true);
  };

  const handleConfirmAddToCart = () => {
    addToCart({
      Course_ID: Number(courseId || 1),
      Course_Name: courseInfo?.Course_Name || courseInfo?.courseName || 'Course Program',
      Amount: Number(courseInfo?.Price || courseInfo?.price) || 0,
      Duration: `${courseInfo?.Validity || 30} Days`,
      Image_Url: courseInfo?.Thumbnail_Path || courseInfo?.thumbnailPath,
    });
    setGuidanceModalOpen(false);
    navigate('/cart');
  };

  const activeContent = dayContents[activeContentIndex] || null;
  const activeExam = activeContent?.exams && activeContent.exams.length > 0 ? activeContent.exams[0] : null;

  const getSectionIcon = (secName: string) => {
    const s = secName.toLowerCase();
    if (s.includes('video')) return <Video className="w-6 h-6 text-[#1863D3]" />;
    if (s.includes('study') || s.includes('doc') || s.includes('material') || s.includes('pdf'))
      return <BookOpen className="w-6 h-6 text-[#E65100]" />;
    if (s.includes('listen')) return <Headphones className="w-6 h-6 text-[#7B1FA2]" />;
    if (s.includes('read')) return <FileText className="w-6 h-6 text-[#1863D3]" />;
    if (s.includes('write')) return <FileText className="w-6 h-6 text-[#2E7D32]" />;
    if (s.includes('speak')) return <Volume2 className="w-6 h-6 text-[#D81B60]" />;
    return <CheckSquare className="w-6 h-6 text-[#1863D3]" />;
  };

  const courseTitle = courseInfo?.Course_Name || courseInfo?.courseName || `Course #${courseId || 1}`;
  const courseDescription = courseInfo?.Description || courseInfo?.description || '';
  const coursePrice = courseInfo?.Price || courseInfo?.price || '0.00';
  const courseThumbnail = getMediaUrl(courseInfo?.Thumbnail_Path || courseInfo?.thumbnailPath);

  return (
    <div className="font-sans max-w-4xl mx-auto pb-24 text-[#000000]">
      {/* ------------------------------------------------------------- */}
      {/* Toast Notification Banner */}
      {/* ------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 bg-[#1863D3] text-white px-5 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP APP BAR (Matching Flutter PreferredSize height: 75) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white px-4 py-4 mb-3 rounded-2xl border border-[#E3E7EE] shadow-2xs flex items-center space-x-3">
        <button
          type="button"
          onClick={() => {
            if (activeView === 'content') {
              setActiveView('categories');
            } else if (activeView === 'categories') {
              setActiveView('days');
            } else {
              navigate(-1);
            }
          }}
          className="w-[35px] h-[35px] rounded-full bg-[#E5F0FF] flex items-center justify-center text-black/80 hover:bg-[#d8e8ff] transition-all cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-[#111822]" />
        </button>
        <h1 className="text-[16px] font-medium text-[#000000] tracking-tight">
          {activeView === 'content'
            ? activeContent?.contentName || `${selectedDay?.Day_Name} - ${selectedSection?.sectionName}`
            : activeView === 'categories'
            ? `${selectedDay?.Day_Name} Categories`
            : 'Course details'}
        </h1>
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-gray-500">
          <div className="w-8 h-8 border-3 border-[#1863D3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold">Loading course details...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ------------------------------------------------------------- */}
          {/* 2. COURSE THUMBNAIL BANNER (Height: 180, Rounded: 12) */}
          {/* ------------------------------------------------------------- */}
          <div className="h-[180px] w-full rounded-[12px] bg-gradient-to-br from-[#1C2348] via-[#184894] to-[#2B83D5] overflow-hidden relative shadow-xs text-white p-6 flex flex-col justify-between">
            {courseThumbnail ? (
              <img
                src={courseThumbnail}
                alt={courseTitle}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : null}

            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />

            <div className="relative z-10 flex justify-between items-start">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs">
                {courseInfo?.Validity || 30} Days Plan
              </span>
              {coursePrice === '0.00' || coursePrice === '0' ? (
                <span className="bg-emerald-500/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs">
                  Free Access
                </span>
              ) : (
                <span className="bg-[#1863D3]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs">
                  ₹{coursePrice}
                </span>
              )}
            </div>

            <div className="relative z-10">
              <h2 className="text-[20px] font-bold text-white leading-snug drop-shadow-md">
                {courseTitle}
              </h2>
              {courseDescription && (
                <p className="text-xs text-white/90 mt-1 line-clamp-2 leading-relaxed font-normal drop-shadow-xs">
                  {courseDescription}
                </p>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* 3. TAB BAR NAVIGATION (Modules | Exams | Results) */}
          {/* ------------------------------------------------------------- */}
          <div className="border-b border-[#E0E0E0] flex items-center justify-around pt-2">
            <button
              type="button"
              onClick={() => handleTabClick('modules')}
              className={`flex-1 text-center py-2.5 text-[14px] font-bold transition-all relative cursor-pointer ${
                activeTab === 'modules' ? 'text-[#000000]' : 'text-[#9E9E9E]'
              }`}
            >
              Modules
              {activeTab === 'modules' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2B83D5] rounded-t-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleTabClick('exams')}
              className={`flex-1 text-center py-2.5 text-[14px] font-bold transition-all relative cursor-pointer ${
                activeTab === 'exams' ? 'text-[#000000]' : 'text-[#9E9E9E]'
              }`}
            >
              Exams
              {activeTab === 'exams' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2B83D5] rounded-t-full" />
              )}
            </button>

            {isEnrolled && (
              <button
                type="button"
                onClick={() => handleTabClick('results')}
                className={`flex-1 text-center py-2.5 text-[14px] font-bold transition-all relative cursor-pointer ${
                  activeTab === 'results' ? 'text-[#000000]' : 'text-[#9E9E9E]'
                }`}
              >
                Results
                {activeTab === 'results' && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#2B83D5] rounded-t-full" />
                )}
              </button>
            )}
          </div>

          {/* ============================================================= */}
          {/* TAB 1: MODULES VIEW */}
          {/* ============================================================= */}
          {activeTab === 'modules' && (
            <div className="space-y-4 pt-1">
              {/* SUB-VIEW 1: DAYS GRID (GridViewDayWidget) */}
              {activeView === 'days' && (
                <div className="bg-[#F5F7FA] p-3 sm:p-4 rounded-2xl border border-[#E3E7EE]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-bold text-[#616161]">
                      {batchDays.length} Days Structured Curriculum
                    </span>
                    <span className="text-[11px] text-[#1863D3] font-semibold bg-[#E5F0FF] px-2.5 py-0.5 rounded-full">
                      {batchDays.length} Days Available
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                    {batchDays.map((day) => {
                      const isUnlocked = day.is_day_unlocked !== 0 || isEnrolled;
                      const parts = day.Day_Name.split(' ');
                      const dayLabel = parts[0] || 'Day';
                      const dayNumber = (parts[1] || String(day.Days_Id)).padStart(2, '0');

                      return (
                        <div
                          key={day.Days_Id}
                          onClick={() => handleDayTap(day)}
                          className="h-[85px] bg-white rounded-[8px] border border-[#E0E0E0] relative flex flex-col justify-between overflow-hidden shadow-2xs hover:border-[#1863D3] transition-all cursor-pointer"
                        >
                          {/* Top-Left Tag (Class vs Test) */}
                          <div
                            className={`h-[22px] w-[55px] rounded-tl-[8px] rounded-br-[8px] flex items-center justify-center font-bold text-[10px] sm:text-[11px] ${
                              day.is_exam_day === 1
                                ? 'bg-[#EAF7E6] text-[#509144]'
                                : 'bg-[#E5F0FF] text-[#1863D3] font-medium'
                            }`}
                          >
                            {day.is_exam_day === 1 ? 'Test' : 'Class'}
                          </div>

                          {/* Center Rich Text (Day XX) */}
                          <div className="text-center pb-2">
                            <span className="block text-[11px] text-[#9E9E9E] font-medium leading-none">
                              {dayLabel}
                            </span>
                            <span className="block text-[17px] text-[#616161] font-bold mt-0.5">
                              {dayNumber}
                            </span>
                          </div>

                          {/* Locked Overlay */}
                          {!isUnlocked && (
                            <div className="absolute inset-0 bg-[#BDBDBD]/70 backdrop-blur-[0.5px] rounded-[8px] flex items-center justify-center">
                              <Lock className="w-5 h-5 text-gray-700 opacity-90" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 2: CATEGORY / SKILLS PICKER (GridviewCategoryWidget) */}
              {activeView === 'categories' && selectedDay && (
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#000000]">
                        {selectedDay.Day_Name} Learning Categories
                      </h3>
                      <p className="text-xs text-[#757575] mt-0.5">
                        Select a category to view lesson videos & materials
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveView('days')}
                      className="px-3 py-1 bg-[#F5F7FA] hover:bg-[#E5F0FF] text-[#1863D3] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Back to Days
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {sections.map((sec) => (
                      <div
                        key={sec.sectionId}
                        onClick={() => handleCategoryTap(sec)}
                        className="h-[85px] bg-white rounded-[8px] border border-[#E0E0E0] p-3 flex flex-col justify-between hover:border-[#2B83D5] hover:shadow-xs transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="p-1.5 bg-[#F5F7FA] rounded-lg group-hover:bg-[#E5F0FF] transition-colors">
                            {getSectionIcon(sec.sectionName)}
                          </div>
                          {!isEnrolled && (
                            <Lock className="w-4 h-4 text-gray-400 opacity-60" />
                          )}
                        </div>
                        <span className="text-[14px] font-bold text-[#616161] truncate">
                          {sec.sectionName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUB-VIEW 3: CONTENT DETAILS SCREEN (CourseDetailsPage1Screen) */}
              {activeView === 'content' && (
                <div className="space-y-4">
                  {/* Top Breadcrumbs / Back Bar */}
                  <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-[#E3E7EE]">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#1863D3] bg-[#E5F0FF] px-2.5 py-1 rounded-full">
                        {selectedDay?.Day_Name}
                      </span>
                      <span className="text-xs text-[#757575] font-semibold">
                        / {selectedSection?.sectionName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView('categories')}
                      className="text-xs text-[#1863D3] font-bold hover:underline cursor-pointer"
                    >
                      Change Category
                    </button>
                  </div>

                  {isContentLoading ? (
                    <div className="py-16 text-center text-gray-500">
                      <div className="w-8 h-8 border-3 border-[#1863D3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs font-semibold">Loading lesson materials...</p>
                    </div>
                  ) : dayContents.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-[#E3E7EE] text-center text-[#757575] space-y-2">
                      <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                      <p className="text-sm font-bold text-[#283B52]">
                        No Documents Found In This Course Section
                      </p>
                      <p className="text-xs text-[#757575]">
                        Materials for this day and category will be updated by your faculty.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Top Media Player Container */}
                      <div className="bg-white rounded-2xl border border-[#E3E7EE] overflow-hidden shadow-xs">
                        {activeContent?.file_type === 'video/mp4' || (activeContent?.file && activeContent.file.endsWith('.mp4')) ? (
                          <div className="relative bg-black w-full h-[240px] sm:h-[340px] flex items-center justify-center">
                            <video
                              key={getMediaUrl(activeContent.file)}
                              ref={videoRef}
                              src={getMediaUrl(activeContent.file)}
                              controls
                              playsInline
                              onTimeUpdate={handleVideoTimeUpdate}
                              className="w-full h-full object-contain"
                            />
                            {/* Fast Control Overlay Buttons */}
                            <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
                              <button
                                type="button"
                                onClick={() => skipVideoTime(-10)}
                                className="bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full backdrop-blur-xs transition-all cursor-pointer"
                                title="Rewind 10s"
                              >
                                <Rewind className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => skipVideoTime(10)}
                                className="bg-black/70 hover:bg-black/90 text-white p-1.5 rounded-full backdrop-blur-xs transition-all cursor-pointer"
                                title="Forward 10s"
                              >
                                <FastForward className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={cyclePlaybackSpeed}
                                className="bg-black/70 hover:bg-black/90 text-white px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-xs flex items-center space-x-1 transition-all cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{playbackSpeed}x</span>
                              </button>
                            </div>
                          </div>
                        ) : activeContent?.file_type === 'image/jpeg' || activeContent?.file_type === 'image/png' ? (
                          <div className="h-[220px] sm:h-[300px] w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={getMediaUrl(activeContent.file)}
                              alt={activeContent.contentName}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          /* PDF / Test Hero Preview with Action Button */
                          <div className="h-[200px] w-full bg-gradient-to-br from-[#1C2348] via-[#243572] to-[#1863D3] rounded-t-2xl flex flex-col items-center justify-center relative p-6 text-white space-y-3">
                            <FileText className="w-10 h-10 text-white/90" />
                            <h4 className="text-base font-bold text-center drop-shadow-xs max-w-md line-clamp-1">
                              {activeContent?.contentName || 'Lesson Document & Assessment'}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                const docUrl = getMediaUrl(activeExam?.Supporting_Document_Path || activeContent?.file || '');
                                const audUrl = getMediaUrl(activeExam?.Main_Question || '');
                                const ansKey = getMediaUrl(activeExam?.Answer_Key_Path || '');
                                setPdfUrl(docUrl);
                                setPdfAudioUrl(audUrl);
                                setAnswerKeyUrl(ansKey);
                                setPdfTitle(activeContent?.contentName || 'Document Viewer');
                                setShowAnswerKey(false);
                                setPdfModalOpen(true);
                              }}
                              className="px-8 py-3 bg-white hover:bg-gray-100 text-black text-[14px] font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                            >
                              {activeContent?.Is_Exam_Test === 1 ? 'Start Your Test' : 'Open Document'}
                            </button>
                          </div>
                        )}

                        {/* Active Lesson Title & Info */}
                        <div className="p-4 sm:p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <h3 className="text-[17px] font-bold text-[#000000] leading-snug">
                                {activeContent?.contentName}
                              </h3>
                              {activeContent?.file_name && (
                                <p className="text-xs text-[#757575] mt-0.5">
                                  File: {activeContent.file_name}
                                </p>
                              )}
                            </div>

                            {activeContent?.External_Link && (
                              <button
                                type="button"
                                onClick={() => window.open(activeContent.External_Link, '_blank')}
                                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#1863D3] hover:bg-[#1554B8] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Resource Link</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Curriculum Content List (CourseCurriculamWidget) */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-2xs space-y-3">
                        <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-3">
                          <h4 className="text-[15px] font-bold text-[#000000]">
                            Lesson Resources ({dayContents.length})
                          </h4>
                          <span className="text-xs text-[#757575]">Click to play or view</span>
                        </div>

                        <div className="space-y-2.5">
                          {dayContents.map((item, idx) => {
                            const isSelected = activeContentIndex === idx;
                            const isVideo = item.file_type === 'video/mp4' || item.file?.endsWith('.mp4');
                            const isPdf = item.file_type === 'application/pdf' || item.file?.endsWith('.pdf') || item.exams?.length;
                            const isAudio = item.file_type === 'audio/mpeg' || item.file?.endsWith('.mp3');

                            return (
                              <div
                                key={item.Content_ID || idx}
                                onClick={() => {
                                  setActiveContentIndex(idx);
                                  setAttendanceMarked(false);
                                  setWatchedSeconds(new Set());
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                                  isSelected
                                    ? 'border-[#2B83D5] bg-[#E5F0FF]/30 shadow-xs'
                                    : 'border-[#E0E0E0] bg-white hover:border-[#BDBDBD]'
                                }`}
                              >
                                <div className="flex items-center space-x-3 min-w-0 pr-3">
                                  {/* Left Icon in 44x44 Box */}
                                  <div
                                    className={`w-[44px] h-[44px] rounded-[7px] flex items-center justify-center shrink-0 ${
                                      isSelected ? 'bg-[#90CAF9]' : 'bg-[#EEEEEE]'
                                    }`}
                                  >
                                    {isVideo ? (
                                      <Play className="w-5 h-5 text-[#1863D3] fill-current" />
                                    ) : isPdf ? (
                                      <FileText className="w-5 h-5 text-[#E65100]" />
                                    ) : isAudio ? (
                                      <Headphones className="w-5 h-5 text-[#7B1FA2]" />
                                    ) : (
                                      <CheckSquare className="w-5 h-5 text-[#2E7D32]" />
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h5 className="text-[14px] font-medium text-[#000000] truncate">
                                        {item.contentName}
                                      </h5>
                                      {item.External_Link && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(item.External_Link, '_blank');
                                          }}
                                          className="px-2 py-0.5 bg-[#1863D3] hover:bg-[#1554B8] text-white text-[11px] font-bold rounded-md transition-colors cursor-pointer"
                                        >
                                          Link
                                        </button>
                                      )}
                                    </div>

                                    {/* File Type Badge Pill */}
                                    <div className="mt-1">
                                      <span className="inline-block px-2 py-0.5 bg-[#EEEEEE] rounded-[5px] text-[11px] font-medium text-[#616161]">
                                        {item.file_type || (item.exams?.length ? 'Exam Assessment' : 'Study Resource')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: EXAMS VIEW (ExamsHomeScreen) */}
          {/* ============================================================= */}
          {activeTab === 'exams' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[15px] font-bold text-[#000000]">Course Mock Exams & Assessments</h3>
                <span className="text-xs font-semibold text-[#1863D3] bg-[#E5F0FF] px-2.5 py-0.5 rounded-full">
                  {courseExams.length} Exams
                </span>
              </div>

              {isExamsLoading ? (
                <div className="py-16 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-[#1863D3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading exams...</p>
                </div>
              ) : courseExams.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#E3E7EE] text-center text-[#757575]">
                  <p className="text-sm font-semibold">No exams found for this course.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {courseExams.map((exam) => (
                    <div
                      key={exam.courseExamId || exam.Exam_ID || exam.Course_Exam_ID}
                      className="bg-white p-4 rounded-xl border border-[#E0E0E0] flex items-center justify-between hover:border-[#1863D3] transition-all shadow-2xs"
                    >
                      <div className="flex items-center space-x-3.5 min-w-0 pr-3">
                        <div className="w-11 h-11 rounded-xl bg-[#E5F0FF] text-[#1863D3] flex items-center justify-center shrink-0">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-[#000000] truncate">
                            {exam.examName || exam.Exam_Name || `Course Exam #${exam.courseExamId || exam.Course_Exam_ID}`}
                          </h4>
                          <p className="text-xs text-[#757575] mt-0.5">
                            Duration: {exam.duration || exam.Duration || 30} mins | Qs: {exam.questions || exam.Total_Questions || 15} | Pass: {exam.passingScore || exam.Passing_Score || 70}%
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/exams/${exam.courseExamId || exam.Exam_ID || exam.Course_Exam_ID || 1}/run`)}
                        className="px-4 py-2 bg-[#1863D3] hover:bg-[#1554B8] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
                      >
                        Start Exam
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* TAB 3: RESULTS VIEW (ResultViewingScreen) */}
          {/* ============================================================= */}
          {activeTab === 'results' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[15px] font-bold text-[#000000]">Completed Exam Scores & Badges</h3>
                <span className="text-xs font-semibold text-[#2E7D32] bg-[#EAF7E6] px-2.5 py-0.5 rounded-full">
                  {studentResults.length} Submissions
                </span>
              </div>

              {isResultsLoading ? (
                <div className="py-16 text-center text-gray-500">
                  <div className="w-8 h-8 border-3 border-[#1863D3] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading student results...</p>
                </div>
              ) : studentResults.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-[#E3E7EE] text-center text-[#757575]">
                  <p className="text-sm font-semibold">No results to show.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {studentResults.map((res, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-[8px] border border-[#E0E0E0] shadow-2xs overflow-hidden"
                    >
                      {/* Card Header Tags */}
                      <div className="flex items-center justify-between px-3 pt-2">
                        <div className="bg-[#EAF7E6] text-[#2E7D32] text-xs font-medium px-2.5 py-0.5 rounded-br-[8px]">
                          {res.contentName || res.Exam_Name || 'Course Assessment'}
                        </div>
                        <div className="bg-[#E5F0FF] text-[#1863D3] text-xs font-medium px-2.5 py-0.5 rounded-bl-[8px] flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{res.resultDate || res.Exam_Date || 'Recent'}</span>
                        </div>
                      </div>

                      {/* Card Body Scores Grid */}
                      <div className="h-[60px] px-4 flex items-center justify-between text-center">
                        <div className="w-8">
                          <span className="block text-[11px] text-[#757575] font-medium">R</span>
                          <span className="block text-[14px] text-[#616161] font-bold">{res.reading ?? '-'}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[#E0E0E0]" />
                        <div className="w-8">
                          <span className="block text-[11px] text-[#757575] font-medium">W</span>
                          <span className="block text-[14px] text-[#616161] font-bold">{res.writing ?? '-'}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[#E0E0E0]" />
                        <div className="w-8">
                          <span className="block text-[11px] text-[#757575] font-medium">L</span>
                          <span className="block text-[14px] text-[#616161] font-bold">{res.listening ?? '-'}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[#E0E0E0]" />
                        <div className="w-8">
                          <span className="block text-[11px] text-[#757575] font-medium">S</span>
                          <span className="block text-[14px] text-[#616161] font-bold">{res.speaking ?? '-'}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[#E0E0E0]" />
                        <div className="w-8">
                          <span className="block text-[11px] text-[#757575] font-medium">O</span>
                          <span className="block text-[14px] text-[#616161] font-bold">{res.overallScore || res.Marks_Obtained || '-'}</span>
                        </div>
                        <div className="w-[1px] h-6 bg-[#E0E0E0]" />
                        <div className="w-20 bg-[#F5F7FA] py-1 px-2 rounded-md">
                          <span className="block text-[10px] text-[#757575] font-medium">CEFR Level</span>
                          <span className="block text-[12px] text-[#1863D3] font-bold">{res.cefrLevel || 'B2'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM TOTAL PRICE & ENROLL BAR (If NOT enrolled) */}
      {/* ------------------------------------------------------------- */}
      {!isEnrolled && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#E0E0E0] p-3 px-6 z-30 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <span className="block text-[12px] text-[#757575] font-medium">Total Price</span>
              <span className="text-[18px] font-bold text-[#000000]">
                {coursePrice === '0.00' || coursePrice === '0'
                  ? 'Free'
                  : `₹${coursePrice}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleEnrollClick}
              className="w-[169px] h-[44px] bg-[#1863D3] hover:bg-[#1554B8] text-white text-[14px] font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center"
            >
              Enroll Now
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. PDF VIEWER & AUDIO PRACTICE MODAL (PdfViewerPage) */}
      {/* ------------------------------------------------------------- */}
      {pdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white w-full max-w-3xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#F5F7FA] px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 pr-3">
                <FileText className="w-5 h-5 text-[#1863D3] shrink-0" />
                <h3 className="text-sm font-bold text-[#000000] truncate">{pdfTitle}</h3>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {answerKeyUrl && (
                  <button
                    type="button"
                    onClick={() => setShowAnswerKey(!showAnswerKey)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-colors flex items-center space-x-1 cursor-pointer ${
                      showAnswerKey
                        ? 'bg-[#2E7D32] text-white border-[#2E7D32]'
                        : 'bg-white text-[#2E7D32] border-[#2E7D32] hover:bg-[#EAF7E6]'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{showAnswerKey ? 'Show Question' : 'Answer Key'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.open(showAnswerKey ? answerKeyUrl : pdfUrl, '_blank')}
                  className="p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                  title="Download Document"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setPdfModalOpen(false)}
                  className="p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 text-gray-700 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Audio Track Bar (If attached) */}
            {pdfAudioUrl && (
              <div className="bg-[#E5F0FF] px-4 py-2.5 border-b border-[#BCE0FD] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Volume2 className="w-4 h-4 text-[#1863D3]" />
                  <span className="text-xs font-bold text-[#1863D3]">Listening Audio Material</span>
                </div>
                <audio src={pdfAudioUrl} controls className="h-8 max-w-[260px] sm:max-w-xs" />
              </div>
            )}

            {/* PDF Viewer Body */}
            <div className="flex-1 bg-gray-100 p-2 overflow-hidden relative">
              <iframe
                src={showAnswerKey ? answerKeyUrl : pdfUrl}
                title="Lesson PDF Viewer"
                className="w-full h-full rounded-lg border border-gray-300 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. ENROLLMENT GUIDANCE MODAL (BottomSheetGuidanceWidget) */}
      {/* ------------------------------------------------------------- */}
      {guidanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#000000]">Enroll in Course</h3>
              <button
                type="button"
                onClick={() => setGuidanceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-[#1863D3]">
                {courseTitle}
              </h4>
              <p className="text-xs text-[#757575] leading-relaxed">
                Unlock full curriculum modules, video lectures, audio recordings, PDF worksheets, and practice exams.
              </p>
            </div>

            {/* Batch Time Slot Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#616161]">Select Preferred Live Batch</label>
              <div className="space-y-2">
                {timeSlots.map((slot) => (
                  <label
                    key={slot.Time_Slot_ID || slot.slotId}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      selectedSlotId === (slot.Time_Slot_ID || slot.slotId)
                        ? 'border-[#1863D3] bg-[#E5F0FF]/30 font-bold'
                        : 'border-[#E0E0E0] hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xs text-[#000000]">
                      {slot.Slot_Name || slot.slotName || 'Regular Batch'}
                    </span>
                    <input
                      type="radio"
                      name="timeslot"
                      checked={selectedSlotId === (slot.Time_Slot_ID || slot.slotId)}
                      onChange={() => setSelectedSlotId(slot.Time_Slot_ID || slot.slotId)}
                      className="text-[#1863D3] focus:ring-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-[#F5F7FA] p-3.5 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-[#757575]">Program Fee</span>
              <span className="text-base font-bold text-[#1863D3]">
                {coursePrice === '0.00' || coursePrice === '0' ? 'Free' : `₹${coursePrice}`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleConfirmAddToCart}
              className="w-full py-3 bg-[#1863D3] hover:bg-[#1554B8] text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
