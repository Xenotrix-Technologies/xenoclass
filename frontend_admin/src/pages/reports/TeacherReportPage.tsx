import React, { useState, useEffect } from 'react';
import { reportService } from '../../services/reportService';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';
import { Search, X, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const TeacherReportPage: React.FC = () => {
  // Form Controls
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filter Option Lists
  const [courseOptions, setCourseOptions] = useState<any[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<any[]>([]);
  const [batchOptions, setBatchOptions] = useState<any[]>([]);

  // Table Data & Pagination State matching Angular
  const [tableData, setTableData] = useState<any[]>([]);
  const displayedColumns = ['Teacher_Name', 'Batch_Name', 'Course_Name', 'Start_Time', 'End_Time', 'Duration'];
  const [totalDuration, setTotalDuration] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [currentPage, pageSize]);

  /**
   * Loads initial dropdown data for courses, teachers, and batches
   */
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [coursesRes, teachersRes, batchesRes] = await Promise.all([
        courseService.searchCourses('').catch(() => []),
        userService.searchUsers({ user_Name: '', course_id: 0 }).catch(() => []),
        courseService.getAllBatches().catch(() => []),
      ]);

      setCourseOptions(Array.isArray(coursesRes) ? coursesRes : []);
      setTeacherOptions(Array.isArray(teachersRes) ? teachersRes : []);
      setBatchOptions(Array.isArray(batchesRes) ? batchesRes : []);

      // Initial report fetch
      fetchReportData();
    } catch (err) {
      console.error('Error loading initial report filters:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch report data based on selected filters
   */
  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      const res: any = await reportService.getTeacherLiveClassesReport(
        selectedTeacherId || 0,
        selectedBatchId || 0,
        selectedCourseId || 0,
        fromDate,
        toDate,
        currentPage,
        pageSize
      );

      if (Array.isArray(res) && res.length >= 2) {
        const countResult = res[0];
        const data = res[1];
        setTableData(Array.isArray(data) ? data : []);
        setTotalDuration(data?.[0]?.Total_Duration || 'N/A');
        setTotalRecords(countResult?.[0]?.total_count || 0);
      } else if (Array.isArray(res)) {
        setTableData(res);
        setTotalDuration(res[0]?.Total_Duration || 'N/A');
        setTotalRecords(res.length);
      } else {
        setTableData([]);
        setTotalDuration('N/A');
        setTotalRecords(0);
      }
    } catch (err) {
      console.error('Error fetching teacher live classes report:', err);
      setTableData([]);
      setTotalDuration('N/A');
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears all filters and resets data
   */
  const clearFilters = () => {
    setSelectedCourseId(null);
    setSelectedTeacherId(null);
    setSelectedBatchId(null);
    const today = new Date().toISOString().split('T')[0];
    setFromDate(today);
    setToDate(today);
    setCurrentPage(1);
    fetchReportData();
  };

  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchReportData();
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="p-4 space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. FILTERS SECTION (Matching Angular teacher-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white p-6 rounded-lg shadow-xs mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
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

          {/* Teacher Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={selectedTeacherId || ''}
              onChange={(e) => setSelectedTeacherId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pick one</option>
              {teacherOptions.map((t) => (
                <option key={t.Teacher_ID || t.User_ID || t.Id} value={t.Teacher_ID || t.User_ID || t.Id}>
                  {t.First_Name} {t.Last_Name || ''}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pick one</option>
              {batchOptions.map((b) => (
                <option key={b.Batch_ID} value={b.Batch_ID}>
                  {b.Batch_Name}
                </option>
              ))}
            </select>
          </div>

          {/* From Date Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Choose From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date Filter */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-700 mb-1">Choose To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons matching Angular exact classes */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleSearchClick}
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
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 2. TABLE SECTION (Matching Angular teacher-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              {displayedColumns.map((column) => (
                <th key={column} className="px-6 py-3 font-semibold tracking-wider">
                  {column.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={displayedColumns.length} className="px-6 py-10 text-center">
                  <LoadingSpinner message="Loading report data..." size="md" />
                </td>
              </tr>
            ) : tableData.length > 0 ? (
              tableData.map((row, index) => (
                <tr key={index} className="bg-white border-b hover:bg-gray-50 transition duration-150 text-xs">
                  {displayedColumns.map((column) => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-gray-800">
                      {row[column] !== null && row[column] !== undefined ? String(row[column]) : '-'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={displayedColumns.length} className="px-6 py-8 text-center text-gray-500 text-xs">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. PAGINATION (Matching Angular teacher-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-xs">
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-600">Items per page:</label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={75}>75</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-gray-700 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. TOTAL DURATION (Matching Angular teacher-report.component.html) */}
      {/* ------------------------------------------------------------- */}
      {totalDuration && totalDuration !== 'N/A' && (
        <div className="p-4 text-right">
          <span className="text-xs font-bold text-gray-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg">
            Total Duration: {totalDuration}
          </span>
        </div>
      )}
    </div>
  );
};
