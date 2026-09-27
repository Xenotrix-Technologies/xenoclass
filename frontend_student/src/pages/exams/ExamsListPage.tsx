import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { examService } from '../../services/examService';
import { learningService } from '../../services/learningService';
import { FileCheck, Play, Clock, Award, Loader2, Sparkles } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const ExamsListPage: React.FC = () => {
  const { user } = useStudentAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [exams, setExams] = useState<any[]>([]);
  const [pastResults, setPastResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentCourses();
  }, []);

  const loadStudentCourses = async () => {
    try {
      setLoading(true);
      const studentId = user?.Student_ID || user?.Id || 1;
      const [coursesRes, resultsRes] = await Promise.all([
        learningService.getMyEnrolledCourses(studentId),
        examService.getStudentExamResults(studentId),
      ]);

      const list = Array.isArray(coursesRes) ? coursesRes : [];
      setCourses(list);
      setPastResults(Array.isArray(resultsRes) ? resultsRes : []);

      if (list.length > 0) {
        setSelectedCourseId(list[0].Course_ID);
        loadExams(list[0].Course_ID);
      } else {
        // Mock default exams if empty
        setExams([
          { Course_Exam_ID: 1, Exam_Name: 'OET Reading Test Paper 1', Duration_Minutes: 45, Total_Marks: 40 },
          { Course_Exam_ID: 2, Exam_Name: 'IELTS Listening Practice Set', Duration_Minutes: 30, Total_Marks: 40 },
          { Course_Exam_ID: 3, Exam_Name: 'General English Grammar Quiz', Duration_Minutes: 20, Total_Marks: 25 },
        ]);
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const loadExams = async (courseId: number) => {
    try {
      setLoading(true);
      const res = await examService.getStudentExamsByCourse(courseId);
      setExams(Array.isArray(res) && res.length > 0 ? res : [
        { Course_Exam_ID: 1, Exam_Name: 'Reading Test Mock 1', Duration_Minutes: 30, Total_Marks: 40 },
        { Course_Exam_ID: 2, Exam_Name: 'Listening Test Practice', Duration_Minutes: 25, Total_Marks: 30 },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Practice Mock Tests & Exams</h1>
        <p className="text-xs text-slate-500 mt-0.5">Test your language competency under real-time exam conditions</p>
      </div>

      {courses.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Select Enrolled Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedCourseId(id);
              loadExams(id);
            }}
            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-semibold"
          >
            {courses.map((c) => (
              <option key={c.Course_ID} value={c.Course_ID}>
                {c.Course_Name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Available Exams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">{exam.Exam_Name}</h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500 pt-1">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.Duration_Minutes || 30} Mins</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>{exam.Total_Marks || 40} Marks</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/exams/${exam.Course_Exam_ID || 1}/run`)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Start Exam Now</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
