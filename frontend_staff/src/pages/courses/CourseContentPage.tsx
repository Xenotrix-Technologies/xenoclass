import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentService } from '../../services/contentService';
import { teacherService } from '../../services/teacherService';
import { useStaffAuth } from '../../context/StaffAuthContext';
import {
  ChevronLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FileText,
  Headphones,
  CheckSquare,
  ExternalLink,
  Clock,
  Radio,
  Calendar,
  Layers,
  Video as VideoIcon,
  BookOpen,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Unlock,
  Lock,
  Search,
  ArrowRight,
  RefreshCw,
  UserCheck,
  BarChart3,
  Filter,
  Check,
  X,
} from 'lucide-react';

const R2_PUBLIC_URL = 'https://pub-11714a99f3bd420ca95f23dda2af714b.r2.dev/';

interface BatchDay {
  Days_Id: number;
  Day_Name: string;
  is_day_unlocked?: number;
  is_exam_day?: number;
  isToday?: number;
}

interface Section {
  Section_ID: number;
  Section_Name: string;
  Delete_Status?: number;
}

interface ExamItem {
  Exam_ID?: number;
  examId?: number;
  examName?: string;
  Supporting_Document_Path?: string;
  supportingDocumentPath?: string;
  Supporting_Document_Name?: string;
  Main_Question?: string;
  mainQuestion?: string;
  Answer_Key_Path?: string;
  answerKeyPath?: string;
  Answer_Key_Name?: string;
  Is_Question_Unlocked?: number;
  Is_Question_Media_Unlocked?: number;
  Is_Answer_Unlocked?: number;
  isAnswerUnlocked?: number;
  file_type?: string;
  fileType?: string;
}

interface ContentItem {
  Content_ID: number;
  contentId?: number;
  contentName: string;
  file?: string;
  file_name?: string;
  file_type?: string;
  fileType?: string;
  contentThumbnail_Path?: string;
  contentThumbnailPath?: string;
  contentThumbnail_name?: string;
  Is_Exam_Test?: number;
  isExamTest?: number;
  External_Link?: string;
  externalLink?: string;
  exams?: ExamItem[];
}

export const CourseContentPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useStaffAuth();

  // Navigation views matching Flutter Staff App
  // 'days' (CourseCategoryDetailsScreen) | 'categories' (DayCategoryScreen) | 'content' (CourseDetailsPage1Screen) | 'attendance' (CourseAttendanceReportView)
  const [activeView, setActiveView] = useState<'days' | 'categories' | 'content' | 'attendance'>('days');
  const [activeTab, setActiveTab] = useState<'modules' | 'attendance'>('modules');

  // Core Data
  const [courseInfo, setCourseInfo] = useState<any>(null);
  const [batchDays, setBatchDays] = useState<BatchDay[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dayLessons, setDayLessons] = useState<ContentItem[]>([]);

  // Selection states
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedDayName, setSelectedDayName] = useState<string>('Day 1');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [activeContentIndex, setActiveContentIndex] = useState<number>(0);

  // Loading & feedback states
  const [loadingCourse, setLoadingCourse] = useState<boolean>(true);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [unlockingState, setUnlockingState] = useState<{ [key: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Video Player Controls State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);

  // Modal PDF & Audio Assessment Viewer State matching PdfViewerPage & AnswerKeyPage
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState<string>('');
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [previewAnswerKeyUrl, setPreviewAnswerKeyUrl] = useState<string | null>(null);
  const [isShowingAnswerKey, setIsShowingAnswerKey] = useState<boolean>(false);

  // Student Attendance Report State matching CourseAttendanceReportView
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // 'YYYY-MM'
  );
  const [attendanceRows, setAttendanceRows] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getMediaUrl = (path?: string) => {
    if (!path || path === 'null' || path === 'undefined' || path.trim() === '') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = R2_PUBLIC_URL.replace(/\/+$/, '');
    const cleanPath = path.replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  };

  // 1. Initial Load: Fetch Course Info, Batch Days, Sections, Enrolled Students
  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  const loadCourseDetails = async () => {
    const cid = Number(courseId || 1);
    try {
      setLoadingCourse(true);

      // Fetch Course Info
      const infoRes = await contentService.getCourseInfo(cid);
      let courseObj: any = null;
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

      // Fetch Batch Days
      try {
        const daysRes = await contentService.getBatchWithDays(cid, 0);
        let dList: any[] = [];
        if (Array.isArray(daysRes)) {
          dList = Array.isArray(daysRes[0]) ? daysRes[0] : daysRes;
        }
        if (dList && dList.length > 0) {
          setBatchDays(dList);
        } else {
          const totalDays = Number(courseObj?.Validity || courseObj?.validity || 30);
          setBatchDays(
            Array.from({ length: totalDays }, (_, i) => ({
              Days_Id: i + 1,
              Day_Name: `Day ${i + 1}`,
              is_exam_day: 0,
            }))
          );
        }
      } catch (err) {
        const totalDays = Number(courseObj?.Validity || courseObj?.validity || 30);
        setBatchDays(
          Array.from({ length: totalDays }, (_, i) => ({
            Days_Id: i + 1,
            Day_Name: `Day ${i + 1}`,
            is_exam_day: 0,
          }))
        );
      }

      // Fetch Sections
      try {
        const secRes = await contentService.getSectionsByCourse(cid);
        let sList: any[] = [];
        if (Array.isArray(secRes)) {
          sList = Array.isArray(secRes[0]) ? secRes[0] : secRes;
        }
        const valid = sList.filter(
          (s: any) => s.Delete_Status !== 1 && s.Section_Name && s.Section_Name.trim().length > 0
        );
        setSections(valid);
        if (valid.length > 0) {
          setSelectedSection(valid[0]);
        } else {
          setSelectedSection(null);
        }
      } catch (err) {
        setSections([]);
        setSelectedSection(null);
      }

      // Fetch Enrolled Students for Attendance Report
      try {
        const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
        const studentsRes = await teacherService.getFacultyBatchStudents(teacherId);
        const sList = Array.isArray(studentsRes) ? studentsRes : [];
        const courseStudents = sList.filter(
          (s: any) => String(s.Course_ID || s.courseId) === String(cid)
        );
        const finalStudents = courseStudents.length > 0 ? courseStudents : sList;
        setEnrolledStudents(finalStudents);
        if (finalStudents.length > 0) {
          setSelectedStudent(finalStudents[0]);
        }
      } catch (err) {
        console.error('Error fetching enrolled students for attendance:', err);
      }
    } catch (err) {
      console.error('Error loading course details:', err);
    } finally {
      setLoadingCourse(false);
    }
  };

  // 2. Fetch Day Lessons for a Day and Section
  const loadDayContent = async (dayNum: number, sec?: Section | null) => {
    setSelectedDay(dayNum);
    const dayObj = batchDays.find((d) => d.Days_Id === dayNum);
    setSelectedDayName(dayObj?.Day_Name || `Day ${dayNum}`);

    const targetSection = sec !== undefined ? sec : selectedSection;
    if (sec !== undefined) setSelectedSection(sec);

    setLoadingContent(true);
    setActiveContentIndex(0);
    setVideoError(false);

    const cid = Number(courseId || 1);
    try {
      const res = await contentService.getCourseContentByDay({
        courseId: cid,
        moduleId: '0',
        sectionId: String(targetSection?.Section_ID || '0'),
        dayId: String(dayNum),
        isStudent: false,
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

      setDayLessons(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Error fetching day content:', err);
      setDayLessons([]);
    } finally {
      setLoadingContent(false);
    }
  };

  // 3. Fetch Attendance Report for Selected Student
  const fetchAttendanceReport = async () => {
    if (!selectedStudent) return;
    try {
      setLoadingAttendance(true);
      const studentId = selectedStudent.Student_ID || selectedStudent.studentId || 0;
      const cid = Number(courseId || 1);
      const res = await contentService.getVideoAttendanceReport(studentId, cid);
      const rows = res?.rows || (Array.isArray(res) ? res : []);
      setAttendanceRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error('Error fetching attendance report:', err);
      setAttendanceRows([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance' || activeView === 'attendance') {
      fetchAttendanceReport();
    }
  }, [selectedStudent, selectedMonth, activeTab, activeView]);

  // Handle Day Click
  const handleDayClick = (dayNum: number, dayTitle: string) => {
    setSelectedDay(dayNum);
    setSelectedDayName(dayTitle);
    if (sections.length > 0) {
      setActiveView('categories');
    } else {
      loadDayContent(dayNum, null);
      setActiveView('content');
    }
  };

  // Handle Category Click
  const handleCategoryClick = (sec: Section) => {
    setSelectedSection(sec);
    loadDayContent(selectedDay, sec);
    setActiveView('content');
  };

  // Video player controls
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => setVideoError(true));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setDuration(videoRef.current.duration || 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = Number(e.target.value);
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const vol = Number(e.target.value);
    videoRef.current.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (!document.fullscreenElement) {
      videoRef.current.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Faculty Unlock Exam Toggle
  const handleToggleUnlock = async (
    content: ContentItem,
    exam: ExamItem,
    type: 'pdf' | 'audio' | 'answer',
    currentVal: boolean
  ) => {
    const examId = exam.Exam_ID || exam.examId || 0;
    const contentId = content.Content_ID || content.contentId || 0;
    const key = `${contentId}_${examId}_${type}`;
    setUnlockingState((prev) => ({ ...prev, [key]: true }));

    const isQuestionUnlocked = type === 'pdf' ? (!currentVal ? 1 : 0) : exam.Is_Question_Unlocked ?? 1;
    const isAudioUnlocked = type === 'audio' ? (!currentVal ? 1 : 0) : exam.Is_Question_Media_Unlocked ?? 1;
    const isAnswerUnlocked = type === 'answer' ? (!currentVal ? 1 : 0) : exam.Is_Answer_Unlocked ?? exam.isAnswerUnlocked ?? 0;

    try {
      await contentService.unlockExam({
        contentId: contentId,
        examID: examId,
        Is_Question_Unlocked: isQuestionUnlocked,
        Is_Question_Media_Unlocked: isAudioUnlocked,
        Is_Answer_Unlocked: isAnswerUnlocked,
        Batch_ID: 0,
      });

      // Update local state
      setDayLessons((prev) =>
        prev.map((item) => {
          if ((item.Content_ID === contentId || item.contentId === contentId) && item.exams) {
            return {
              ...item,
              exams: item.exams.map((ex) => {
                if ((ex.Exam_ID === examId || ex.examId === examId)) {
                  return {
                    ...ex,
                    Is_Question_Unlocked: isQuestionUnlocked,
                    Is_Question_Media_Unlocked: isAudioUnlocked,
                    Is_Answer_Unlocked: isAnswerUnlocked,
                    isAnswerUnlocked: isAnswerUnlocked,
                  };
                }
                return ex;
              }),
            };
          }
          return item;
        })
      );

      showToast(`Student access updated for ${type.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to unlock exam:', err);
      showToast('Updated local permission state');
    } finally {
      setUnlockingState((prev) => ({ ...prev, [key]: false }));
    }
  };

  // Open PDF / Assessment modal
  const handleOpenPdfAssessment = (content: ContentItem) => {
    const exam = content.exams && content.exams.length > 0 ? content.exams[0] : null;
    const pdfPath =
      exam?.Supporting_Document_Path ||
      exam?.supportingDocumentPath ||
      (content.file_type === 'application/pdf' || content.file?.endsWith('.pdf') ? content.file : '');
    const audioPath =
      exam?.Main_Question ||
      exam?.mainQuestion ||
      (content.file_type?.includes('audio') || content.file?.endsWith('.mp3') ? content.file : '');
    const answerPath = exam?.Answer_Key_Path || exam?.answerKeyPath || '';

    const finalPdfUrl = getMediaUrl(pdfPath);
    const finalAudioUrl = getMediaUrl(audioPath);
    const finalAnswerUrl = getMediaUrl(answerPath);

    if (!finalPdfUrl && !finalAudioUrl) {
      showToast('Document or audio resource is currently unavailable');
      return;
    }

    setPreviewPdfUrl(finalPdfUrl || finalAnswerUrl);
    setPreviewPdfTitle(content.contentName || exam?.examName || 'Assessment Material');
    setPreviewAudioUrl(finalAudioUrl || null);
    setPreviewAnswerKeyUrl(finalAnswerUrl || null);
    setIsShowingAnswerKey(false);
  };

  const getSectionIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('video') || lower.includes('record')) return <VideoIcon className="w-5 h-5 text-blue-600" />;
    if (lower.includes('study') || lower.includes('material') || lower.includes('write'))
      return <FileText className="w-5 h-5 text-amber-600" />;
    if (lower.includes('listen')) return <Headphones className="w-5 h-5 text-purple-600" />;
    if (lower.includes('read')) return <BookOpen className="w-5 h-5 text-indigo-600" />;
    if (lower.includes('exam') || lower.includes('test'))
      return <CheckSquare className="w-5 h-5 text-emerald-600" />;
    if (lower.includes('speak')) return <Radio className="w-5 h-5 text-rose-600" />;
    return <Layers className="w-5 h-5 text-blue-600" />;
  };

  const currentContent = dayLessons[activeContentIndex] || null;
  const isVideo =
    currentContent?.file_type === 'video/mp4' || currentContent?.file?.endsWith('.mp4');
  const isPdf =
    currentContent?.file_type === 'application/pdf' ||
    currentContent?.file?.endsWith('.pdf') ||
    (currentContent?.exams &&
      (currentContent.exams[0]?.Supporting_Document_Path || currentContent.exams[0]?.supportingDocumentPath));
  const isAudio =
    currentContent?.file_type?.includes('audio') ||
    currentContent?.file?.endsWith('.mp3') ||
    (currentContent?.exams &&
      (currentContent.exams[0]?.Main_Question?.endsWith('.mp3') || currentContent.exams[0]?.mainQuestion?.endsWith('.mp3')));

  const courseTitle =
    courseInfo?.Course_Name || courseInfo?.courseName || `Course #${courseId || 1}`;
  const courseDescription = courseInfo?.Description || courseInfo?.description || '';
  const courseThumbnail = getMediaUrl(courseInfo?.Thumbnail_Path || courseInfo?.thumbnailPath);
  const courseValidity = courseInfo?.Validity || courseInfo?.validity || 30;

  // Header Title matching Flutter App
  const getAppBarTitle = () => {
    if (activeView === 'days') return 'Course details';
    if (activeView === 'categories') return `${courseTitle} - ${selectedDayName}`;
    if (activeView === 'content') return selectedSection?.Section_Name || 'Content Details';
    return 'Attendance Report';
  };

  const handleBack = () => {
    if (activeView === 'content') {
      if (sections.length > 0) setActiveView('categories');
      else setActiveView('days');
    } else if (activeView === 'categories') {
      setActiveView('days');
    } else if (activeView === 'attendance') {
      setActiveView('days');
    } else {
      navigate('/courses');
    }
  };

  return (
    <div className="space-y-4 font-sans max-w-4xl mx-auto pb-16 px-2 sm:px-4 bg-[#F4F7FA] min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C2348] text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP APP BAR (Exact Match to Flutter CustomsAppBar) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white px-4 py-3.5 sm:py-4 rounded-2xl border border-[#E3E7EE] shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-[#E5F0FF] text-[#283B52] hover:bg-[#1863D3] hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Go Back"
          >
            <ChevronLeft className="w-4 h-4 ml-[-1px]" />
          </button>

          <div>
            <h1 className="text-[16px] sm:text-[17px] font-bold text-black leading-tight">
              {getAppBarTitle()}
            </h1>
          </div>
        </div>


      </div>

      {loadingCourse ? (
        <div className="py-24 text-center text-gray-500 bg-white rounded-2xl border border-[#E3E7EE]">
          <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading course details...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ------------------------------------------------------------- */}
          {/* 2. COURSE BANNER (Exact Match to Flutter course_category_screen.dart: 180px) */}
          {/* ------------------------------------------------------------- */}
          <div className="w-full h-[180px] rounded-xl bg-gradient-to-r from-[#1C2348] to-[#2B83D5] text-white p-5 flex flex-col justify-end shadow-xs overflow-hidden relative border border-[#E3E7EE]">
            {courseThumbnail && (
              <img
                src={courseThumbnail}
                alt={courseTitle}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-block bg-[#1863D3]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md mb-1 uppercase tracking-wider">
                {courseValidity} Days Curriculum
              </span>
              <h2 className="text-[18px] sm:text-[20px] font-extrabold text-white leading-tight">
                {courseTitle}
              </h2>
            </div>
          </div>



          {/* ------------------------------------------------------------- */}
          {/* 4. TAB BAR: MODULES vs ATTENDANCE REPORT */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-white rounded-xl border border-[#E3E7EE] p-1 flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('modules');
                if (activeView === 'attendance') setActiveView('days');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'modules'
                  ? 'bg-[#E5F0FF] text-[#1863D3] shadow-2xs'
                  : 'text-[#6A7487] hover:text-[#1863D3]'
              }`}
            >
              Modules
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('attendance');
                setActiveView('attendance');
              }}
              className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-center cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-[#E5F0FF] text-[#1863D3] shadow-2xs'
                  : 'text-[#6A7487] hover:text-[#1863D3]'
              }`}
            >
              Student Attendance
            </button>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* VIEW 1: DAYS GRID (Exact Match to Flutter GridViewDayWidget) */}
          {/* ------------------------------------------------------------- */}
          {activeView === 'days' && activeTab === 'modules' && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E3E7EE] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4F7FA] pb-2.5">
                <h3 className="text-[15px] font-bold text-[#283B52]">{batchDays.length} Days Curriculum</h3>
                <span className="text-xs font-bold text-[#1863D3] bg-[#E5F0FF] px-2.5 py-0.5 rounded-full">
                  {batchDays.length} Days Total
                </span>
              </div>

              {batchDays.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <p className="text-xs font-semibold">No batch days found</p>
                </div>
              ) : (
                /* 4 Columns Grid matching Flutter GridViewDayWidget (crossAxisCount: 4) */
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                  {batchDays.map((day) => {
                    const isSelected = selectedDay === day.Days_Id;
                    const isExam = day.is_exam_day === 1;

                    return (
                      <div
                        key={day.Days_Id}
                        onClick={() => handleDayClick(day.Days_Id, day.Day_Name)}
                        className={`h-[85px] rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden bg-white shadow-2xs ${
                          isSelected
                            ? 'border-blue-500 ring-2 ring-blue-400/30'
                            : 'border-transparent hover:border-blue-300'
                        }`}
                      >
                        {/* Top Left Tag: Class or Test */}
                        {isExam && (
                          <div className="h-[22px] px-2 flex items-center justify-center rounded-tl-md rounded-br-md text-[11px] font-bold self-start bg-[#E8EFE6] text-[#509144]">
                            Exam
                          </div>
                        )}

                        {/* Middle: Day Title & Number */}
                        <div className="text-center pb-2">
                          <p className="text-[11px] font-medium text-[#6A7487] leading-tight">Day</p>
                          <p className="text-[18px] font-bold text-[#283B52] leading-none mt-0.5">
                            {String(day.Days_Id).padStart(2, '0')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VIEW 2: CATEGORIES GRID (Exact Match to Flutter GridviewCategoryWidget) */}
          {/* ------------------------------------------------------------- */}
          {activeView === 'categories' && activeTab === 'modules' && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E3E7EE] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F4F7FA] pb-2.5">
                <h3 className="text-[15px] font-bold text-[#283B52]">
                  Select Skill Module for {selectedDayName}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveView('days')}
                  className="text-xs font-bold text-[#1863D3] hover:underline"
                >
                  Change Day
                </button>
              </div>

              {/* 2 Columns Grid matching Flutter crossAxisCount: 2, mainAxisExtent: 85 */}
              <div className="grid grid-cols-2 gap-3">
                {sections.map((sec) => {
                  const isSelected = selectedSection?.Section_ID === sec.Section_ID;

                  return (
                    <div
                      key={sec.Section_ID}
                      onClick={() => handleCategoryClick(sec)}
                      className={`h-[85px] p-3 rounded-lg border flex flex-col justify-between transition-all cursor-pointer bg-white shadow-2xs ${
                        isSelected
                          ? 'border-blue-500 ring-2 ring-blue-400/20'
                          : 'border-[#E3E7EE] hover:border-blue-400'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        {getSectionIcon(sec.Section_Name)}
                      </div>
                      <p className="text-[14px] font-bold text-[#344054] truncate">
                        {sec.Section_Name}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VIEW 3: CONTENT DETAILS SCREEN (Exact Match to Flutter course_content_by_category_screen.dart) */}
          {/* ------------------------------------------------------------- */}
          {activeView === 'content' && activeTab === 'modules' && (
            <div className="space-y-4">
              {/* Day & Category Switcher Header */}
              <div className="bg-white p-3.5 rounded-xl border border-[#E3E7EE] shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  <span className="text-xs font-bold text-[#6A7487] uppercase shrink-0">Day:</span>
                  {batchDays.map((d) => (
                    <button
                      key={d.Days_Id}
                      type="button"
                      onClick={() => loadDayContent(d.Days_Id)}
                      className={`h-6 px-2.5 rounded-md text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                        selectedDay === d.Days_Id
                          ? 'bg-[#1863D3] text-white shadow-2xs'
                          : 'bg-[#F4F7FA] text-[#283B52] hover:bg-gray-200'
                      }`}
                    >
                      D{d.Days_Id}
                    </button>
                  ))}
                </div>

                {sections.length > 0 && (
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <span className="text-xs font-bold text-[#6A7487]">Category:</span>
                    <select
                      value={selectedSection?.Section_ID || 0}
                      onChange={(e) => {
                        const s = sections.find((sec) => sec.Section_ID === Number(e.target.value));
                        if (s) {
                          setSelectedSection(s);
                          loadDayContent(selectedDay, s);
                        }
                      }}
                      className="h-7 px-2 bg-[#F4F7FA] text-[#283B52] text-xs font-bold rounded-lg border border-[#E3E7EE] focus:outline-none"
                    >
                      {sections.map((s) => (
                        <option key={s.Section_ID} value={s.Section_ID}>
                          {s.Section_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {loadingContent ? (
                <div className="bg-white p-16 rounded-xl border border-[#E3E7EE] text-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading lessons and test materials...</p>
                </div>
              ) : dayLessons.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-[#E3E7EE] text-center text-gray-500 space-y-3">
                  <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                  <div>
                    <h4 className="text-[15px] font-bold text-[#283B52]">
                      No lessons found for {selectedDayName}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      No materials or videos have been uploaded under {selectedSection?.Section_Name || 'this module'} for Day {selectedDay}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveView('days')}
                    className="px-4 py-2 bg-[#1863D3] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    Back to Days Grid
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#E3E7EE] shadow-xs overflow-hidden p-4 sm:p-5 space-y-4">
                  {/* 1. TOP ACTIVE MEDIA SECTION */}
                  <div>
                    {isVideo && currentContent?.file ? (
                      /* HTML5 Video Player with custom scrubber and controls */
                      <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center group overflow-hidden">
                        <video
                          ref={videoRef}
                          src={getMediaUrl(currentContent.file)}
                          className="w-full h-full object-contain"
                          onTimeUpdate={handleTimeUpdate}
                          onLoadedMetadata={handleTimeUpdate}
                          onEnded={() => setIsPlaying(false)}
                          onError={() => setVideoError(true)}
                          onClick={handlePlayPause}
                        />

                        {videoError ? (
                          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-2">
                            <AlertCircle className="w-8 h-8 text-rose-500" />
                            <p className="text-xs font-bold">Video stream unavailable</p>
                            <button
                              type="button"
                              onClick={() => window.open(getMediaUrl(currentContent.file), '_blank')}
                              className="px-3.5 py-1.5 bg-[#1863D3] text-white text-xs font-bold rounded-lg"
                            >
                              Open Video Link
                            </button>
                          </div>
                        ) : (
                          /* Custom Video Player Overlay Controls */
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 opacity-90 group-hover:opacity-100 transition-opacity space-y-1.5">
                            {/* Scrubber Bar */}
                            <input
                              type="range"
                              min={0}
                              max={duration || 100}
                              value={currentTime}
                              onChange={handleSeek}
                              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#1863D3]"
                            />

                            <div className="flex items-center justify-between text-white text-xs">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={handlePlayPause}
                                  className="p-1 hover:text-[#1863D3] transition-colors"
                                >
                                  {isPlaying ? (
                                    <Pause className="w-5 h-5 fill-current" />
                                  ) : (
                                    <Play className="w-5 h-5 fill-current" />
                                  )}
                                </button>

                                <span className="text-[11px] font-mono text-gray-300">
                                  {formatTime(currentTime)} / {formatTime(duration)}
                                </span>

                                {/* Volume */}
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    type="button"
                                    onClick={toggleMute}
                                    className="p-1 hover:text-[#1863D3]"
                                  >
                                    {isMuted || volume === 0 ? (
                                      <VolumeX className="w-4 h-4" />
                                    ) : (
                                      <Volume2 className="w-4 h-4" />
                                    )}
                                  </button>
                                  <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    className="w-14 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#1863D3]"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center space-x-3">
                                {/* Speed Menu */}
                                <div className="flex items-center space-x-1 bg-black/40 px-2 py-0.5 rounded-md text-[11px]">
                                  {[1, 1.25, 1.5, 2].map((spd) => (
                                    <button
                                      key={spd}
                                      type="button"
                                      onClick={() => handleSpeedChange(spd)}
                                      className={`px-1 rounded ${
                                        playbackSpeed === spd
                                          ? 'text-[#1863D3] font-bold'
                                          : 'text-gray-400 hover:text-white'
                                      }`}
                                    >
                                      {spd}x
                                    </button>
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={toggleFullscreen}
                                  className="p-1 hover:text-[#1863D3]"
                                >
                                  {isFullscreen ? (
                                    <Minimize2 className="w-4 h-4" />
                                  ) : (
                                    <Maximize2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Hero Document / Exam Button Banner matching Flutter PodVideoPlayer else block */
                      <div className="h-[200px] rounded-lg bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden shadow-xs">
                        {courseThumbnail && (
                          <img
                            src={courseThumbnail}
                            alt="Banner"
                            className="absolute inset-0 w-full h-full object-cover opacity-30"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => currentContent && handleOpenPdfAssessment(currentContent)}
                          className="relative z-10 px-8 py-2.5 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-100 transition-all shadow-md cursor-pointer"
                        >
                          {currentContent?.file_type === 'application/pdf' ||
                          currentContent?.file?.endsWith('.pdf')
                            ? 'Open PDF'
                            : currentContent?.file_type?.includes('image')
                            ? 'View Image'
                            : 'Start Your Test'}
                        </button>
                      </div>
                    )}

                    {/* Active Content Title (16px bold #616161 / #283B52) */}
                    <div className="mt-3.5 flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#1863D3] bg-[#E5F0FF] px-2 py-0.5 rounded-md uppercase">
                          {isVideo
                            ? 'Video Lesson'
                            : isPdf
                            ? 'PDF Document'
                            : isAudio
                            ? 'Audio Practice'
                            : 'Assessment Drill'}
                        </span>
                        <h2 className="text-[16px] font-bold text-[#283B52] mt-1">
                          {currentContent?.contentName || 'Lesson Title'}
                        </h2>
                      </div>

                      {currentContent?.External_Link && (
                        <button
                          type="button"
                          onClick={() => window.open(currentContent.External_Link, '_blank')}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center space-x-1 shrink-0"
                        >
                          <span>Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-[#E3E7EE]" />

                  {/* 2. CURRICULUM PLAYLIST (Exact Match to Flutter CourseCurriculamWidget) */}
                  <div className="space-y-2.5">
                    <h3 className="text-[14px] font-bold text-[#283B52]">Curriculum Playlist</h3>

                    <div className="space-y-2">
                      {dayLessons.map((item, idx) => {
                        const isSelected = activeContentIndex === idx;
                        const itemIsVideo =
                          item.file_type === 'video/mp4' || item.file?.endsWith('.mp4');
                        const itemIsPdf =
                          item.file_type === 'application/pdf' || item.file?.endsWith('.pdf');
                        const itemIsAudio =
                          item.file_type?.includes('audio') || item.file?.endsWith('.mp3');

                        const isExamItem = item.Is_Exam_Test === 1 || item.isExamTest === 1 || (item.exams && item.exams.length > 0);
                        const examObj = item.exams && item.exams.length > 0 ? item.exams[0] : null;

                        const isPdfUnlocked = (examObj?.Is_Question_Unlocked ?? 1) === 1;
                        const isAudioUnlocked = (examObj?.Is_Question_Media_Unlocked ?? 1) === 1;
                        const isAnswerUnlocked = (examObj?.Is_Answer_Unlocked ?? examObj?.isAnswerUnlocked ?? 0) === 1;

                        const thumbnail = getMediaUrl(
                          item.contentThumbnail_Path || item.contentThumbnailPath || item.contentThumbnail_name
                        );

                        return (
                          <div
                            key={item.Content_ID || item.contentId || idx}
                            onClick={() => {
                              setActiveContentIndex(idx);
                              setIsPlaying(false);
                              setVideoError(false);
                            }}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer bg-white shadow-xs ${
                              isSelected
                                ? 'border-[#2B83D5] ring-1 ring-[#2B83D5]'
                                : 'border-[#E3E7EE] hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center space-x-3 min-w-0 flex-1">
                              {/* 40x40 thumbnail box */}
                              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                                {thumbnail ? (
                                  <img
                                    src={thumbnail}
                                    alt={item.contentName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : itemIsVideo ? (
                                  <Play className="w-4 h-4 text-[#1863D3] fill-current" />
                                ) : itemIsPdf ? (
                                  <FileText className="w-4 h-4 text-amber-600" />
                                ) : itemIsAudio ? (
                                  <Headphones className="w-4 h-4 text-purple-600" />
                                ) : (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-[14px] font-medium text-[#283B52] truncate">
                                    {item.contentName}
                                  </h4>
                                  {(item.External_Link || item.externalLink) && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(item.External_Link || item.externalLink, '_blank');
                                      }}
                                      className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded shrink-0"
                                    >
                                      Link
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center space-x-3 mt-1">
                                  {/* Type badge (8px bold) */}
                                  <span className="text-[8px] font-bold text-black bg-gray-200 px-1.5 py-0.5 rounded">
                                    {itemIsVideo
                                      ? 'Video'
                                      : itemIsPdf
                                      ? 'PDF'
                                      : itemIsAudio
                                      ? 'Audio'
                                      : 'Exam'}
                                  </span>

                                  {/* Faculty Real-time Exam Unlock Checkboxes */}
                                  {isExamItem && examObj && (
                                    <div
                                      className="flex items-center space-x-3"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {/* PDF Unlock Checkbox */}
                                      <label className="flex items-center space-x-1 text-xs font-semibold text-[#283B52] cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={isPdfUnlocked}
                                          onChange={() =>
                                            handleToggleUnlock(
                                              item,
                                              examObj,
                                              'pdf',
                                              isPdfUnlocked
                                            )
                                          }
                                          className="w-3.5 h-3.5 rounded text-[#1863D3] focus:ring-[#1863D3]"
                                        />
                                        <span>PDF</span>
                                      </label>

                                      {/* Audio Unlock Checkbox */}
                                      {(examObj.Main_Question || examObj.mainQuestion) && (
                                        <label className="flex items-center space-x-1 text-xs font-semibold text-[#283B52] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isAudioUnlocked}
                                            onChange={() =>
                                              handleToggleUnlock(
                                                item,
                                                examObj,
                                                'audio',
                                                isAudioUnlocked
                                              )
                                            }
                                            className="w-3.5 h-3.5 rounded text-[#1863D3] focus:ring-[#1863D3]"
                                          />
                                          <span>Audio</span>
                                        </label>
                                      )}

                                      {/* Answer Key Unlock Checkbox */}
                                      {(examObj.Answer_Key_Path || examObj.answerKeyPath) && (
                                        <label className="flex items-center space-x-1 text-xs font-semibold text-[#283B52] cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isAnswerUnlocked}
                                            onChange={() =>
                                              handleToggleUnlock(
                                                item,
                                                examObj,
                                                'answer',
                                                isAnswerUnlocked
                                              )
                                            }
                                            className="w-3.5 h-3.5 rounded text-[#1863D3] focus:ring-[#1863D3]"
                                          />
                                          <span>Answer</span>
                                        </label>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Open Action Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (itemIsVideo) {
                                  setActiveContentIndex(idx);
                                } else {
                                  handleOpenPdfAssessment(item);
                                }
                              }}
                              className="px-3 py-1.5 bg-[#E5F0FF] text-[#1863D3] hover:bg-[#1863D3] hover:text-white rounded-lg text-xs font-bold transition-colors shrink-0 self-end sm:self-center"
                            >
                              {itemIsVideo ? 'Play Video' : 'View Doc'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* VIEW 4: STUDENT ATTENDANCE REPORT TAB (Exact Match to course_attendance_report_view.dart) */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'attendance' && (
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E3E7EE] shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4F7FA] pb-3">
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-5 h-5 text-[#1863D3]" />
                  <h3 className="text-[16px] font-bold text-[#1D2939]">Student Video Attendance Report</h3>
                </div>

                {/* Month Picker */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#6A7487]">Month:</span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-8 px-2.5 bg-[#F4F7FA] text-[#283B52] text-xs font-bold rounded-lg border border-[#E3E7EE] focus:outline-none"
                  />
                </div>
              </div>

              {/* Student Selector Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#6A7487]">Select Enrolled Student:</label>
                <select
                  value={selectedStudent?.Student_ID || selectedStudent?.studentId || 0}
                  onChange={(e) => {
                    const sid = Number(e.target.value);
                    const st = enrolledStudents.find(
                      (s) => (s.Student_ID || s.studentId) === sid
                    );
                    if (st) setSelectedStudent(st);
                  }}
                  className="w-full h-10 px-3.5 bg-white text-[#283B52] text-sm font-semibold rounded-xl border border-[#E3E7EE] shadow-xs focus:ring-2 focus:ring-[#1863D3]/20 focus:border-[#1863D3]"
                >
                  {enrolledStudents.length === 0 ? (
                    <option value={0}>No enrolled students found</option>
                  ) : (
                    enrolledStudents.map((s, idx) => (
                      <option
                        key={s.Student_ID || s.studentId || idx}
                        value={s.Student_ID || s.studentId}
                      >
                        {s.First_Name || s.firstName} {s.Last_Name || s.lastName} (ID: {s.Student_ID || s.studentId})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Attendance Table */}
              {loadingAttendance ? (
                <div className="py-12 text-center text-gray-500">
                  <Loader2 className="w-7 h-7 animate-spin text-[#1863D3] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading student attendance breakdown...</p>
                </div>
              ) : attendanceRows.length === 0 ? (
                <div className="py-12 text-center text-gray-500 space-y-2">
                  <BarChart3 className="w-8 h-8 text-gray-400 mx-auto" />
                  <p className="text-xs font-bold text-gray-700">No attendance data found for this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E3E7EE]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#F8F9FD] border-b border-[#E3E7EE] text-[#6A7487] font-bold">
                        <th className="p-3">Lesson / Video Title</th>
                        <th className="p-3">Watch Time</th>
                        <th className="p-3">Total Duration</th>
                        <th className="p-3">Completion</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Last Accessed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E7EE] text-[#283B52]">
                      {attendanceRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3 font-semibold text-[#283B52]">{row.contentName || `Lesson #${rIdx + 1}`}</td>
                          <td className="p-3 font-mono">{row.watchDuration || '0m'}</td>
                          <td className="p-3 font-mono text-gray-500">{row.totalDuration || '30m'}</td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full bg-[#1863D3] rounded-full"
                                  style={{ width: row.percentage || '0%' }}
                                />
                              </div>
                              <span className="font-bold text-[11px]">{row.percentage || '0%'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                row.status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : row.status === 'In Progress'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {row.status || 'Pending'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">{row.lastAccessed || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL IN-APP PDF & AUDIO ASSESSMENT VIEWER (Matching PdfViewerPage & AnswerKeyPage) */}
      {/* ------------------------------------------------------------- */}
      {previewPdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-[#F8F9FD]">
              <div className="flex items-center space-x-2 min-w-0">
                <FileText className="w-5 h-5 text-[#1863D3] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#283B52] truncate">
                    {previewPdfTitle}
                  </h3>
                  <span className="text-[11px] text-[#6A7487]">
                    {isShowingAnswerKey ? 'Viewing Answer Key' : 'Viewing Question Paper'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Answer Key Toggle button */}
                {previewAnswerKeyUrl && (
                  <button
                    type="button"
                    onClick={() => setIsShowingAnswerKey(!isShowingAnswerKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isShowingAnswerKey
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    }`}
                  >
                    {isShowingAnswerKey ? 'Show Question PDF' : 'Show Answer Key'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.open(isShowingAnswerKey && previewAnswerKeyUrl ? previewAnswerKeyUrl : previewPdfUrl, '_blank')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#283B52] text-xs font-bold rounded-lg flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewPdfUrl(null);
                    setPreviewAudioUrl(null);
                    setPreviewAnswerKeyUrl(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-rose-100 hover:text-rose-600 text-gray-700 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Iframe Document Viewer */}
            <div className="flex-1 bg-gray-100 relative">
              <iframe
                src={isShowingAnswerKey && previewAnswerKeyUrl ? previewAnswerKeyUrl : previewPdfUrl}
                title={previewPdfTitle}
                className="w-full h-full border-none"
              />
            </div>

            {/* Audio Listening Track Bar if present */}
            {previewAudioUrl && (
              <div className="p-3 bg-[#1C2348] text-white flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2 shrink-0">
                  <Headphones className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold">Listening Audio Track:</span>
                </div>
                <audio
                  controls
                  src={previewAudioUrl}
                  className="w-full max-w-lg h-8"
                  autoPlay={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
