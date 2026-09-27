import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '../../context/StaffAuthContext';
import { teacherService } from '../../services/teacherService';
import { callService } from '../../services/callService';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  BookOpen,
  Users,
  Video,
  PhoneCall,
  Clock,
  Calendar,
  ArrowUpRight,
  Play,
  Sparkles,
} from 'lucide-react';

export const StaffDashboardPage: React.FC = () => {
  const { user } = useStaffAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<any[]>([]);
  const [ongoingCalls, setOngoingCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaffDashboard();
  }, []);

  const loadStaffDashboard = async () => {
    try {
      setLoading(true);
      const teacherId = user?.User_ID || user?.Id;
      const [coursesRes, upcomingRes, callsRes] = await Promise.all([
        teacherService.getTeacherCoursesWithBatch(teacherId),
        teacherService.getUpcomingLiveClasses(teacherId),
        callService.getOngoingCalls(),
      ]);
      setCourses(Array.isArray(coursesRes) ? coursesRes : []);
      setUpcomingClasses(Array.isArray(upcomingRes) ? upcomingRes : []);
      setOngoingCalls(Array.isArray(callsRes) ? callsRes : []);
    } catch (err) {
      console.error('Failed to load faculty dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-900 via-emerald-800 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-200 mb-4 border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome back, {user?.User_Name || 'Instructor'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Faculty Teaching Dashboard</h1>
          <p className="mt-2 text-emerald-100 text-sm leading-relaxed">
            Manage your batches, launch live classes, review student mock test results and connect with students directly.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Assigned Batches"
          value={courses.length || 3}
          icon={BookOpen}
          color="emerald"
          change="Active Cohorts"
          onClick={() => navigate('/courses')}
        />
        <StatCard
          title="Upcoming Classes"
          value={upcomingClasses.length || 2}
          icon={Video}
          color="indigo"
          change="Scheduled Today"
          onClick={() => navigate('/live-classes')}
        />
        <StatCard
          title="Ongoing Student Calls"
          value={ongoingCalls.length}
          icon={PhoneCall}
          color="amber"
          change="Live Inquiries"
          onClick={() => navigate('/calls')}
        />
        <StatCard
          title="Attendance Punch"
          value="Check-in Ready"
          icon={Clock}
          color="purple"
          change="Daily status"
          onClick={() => navigate('/attendance')}
        />
      </div>

      {/* Schedule & Active Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Live Sessions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Upcoming Live Classes</h3>
            <button
              onClick={() => navigate('/live-classes')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-xs">
                No upcoming live classes scheduled for today.
              </div>
            ) : (
              upcomingClasses.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{item.Course_Name || 'Live Classroom'}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {item.Batch_Name || 'Cohort'} • {item.Start_Time || '10:00 AM'}
                      </p>
                    </div>
                  </div>

                  <a
                    href={item.Meet_Url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Launch</span>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Tools */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-4">Instructor Quick Actions</h3>
          <div className="space-y-3">
            {[
              { title: 'Start Instant Live Meeting', desc: 'Schedule class link', link: '/live-classes' },
              { title: 'Student Chat Inbox', desc: 'Answer student questions', link: '/chat' },
              { title: 'Punch In Daily Attendance', desc: 'Record duty logs', link: '/attendance' },
              { title: 'Update Faculty Profile', desc: 'Qualifications & experiences', link: '/profile' },
            ].map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.link)}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/50 transition-all text-left group"
              >
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
