import React, { useState, useEffect } from 'react';
import { studentService, Student } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  List,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Check,
  X,
  Printer,
  Award,
  Eye,
  Clock,
  UserCheck,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [enrollmentStatus, setEnrollmentStatus] = useState<string>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);

  // Dropdown lists
  const [allCourse, setAllCourse] = useState<any[]>([]);
  const [batchList, setBatchList] = useState<any[]>([]);

  // Subviews: 'list' | 'edit' | 'courses' | 'Add_Result'
  const [view, setView] = useState<'list' | 'edit' | 'courses' | 'Add_Result'>('list');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // -------------------------------------------------------------
  // EDIT / REGISTRATION FORM STATE ('edit')
  // -------------------------------------------------------------
  const [studentForm, setStudentForm] = useState({
    Student_ID: 0,
    First_Name: '',
    Last_Name: '',
    Email: '',
    Phone_Number: '',
    Country_Code: '+91',
    Country_Code_Name: 'in',
    Password: '',
    Profile_Photo_Path: '',
  });
  const [studentCourseForm, setStudentCourseForm] = useState({
    Course_ID: 0,
    Batch_ID: 0,
    Slot_Id: 0,
    Price: 3999,
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState<any[]>([]);
  const [batchData, setBatchData] = useState<any[]>([]);
  const [savingStudent, setSavingStudent] = useState(false);

  // -------------------------------------------------------------
  // COURSES SUBVIEW STATE ('courses')
  // -------------------------------------------------------------
  const [enrolledCourseList, setEnrolledCourseList] = useState<any[]>([]);

  // -------------------------------------------------------------
  // EXAM RESULTS STATE ('Add_Result')
  // -------------------------------------------------------------
  const [newExamResult, setNewExamResult] = useState({
    StudentExam_ID: 0,
    Student_ID: 0,
    Course_ID: 0,
    Exam_Name: 'OET Reading Assessment',
    Result_Date: new Date().toISOString().split('T')[0],
    Listening: '7.5',
    Reading: '8.0',
    Writing: '7.0',
    Speaking: '7.5',
    Overall_Score: '7.5',
    CEFR_level: 'C1',
  });
  const [examResults, setExamResults] = useState<any[]>([]);

  // Certificate Modal State
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [currentCertStudent, setCurrentCertStudent] = useState<any>(null);

  useEffect(() => {
    loadMasterFilterData();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [currentPage, enrollmentStatus, selectedCourseId, selectedBatchId]);

  const loadMasterFilterData = async () => {
    try {
      const [courses, batches] = await Promise.all([
        courseService.searchCourses(''),
        courseService.getAllBatches().catch(() => []),
      ]);
      setAllCourse(Array.isArray(courses) ? courses : []);
      setBatchList(Array.isArray(batches) ? batches : []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStudents = async (search: string = searchTerm) => {
    try {
      setLoading(true);
      const res: any = await studentService.searchStudent({
        student_Name: search,
        page: currentPage,
        pageSize,
        enrollmentStatus,
        courseId: selectedCourseId,
        batchId: selectedBatchId,
      });

      if (res && res.data) {
        setStudents(res.data);
        setTotalEntries(res.total || res.data.length);
      } else if (Array.isArray(res)) {
        setStudents(res);
        setTotalEntries(res.length);
      } else {
        setStudents([]);
        setTotalEntries(0);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setStudents([]);
      setTotalEntries(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setCurrentPage(1);
    loadStudents(val);
  };

  const handleCourseFilterChange = (courseId: number | null) => {
    setSelectedCourseId(courseId);
    setCurrentPage(1);
  };

  // -------------------------------------------------------------
  // STUDENT CREATION & EDITING
  // -------------------------------------------------------------
  const handleCreateNew = () => {
    setSelectedStudent(null);
    setStudentForm({
      Student_ID: 0,
      First_Name: '',
      Last_Name: '',
      Email: '',
      Phone_Number: '',
      Country_Code: '+91',
      Country_Code_Name: 'in',
      Password: '',
      Profile_Photo_Path: '',
    });
    setStudentCourseForm({
      Course_ID: allCourse[0]?.Course_ID || 0,
      Batch_ID: 0,
      Slot_Id: 0,
      Price: 3999,
    });
    setView('edit');
    if (allCourse[0]?.Course_ID) {
      onCourseSelectedInForm(allCourse[0].Course_ID);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setStudentForm({
      Student_ID: student.Student_ID || student.Id,
      First_Name: student.First_Name || (student.Student_Name ? student.Student_Name.split(' ')[0] : ''),
      Last_Name: student.Last_Name || (student.Student_Name ? student.Student_Name.split(' ').slice(1).join(' ') : ''),
      Email: student.Email || '',
      Phone_Number: student.Phone_Number || student.Mobile_Number || '',
      Country_Code: student.Country_Code || '+91',
      Country_Code_Name: student.Country_Code_Name || 'in',
      Password: '',
      Profile_Photo_Path: student.Profile_Photo_Path || '',
    });
    setView('edit');
  };

  const onCourseSelectedInForm = async (courseId: number) => {
    setStudentCourseForm((prev) => ({ ...prev, Course_ID: courseId }));
    try {
      const [batches, slots] = await Promise.all([
        courseService.getCourseBatches(courseId).catch(() => []),
        courseService.getFreeTimeSlot(courseId).catch(() => []),
      ]);
      setBatchData(Array.isArray(batches) ? batches : []);
      setAvailableTimeSlots(Array.isArray(slots) ? (Array.isArray(slots[0]) ? slots[0] : slots) : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingStudent(true);
      const studentPayload = {
        student: studentForm,
        course: studentCourseForm,
      };
      await studentService.saveStudent(studentPayload);
      setView('list');
      loadStudents(searchTerm);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving student');
    } finally {
      setSavingStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!window.confirm('Do you want to delete ?')) return;
    try {
      await studentService.deleteStudent(studentId);
      loadStudents(searchTerm);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // STUDENT ENROLLED COURSES SUBVIEW ('courses')
  // -------------------------------------------------------------
  const handleViewCourses = async (student: Student) => {
    setSelectedStudent(student);
    setView('courses');
    setLoading(true);
    try {
      const res = await studentService.getCoursesByStudentId(student.Student_ID || student.Id);
      setEnrolledCourseList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setEnrolledCourseList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !studentCourseForm.Course_ID) return;
    try {
      await studentService.enrollCourseFromAdmin({
        Student_ID: selectedStudent.Student_ID || selectedStudent.Id,
        Course_ID: studentCourseForm.Course_ID,
        Batch_ID: studentCourseForm.Batch_ID || undefined,
        Slot_Id: studentCourseForm.Slot_Id || undefined,
        Price: studentCourseForm.Price,
      });
      handleViewCourses(selectedStudent);
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // EXAM RESULTS SUBVIEW ('Add_Result')
  // -------------------------------------------------------------
  const handleOpenAddResult = async (student: Student, course: any) => {
    setSelectedStudent(student);
    setView('Add_Result');
    setNewExamResult({
      StudentExam_ID: 0,
      Student_ID: student.Student_ID || student.Id,
      Course_ID: course.Course_ID,
      Exam_Name: 'OET Practice Exam Paper 1',
      Result_Date: new Date().toISOString().split('T')[0],
      Listening: '7.5',
      Reading: '8.0',
      Writing: '7.0',
      Speaking: '7.5',
      Overall_Score: '7.5',
      CEFR_level: 'C1',
    });
    loadExamResults(student.Student_ID || student.Id, course.Course_ID);
  };

  const loadExamResults = async (studentId: number, courseId: number) => {
    try {
      const res = await studentService.getExamResultsByStudentID(studentId, courseId);
      setExamResults(Array.isArray(res) ? res : []);
    } catch (e) {
      setExamResults([]);
    }
  };

  const handleSaveExamResult = async () => {
    try {
      await studentService.insertStudentExamResult(newExamResult);
      if (selectedStudent) {
        loadExamResults(selectedStudent.Student_ID || selectedStudent.Id, newExamResult.Course_ID);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExamResult = async (studentExamId: number) => {
    if (!window.confirm('Do you want to delete ?')) return;
    try {
      await studentService.deleteStudentExamResult(studentExamId);
      if (selectedStudent) {
        loadExamResults(selectedStudent.Student_ID || selectedStudent.Id, newExamResult.Course_ID);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // CERTIFICATE GENERATION & PRINTING
  // -------------------------------------------------------------
  const handleOpenCertificate = (student: Student, course: any) => {
    setCurrentCertStudent({
      name: `${student.First_Name} ${student.Last_Name || ''}`,
      Course_Name: course.Course_Name || 'OET Comprehensive Prep Course',
      Date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
    setCertModalOpen(true);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // Pagination calculation
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW: LIST (Matching Angular student.component.html) */}
      {/* ------------------------------------------------------------- */}
      {view === 'list' && (
        <section className="border border-gray-300 shadow-sm p-4 rounded-lg bg-white space-y-4">
          {/* Filters Bar Card matching Angular student filter card */}
          <div className="bg-white shadow-sm rounded-lg p-4 mb-2 border border-gray-200">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              {/* Search Input */}
              <div className="flex-grow">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Search Students</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search by name or email"
                    className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-md focus:border-sky-500 text-xs transition duration-300"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Enrollment Status Filter */}
              <div className="min-w-[170px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enrollment Status</label>
                <select
                  value={enrollmentStatus}
                  onChange={(e) => {
                    setEnrollmentStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border-2 border-gray-300 rounded-md py-2 px-3 text-xs focus:border-sky-500"
                >
                  <option value="all">All Students</option>
                  <option value="enrolled">Enrolled</option>
                  <option value="not_enrolled">Not Enrolled</option>
                </select>
              </div>

              {/* Course Filter */}
              <div className="min-w-[170px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Course</label>
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => handleCourseFilterChange(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-white border-2 border-gray-300 rounded-md py-2 px-3 text-xs focus:border-sky-500"
                >
                  <option value="">All Courses</option>
                  {allCourse.map((c) => (
                    <option key={c.Course_ID} value={c.Course_ID}>
                      {c.Course_Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Filter */}
              {batchList.length > 0 && (
                <div className="min-w-[170px]">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Select Batch</label>
                  <select
                    value={selectedBatchId || ''}
                    onChange={(e) => {
                      setSelectedBatchId(e.target.value ? Number(e.target.value) : null);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white border-2 border-gray-300 rounded-md py-2 px-3 text-xs focus:border-sky-500"
                  >
                    <option value="">All Batches</option>
                    {batchList.map((b) => (
                      <option key={b.Batch_ID} value={b.Batch_ID}>
                        {b.Batch_Name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Add Student Button */}
              <div className="flex items-end">
                <button
                  onClick={handleCreateNew}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-5 rounded-md transition duration-300 flex items-center space-x-1.5 text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Student</span>
                </button>
              </div>
            </div>
          </div>

          {/* Student Cards List */}
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading students..." size="md" />
            </div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">No Students Found</div>
          ) : (
            <div className="space-y-3">
              {students.map((item, idx) => (
                <div key={idx} className="border border-gray-300 p-4 rounded-lg relative bg-white shadow-xs">
                  {/* Not Enrolled Ribbon matching Angular template */}
                  {item.is_enrolled === 0 && (
                    <div className="absolute top-0 left-0 bg-[#BDAE01] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-br-lg shadow-xs">
                      Not Enrolled
                    </div>
                  )}

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Avatar & Info */}
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-600 text-lg font-bold">
                        {item.First_Name ? item.First_Name.charAt(0) : 'S'}
                        {item.Last_Name ? item.Last_Name.charAt(0) : ''}
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-gray-800">
                          {item.First_Name} {item.Last_Name || ''}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {item.Email || item.Phone_Number || item.Mobile_Number || 'No contact email'}
                        </p>
                      </div>
                    </div>

                    {/* Right Action Buttons matching Angular student.component.html */}
                    <div className="flex items-center gap-2">
                      {/* Courses Button */}
                      <button
                        onClick={() => handleViewCourses(item)}
                        title="View Courses"
                        className="flex items-center px-4 py-2 h-10 text-[#1d4ed8] bg-[#eff6ff] rounded-md hover:bg-[#dbeafe] transition-all duration-300 transform hover:scale-105 text-xs font-semibold"
                      >
                        <List className="w-4 h-4 mr-2" />
                        <span>Courses</span>
                      </button>

                      {/* Edit Button (Yellow) */}
                      <button
                        onClick={() => handleEditStudent(item)}
                        className="flex items-center justify-center px-3.5 py-2 h-10 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-all duration-300 transform hover:scale-105"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Red) */}
                      <button
                        onClick={() => handleDeleteStudent(item.Student_ID || item.Id)}
                        className="flex items-center justify-center px-3.5 py-2 h-10 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-all duration-300 transform hover:scale-105"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Bar matching Angular template */}
          <nav aria-label="Page navigation" className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-700">
                Showing <span className="font-semibold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(currentPage * pageSize, totalEntries)}</span> of{' '}
                <span className="font-semibold">{totalEntries}</span> results
              </p>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
                      p === currentPage ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </nav>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW: ENROLLED COURSES ('courses') */}
      {/* ------------------------------------------------------------- */}
      {view === 'courses' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-6">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h2 className="text-base font-bold text-gray-800">
                {selectedStudent?.First_Name} {selectedStudent?.Last_Name}
              </h2>
              <p className="text-xs text-gray-500">Enrolled Courses & Certificates</p>
            </div>
            <button
              onClick={() => setView('list')}
              className="border border-blue-600 hover:bg-gray-500 hover:text-white text-gray-800 font-bold py-2 px-4 rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>

          {enrolledCourseList.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Course Details</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Faculty & Timing</th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {enrolledCourseList.map((course, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{course.Course_Name}</p>
                        {course.Batch_Name && (
                          <p className="text-xs text-gray-500 mt-0.5">Batch: {course.Batch_Name}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <p className="font-medium text-gray-800">
                          {course.Teacher_Name_One_On_One || course.Teacher_Name_Batch || 'Faculty Lead'}
                        </p>
                        <p className="font-mono text-[11px] text-gray-500">
                          {course.start_time ? `${course.start_time} - ${course.end_time}` : 'Flexible Timing'}
                        </p>
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        {selectedStudent && (
                          <>
                            <button
                              onClick={() => handleOpenAddResult(selectedStudent, course)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-md shadow-xs"
                            >
                              Add Result
                            </button>
                            <button
                              onClick={() => handleOpenCertificate(selectedStudent, course)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-md border border-indigo-200"
                            >
                              View Certificate
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Enrollment Form when student has no active enrollment */
            <form onSubmit={handleEnrollCourse} className="space-y-4 border p-6 rounded-xl bg-gray-50">
              <h3 className="text-xs font-bold uppercase text-gray-700">Enroll in a Course</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Course *</label>
                  <select
                    value={studentCourseForm.Course_ID}
                    onChange={(e) => onCourseSelectedInForm(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>Select Course</option>
                    {allCourse.map((c) => (
                      <option key={c.Course_ID} value={c.Course_ID}>
                        {c.Course_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Timing & Faculty</label>
                  <select
                    value={studentCourseForm.Slot_Id}
                    onChange={(e) =>
                      setStudentCourseForm({ ...studentCourseForm, Slot_Id: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>No selection</option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.Slot_Id} value={slot.Slot_Id}>
                        {slot.Teacher_Name} ({slot.start_time} - {slot.end_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch</label>
                  <select
                    value={studentCourseForm.Batch_ID}
                    onChange={(e) =>
                      setStudentCourseForm({ ...studentCourseForm, Batch_ID: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>Select Batch</option>
                    {batchData.map((b) => (
                      <option key={b.Batch_ID} value={b.Batch_ID}>
                        {b.Batch_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-md shadow-xs"
                >
                  Save Enrollment
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW: REGISTRATION / EDIT STUDENT ('edit') */}
      {/* ------------------------------------------------------------- */}
      {view === 'edit' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-800">
              {studentForm.Student_ID ? 'Edit Student Details' : 'Student Registration'}
            </h2>
            <p className="text-xs text-gray-500">Configure personal account info and initial course enrollment</p>
          </div>

          <form onSubmit={handleSaveStudent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentForm.First_Name}
                  onChange={(e) => setStudentForm({ ...studentForm, First_Name: e.target.value })}
                  required
                  placeholder="e.g. John"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={studentForm.Last_Name}
                  onChange={(e) => setStudentForm({ ...studentForm, Last_Name: e.target.value })}
                  placeholder="e.g. Doe"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={studentForm.Email}
                  onChange={(e) => setStudentForm({ ...studentForm, Email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={studentForm.Phone_Number}
                  onChange={(e) => setStudentForm({ ...studentForm, Phone_Number: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={studentForm.Password}
                  onChange={(e) => setStudentForm({ ...studentForm, Password: e.target.value })}
                  placeholder="Password"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Course Enrollment Block matching student_Course in Angular */}
            <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
              <h4 className="text-xs font-bold uppercase text-gray-800">Course & Batch Selection</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentCourseForm.Course_ID}
                    onChange={(e) => onCourseSelectedInForm(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>Select Course</option>
                    {allCourse.map((c) => (
                      <option key={c.Course_ID} value={c.Course_ID}>
                        {c.Course_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Faculty & Timing</label>
                  <select
                    value={studentCourseForm.Slot_Id}
                    onChange={(e) =>
                      setStudentCourseForm({ ...studentCourseForm, Slot_Id: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>No selection</option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.Slot_Id} value={slot.Slot_Id}>
                        {slot.Teacher_Name} ({slot.start_time} - {slot.end_time})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Batch</label>
                  <select
                    value={studentCourseForm.Batch_ID}
                    onChange={(e) =>
                      setStudentCourseForm({ ...studentCourseForm, Batch_ID: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                  >
                    <option value={0}>Select Batch</option>
                    {batchData.map((b) => (
                      <option key={b.Batch_ID} value={b.Batch_ID}>
                        {b.Batch_Name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setView('list')}
                className="border border-blue-600 hover:bg-gray-500 hover:text-white text-gray-800 font-bold py-2 px-4 rounded text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingStudent}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {savingStudent ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VIEW: EXAM RESULTS ('Add_Result') */}
      {/* ------------------------------------------------------------- */}
      {view === 'Add_Result' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-800">
              Exam Results - {selectedStudent?.First_Name} {selectedStudent?.Last_Name}
            </h2>
            <button
              onClick={() => setView('courses')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-xs"
            >
              Close
            </button>
          </div>

          {/* Add Result Form matching Angular template */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
            <h3 className="text-xs font-bold uppercase text-gray-700">Add Exam Result</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={newExamResult.Exam_Name}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Exam_Name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Result Date</label>
                <input
                  type="date"
                  value={newExamResult.Result_Date}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Result_Date: e.target.value })}
                  className="w-full px-3 py-2 text-xs border rounded-md bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Listening</label>
                <input
                  type="text"
                  value={newExamResult.Listening}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Listening: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reading</label>
                <input
                  type="text"
                  value={newExamResult.Reading}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Reading: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Writing</label>
                <input
                  type="text"
                  value={newExamResult.Writing}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Writing: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Speaking</label>
                <input
                  type="text"
                  value={newExamResult.Speaking}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Speaking: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Overall</label>
                <input
                  type="text"
                  value={newExamResult.Overall_Score}
                  onChange={(e) => setNewExamResult({ ...newExamResult, Overall_Score: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CEFR Level</label>
                <input
                  type="text"
                  value={newExamResult.CEFR_level}
                  onChange={(e) => setNewExamResult({ ...newExamResult, CEFR_level: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border rounded-md bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveExamResult}
                className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-md shadow-xs"
              >
                Save Result
              </button>
            </div>
          </div>

          {/* Results Table matching Angular template */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Exam</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Result Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Listening</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Reading</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Writing</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Speaking</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Overall</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">CEFR</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examResults.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                      No recorded exam results found for this student
                    </td>
                  </tr>
                ) : (
                  examResults.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">{r.Exam_Name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.Result_Date}</td>
                      <td className="px-4 py-3 text-gray-700">{r.Listening}</td>
                      <td className="px-4 py-3 text-gray-700">{r.Reading}</td>
                      <td className="px-4 py-3 text-gray-700">{r.Writing}</td>
                      <td className="px-4 py-3 text-gray-700">{r.Speaking}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{r.Overall_Score}</td>
                      <td className="px-4 py-3 text-indigo-600 font-semibold">{r.CEFR_level}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDeleteExamResult(r.StudentExam_ID)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
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
      {/* VERIFIABLE CERTIFICATE MODAL */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
        title="Verifiable Course Certificate"
        maxWidth="lg"
      >
        {currentCertStudent && (
          <div className="space-y-6">
            <div className="border-4 border-double border-amber-600 p-8 rounded-2xl bg-gradient-to-br from-amber-50/50 to-white text-center space-y-4 shadow-sm relative">
              <Award className="w-12 h-12 text-amber-600 mx-auto" />
              <h2 className="text-xl font-serif font-black tracking-wider text-gray-900 uppercase">
                Certificate of Completion
              </h2>
              <p className="text-xs text-gray-500 italic">This is proudly presented to</p>
              <h3 className="text-2xl font-bold text-indigo-900 font-serif border-b-2 border-amber-300 pb-2 inline-block px-8">
                {currentCertStudent.name}
              </h3>
              <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed pt-2">
                For successfully completing the comprehensive curriculum in{' '}
                <span className="font-bold text-gray-900">{currentCertStudent.Course_Name}</span> at Xenoclass
                Academy, demonstrating proficiency and commitment.
              </p>
              <div className="flex justify-between items-center pt-6 text-[11px] text-gray-500 border-t border-amber-200">
                <span>Date: {currentCertStudent.Date}</span>
                <span className="font-mono">VERIFIED CREDENTIAL</span>
                <span>Authorized Signature</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={handlePrintCertificate}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-xs"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
