import React, { useState, useEffect } from 'react';
import { studentService } from '../../services/studentService';
import { courseService } from '../../services/courseService';
import { Search, X, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ExamReportPage: React.FC = () => {
  // Form Controls
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Filter Option Lists
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [studentOptions, setStudentOptions] = useState<any[]>([]);

  // Table Data & State
  const [tableData, setTableData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, studentsRes] = await Promise.all([
        courseService.searchCourses('').catch(() => []),
        studentService.getAllStudents('').catch(() => []),
      ]);

      const courses = Array.isArray(coursesRes) ? coursesRes : [];
      const students = Array.isArray(studentsRes) ? studentsRes : [];

      setCourseOptions(courses);
      setStudentOptions(students);

      // Initial Fetch
      fetchReportData(0, 0);
    } catch (err) {
      console.error('Error loading exam report initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReportData = async (studentIdParam?: number, courseIdParam?: number) => {
    try {
      setIsLoading(true);
      const studentId = studentIdParam !== undefined ? studentIdParam : (selectedStudentId || 0);
      const courseId = courseIdParam !== undefined ? courseIdParam : (selectedCourseId || 0);

      const res = await studentService.getExamResultsByStudentID(studentId, courseId);

      if (Array.isArray(res) && res.length > 0 && Array.isArray(res[0])) {
        setTableData(res[0]);
      } else if (Array.isArray(res)) {
        setTableData(res);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error('Error fetching exam report:', err);
      setTableData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedCourseId(null);
    setSelectedStudentId(null);
    fetchReportData(0, 0);
  };

  const handleSearch = () => {
    fetchReportData(selectedStudentId || 0, selectedCourseId || 0);
  };

  return (
    <div className="p-4 space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. FILTERS SECTION (Matching Angular report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white p-6 rounded-lg shadow-xs mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {/* Course Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Course</label>
            <select
              value={selectedCourseId || ''}
              onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pick one</option>
              {courseOptions.map((c) => (
                <option key={c.Course_ID} value={c.Course_ID}>
                  {c.Course_Name}
                </option>
              ))}
            </select>
          </div>

          {/* Student Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
            <select
              value={selectedStudentId || ''}
              onChange={(e) => setSelectedStudentId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pick one</option>
              {studentOptions.map((s) => (
                <option key={s.Student_ID || s.Id} value={s.Student_ID || s.Id}>
                  {s.First_Name || s.Student_Name} {s.Last_Name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-start gap-4 mt-5">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              <Search className="w-4 h-4 mr-2" />
              <span>Search</span>
            </button>

            <button
              onClick={clearFilters}
              className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center text-xs font-semibold shadow-xs"
            >
              <X className="w-4 h-4 mr-2" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. TABLE SECTION (Matching Angular report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-semibold tracking-wider">Student Name</th>
              <th className="px-6 py-3 font-semibold tracking-wider">Course Name</th>
              <th className="px-6 py-3 font-semibold tracking-wider">Exam Name</th>
              <th className="px-6 py-3 font-semibold tracking-wider text-center">Score</th>
              <th className="px-6 py-3 font-semibold tracking-wider text-center">Percentage</th>
              <th className="px-6 py-3 font-semibold tracking-wider text-center">Result</th>
              <th className="px-6 py-3 font-semibold tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center">
                  <LoadingSpinner message="Loading exam results..." size="md" />
                </td>
              </tr>
            ) : tableData.length > 0 ? (
              tableData.map((row, idx) => (
                <tr key={idx} className="bg-white border-b hover:bg-gray-50 transition duration-150 text-xs">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-medium">
                    {row.First_Name || row.Student_Name} {row.Last_Name || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800">{row.Course_Name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-800 font-semibold">{row.exam_name || row.Exam_Name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-800">
                    <span className="font-bold">{row.obtained_mark || row.Score || row.Marks_Obtained || '0'}</span>{' '}
                    <span className="text-gray-400 text-[11px]">/ {row.total_mark || row.Total_Marks || '100'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-gray-800 font-semibold">
                    {row.percentage !== undefined ? `${row.percentage}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        row.result_status === 'Pass' || row.result_status === 'PASSED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {row.result_status || 'Pass'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-500 font-mono">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 italic text-xs">
                  No exam results found for the selected criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
