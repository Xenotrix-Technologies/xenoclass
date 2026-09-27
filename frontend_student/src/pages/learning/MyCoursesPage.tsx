import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { learningService } from '../../services/learningService';
import { BookOpen, Play, CheckCircle2, Clock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { R2_PUBLIC_URL } from '../../config/constants';

export const MyCoursesPage: React.FC = () => {
  const { user } = useStudentAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyCourses();
  }, []);

  const loadMyCourses = async () => {
    try {
      setLoading(true);
      const studentId = user?.Student_ID || user?.Id || 1;
      const res = await learningService.getMyEnrolledCourses(studentId);
      setCourses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Enrolled Learning Programs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Resume your daily video lessons, exercises & practice modules</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4 max-w-xl mx-auto">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active course enrollments yet</h3>
          <p className="text-xs text-slate-500">
            Browse our catalog and enroll in English fluency, grammar, or test prep courses.
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl"
          >
            Explore Courses Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {c.Image_Url ? (
                  <img
                    src={c.Image_Url.startsWith('http') ? c.Image_Url : `${R2_PUBLIC_URL}${c.Image_Url}`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-bold text-3xl">
                    {c.Course_Name?.charAt(0) || 'E'}
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-base text-slate-800 line-clamp-1">{c.Course_Name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Batch: {c.Batch_Name || 'Standard Cohort'}</p>
                </div>

                <div className="space-y-3">
                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Course Progress</span>
                      <span>{c.Progress_Percentage || 35}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${c.Progress_Percentage || 35}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/learn/${c.Course_ID || 1}`)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4" />
                    <span>Continue Learning</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
