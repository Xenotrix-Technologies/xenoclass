import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { courseService } from '../../services/courseService';
import { studentService } from '../../services/studentService';
import { Search, RotateCcw, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AttendanceReportPage: React.FC = () => {
  // Form Controls
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Dropdown Lists
  const [studentOptions, setStudentOptions] = useState<any[]>([]);
  const [courseOptions, setCourseOptions] = useState<any[]>([]);

  // Table Data & State
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoaded(false);
      const [coursesRes, studentsRes] = await Promise.all([
        courseService.searchCourses('').catch(() => []),
        studentService.getAllStudents('').catch(() => []),
      ]);

      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      const students = Array.isArray(studentsRes) ? studentsRes : [];

      setCourseOptions(courses);
      setStudentOptions(students);

      fetchReportData(0, 0, '');
    } catch (err) {
      console.error('Error loading attendance initial data:', err);
      setIsLoaded(true);
    }
  };

  const fetchReportData = async (
    studentIdParam?: number,
    courseIdParam?: number,
    dateParam?: string
  ) => {
    try {
      setIsLoaded(false);
      const studentId = studentIdParam !== undefined ? studentIdParam : (selectedStudentId || 0);
      const courseId = courseIdParam !== undefined ? courseIdParam : (selectedCourseId || 0);
      const date = dateParam !== undefined ? dateParam : (selectedDate || '');

      const res: any = await reportService.getVideoAttendance(studentId, courseId, 0, date);

      if (res && res.success && Array.isArray(res.rows)) {
        if (res.rows.length > 0 && Array.isArray(res.rows[0])) {
          setTableData(res.rows[0]);
        } else {
          setTableData(res.rows);
        }
      } else if (Array.isArray(res)) {
        setTableData(res);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error('Error fetching attendance report data:', err);
      setTableData([]);
    } finally {
      setIsLoaded(true);
    }
  };

  const clearFilters = () => {
    setSelectedStudentId(null);
    setSelectedCourseId(null);
    setSelectedDate('');
    fetchReportData(0, 0, '');
  };

  const handleSearch = () => {
    fetchReportData(selectedStudentId || 0, selectedCourseId || 0, selectedDate);
  };

  return (
    <div className="p-6 bg-[#f8f9fa] min-h-screen space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER & FILTER SECTION (Matching attendance-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-100 space-y-4">
        <h1 className="text-xl font-bold text-[#1a1a1a]">Attendance Report</h1>

        <div className="flex flex-wrap items-center gap-5 pt-2 border-b border-[#ebebeb] pb-4">
          {/* Student Filter */}
          <div className="w-52">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Student</label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-600"
            >
              <option value="">All Students</option>
              {studentOptions.map((s) => (
                <option key={s.Student_ID || s.Id} value={s.Student_ID || s.Id}>
                  {s.First_Name || s.Student_Name} {s.Last_Name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Course Filter */}
          <div className="w-52">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Course</label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-600"
            >
              <option value="">All Courses</option>
              {courseOptions.map((c) => (
                <option key={c.Course_ID} value={c.Course_ID}>
                  {c.Course_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-52">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-600"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSearch}
              className="h-9 px-5 bg-[#673ab7] hover:bg-[#5e35b1] text-white text-xs font-medium rounded-md flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
            <button
              onClick={clearFilters}
              className="h-9 px-5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TABLE SECTION (Matching attendance-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      {isLoaded ? (
        <div className="bg-white rounded-xl shadow-xs border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#f1f3f5]">
                <tr>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Student Name
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Course Name
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Assigned Faculty
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Assigned Batch
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Video Content
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Watched Date
                  </th>
                  <th className="p-4 text-xs font-semibold text-[#495057] border-b border-[#dee2e6]">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5]">
                {tableData.length > 0 ? (
                  tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#f8f9fa] transition-colors text-xs text-[#212529]">
                      <td className="p-4 whitespace-nowrap font-medium">{row.Student_Name || '-'}</td>
                      <td className="p-4 whitespace-nowrap">{row.Course_Name || '-'}</td>
                      <td className="p-4 whitespace-nowrap">{row.Teacher_Name || '-'}</td>
                      <td className="p-4 whitespace-nowrap">{row.Batch_Name || '-'}</td>
                      <td className="p-4 whitespace-nowrap">{row.Content_Name || '-'}</td>
                      <td className="p-4 whitespace-nowrap text-gray-600">
                        {row.Watched_Date
                          ? new Date(row.Watched_Date).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>
                      <td className="p-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                        {row.Update_Time
                          ? new Date(row.Update_Time).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-gray-500 italic text-xs">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner message="Loading attendance data..." size="md" />
        </div>
      )}
    </div>
  );
};
