import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../context/StaffAuthContext';
import {
  Filter,
  Calendar as CalendarIcon,
  X,
  FileText,
  CheckCircle,
  TrendingUp,
  School,
  ClipboardList,
  Loader2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const MockExamReviewPage: React.FC = () => {
  const { user } = useStaffAuth();

  const [examResults, setExamResults] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    loadExamResults();
  }, []);

  const loadExamResults = async () => {
    try {
      setLoading(true);
      const teacherId = user?.User_ID || user?.Id || user?.Teacher_ID || 0;
      // In real DB, exam reviews are fetched based on teacher's students/batches
      setExamResults([]);
    } catch (err) {
      console.error('Error loading exam results:', err);
      setExamResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const filteredResults = examResults.filter((exam) => {
    if (!startDate && !endDate) return true;
    const examDate = new Date(exam.createdAt).setHours(0, 0, 0, 0);

    if (startDate) {
      const sDate = new Date(startDate).setHours(0, 0, 0, 0);
      if (examDate < sDate) return false;
    }
    if (endDate) {
      const eDate = new Date(endDate).setHours(23, 59, 59, 999);
      if (examDate > eDate) return false;
    }
    return true;
  });

  const totalExams = filteredResults.length;
  const passedCount = filteredResults.filter((e) => e.isPassed).length;
  const passPercent =
    totalExams > 0 ? ((passedCount / totalExams) * 100).toFixed(1) : '0';

  const handleCardClick = (exam: any) => {
    setSelectedExam(exam);
    setDetailModalOpen(true);
  };

  return (
    <div className="space-y-4 font-sans max-w-5xl mx-auto pb-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP TITLE HEADER (Matching Flutter _buildAppBar) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E3E7EE] shadow-xs">
        <h1 className="text-[20px] sm:text-[24px] font-bold text-[#283B52] tracking-tight">
          Exam Results
        </h1>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. DATE FILTER CONTAINER (Matching Flutter _buildDateFilter) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-[20px] border border-[#E3E7EE] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-[#4318FF]" />
            <h2 className="text-[14px] font-bold text-[#2B3674]">Filter by Date</h2>
          </div>

          {(startDate || endDate) && (
            <button
              onClick={clearFilter}
              className="px-3 py-1.5 bg-[#FFEEEC] text-[#D92D20] text-xs font-semibold rounded-full flex items-center space-x-1 hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Date Pickers Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Start Date */}
          <div className="relative">
            <div className="h-[50px] px-3 bg-[#F4F7FE] rounded-[15px] border border-transparent hover:border-[#4318FF]/50 focus-within:border-[#4318FF] flex items-center space-x-3 transition-colors">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#4318FF] shadow-2xs">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider leading-none">
                  Start Date
                </p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-bold text-[#2B3674] focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* End Date */}
          <div className="relative">
            <div className="h-[50px] px-3 bg-[#F4F7FE] rounded-[15px] border border-transparent hover:border-[#4318FF]/50 focus-within:border-[#4318FF] flex items-center space-x-3 transition-colors">
              <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#4318FF] shadow-2xs">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-[#A3AED0] uppercase tracking-wider leading-none">
                  End Date
                </p>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-bold text-[#2B3674] focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SUMMARY HEADER METRICS (Matching Flutter _buildSummaryHeader) */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Exams Card */}
        <div className="bg-white p-3.5 sm:p-4 rounded-[16px] border border-[#E3E7EE] shadow-xs text-center flex flex-col items-center justify-center">
          <ClipboardList className="w-5 h-5 text-[#4318FF] mb-1.5" />
          <p className="text-[16px] sm:text-[18px] font-bold text-[#2B3674]">{totalExams}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500">Total Exams</p>
        </div>

        {/* Passed Card */}
        <div className="bg-white p-3.5 sm:p-4 rounded-[16px] border border-[#E3E7EE] shadow-xs text-center flex flex-col items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600 mb-1.5" />
          <p className="text-[16px] sm:text-[18px] font-bold text-[#2B3674]">{passedCount}</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500">Passed</p>
        </div>

        {/* Pass % Card */}
        <div className="bg-white p-3.5 sm:p-4 rounded-[16px] border border-[#E3E7EE] shadow-xs text-center flex flex-col items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-500 mb-1.5" />
          <p className="text-[16px] sm:text-[18px] font-bold text-[#2B3674]">{passPercent}%</p>
          <p className="text-[10px] sm:text-[11px] font-semibold text-gray-500">Pass %</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. EXAM CARDS LIST (Matching Flutter _buildExamCard) */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#1863D3] mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading exam scorecards...</p>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-[20px] border border-[#E3E7EE] text-gray-500">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-semibold">No exam results found for this filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredResults.map((exam) => (
            <div
              key={exam.examResultId}
              onClick={() => handleCardClick(exam)}
              className="bg-white rounded-[20px] border border-[#E3E7EE] p-5 shadow-xs hover:shadow-md hover:border-[#1863D3]/40 transition-all cursor-pointer space-y-3.5"
            >
              {/* Header Row: Student Name + PASSED / FAILED Badge */}
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[17px] font-bold text-[#2B3674] truncate">
                  {exam.studentFullName}
                </h3>
                <span
                  className={`px-2.5 py-1 rounded-[10px] text-[10px] font-bold tracking-wider ${
                    exam.isPassed
                      ? 'bg-[#E6F6EC] text-[#039855]'
                      : 'bg-[#FFEEEE] text-[#D92D20]'
                  }`}
                >
                  {exam.isPassed ? 'PASSED' : 'FAILED'}
                </span>
              </div>

              {/* Info Rows */}
              <div className="space-y-2 text-[12px]">
                {/* Course Row */}
                <div className="flex items-center text-[#A3AED0]">
                  <School className="w-4 h-4 mr-2 shrink-0 text-[#A3AED0]" />
                  <span className="mr-1.5 font-medium">Course:</span>
                  <span className="text-[#2B3674] font-medium truncate">{exam.courseName}</span>
                </div>

                {/* Exam Row */}
                <div className="flex items-center text-[#A3AED0]">
                  <ClipboardList className="w-4 h-4 mr-2 shrink-0 text-[#A3AED0]" />
                  <span className="mr-1.5 font-medium">Exam:</span>
                  <span className="text-[#2B3674] font-medium truncate">{exam.examName}</span>
                </div>

                {/* Date Row */}
                <div className="flex items-center text-[#A3AED0]">
                  <CalendarIcon className="w-4 h-4 mr-2 shrink-0 text-[#A3AED0]" />
                  <span className="mr-1.5 font-medium">Date:</span>
                  <span className="text-[#2B3674] font-medium">{exam.formattedDate}</span>
                </div>
              </div>

              <div className="border-t border-[#F4F7FE] pt-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#A3AED0] font-medium">Final Score</p>
                  <p className="text-[16px] font-bold text-[#2B3674]">
                    {exam.obtainedMark} / {exam.totalMark}
                  </p>
                </div>

                {/* Circular Percentage Gauge matching _buildScoreProgress */}
                <div className="relative w-11 h-11 flex items-center justify-center">
                  <svg className="w-11 h-11 transform -rotate-90">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke="#F4F7FE"
                      strokeWidth="4"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke={exam.percentage >= 50 ? '#039855' : '#D92D20'}
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray="113"
                      strokeDashoffset={113 - (113 * exam.percentage) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-[11px] font-bold text-[#2B3674]">
                    {Math.round(exam.percentage)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. EXAM DETAILS MODAL (Matching Flutter _showExamDetails dialog) */}
      {/* ------------------------------------------------------------- */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Exam Performance Summary"
        maxWidth="md"
      >
        {selectedExam && (
          <div className="space-y-4 font-sans">
            <div className="bg-[#F4F7FE] p-4 rounded-xl space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-[#2B3674]">
                  {selectedExam.studentFullName}
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-[10px] text-[10px] font-bold ${
                    selectedExam.isPassed
                      ? 'bg-[#E6F6EC] text-[#039855]'
                      : 'bg-[#FFEEEE] text-[#D92D20]'
                  }`}
                >
                  {selectedExam.isPassed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#4318FF]">{selectedExam.courseName}</p>
              <p className="text-xs text-gray-600">{selectedExam.examName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <p className="text-[11px] text-gray-500 font-medium">Obtained Score</p>
                <p className="text-lg font-bold text-[#2B3674]">
                  {selectedExam.obtainedMark} / {selectedExam.totalMark}
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-center">
                <p className="text-[11px] text-gray-500 font-medium">Percentage</p>
                <p
                  className={`text-lg font-bold ${
                    selectedExam.percentage >= 50 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {selectedExam.percentage}%
                </p>
              </div>
            </div>

            {selectedExam.feedback && (
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                <p className="text-xs font-bold text-[#2B3674]">Faculty Feedback:</p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {selectedExam.feedback}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2 bg-[#1863D3] hover:bg-[#1A7AE8] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Close Scorecard
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
