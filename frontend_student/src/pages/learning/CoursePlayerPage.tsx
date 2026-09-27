import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { learningService } from '../../services/learningService';
import { useStudentAuth } from '../../context/StudentAuthContext';
import { ArrowLeft, Play, CheckCircle2, FileText, Download, Clock, Video, Lock } from 'lucide-react';
import { R2_PUBLIC_URL } from '../../config/constants';

export const CoursePlayerPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useStudentAuth();
  const navigate = useNavigate();

  const [modules, setModules] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayContent, setDayContent] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurriculum();
  }, [courseId]);

  const loadCurriculum = async () => {
    try {
      setLoading(true);
      const res = await learningService.getCourseModules(Number(courseId || 1));
      setModules(Array.isArray(res) ? res : []);
      loadLessonsForDay(1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLessonsForDay = async (day: number) => {
    try {
      setSelectedDay(day);
      const res = await learningService.getCourseContentByDay(day);
      const items = Array.isArray(res) ? res : [];
      setDayContent(items);
      if (items.length > 0) {
        setActiveLesson(items[0]);
      } else {
        setActiveLesson(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVideoEnded = async () => {
    if (!activeLesson) return;
    try {
      await learningService.saveVideoAttendance({
        Student_ID: user?.Student_ID || user?.Id || 1,
        Course_ID: Number(courseId || 1),
        Video_ID: activeLesson.Content_ID || 1,
        Watch_Seconds: 300,
        Completed: 1,
      });
      alert('Lesson completed! Video attendance marked.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/my-courses')}
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Enrolled Courses</span>
        </button>

        <button
          onClick={() => navigate(`/exams`)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Practice Exams
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Player & Active Lesson */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl aspect-video relative flex items-center justify-center">
            {activeLesson?.Video_Url ? (
              <video
                src={
                  activeLesson.Video_Url.startsWith('http')
                    ? activeLesson.Video_Url
                    : `${R2_PUBLIC_URL}${activeLesson.Video_Url}`
                }
                controls
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-slate-400 p-8 space-y-3">
                <Video className="w-12 h-12 mx-auto text-slate-600" />
                <p className="text-xs font-semibold">Select a video lesson from the curriculum schedule to begin.</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <h2 className="text-lg font-bold text-slate-900">
              {activeLesson?.Title || `Day ${selectedDay} - Lesson Introduction`}
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {activeLesson?.Description ||
                'Listen attentively to native pronunciations, take notes, and complete the exercise drills.'}
            </p>
          </div>
        </div>

        {/* Right 1 Col: Day by Day Curriculum */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Course Lessons & Schedule</h3>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => {
                const isSelected = selectedDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => loadLessonsForDay(day)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Play className="w-3.5 h-3.5" />
                      <span>Day {day} Curriculum</span>
                    </div>
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
