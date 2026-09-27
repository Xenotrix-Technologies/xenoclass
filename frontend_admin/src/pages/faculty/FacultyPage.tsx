import React, { useState, useEffect } from 'react';
import { userService, User } from '../../services/userService';
import { courseService } from '../../services/courseService';
import { Modal } from '../../components/common/Modal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  Search,
  List,
  Users,
  Eye,
  EyeOff,
  ChevronRight,
  Check,
  X,
  Loader2,
  Phone,
  Mail,
  Calendar,
  Clock,
  TimerOff,
  UserX,
  Upload,
} from 'lucide-react';

export const FacultyPage: React.FC = () => {
  const [facultyList, setFacultyList] = useState<User[]>([]);
  const [courseList, setCourseList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<number>(0);

  // Views: 'list' | 'edit' | 'courses' | 'TeacherStudents'
  const [view, setView] = useState<'list' | 'edit' | 'courses' | 'TeacherStudents'>('list');
  const [selectedFaculty, setSelectedFaculty] = useState<User | null>(null);

  // Edit / Registration Form State
  const [formData, setFormData] = useState({
    User_ID: 0,
    First_Name: '',
    Last_Name: '',
    Email: '',
    PhoneNumber: '',
    Country_Code: '+91',
    Country_Code_Name: 'in',
    Registered_Date: new Date().toISOString().split('T')[0],
    password: '',
    Address: '',
    Hod: false,
    Profile_Photo_Path: '',
    Profile_Photo_Name: '',
    Course_ID: [] as number[],
    User_Type_Id: 2,
    teacherCourses: [] as {
      Course_ID: number;
      timeSlots: { start_time: string; end_time: string; isLive?: boolean; Batch_ID?: number }[];
    }[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Subviews Data
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [teacherStudentsList, setTeacherStudentsList] = useState<any[]>([]);
  const [studentCourseFilter, setStudentCourseFilter] = useState<number>(0);

  useEffect(() => {
    loadFaculty();
    loadCourses();
  }, [selectedCourseFilter]);

  const loadCourses = async () => {
    try {
      const res = await courseService.searchCourses('');
      setCourseList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setCourseList([]);
    }
  };

  const loadFaculty = async (search: string = '') => {
    try {
      setLoading(true);
      const res = await userService.searchUser({
        user_Name: search || searchTerm,
        course_id: selectedCourseFilter || 0,
      });
      setFacultyList(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error loading faculty:', err);
      setFacultyList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    loadFaculty(val);
  };

  const handleFilterChange = (courseId: number) => {
    setSelectedCourseFilter(courseId);
  };

  // -------------------------------------------------------------
  // CREATE / EDIT HANDLERS
  // -------------------------------------------------------------
  const handleCreateNew = () => {
    setSelectedFaculty(null);
    setSubmitted(false);
    setPreviewUrl(null);
    setFormData({
      User_ID: 0,
      First_Name: '',
      Last_Name: '',
      Email: '',
      PhoneNumber: '',
      Country_Code: '+91',
      Country_Code_Name: 'in',
      Registered_Date: new Date().toISOString().split('T')[0],
      password: '',
      Address: '',
      Hod: false,
      Profile_Photo_Path: '',
      Profile_Photo_Name: '',
      Course_ID: [],
      User_Type_Id: 2,
      teacherCourses: [
        {
          Course_ID: courseList[0]?.Course_ID || 0,
          timeSlots: [{ start_time: '10:00 AM', end_time: '11:00 AM' }],
        },
      ],
    });
    setView('edit');
  };

  const handleEditUser = async (faculty: User) => {
    setSelectedFaculty(faculty);
    setSubmitted(false);
    setPreviewUrl(faculty.Profile_Photo_Path || null);

    let currentTeacherCourses = [
      {
        Course_ID: (Array.isArray(faculty.Course_ID) && faculty.Course_ID[0]) || faculty.Course_ID || courseList[0]?.Course_ID || 0,
        timeSlots: [{ start_time: '10:00 AM', end_time: '11:00 AM', Delete_Status: 0 }],
        Delete_Status: 0,
      },
    ];

    try {
      const teacherId = faculty.User_ID || faculty.Id;
      if (teacherId) {
        const res = await userService.getTeacherCoursesWithBatch(teacherId);
        if (Array.isArray(res) && res.length > 0) {
          const grouped: { [key: number]: any } = {};
          res.forEach((row: any) => {
            if (!grouped[row.Course_ID]) {
              grouped[row.Course_ID] = {
                CourseTeacher_ID: row.CourseTeacher_ID,
                Course_ID: row.Course_ID,
                Delete_Status: 0,
                timeSlots: [],
              };
            }
            if (row.start_time && row.end_time) {
              grouped[row.Course_ID].timeSlots.push({
                Slot_Id: row.Slot_Id,
                start_time: row.start_time,
                end_time: row.end_time,
                Batch_ID: row.Batch_ID || undefined,
                Delete_Status: 0,
              });
            }
          });
          const mapped = Object.values(grouped);
          if (mapped.length > 0) {
            currentTeacherCourses = mapped;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching teacher courses for edit:', err);
    }

    setFormData({
      User_ID: faculty.User_ID || faculty.Id || 0,
      First_Name: faculty.First_Name || (faculty.User_Name ? faculty.User_Name.split(' ')[0] : ''),
      Last_Name: faculty.Last_Name || (faculty.User_Name ? faculty.User_Name.split(' ').slice(1).join(' ') : ''),
      Email: faculty.Email || '',
      PhoneNumber: faculty.PhoneNumber || faculty.Mobile_Number || '',
      Country_Code: faculty.Country_Code || '+91',
      Country_Code_Name: faculty.Country_Code_Name || 'in',
      Registered_Date: faculty.Registered_Date
        ? new Date(faculty.Registered_Date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      password: '',
      Address: faculty.Address || '',
      Hod: faculty.User_Type_Id === 3,
      Profile_Photo_Path: faculty.Profile_Photo_Path || '',
      Profile_Photo_Name: faculty.Profile_Photo_Name || '',
      Course_ID: Array.isArray(faculty.Course_ID) ? faculty.Course_ID : (faculty.Course_ID ? [faculty.Course_ID] : []),
      User_Type_Id: faculty.User_Type_Id || 2,
      teacherCourses: currentTeacherCourses,
    });
    setView('edit');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formData.First_Name || !formData.Email || !formData.PhoneNumber) {
      return;
    }
    try {
      setSaving(true);
      const sanitizedCourses = (formData.teacherCourses || []).map((tc) => ({
        ...tc,
        Delete_Status: 0,
        timeSlots: (tc.timeSlots || []).map((ts) => ({
          ...ts,
          Delete_Status: 0,
        })),
      }));

      await userService.saveUser({
        ...formData,
        Delete_Status: 0,
        User_Type_Id: formData.Hod ? 3 : 2,
        teacherCourses: sanitizedCourses,
      });
      setView('list');
      loadFaculty(searchTerm);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving faculty member');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Do you want to delete ?')) return;
    try {
      await userService.deleteUser(userId);
      loadFaculty(searchTerm);
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // SUBVIEWS: VIEW COURSES & VIEW STUDENTS
  // -------------------------------------------------------------
  const handleViewCourses = async (faculty: User) => {
    setSelectedFaculty(faculty);
    setView('courses');
    setLoading(true);
    try {
      const res =
        faculty.User_Type_Id === 3
          ? await userService.getHodCourse(faculty.User_ID || faculty.Id)
          : await userService.getTeacherCoursesWithBatch(faculty.User_ID || faculty.Id);
      setAssignedCourses(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setAssignedCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = async (faculty: User, courseId: number = 0) => {
    setSelectedFaculty(faculty);
    setView('TeacherStudents');
    setStudentCourseFilter(courseId);
    setLoading(true);
    try {
      const res = await userService.getTeacherStudents(faculty.User_ID || faculty.Id, courseId);
      setTeacherStudentsList(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
      setTeacherStudentsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentCourseFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = Number(e.target.value);
    setStudentCourseFilter(cid);
    if (selectedFaculty) {
      handleViewStudents(selectedFaculty, cid);
    }
  };

  // Add/Remove Teacher Course & Slot handlers
  const handleAddCourseSlot = () => {
    setFormData({
      ...formData,
      teacherCourses: [
        ...formData.teacherCourses,
        {
          Course_ID: courseList[0]?.Course_ID || 0,
          timeSlots: [{ start_time: '10:00 AM', end_time: '11:00 AM' }],
        },
      ],
    });
  };

  const handleRemoveCourseSlot = (cIdx: number) => {
    setFormData({
      ...formData,
      teacherCourses: formData.teacherCourses.filter((_, i) => i !== cIdx),
    });
  };

  const handleAddTimeSlot = (cIdx: number) => {
    const updated = [...formData.teacherCourses];
    updated[cIdx].timeSlots.push({ start_time: '11:00 AM', end_time: '12:00 PM' });
    setFormData({ ...formData, teacherCourses: updated });
  };

  const handleRemoveTimeSlot = (cIdx: number, sIdx: number) => {
    const updated = [...formData.teacherCourses];
    updated[cIdx].timeSlots = updated[cIdx].timeSlots.filter((_, i) => i !== sIdx);
    setFormData({ ...formData, teacherCourses: updated });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. VIEW: LIST (Matching Angular teacher.component.html) */}
      {/* ------------------------------------------------------------- */}
      {view === 'list' && (
        <section className="border border-gray-300 shadow-sm p-4 rounded-lg bg-white space-y-4">
          {/* Search & Actions Bar */}
          <div className="p-4 bg-white border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="relative flex-grow w-full md:w-1/2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search faculty by name or email"
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs transition duration-300 text-gray-700"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              {/* Add Faculty Button */}
              <button
                onClick={handleCreateNew}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center gap-2 text-xs shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Faculty</span>
              </button>
            </div>

            {/* Advanced Filters */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Course Filter */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Course</h3>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => handleFilterChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                >
                  <option value={0}>All Courses</option>
                  {courseList.map((course) => (
                    <option key={course.Course_ID} value={course.Course_ID}>
                      {course.Course_Name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Faculty List Cards */}
          {loading ? (
            <div className="p-12 text-center">
              <LoadingSpinner message="Loading faculty members..." size="md" />
            </div>
          ) : facultyList.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">No Details Found</div>
          ) : (
            <div className="space-y-3">
              {facultyList.map((item, idx) => (
                <div
                  key={idx}
                  className="mt-3 border border-gray-300 p-3 rounded-lg relative bg-white shadow-xs"
                  style={{ paddingTop: '15px' }}
                >
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    {/* Faculty Details */}
                    <div className="w-full md:w-4/12">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-800 leading-7">
                          {item.First_Name} {item.Last_Name || ''}
                        </span>
                        {item.PhoneNumber && (
                          <>
                            <span className="text-gray-400">|</span>
                            <span className="text-xs leading-7 text-gray-600 font-mono">{item.PhoneNumber}</span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">{item.Email}</p>
                    </div>

                    {/* Action Buttons matching Angular teacher.component.html */}
                    <div className="flex flex-wrap gap-2.5 cursor-pointer items-center">
                      {/* View Courses / Batch Button */}
                      <button
                        onClick={() => handleViewCourses(item)}
                        title="view Courses"
                        className="flex items-center px-4 py-2 h-10 text-[#1d4ed8] bg-[#eff6ff] rounded-md hover:bg-[#dbeafe] transition-all duration-300 transform hover:scale-105 text-xs font-semibold"
                      >
                        <List className="w-4 h-4 mr-2" />
                        <span>View Courses / Batch</span>
                      </button>

                      {/* View Students Button */}
                      <button
                        onClick={() => handleViewStudents(item)}
                        title="view Students"
                        className="flex items-center px-4 py-2 h-10 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-all duration-300 transform hover:scale-105 text-xs font-semibold"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        <span>View Students</span>
                      </button>

                      {/* Edit Button (Yellow) */}
                      <button
                        onClick={() => handleEditUser(item)}
                        className="flex items-center justify-center px-4 py-2 h-10 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-all duration-300 transform hover:scale-105"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete Button (Red) */}
                      <button
                        onClick={() => handleDeleteUser(item.User_ID || item.Id)}
                        className="flex items-center justify-center px-4 py-2 h-10 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-all duration-300 transform hover:scale-105"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. VIEW: ASSIGNED COURSES ('courses') */}
      {/* ------------------------------------------------------------- */}
      {view === 'courses' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-gray-800">
              Assigned Courses - {selectedFaculty?.First_Name} {selectedFaculty?.Last_Name}
            </h2>
            <button
              onClick={() => setView('list')}
              className="border border-blue-600 hover:bg-gray-500 hover:text-white text-gray-800 font-bold py-2 px-4 rounded text-xs transition-colors"
            >
              Close
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-8 py-4 text-left font-semibold text-gray-900">
                      Course
                    </th>
                    <th scope="col" className="px-8 py-4 text-left font-semibold text-gray-900">
                      Timing Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assignedCourses.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-8 py-8 text-center text-gray-400">
                        No assigned courses found for this faculty member
                      </td>
                    </tr>
                  ) : (
                    assignedCourses.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/30 transition-all duration-150">
                        <td className="px-8 py-4 font-semibold text-gray-900">{item.Course_Name}</td>
                        <td className="px-8 py-4 text-gray-600 font-mono">
                          {item.start_time ? `${item.start_time} - ${item.end_time}` : 'Flexible One-on-One'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. VIEW: ASSIGNED STUDENTS ('TeacherStudents') */}
      {/* ------------------------------------------------------------- */}
      {view === 'TeacherStudents' && (
        <div className="container mx-auto px-2 py-4 bg-gray-50 min-h-screen space-y-4">
          <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-100 flex items-center justify-between border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Assigned Students - {selectedFaculty?.First_Name} {selectedFaculty?.Last_Name}
              </h2>
              <button
                onClick={() => setView('list')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 text-xs font-semibold"
              >
                <X className="w-4 h-4 mr-1" />
                <span>Close</span>
              </button>
            </div>

            {/* Filter by Course */}
            <div className="px-6 py-4 flex items-center gap-4 bg-gray-50 border-b border-gray-200">
              <label className="text-xs font-semibold text-gray-700">Filter by Course:</label>
              <select
                value={studentCourseFilter}
                onChange={handleStudentCourseFilterChange}
                className="block w-full max-w-xs pl-3 pr-10 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-blue-500 rounded-md bg-white"
              >
                <option value={0}>All Courses</option>
                {courseList.map((course) => (
                  <option key={course.Course_ID} value={course.Course_ID}>
                    {course.Course_Name}
                  </option>
                ))}
              </select>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                      Batch Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                      Course Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider">
                      End Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teacherStudentsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                          <UserX className="w-10 h-10 text-gray-300 mb-2" />
                          <p className="text-xs font-medium">No students assigned</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    teacherStudentsList.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition duration-150">
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full mr-3 flex items-center justify-center text-white text-xs font-bold">
                              {(item.First_Name || 'S')[0]}
                            </div>
                            <span>
                              {item.First_Name} {item.Last_Name || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-800">
                            {item.Batch_Name || '1 on 1 Section'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{item.Course_Name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-blue-500" />
                            <span>{item.start_time || '10:00 AM'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono">
                          <div className="flex items-center">
                            <TimerOff className="w-3.5 h-3.5 mr-1 text-red-500" />
                            <span>{item.end_time || '11:00 AM'}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. VIEW: REGISTRATION / EDIT FORM ('edit') */}
      {/* ------------------------------------------------------------- */}
      {view === 'edit' && (
        <section className="border border-gray-300 shadow-sm p-6 rounded-lg bg-white space-y-6">
          <div className="border-b pb-3">
            <h2 className="text-base font-bold text-gray-800">
              {formData.User_ID ? 'Edit Faculty Details' : 'Faculty Registration'}
            </h2>
            <p className="text-xs text-gray-500">Configure personal credentials, courses, and time slots</p>
          </div>

          <form onSubmit={handleSaveUser} className="space-y-6">
            {/* Profile Avatar / Photo */}
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Photo</label>
              <p className="text-[11px] text-gray-500 mb-2">PNG, JPG, GIF up to 1MB</p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-gray-50 shadow-xs">
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreviewUrl(URL.createObjectURL(file));
                        setFormData({ ...formData, Profile_Photo_Name: file.name });
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.First_Name}
                  onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })}
                  required
                  placeholder="e.g. Sarah"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.Last_Name}
                  onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })}
                  placeholder="e.g. Jenkins"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.Email}
                  onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                  required
                  placeholder="faculty@example.com"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.PhoneNumber}
                  onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
                  required
                  placeholder="9876543210"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Registered Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.Registered_Date}
                  onChange={(e) => setFormData({ ...formData, Registered_Date: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!formData.User_ID}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="col-span-full">
                <label className="block text-xs font-semibold uppercase text-gray-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={formData.Address}
                  onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
                  placeholder="Residential or branch address..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Assigned Courses & Time Slots matching teacherCourses in Angular */}
            <div className="border p-4 rounded-lg space-y-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-gray-800">Assigned Courses & Availability</h4>
                <button
                  type="button"
                  onClick={handleAddCourseSlot}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-md shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Course (Optional)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.teacherCourses.map((cGroup, cIdx) => (
                  <div key={cIdx} className="bg-white p-4 rounded-lg border border-gray-200 space-y-3 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveCourseSlot(cIdx)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Course <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cGroup.Course_ID}
                        onChange={(e) => {
                          const updated = [...formData.teacherCourses];
                          updated[cIdx].Course_ID = Number(e.target.value);
                          setFormData({ ...formData, teacherCourses: updated });
                        }}
                        className="w-full px-3 py-1.5 text-xs border rounded-md bg-gray-50"
                      >
                        {courseList.map((c) => (
                          <option key={c.Course_ID} value={c.Course_ID}>
                            {c.Course_Name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-semibold text-gray-500 uppercase">Time Slots</span>
                        <button
                          type="button"
                          onClick={() => handleAddTimeSlot(cIdx)}
                          className="text-[11px] text-green-600 font-bold hover:underline"
                        >
                          + Add Time Slot
                        </button>
                      </div>

                      {cGroup.timeSlots.map((slot, sIdx) => (
                        <div key={sIdx} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={slot.start_time}
                            onChange={(e) => {
                              const updated = [...formData.teacherCourses];
                              updated[cIdx].timeSlots[sIdx].start_time = e.target.value;
                              setFormData({ ...formData, teacherCourses: updated });
                            }}
                            placeholder="Start Time (e.g. 10:00 AM)"
                            className="w-1/2 px-2.5 py-1 text-xs border rounded-md"
                          />
                          <input
                            type="text"
                            value={slot.end_time}
                            onChange={(e) => {
                              const updated = [...formData.teacherCourses];
                              updated[cIdx].timeSlots[sIdx].end_time = e.target.value;
                              setFormData({ ...formData, teacherCourses: updated });
                            }}
                            placeholder="End Time (e.g. 11:00 AM)"
                            className="w-1/2 px-2.5 py-1 text-xs border rounded-md"
                          />
                          {cGroup.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTimeSlot(cIdx, sIdx)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
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
                disabled={saving}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-6 rounded text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};
