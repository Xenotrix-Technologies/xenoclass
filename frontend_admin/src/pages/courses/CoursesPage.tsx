import React, { useState, useEffect } from 'react';
import { courseService, Course, Category } from '../../services/courseService';
import { userService } from '../../services/userService';
import { R2_PUBLIC_URL } from '../../config/constants';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  BookOpen,
  HelpCircle,
  Tv,
  Users,
  ChevronRight,
  Upload,
  Video,
  FileCheck,
  Check,
  X,
  Loader2,
  Clock,
  Calendar,
  Save,
  FileText,
  Eye,
  Filter,
  Layers,
  Sparkles,
  Music,
  Download,
  ExternalLink,
  PlayCircle,
  Film,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const getMediaUrl = (path?: string) => {
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const base = (R2_PUBLIC_URL || '').replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
};

const ContentThumbnail: React.FC<{ src?: string; alt?: string; fileType?: string }> = ({ src, alt, fileType }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (src && !hasError) {
    return (
      <div className="w-12 h-12 shrink-0 overflow-hidden rounded-lg shadow-xs border border-gray-200 bg-gray-100 flex items-center justify-center">
        <img
          src={src}
          alt={alt || 'Thumbnail'}
          className="object-cover w-full h-full"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  const isVideo = fileType?.includes('video') || fileType?.endsWith('.mp4');
  const isAudio = fileType?.includes('audio') || fileType?.endsWith('.mp3') || fileType?.endsWith('.wav');

  return (
    <div
      className={`w-12 h-12 shrink-0 rounded-lg border flex items-center justify-center ${
        isVideo
          ? 'bg-indigo-50 border-indigo-100 text-indigo-600'
          : isAudio
          ? 'bg-purple-50 border-purple-100 text-purple-600'
          : 'bg-sky-50 border-sky-100 text-sky-600'
      }`}
    >
      {isVideo ? <Video className="w-6 h-6" /> : isAudio ? <Music className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
    </div>
  );
};

const DEFAULT_SECTIONS = [
  { Section_ID: 1, Section_Name: 'Videos' },
  { Section_ID: 2, Section_Name: 'Study Materials' },
];

export const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Active View:
  // 'list' | 'students' | 'Batch_Course' | 'exam_management' | 'content_list' | 'course_content_details' | 'form'
  const [view, setView] = useState<
    'list' | 'students' | 'Batch_Course' | 'exam_management' | 'content_list' | 'course_content_details' | 'form'
  >('list');

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // -------------------------------------------------------------
  // 1. COURSE FORM (Step 1: Details & Faculty Schedule)
  // -------------------------------------------------------------
  const [courseForm, setCourseForm] = useState({
    Course_ID: 0,
    Course_Name: '',
    Category_ID: 0,
    Validity: 30,
    Price: 3999,
    Description: '',
    Things_To_Learn: '',
    Sections: [] as number[],
    Thumbnail_Path: '',
    Thumbnail_Name: '',
    scheduledTeachers: [] as {
      Teacher_ID: number;
      timeSlots: { startTime: string; endTime: string; Slot_Id?: number }[];
    }[],
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // -------------------------------------------------------------
  // 2. ENROLLED STUDENTS SUBVIEW ('students')
  // -------------------------------------------------------------
  const [courseStudents, setCourseStudents] = useState<any[]>([]);
  const [courseBatches, setCourseBatches] = useState<any[]>([]);

  // -------------------------------------------------------------
  // 3. BATCH MANAGEMENT SUBVIEW ('Batch_Course')
  // -------------------------------------------------------------
  const [batchList, setBatchList] = useState<any[]>([]);
  const [batchFormOpen, setBatchFormOpen] = useState(false);
  const [batchFormData, setBatchFormData] = useState({
    Batch_ID: 0,
    Batch_Name: '',
    Start_Date: '',
    End_Date: '',
    Time_Slot: '10:00 AM - 11:00 AM',
    Max_Students: 25,
  });
  const [selectedBatchStudents, setSelectedBatchStudents] = useState<any[] | null>(null);
  const [selectedBatchName, setSelectedBatchName] = useState('');

  // -------------------------------------------------------------
  // 4. EXAM MANAGEMENT SUBVIEW ('exam_management')
  // -------------------------------------------------------------
  const [courseExams, setCourseExams] = useState<any[]>([]);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examForm, setExamForm] = useState({
    Course_Exam_ID: 0,
    Exam_Name: '',
    Duration_Minutes: 30,
    Total_Marks: 40,
    Pass_Marks: 20,
    Day: 1,
  });
  const [questionsModalOpen, setQuestionsModalOpen] = useState(false);
  const [activeExamQuestions, setActiveExamQuestions] = useState<any[]>([]);
  const [selectedExamForQuestions, setSelectedExamForQuestions] = useState<any>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('A');

  // -------------------------------------------------------------
  // 5. CONTENT LIST SUBVIEW ('content_list')
  // -------------------------------------------------------------
  const [showContentFilters, setShowContentFilters] = useState(false);
  const [contentFilterModule, setContentFilterModule] = useState(0);
  const [contentFilterDay, setContentFilterDay] = useState(0);
  const [contentFilterSearch, setContentFilterSearch] = useState('');
  const [courseContents, setCourseContents] = useState<any[]>([]);

  // -------------------------------------------------------------
  // 6. CONTENT SUBMISSION FORM ('course_content_details')
  // -------------------------------------------------------------
  const [contentFormData, setContentFormData] = useState({
    Content_ID: 0,
    Course_ID: 0,
    Section_ID: 0,
    Days_Id: 1,
    contentName: '',
    file: '',
    file_name: '',
    file_type: '',
    contentThumbnail_Path: '',
    contentThumbnail_name: '',
    visibilities: [1, 2],
    Is_Exam_Test: false,
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [selectedThumbObj, setSelectedThumbObj] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('Idle');
  const [totalFiles, setTotalFiles] = useState(0);
  const [filesUploaded, setFilesUploaded] = useState(0);
  const [savingContent, setSavingContent] = useState(false);

  useEffect(() => {
    loadMasterData();
    loadCourses();
  }, []);

  const loadMasterData = async () => {
    try {
      const [items, categoriesRes] = await Promise.all([
        courseService.getAllCourseItems().catch(() => []),
        courseService.searchCategories('').catch(() => []),
      ]);
      if (Array.isArray(items) && items.length > 0) {
        if (items[0] && items[0].length > 0) setCategories(items[0]);
        else if (Array.isArray(categoriesRes) && categoriesRes.length > 0) setCategories(categoriesRes);

        if (items[1] && items[1].length > 0) {
          setSections(items[1]);
        } else {
          setSections(DEFAULT_SECTIONS);
        }

        if (items[2]) setTeachers(items[2]);
      } else {
        if (Array.isArray(categoriesRes) && categoriesRes.length > 0) {
          setCategories(categoriesRes);
        }
        setSections(DEFAULT_SECTIONS);
      }
    } catch (e) {
      console.error(e);
      setSections(DEFAULT_SECTIONS);
    }
  };

  const loadCourses = async (search: string = '') => {
    try {
      setLoading(true);
      const res = await courseService.searchCourses(search);
      setCourses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadCourses(val);
  };

  // Switch views
  const handleCreateNewCourse = () => {
    setSelectedCourse(null);
    const availableSections = sections.length > 0 ? sections : DEFAULT_SECTIONS;
    setCourseForm({
      Course_ID: 0,
      Course_Name: '',
      Category_ID: categories[0]?.Category_ID || 1,
      Validity: 30,
      Price: 3999,
      Description: '',
      Things_To_Learn: '',
      Sections: availableSections.map((s) => s.Section_ID),
      Thumbnail_Path: '',
      Thumbnail_Name: '',
      scheduledTeachers: [
        {
          Teacher_ID: teachers[0]?.User_ID || 0,
          timeSlots: [{ startTime: '10:00 AM', endTime: '11:00 AM' }],
        },
      ],
    });
    setView('form');
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setCourseForm({
      Course_ID: course.Course_ID,
      Course_Name: course.Course_Name || '',
      Category_ID: course.Category_ID || 0,
      Validity: course.Validity || 30,
      Price: course.Price || 3999,
      Description: course.Description || '',
      Things_To_Learn: course.Things_To_Learn || '',
      Sections: course.Sections || [],
      Thumbnail_Path: course.Thumbnail_Path || '',
      Thumbnail_Name: course.Thumbnail_Name || '',
      scheduledTeachers: course.scheduledTeachers || [
        {
          Teacher_ID: teachers[0]?.User_ID || 0,
          timeSlots: [{ startTime: '10:00 AM', endTime: '11:00 AM' }],
        },
      ],
    });
    setView('form');
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCourse(true);
      await courseService.saveCourse({ course: courseForm });
      setView('list');
      loadCourses(searchTerm);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!window.confirm('Do you want to delete ?')) return;
    try {
      await courseService.deleteCourse(courseId);
      loadCourses(searchTerm);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // STUDENTS SUBVIEW
  // -------------------------------------------------------------
  const handleViewStudents = async (course: Course) => {
    setSelectedCourse(course);
    setView('students');
    try {
      const [studentsRes, batchesRes] = await Promise.all([
        courseService.getCourseStudents(course.Course_ID),
        courseService.getCourseBatches(course.Course_ID),
      ]);
      setCourseStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setCourseBatches(Array.isArray(batchesRes) ? batchesRes : []);
    } catch (e) {
      console.error(e);
      setCourseStudents([]);
      setCourseBatches([]);
    }
  };

  // -------------------------------------------------------------
  // BATCH SUBVIEW
  // -------------------------------------------------------------
  const handleViewBatchCourse = async (course: Course) => {
    setSelectedCourse(course);
    setView('Batch_Course');
    setSelectedBatchStudents(null);
    try {
      const res = await courseService.getCourseBatches(course.Course_ID);
      setBatchList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setBatchList([]);
    }
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await courseService.saveBatch({
        ...batchFormData,
        Course_ID: selectedCourse.Course_ID,
      });
      setBatchFormOpen(false);
      handleViewBatchCourse(selectedCourse);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBatch = async (batchId: number) => {
    if (!window.confirm('Do you want to delete this batch?')) return;
    try {
      await courseService.deleteBatch(batchId);
      if (selectedCourse) handleViewBatchCourse(selectedCourse);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewBatchStudents = async (batch: any) => {
    setSelectedBatchName(batch.Batch_Name);
    try {
      const res = await courseService.getStudentListByBatch(batch.Batch_ID || batch.Batch_Id);
      setSelectedBatchStudents(Array.isArray(res) ? res : []);
    } catch (e) {
      setSelectedBatchStudents([]);
    }
  };

  // -------------------------------------------------------------
  // EXAM MANAGEMENT SUBVIEW
  // -------------------------------------------------------------
  const handleViewExamList = async (course: Course) => {
    setSelectedCourse(course);
    setView('exam_management');
    try {
      const res = await courseService.getExamOfCourse(course.Course_ID);
      setCourseExams(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setCourseExams([]);
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    try {
      await courseService.manageCourseExam({
        ...examForm,
        Course_ID: selectedCourse.Course_ID,
      });
      setExamModalOpen(false);
      handleViewExamList(selectedCourse);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenQuestionsModal = (exam: any) => {
    setSelectedExamForQuestions(exam);
    setActiveExamQuestions(exam.questionsList || []);
    setQuestionsModalOpen(true);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;
    const newQ = {
      Question_ID: Date.now(),
      Question_Text: newQuestionText,
      Option_A: newOptionA,
      Option_B: newOptionB,
      Option_C: newOptionC,
      Option_D: newOptionD,
      Correct_Answer: newCorrectAnswer,
    };
    setActiveExamQuestions([...activeExamQuestions, newQ]);
    setNewQuestionText('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
  };

  // -------------------------------------------------------------
  // CONTENT LIST SUBVIEW
  // -------------------------------------------------------------
  const handleViewContentList = async (course: Course) => {
    setSelectedCourse(course);
    setView('content_list');
    loadContentsForCourse(course.Course_ID);
  };

  const loadContentsForCourse = async (courseId: number) => {
    try {
      const res = await courseService.getCourseContentByDay(
        courseId,
        false,
        contentFilterModule || 0,
        undefined,
        contentFilterDay || 0
      );
      let list = Array.isArray(res) ? res : res?.contents;
      if (typeof list === 'string') {
        try {
          list = JSON.parse(list);
        } catch (e) {
          list = [];
        }
      }
      setCourseContents(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Error loading course contents:', e);
      setCourseContents([]);
    }
  };

  const handleAddContent = () => {
    setContentFormData({
      Content_ID: 0,
      Course_ID: selectedCourse ? selectedCourse.Course_ID : 0,
      Section_ID: sections.length > 0 ? sections[0].Section_ID : 0,
      Days_Id: 1,
      contentName: '',
      file: '',
      file_name: '',
      file_type: '',
      contentThumbnail_Path: '',
      contentThumbnail_name: '',
      visibilities: [1, 2],
      Is_Exam_Test: false,
    });
    setFilePreview(null);
    setThumbnailPreview(null);
    setSelectedFileObj(null);
    setSelectedThumbObj(null);
    setTotalFiles(0);
    setFilesUploaded(0);
    setUploadProgress(0);
    setView('course_content_details');
  };

  const handleEditContent = (content: any) => {
    setContentFormData({
      Content_ID: content.Content_ID || 0,
      Course_ID: selectedCourse ? selectedCourse.Course_ID : 0,
      Section_ID: content.Section_ID || (sections.length > 0 ? sections[0].Section_ID : 0),
      Days_Id: content.Days_Id || 1,
      contentName: content.contentName || content.Content_Name || '',
      file: content.file || '',
      file_name: content.file_name || content.file || '',
      file_type: content.file_type || (content.file?.endsWith('.mp4') ? 'video/mp4' : ''),
      contentThumbnail_Path: content.contentThumbnail_Path || '',
      contentThumbnail_name: content.contentThumbnail_name || '',
      visibilities: content.Visibilities || [1, 2],
      Is_Exam_Test: !!content.Is_Exam_Test,
    });
    setFilePreview(content.file ? getMediaUrl(content.file) : null);
    setThumbnailPreview(content.contentThumbnail_Path ? getMediaUrl(content.contentThumbnail_Path) : null);
    setSelectedFileObj(null);
    setSelectedThumbObj(null);
    setTotalFiles(0);
    setFilesUploaded(0);
    setUploadProgress(0);
    setView('course_content_details');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileObj(file);
      setContentFormData((prev) => ({
        ...prev,
        file_name: file.name,
        file_type: file.type,
      }));
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedThumbObj(file);
      setContentFormData((prev) => ({
        ...prev,
        contentThumbnail_name: file.name,
      }));
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    if (!contentFormData.contentName.trim()) {
      alert('Please enter content name.');
      return;
    }
    if (!contentFormData.Section_ID) {
      alert('Please select a module.');
      return;
    }

    try {
      setSavingContent(true);
      let total = 0;
      if (selectedFileObj) total++;
      if (selectedThumbObj) total++;
      setTotalFiles(total);

      let uploadedFilePath = contentFormData.file;
      let uploadedFileName = contentFormData.file_name;
      let uploadedThumbPath = contentFormData.contentThumbnail_Path;
      let uploadedThumbName = contentFormData.contentThumbnail_name;

      if (selectedFileObj) {
        setUploadStatus('Uploading content file...');
        setUploadProgress(30);
        const res = await courseService.upload(selectedFileObj, total, selectedCourse.Course_Name);
        uploadedFilePath = res.key || res.filePath || res.filename || res.name;
        uploadedFileName = selectedFileObj.name;
        setFilesUploaded((prev) => prev + 1);
        setUploadProgress(60);
      }

      if (selectedThumbObj) {
        setUploadStatus('Uploading thumbnail...');
        const res = await courseService.upload(selectedThumbObj, total, selectedCourse.Course_Name);
        uploadedThumbPath = res.key || res.filePath || res.filename || res.name;
        uploadedThumbName = selectedThumbObj.name;
        setFilesUploaded((prev) => prev + 1);
        setUploadProgress(90);
      }

      setUploadStatus('Saving content details...');
      setUploadProgress(100);

      await courseService.saveCourseContent({
        ...contentFormData,
        Course_ID: selectedCourse.Course_ID,
        file: uploadedFilePath,
        file_name: uploadedFileName,
        contentThumbnail_Path: uploadedThumbPath,
        contentThumbnail_name: uploadedThumbName,
      });

      alert('Content saved successfully!');
      setView('content_list');
      loadContentsForCourse(selectedCourse.Course_ID);
    } catch (err: any) {
      console.error('Error saving content:', err);
      alert('Failed to save content: ' + (err.message || 'Error occurred'));
    } finally {
      setSavingContent(false);
      setTotalFiles(0);
      setFilesUploaded(0);
      setUploadProgress(0);
    }
  };

  const handleDeleteContent = async (contentId: number) => {
    if (!window.confirm('Are you sure you want to delete this course content?')) return;
    try {
      await courseService.deleteCourseContent(contentId);
      if (selectedCourse) {
        await loadContentsForCourse(selectedCourse.Course_ID);
      }
    } catch (e: any) {
      console.error('Delete error:', e);
      alert('Failed to delete content: ' + (e.response?.data?.message || e.message || 'Unknown error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* TOP BREADCRUMB NAVIGATION (Matching Angular template) */}
      {/* ------------------------------------------------------------- */}
      <nav className="flex items-center space-x-2 text-sm font-medium text-gray-500 mb-6" aria-label="Breadcrumb">
        <button
          onClick={() => setView('list')}
          className={`hover:text-blue-600 transition-colors ${view === 'list' ? 'text-gray-800 font-bold' : ''}`}
        >
          Course List
        </button>

        {selectedCourse && view !== 'list' && (
          <>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => setView(view === 'course_content_details' ? 'content_list' : 'list')}
              className="text-gray-800 font-bold hover:text-blue-600 cursor-pointer"
            >
              {selectedCourse.Course_Name}
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {view === 'course_content_details' ? (
              <>
                <button
                  onClick={() => setView('content_list')}
                  className="text-gray-600 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  Content Details
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="text-gray-800 font-bold">Content Submission Form</span>
              </>
            ) : (
              <span className="text-blue-600 font-bold uppercase tracking-wider">
                {view === 'content_list' && 'Content Details'}
                {view === 'exam_management' && 'Exam Management'}
                {view === 'Batch_Course' && 'Batch'}
                {view === 'students' && 'Students'}
                {view === 'form' && (selectedCourse ? 'Edit Course' : 'Create Course')}
              </span>
            )}
          </>
        )}
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW: LIST (Course Cards matching Angular course.component.html) */}
      {/* ------------------------------------------------------------- */}
      {view === 'list' && (
        <section className="space-y-4">
          <button
            onClick={handleCreateNewCourse}
            className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded text-xs transition-colors"
          >
            Add course
          </button>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by name  "
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-md text-xs focus:border-blue-500 focus:outline-none transition duration-300"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {/* Course cards container */}
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading courses..." size="md" />
            </div>
          ) : courses.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">No Courses Found</div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              {courses.map((course, idx) => (
                <div key={idx} className="rounded-lg p-4 shadow-sm border border-gray-200 bg-white">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full p-2">
                    {/* Left Course Info */}
                    <div className="w-full lg:w-auto lg:min-w-[40%]">
                      <h3 className="text-base font-bold text-gray-800 break-words">{course.Course_Name}</h3>
                      <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                        <span>Price: ₹{course.Price ?? 0}</span>
                        <span>•</span>
                        <span>Validity: {course.Validity ?? 30} Days</span>
                      </div>
                    </div>

                    {/* Right Single Line Button Group matching Angular icons and colors */}
                    <div className="w-full lg:w-auto">
                      <div className="flex flex-wrap gap-2.5 cursor-pointer items-center">
                        {/* Content Button (Purple) */}
                        <button
                          onClick={() => handleViewContentList(course)}
                          className="flex items-center h-10 px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[110px] text-xs font-semibold"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          <span>Content</span>
                        </button>

                        {/* Exam Button (Orange) */}
                        <button
                          onClick={() => handleViewExamList(course)}
                          className="flex items-center h-10 px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[100px] text-xs font-semibold"
                        >
                          <HelpCircle className="w-4 h-4 mr-2" />
                          <span>Exam</span>
                        </button>

                        {/* Batch Button (Sky Blue) */}
                        <button
                          onClick={() => handleViewBatchCourse(course)}
                          className="flex items-center h-10 px-4 py-2 bg-sky-50 text-sky-700 rounded-md hover:bg-blue-100 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[100px] text-xs font-semibold"
                        >
                          <Tv className="w-4 h-4 mr-2" />
                          <span>Batch</span>
                        </button>

                        {/* Students Button (Green) */}
                        <button
                          onClick={() => handleViewStudents(course)}
                          className="flex items-center h-10 px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-all duration-300 transform hover:scale-105 whitespace-nowrap min-w-[110px] text-xs font-semibold"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          <span>Students</span>
                        </button>

                        {/* Edit Button (Yellow) */}
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="flex items-center justify-center h-10 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-all duration-300 transform hover:scale-105"
                          title="Edit Course"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Button (Red) */}
                        <button
                          onClick={() => handleDeleteCourse(course.Course_ID)}
                          className="flex items-center justify-center h-10 px-3 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-all duration-300 transform hover:scale-105"
                          title="Delete Course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW: ENROLLED STUDENTS ('students') */}
      {/* ------------------------------------------------------------- */}
      {view === 'students' && (
        <section className="border border-gray-300 shadow-sm p-4 rounded-lg bg-white space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">
              Enrolled Students - {selectedCourse?.Course_Name}
            </h2>
            <button
              onClick={() => setView('list')}
              className="border border-blue-600 hover:bg-gray-500 hover:text-white text-gray-800 font-bold py-2 px-4 rounded text-xs"
            >
              Close
            </button>
          </div>

          <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
            <table className="min-w-full bg-white border border-gray-300 text-xs">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-3 border border-gray-300 text-left font-semibold text-gray-700 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 border border-gray-300 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 border border-gray-300 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Faculty Name
                  </th>
                  <th className="px-6 py-3 border border-gray-300 text-left font-semibold text-gray-600 uppercase tracking-wider">
                    Timing
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {courseStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No enrolled students found for this course
                    </td>
                  </tr>
                ) : (
                  courseStudents.map((st, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 border border-gray-300 font-medium text-gray-800">
                        {st.First_Name} {st.Last_Name || ''}
                      </td>
                      <td className="px-6 py-4 border border-gray-300 text-gray-600">
                        {st.Batch_Name || 'Standard Batch'}
                      </td>
                      <td className="px-6 py-4 border border-gray-300 text-gray-600">
                        {st.Teacher_Name || st.Teacher_Name_Batch || 'Faculty Lead'}
                      </td>
                      <td className="px-6 py-4 border border-gray-300 text-gray-600 font-mono">
                        {st.Time_Slot || st.allocatedStartTime || '10:00 AM - 11:00 AM'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW: BATCH MANAGEMENT ('Batch_Course') */}
      {/* ------------------------------------------------------------- */}
      {view === 'Batch_Course' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                setBatchFormData({
                  Batch_ID: 0,
                  Batch_Name: '',
                  Start_Date: '',
                  End_Date: '',
                  Time_Slot: '10:00 AM - 11:00 AM',
                  Max_Students: 25,
                });
                setBatchFormOpen(true);
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded text-xs"
            >
              Add Batch
            </button>

            <button
              onClick={() => setView('list')}
              className="border border-blue-600 hover:bg-gray-500 hover:text-white text-gray-800 font-bold py-2 px-4 rounded text-xs"
            >
              Close
            </button>
          </div>

          {/* Batches cards list matching Angular batch.component.html */}
          <div className="space-y-3">
            {batchList.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No batches configured for this course yet</p>
            ) : (
              batchList.map((item, idx) => (
                <div key={idx} className="border border-gray-200 p-4 rounded-md bg-white">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div>
                        <span className="text-xs text-gray-500 block">Batch Name</span>
                        <span className="text-sm font-bold text-gray-800">{item.Batch_Name}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span>Start Date: {item.Start_Date || 'Flexible'}</span> •{' '}
                        <span>End Date: {item.End_Date || 'Flexible'}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        <span>Group Time Slot: {item.Time_Slot || '10:00 AM - 11:00 AM'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => handleViewBatchStudents(item)}
                        className="flex items-center h-9 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-xs font-semibold"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        <span>Batch Students</span>
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(item.Batch_ID || item.Batch_Id)}
                        className="flex items-center justify-center h-9 w-9 bg-red-50 text-red-700 hover:bg-red-100 rounded-md"
                        title="Delete Batch"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Batch Students Modal */}
          {selectedBatchStudents && (
            <div className="mt-6 border-t pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-800">{selectedBatchName} Students</h3>
                <button
                  onClick={() => setSelectedBatchStudents(null)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Close Student List
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedBatchStudents.length === 0 ? (
                  <p className="text-xs text-gray-400">No students enrolled in this batch</p>
                ) : (
                  selectedBatchStudents.map((st, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 border rounded-lg">
                      <p className="text-xs font-bold text-gray-800">
                        {st.First_Name} {st.Last_Name || ''}
                      </p>
                      <p className="text-[11px] text-gray-500">{st.Email || st.Mobile_Number}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VIEW: EXAM MANAGEMENT ('exam_management') */}
      {/* ------------------------------------------------------------- */}
      {view === 'exam_management' && (
        <section className="p-6 bg-gray-50 min-h-screen rounded-xl space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-bold text-gray-800">Exam Management</h1>
              <span className="text-lg font-semibold text-blue-600">{selectedCourse?.Course_Name}</span>
            </div>
            <button
              onClick={() => setView('list')}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setExamForm({
                  Course_Exam_ID: 0,
                  Exam_Name: '',
                  Duration_Minutes: 30,
                  Total_Marks: 40,
                  Pass_Marks: 20,
                  Day: 1,
                });
                setExamModalOpen(true);
              }}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded shadow-sm text-xs"
            >
              Link New Exam to Course
            </button>
          </div>

          {/* Linked Exams Table matching Angular admin-exam.component.html */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
              <h2 className="text-sm font-bold text-gray-700">Exams Linked to this Course</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Exam Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Duration (mins)</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Pass Mark</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courseExams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No exams linked to this course yet.
                    </td>
                  </tr>
                ) : (
                  courseExams.map((exam, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">{exam.Exam_Name || exam.exam_name}</td>
                      <td className="px-6 py-4 text-gray-500">{exam.Duration_Minutes || exam.duration || 30}</td>
                      <td className="px-6 py-4 text-gray-500">{exam.Pass_Marks || exam.passcount || 20}</td>
                      <td className="px-6 py-4 font-medium space-x-2">
                        <button
                          onClick={() => handleOpenQuestionsModal(exam)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full text-xs"
                        >
                          Manage Questions
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. VIEW: CONTENT LIST ('content_list') */}
      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* 5. VIEW: CONTENT LIST ('content_list') */}
      {/* ------------------------------------------------------------- */}
      {view === 'content_list' && (
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleAddContent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Content
              </button>
              <button
                type="button"
                onClick={() => setShowContentFilters(!showContentFilters)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                <Search className="w-4 h-4 mr-2" /> {showContentFilters ? 'Hide Search' : 'Search'}
              </button>
            </div>

            <button
              className="border border-blue-600 hover:bg-gray-500 hover:text-white text-black font-bold py-2 px-4 rounded cursor-pointer text-sm"
              onClick={() => setView('list')}
            >
              Close
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg shadow-md p-4">
            {showContentFilters && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedCourse) loadContentsForCourse(selectedCourse.Course_ID);
                }}
                className="bg-white rounded-lg shadow-md p-6 mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="space-y-2">
                    <label htmlFor="sectionId" className="block text-sm font-medium text-gray-700">
                      Module
                    </label>
                    <select
                      id="sectionId"
                      value={contentFilterModule}
                      onChange={(e) => setContentFilterModule(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm py-2 px-3 border bg-white"
                    >
                      <option value={0}>All</option>
                      {sections.map((section) => (
                        <option key={section.Section_ID} value={section.Section_ID}>
                          {section.Section_Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dayId" className="block text-sm font-medium text-gray-700">
                      Day
                    </label>
                    <select
                      id="dayId"
                      value={contentFilterDay}
                      onChange={(e) => setContentFilterDay(Number(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm py-2 px-3 border bg-white"
                    >
                      <option value={0}>All</option>
                      {Array.from({ length: selectedCourse?.Validity || 30 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          Day {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={contentFilterSearch}
                      onChange={(e) => setContentFilterSearch(e.target.value)}
                      placeholder="Search by content name"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 text-sm py-2 px-3 border"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <Filter className="w-4 h-4 mr-2" /> Apply Filters
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courseContents.length === 0 ? (
                <div className="col-span-full py-12 text-center text-sm text-gray-500">
                  No lesson contents found for this course
                </div>
              ) : (
                courseContents
                  .filter((c) =>
                    contentFilterSearch
                      ? (c.contentName || c.Title || c.Content_Name || '').toLowerCase().includes(contentFilterSearch.toLowerCase())
                      : true
                  )
                  .map((content, idx) => (
                    <div
                      key={idx}
                      className="bg-white shadow-lg rounded-lg overflow-hidden"
                    >
                      <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex justify-between flex-col relative">
                        {Boolean(content.Is_Exam_Test) && (
                          <div className="absolute top-0 right-[-7px] w-24 h-24 overflow-hidden z-10">
                            <div className="absolute top-0 right-[-7px] -mt-4 -mr-4 w-32 h-8 bg-red-500 text-white text-xs font-semibold flex items-center justify-center transform rotate-45">
                              <span className="pl-11 font-bold">Exam</span>
                            </div>
                          </div>
                        )}

                        <div className="p-4">
                          <div className="flex items-center mb-4" style={{ height: '100px' }}>
                            {content.contentThumbnail_Path && (
                              <div className="mr-3 shrink-0">
                                <div className="w-12 h-12 overflow-hidden rounded-lg shadow-sm border border-gray-100">
                                  <img
                                    src={getMediaUrl(content.contentThumbnail_Path)}
                                    alt={content.contentThumbnail_name || 'Thumbnail'}
                                    className="object-cover w-full h-full"
                                    onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                </div>
                              </div>
                            )}
                            <h2 className="text-xl font-bold text-gray-800 line-clamp-2">
                              {content.contentName || content.Content_Name || content.Title}
                            </h2>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                            <div>
                              <p className="text-gray-600 text-xs">Module</p>
                              <p className="font-medium text-gray-800">{content.Section_Name || 'Core English'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">Day</p>
                              <p className="font-medium text-gray-800">{content.Days_Id || 1}</p>
                            </div>

                            {content.file && (content.file_type?.startsWith('video/') || content.file.endsWith('.mp4')) && (
                              <div className="col-span-2 aspect-video w-full rounded-lg overflow-hidden bg-black mt-2">
                                <video
                                  src={getMediaUrl(content.file)}
                                  controls
                                  className="object-cover w-full h-full rounded-lg"
                                />
                              </div>
                            )}

                            {content.file && (content.file_type?.startsWith('audio/') || content.file.endsWith('.mp3')) && (
                              <div className="col-span-2 w-full mt-2">
                                <audio
                                  src={getMediaUrl(content.file)}
                                  controls
                                  className="w-full"
                                />
                              </div>
                            )}
                          </div>

                          {content.exams && content.exams.length > 0 && (
                            <div className="mb-4">
                              <ul className="space-y-2">
                                {content.exams.map((exam: any, examIdx: number) => (
                                  <li key={examIdx} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex flex-wrap gap-2">
                                      {exam.Supporting_Document_Path && (
                                        <a
                                          href={getMediaUrl(exam.Supporting_Document_Path)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                        >
                                          <FileText className="w-3 h-3 mr-1" /> View Document
                                        </a>
                                      )}
                                      {exam.Answer_Key_Path && (
                                        <a
                                          href={getMediaUrl(exam.Answer_Key_Path)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                                        >
                                          <FileCheck className="w-3 h-3 mr-1" /> View Answer Key
                                        </a>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditContent(content)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 mr-1" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteContent(content.Content_ID)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. VIEW: CONTENT SUBMISSION FORM ('course_content_details') */}
      {/* ------------------------------------------------------------- */}
      {view === 'course_content_details' && (
        <div className="space-y-6">
          {totalFiles > 0 && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-2xl font-semibold mb-4">Upload Progress</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700">Total Files</h3>
                  <p className="text-3xl font-bold text-gray-900">{totalFiles}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700">Files Uploaded</h3>
                  <p className="text-3xl font-bold text-gray-900">{filesUploaded}</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-700">Status</h3>
                  <p className="text-xl font-semibold text-indigo-600">{uploadStatus}</p>
                </div>
              </div>
              <div className="mt-6">
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-sm font-semibold text-gray-700">{uploadProgress}%</p>
              </div>
            </div>
          )}

          <div className="max-w-full mx-auto p-6">
            <form onSubmit={handleSaveContent} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Content Submission Form</h2>

                {/* Visibility and Scheduling */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Visibility and Scheduling</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Day</label>
                      <select
                        value={contentFormData.Days_Id}
                        onChange={(e) => setContentFormData({ ...contentFormData, Days_Id: Number(e.target.value) })}
                        className="w-full px-3 py-2 border rounded-md text-sm bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      >
                        {Array.from({ length: selectedCourse?.Validity || 30 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={d}>
                            Day {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Module and Section Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Module <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={contentFormData.Section_ID}
                      onChange={(e) => setContentFormData({ ...contentFormData, Section_ID: Number(e.target.value) })}
                      required
                      className="w-full px-3 py-2 border rounded-md text-sm bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Select Module</option>
                      {sections.map((section) => (
                        <option key={section.Section_ID} value={section.Section_ID}>
                          {section.Section_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Content Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Content Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contentFormData.contentName}
                        onChange={(e) => setContentFormData({ ...contentFormData, contentName: e.target.value })}
                        required
                        placeholder="Enter content name"
                        className="w-full px-3 py-2 border rounded-md text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Content File Upload Box */}
                    <div className="col-span-full">
                      <label className="block text-sm font-semibold leading-6 text-gray-900">Content File</label>
                      <label
                        htmlFor="content-file-upload"
                        className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 cursor-pointer hover:border-indigo-600 transition-colors bg-white block"
                      >
                        <div className="text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-300" />
                          <div className="mt-4 flex justify-center text-sm leading-6 text-gray-600">
                            <span className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 hover:text-indigo-500">
                              {contentFormData.file_name || 'Upload a file'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Video, Audio, Image, PDF (All formats supported)</p>
                        </div>
                        <input
                          id="content-file-upload"
                          type="file"
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>

                      {/* File Preview */}
                      {filePreview && (
                        <div className="mt-4">
                          {(contentFormData.file_type?.includes('video') || contentFormData.file_name?.endsWith('.mp4')) && (
                            <div className="rounded-lg overflow-hidden shadow-lg max-w-2xl mx-auto bg-black">
                              <video
                                src={filePreview}
                                controls
                                className="w-full max-w-2xl mx-auto"
                                style={{ maxHeight: '360px' }}
                              />
                            </div>
                          )}
                          {contentFormData.file_type?.includes('audio') && (
                            <div className="bg-gray-50 p-4 rounded-lg shadow-sm max-w-2xl mx-auto">
                              <audio src={filePreview} controls className="w-full" />
                            </div>
                          )}
                          {contentFormData.file_type?.includes('image') && (
                            <div className="rounded-lg overflow-hidden shadow-lg max-w-2xl mx-auto">
                              <img src={filePreview} alt="Content preview" className="w-full h-auto object-contain" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content Thumbnail Upload */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-700">Content Thumbnail</h3>
                  <label
                    htmlFor="content-thumb-upload"
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors duration-300 block bg-white"
                  >
                    {thumbnailPreview ? (
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="mx-auto h-24 w-24 mb-4 object-cover rounded-md"
                      />
                    ) : (
                      <div className="mx-auto h-24 w-24 mb-4 flex items-center justify-center bg-gray-100 rounded-md text-gray-400">
                        <Upload className="w-8 h-8" />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 font-medium">
                      {contentFormData.contentThumbnail_name || 'Click to upload thumbnail'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF (Max 500KB)</p>
                    <input
                      id="content-thumb-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Practice Test Exam Checkbox */}
                <div className="bg-gray-50 p-4 rounded-lg flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="Is_Exam_Test_Input"
                    checked={contentFormData.Is_Exam_Test}
                    onChange={(e) => setContentFormData({ ...contentFormData, Is_Exam_Test: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="Is_Exam_Test_Input" className="text-sm font-medium text-gray-900 cursor-pointer">
                    Mark as Practice Test Paper / Exam
                  </label>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setView('content_list')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={savingContent}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center cursor-pointer shadow-sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  <span>{savingContent ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 7. VIEW: FULL COURSE REGISTRATION FORM ('form') */}
      {/* ------------------------------------------------------------- */}
      {view === 'form' && (
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-lg font-bold text-gray-800">
              {selectedCourse ? 'Edit Course' : 'Create Course'}
            </h2>
            <p className="text-xs text-gray-500">Configure curriculum, validity, pricing, and faculty allocations</p>
          </div>

          <form onSubmit={handleSaveCourse} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Name */}
              <div className="col-span-full">
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={courseForm.Course_Name}
                  onChange={(e) => setCourseForm({ ...courseForm, Course_Name: e.target.value })}
                  maxLength={50}
                  required
                  placeholder="e.g. OET Intensive 30-Day Masterclass"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:border-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={courseForm.Description}
                  onChange={(e) => setCourseForm({ ...courseForm, Description: e.target.value })}
                  placeholder="Detailed course description..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              {/* Validity / Days */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Days <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={courseForm.Validity}
                  onChange={(e) => setCourseForm({ ...courseForm, Validity: Number(e.target.value) })}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Price (₹)</label>
                <input
                  type="number"
                  value={courseForm.Price}
                  onChange={(e) => setCourseForm({ ...courseForm, Price: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              {/* Modules / Sections */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-gray-700">
                    Modules <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCourseForm({
                          ...courseForm,
                          Sections: (sections.length > 0 ? sections : DEFAULT_SECTIONS).map((s) => s.Section_ID),
                        })
                      }
                      className="text-[11px] font-medium text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, Sections: [] })}
                      className="text-[11px] font-medium text-gray-500 hover:text-gray-700"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 border border-gray-200 p-3 rounded-lg bg-gray-50">
                  {(sections.length > 0 ? sections : DEFAULT_SECTIONS).map((sec) => {
                    const isChecked = courseForm.Sections.includes(sec.Section_ID);
                    return (
                      <label
                        key={sec.Section_ID}
                        className={`flex items-center space-x-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCourseForm({ ...courseForm, Sections: [...courseForm.Sections, sec.Section_ID] });
                            } else {
                              setCourseForm({
                                ...courseForm,
                                Sections: courseForm.Sections.filter((id) => id !== sec.Section_ID),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{sec.Section_Name}</span>
                      </label>
                    );
                  })}
                </div>
                {courseForm.Sections.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1 font-medium">Please select at least one module for this course.</p>
                )}
              </div>

              {/* Faculty Schedule Array */}
              <div className="col-span-full border p-4 rounded-lg space-y-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-800">Faculty Schedule & Time Slots</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setCourseForm({
                        ...courseForm,
                        scheduledTeachers: [
                          ...courseForm.scheduledTeachers,
                          {
                            Teacher_ID: teachers[0]?.User_ID || 0,
                            timeSlots: [{ startTime: '10:00 AM', endTime: '11:00 AM' }],
                          },
                        ],
                      });
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-md shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Faculty
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courseForm.scheduledTeachers.map((tGroup, tIdx) => (
                    <div key={tIdx} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-gray-700">Select Faculty</label>
                        <button
                          type="button"
                          onClick={() => {
                            setCourseForm({
                              ...courseForm,
                              scheduledTeachers: courseForm.scheduledTeachers.filter((_, i) => i !== tIdx),
                            });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <select
                        value={tGroup.Teacher_ID}
                        onChange={(e) => {
                          const updated = [...courseForm.scheduledTeachers];
                          updated[tIdx].Teacher_ID = Number(e.target.value);
                          setCourseForm({ ...courseForm, scheduledTeachers: updated });
                        }}
                        className="w-full px-3 py-1.5 border rounded-md text-xs bg-gray-50"
                      >
                        {teachers.map((teach) => (
                          <option key={teach.User_ID} value={teach.User_ID}>
                            {teach.First_Name} {teach.Last_Name || ''}
                          </option>
                        ))}
                      </select>

                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase">Allocated Slot</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={tGroup.timeSlots[0]?.startTime || '10:00 AM'}
                            onChange={(e) => {
                              const updated = [...courseForm.scheduledTeachers];
                              if (updated[tIdx].timeSlots[0]) {
                                updated[tIdx].timeSlots[0].startTime = e.target.value;
                                setCourseForm({ ...courseForm, scheduledTeachers: updated });
                              }
                            }}
                            placeholder="Start: 10:00 AM"
                            className="px-2.5 py-1 text-xs border rounded-md"
                          />
                          <input
                            type="text"
                            value={tGroup.timeSlots[0]?.endTime || '11:00 AM'}
                            onChange={(e) => {
                              const updated = [...courseForm.scheduledTeachers];
                              if (updated[tIdx].timeSlots[0]) {
                                updated[tIdx].timeSlots[0].endTime = e.target.value;
                                setCourseForm({ ...courseForm, scheduledTeachers: updated });
                              }
                            }}
                            placeholder="End: 11:00 AM"
                            className="px-2.5 py-1 text-xs border rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Things to Learn */}
              <div className="col-span-full">
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Things You will learn from this Course <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={courseForm.Things_To_Learn}
                  onChange={(e) => setCourseForm({ ...courseForm, Things_To_Learn: e.target.value })}
                  placeholder="Bullet points or summary of takeaways..."
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setView('list')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-xs transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={savingCourse}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-5 rounded text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {savingCourse ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* LINK EXAM MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title="Link New Exam to Course"
        maxWidth="md"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Exam Name *</label>
            <input
              type="text"
              value={examForm.Exam_Name}
              onChange={(e) => setExamForm({ ...examForm, Exam_Name: e.target.value })}
              required
              placeholder="e.g. Final Comprehensive Test"
              className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={examForm.Duration_Minutes}
                onChange={(e) => setExamForm({ ...examForm, Duration_Minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Pass Mark</label>
              <input
                type="number"
                value={examForm.Pass_Marks}
                onChange={(e) => setExamForm({ ...examForm, Pass_Marks: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setExamModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-md shadow-xs"
            >
              Save Exam
            </button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* MANAGE QUESTIONS MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={questionsModalOpen}
        onClose={() => setQuestionsModalOpen(false)}
        title={`Questions - ${selectedExamForQuestions?.Exam_Name || selectedExamForQuestions?.exam_name}`}
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Add Question Form */}
          <form onSubmit={handleAddQuestion} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold uppercase text-gray-700">Add New Multiple Choice Question</h4>
            <div>
              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Question text..."
                required
                className="w-full px-3 py-2 text-xs bg-white border rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newOptionA}
                onChange={(e) => setNewOptionA(e.target.value)}
                placeholder="Option A"
                required
                className="px-3 py-1.5 text-xs bg-white border rounded-md"
              />
              <input
                type="text"
                value={newOptionB}
                onChange={(e) => setNewOptionB(e.target.value)}
                placeholder="Option B"
                required
                className="px-3 py-1.5 text-xs bg-white border rounded-md"
              />
              <input
                type="text"
                value={newOptionC}
                onChange={(e) => setNewOptionC(e.target.value)}
                placeholder="Option C"
                className="px-3 py-1.5 text-xs bg-white border rounded-md"
              />
              <input
                type="text"
                value={newOptionD}
                onChange={(e) => setNewOptionD(e.target.value)}
                placeholder="Option D"
                className="px-3 py-1.5 text-xs bg-white border rounded-md"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-gray-700">Correct Option:</span>
                <select
                  value={newCorrectAnswer}
                  onChange={(e) => setNewCorrectAnswer(e.target.value)}
                  className="px-2 py-1 text-xs border rounded-md bg-white"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-md shadow-xs"
              >
                + Add Question
              </button>
            </div>
          </form>

          {/* Existing Questions List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {activeExamQuestions.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">No questions added to this exam paper yet</p>
            ) : (
              activeExamQuestions.map((q, idx) => (
                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-gray-800">
                      Q{idx + 1}: {q.Question_Text}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 text-[11px] text-gray-600 mt-1">
                      <span>A: {q.Option_A}</span>
                      <span>B: {q.Option_B}</span>
                      {q.Option_C && <span>C: {q.Option_C}</span>}
                      {q.Option_D && <span>D: {q.Option_D}</span>}
                    </div>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">Correct Answer: {q.Correct_Answer}</p>
                  </div>
                  <button
                    onClick={() => setActiveExamQuestions(activeExamQuestions.filter((_, i) => i !== idx))}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <button
              type="button"
              onClick={() => setQuestionsModalOpen(false)}
              className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded-md"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------- */}
      {/* CREATE BATCH MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={batchFormOpen}
        onClose={() => setBatchFormOpen(false)}
        title="Add Course Batch Cohort"
        maxWidth="md"
      >
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Batch Name *</label>
            <input
              type="text"
              value={batchFormData.Batch_Name}
              onChange={(e) => setBatchFormData({ ...batchFormData, Batch_Name: e.target.value })}
              required
              placeholder="e.g. OET Morning Live Batch"
              className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Time Slot</label>
            <input
              type="text"
              value={batchFormData.Time_Slot}
              onChange={(e) => setBatchFormData({ ...batchFormData, Time_Slot: e.target.value })}
              placeholder="10:00 AM - 11:00 AM"
              className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={batchFormData.Start_Date}
                onChange={(e) => setBatchFormData({ ...batchFormData, Start_Date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={batchFormData.End_Date}
                onChange={(e) => setBatchFormData({ ...batchFormData, End_Date: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-gray-50 border rounded-md"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setBatchFormOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-md shadow-xs"
            >
              Save Batch
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
